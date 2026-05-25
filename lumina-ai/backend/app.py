from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
import uuid
import re
from io import BytesIO
import importlib.util
from groq import Groq
# Load agent_training.py from the same directory using importlib (works when app.py is run as a script)
build_strict_prompt = None
try:
    _agent_path = os.path.join(os.path.dirname(__file__), 'agent_training.py')
    spec = importlib.util.spec_from_file_location('agent_training', _agent_path)
    agent_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(agent_mod)
    build_strict_prompt = getattr(agent_mod, 'build_strict_prompt')
except Exception as _e:
    print(f'[Startup] agent_training not loaded: {_e}')
    def build_strict_prompt(base_prompt, data, output_format='narrative'):
        return base_prompt

load_dotenv()

groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
# Use a primary model with larger context window to avoid token-limit failures
groq_model_primary = "llama-3.3-70b-versatile"
groq_model_strong = "llama-3.1-8b-instant"

app = Flask(__name__)
# Explicit CORS settings for API routes to ensure preflight OPTIONS succeed
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)


@app.after_request
def _add_cors_headers(response):
    """Ensure CORS headers are present on all responses so browser preflight checks succeed."""
    origin = request.headers.get('Origin') or '*'
    response.headers.setdefault('Access-Control-Allow-Origin', origin if origin else '*')
    response.headers.setdefault('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE')
    response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    # Allow credentials if frontend needs them
    response.headers.setdefault('Access-Control-Allow-Credentials', 'true')
    return response

HISTORY_PATH = os.path.join(os.path.dirname(__file__), 'history', 'lesson_plans.json')

# ─────────────────────────────────────────────
# HISTORY HELPERS
# ─────────────────────────────────────────────
def load_history():
    try:
        with open(HISTORY_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_history_item(item):
    arr = load_history()
    arr.insert(0, item)
    os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)
    with open(HISTORY_PATH, 'w', encoding='utf-8') as f:
        json.dump(arr, f, ensure_ascii=False, indent=2)

# ─────────────────────────────────────────────
# BLOOM'S TAXONOMY HELPERS
# ─────────────────────────────────────────────
BLOOMS_REVISED = {
    "Remember":    ["define", "identify", "recall", "name", "list", "recognize", "match", "label", "state"],
    "Understand":  ["explain", "describe", "summarize", "classify", "compare", "interpret", "paraphrase", "discuss"],
    "Apply":       ["demonstrate", "use", "solve", "illustrate", "apply", "compute", "construct", "perform"],
    "Analyze":     ["differentiate", "examine", "compare", "contrast", "organize", "relate", "distinguish", "analyze"],
    "Evaluate":    ["justify", "critique", "assess", "argue", "defend", "judge", "appraise", "evaluate"],
    "Create":      ["design", "construct", "formulate", "produce", "develop", "compose", "propose", "create"]
}

def get_blooms_level(grade, difficulty):
    grade_num = int(''.join(filter(str.isdigit, str(grade))) or '7')
    if grade_num <= 3:
        return ("Remember", "Understand", BLOOMS_REVISED["Remember"], BLOOMS_REVISED["Understand"])
    elif grade_num <= 6:
        return ("Understand", "Apply", BLOOMS_REVISED["Understand"], BLOOMS_REVISED["Apply"])
    elif grade_num <= 10:
        if difficulty == "Advanced":
            return ("Analyze", "Evaluate", BLOOMS_REVISED["Analyze"], BLOOMS_REVISED["Evaluate"])
        return ("Apply", "Analyze", BLOOMS_REVISED["Apply"], BLOOMS_REVISED["Analyze"])
    else:
        return ("Evaluate", "Create", BLOOMS_REVISED["Evaluate"], BLOOMS_REVISED["Create"])

def get_time_allocation(duration_str, step):
    total = int(''.join(filter(str.isdigit, str(duration_str))) or '45')
    table = {
        30:  dict(routine=4, review=3, motivation=4, lesson=8,  application=5,  generalization=3, evaluation=2, assignment=1),
        40:  dict(routine=4, review=3, motivation=4, lesson=10, application=8,  generalization=4, evaluation=5, assignment=2),
        45:  dict(routine=5, review=5, motivation=5, lesson=10, application=8,  generalization=4, evaluation=6, assignment=2),
        50:  dict(routine=5, review=5, motivation=5, lesson=12, application=10, generalization=5, evaluation=6, assignment=2),
        60:  dict(routine=5, review=5, motivation=7, lesson=15, application=12, generalization=5, evaluation=9, assignment=2),
        90:  dict(routine=6, review=8, motivation=8, lesson=22, application=18, generalization=8, evaluation=15, assignment=5),
    }
    closest = min(table.keys(), key=lambda x: abs(x - total))
    return table[closest].get(step, 5)


def ensure_table_format(lesson_text, lesson_struct, data):
    """Attempt to convert lesson_struct into DepEd-style HTML tables matching
    the project's fallback spacing and styles. Returns HTML string or None.
    """
    try:
        # If already has tables, return as-is
        if lesson_text and '<table' in str(lesson_text).lower():
            return lesson_text

        td = 'style="padding:10px;border:1px solid #999;vertical-align:top;"'
        th = 'style="background:#e8f4f8;padding:10px;border:1px solid #999;text-align:left;"'
        tbl = 'border="1" cellspacing="0" cellpadding="10" style="width:100%;border-collapse:collapse;margin-bottom:20px;"'

        header = (lesson_struct or {}).get('header', {}) if isinstance(lesson_struct, dict) else {}
        subject = header.get('learning_area') or data.get('subject') or (lesson_struct or {}).get('subject', '')
        grade = header.get('grade_level') or data.get('gradeLevel') or data.get('grade') or ''
        topic = (lesson_struct or {}).get('topic') or data.get('topic') or ''
        quarter = header.get('quarter') or data.get('quarter') or ''
        duration = header.get('duration') or data.get('duration') or ''

        parts = []
        plan_label = 'DETAILED LESSON PLAN'
        parts.append(
            f'<table {tbl}'
            f'><tr><th {th} colspan="2">{plan_label}</th></tr>'
            f'<tr><td {td}><strong>Grade Level</strong></td><td {td}>{grade}</td></tr>'
            f'<tr><td {td}><strong>Learning Area</strong></td><td {td}>{subject}</td></tr>'
            f'<tr><td {td}><strong>Topic</strong></td><td {td}>{topic}</td></tr>'
            f'<tr><td {td}><strong>Quarter</strong></td><td {td}>{quarter}</td></tr>'
            f'<tr><td {td}><strong>Duration</strong></td><td {td}>{duration}</td></tr>'
            f'</table>'
        )

        # Objectives
        objectives = (lesson_struct or {}).get('objectives') if isinstance(lesson_struct, dict) else None
        if objectives:
            obj_html = ''
            if isinstance(objectives, (list, tuple)):
                obj_html = '<br>'.join(str(x) for x in objectives)
            else:
                obj_html = str(objectives)
            parts.append(f'<table {tbl}><tr><th {th}>I. OBJECTIVES</th></tr><tr><td {td}>{obj_html}</td></tr></table>')

        # Content
        content = (lesson_struct or {}).get('content') if isinstance(lesson_struct, dict) else None
        if content:
            if isinstance(content, dict):
                content_text = ''
                for k, v in content.items():
                    content_text += f'<strong>{k.capitalize()}:</strong> {v}<br><br>'
            else:
                content_text = str(content)
            parts.append(f'<table {tbl}><tr><th {th}>II. CONTENT</th></tr><tr><td {td}>{content_text}</td></tr></table>')

        # Learning resources
        lr = (lesson_struct or {}).get('learningResources') if isinstance(lesson_struct, dict) else None
        if lr:
            lr_text = ''
            if isinstance(lr, (list, tuple)):
                lr_text = '<br>'.join(str(x) for x in lr)
            else:
                lr_text = str(lr)
            parts.append(f'<table {tbl}><tr><th {th}>III. LEARNING RESOURCES</th></tr><tr><td {td}>{lr_text}</td></tr></table>')

        # Procedures
        procedures = (lesson_struct or {}).get('procedures') if isinstance(lesson_struct, dict) else None
        if procedures and isinstance(procedures, (list, tuple)) and len(procedures) > 0:
            proc_rows = ''
            for p in procedures:
                if not isinstance(p, dict):
                    continue
                step = p.get('step', '')
                time = p.get('time', '')
                teacher = p.get('teacher', '')
                student = p.get('student', '')
                proc_rows += f'<tr><td {td}>{step}</td><td {td}>{time}</td><td {td}>{teacher}</td><td {td}>{student}</td></tr>'
            parts.append(f'<table {tbl}><tr><th {th}>IV. LEARNING PROCEDURE</th></tr><tr><th {th}>Step</th><th {th}>Time</th><th {th}>Teacher Activity</th><th {th}>Student Activity</th></tr>{proc_rows}</table>')

        # Eval/Assignment/Remarks/Reflection
        for title, key in [('V. EVALUATION', 'evaluation'), ('VI. ASSIGNMENT', 'assignment'), ('VII. REMARKS', 'remarks'), ('VIII. REFLECTION', 'reflection')]:
            val = (lesson_struct or {}).get(key) if isinstance(lesson_struct, dict) else None
            if val:
                val_html = ''
                if isinstance(val, (list, tuple)):
                    val_html = '<br>'.join(str(x) for x in val)
                else:
                    val_html = str(val)
                parts.append(f'<table {tbl}><tr><th {th}>{title}</th></tr><tr><td {td}>{val_html}</td></tr></table>')

        if parts:
            return '\n'.join(parts)
        return None
    except Exception as e:
        print(f'[EnsureTable] ERROR: {e}')
        return None


def normalize_table_styles(html):
    """Normalize table, th, td tags to the project's global styles without
    modifying inner cell content."""
    try:
        if not html or '<table' not in html.lower():
            return html
        tbl_attr = 'border="1" cellspacing="0" cellpadding="10" style="width:100%;border-collapse:collapse;margin-bottom:20px;"'
        td_attr = 'style="background:#ffffff;padding:10px;border:1px solid #999;vertical-align:top;"'
        th_attr = 'style="background:#ffffff;color:#000;padding:10px;border:1px solid #999;text-align:left;"'
        title_th_attr = 'style="background:#012169;color:#ffffff;padding:12px;border:1px solid #999;text-align:left;"'
        html = re.sub(r'<table[^>]*>', f'<table {tbl_attr}>', html, flags=re.IGNORECASE)
        html = re.sub(r'<td[^>]*>', f'<td {td_attr}>', html, flags=re.IGNORECASE)
        html = re.sub(r'<th[^>]*>', f'<th {th_attr}>', html, flags=re.IGNORECASE)
        html = re.sub(r'<th[^>]*colspan[^>]*>', f'<th {title_th_attr}>', html, flags=re.IGNORECASE)
        return html
    except Exception as e:
        print(f'[NormalizeTable] ERROR: {e}')
        return html

# ─────────────────────────────────────────────
# CURRICULUM HELPERS
# ─────────────────────────────────────────────
def build_curriculum_instruction(curriculum, strand=''):
    c = (curriculum or '').strip()
    if 'MATATAG' in c:
        return 'Use the MATATAG Curriculum Guide. Use streamlined, essential competencies only.'
    if 'MELC' in c or 'K-12' in c:
        return 'Use official MELC competency codes (e.g., EN9RC-Ia-14.1). Cite the exact code.'
    if 'SHS' in c:
        return f'Align to SHS CG for strand: {strand or "not specified"}. Specify Core or Specialized.'
    if 'ALS' in c:
        return 'Use ALS Learning Strand codes. Adjust language for adult/non-formal learners.'
    if 'IPED' in c or 'Indigenous' in c:
        return 'Add Cultural Integration section. Use mother tongue context and community references.'
    return 'Use K-12 MELCs as the curriculum framework.'

def build_curriculum_advisory(grade, curriculum):
    grade_years = {
        'Grade 1': 'SY2024-25', 'Grade 4': 'SY2024-25', 'Grade 7': 'SY2024-25',
        'Grade 2': 'SY2025-26', 'Grade 3': 'SY2025-26', 'Grade 5': 'SY2025-26', 'Grade 8': 'SY2025-26',
        'Grade 6': 'SY2026-27', 'Grade 9': 'SY2026-27', 'Grade 10': 'SY2026-27',
    }
    if str(grade) in grade_years and 'MATATAG' not in str(curriculum):
        return f'Advisory: {grade} transitions to MATATAG in {grade_years[str(grade)]}. This plan uses MELCs.'
    return ''

def derive_bloom_levels(grade, difficulty, curriculum):
    grade_num = int(''.join(filter(str.isdigit, str(grade))) or '7')
    if 'ALS' in str(curriculum):
        return ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
    if grade_num <= 3:
        return ['Remember', 'Understand']
    if grade_num <= 6:
        return ['Understand', 'Apply']
    if difficulty == 'Advanced':
        return ['Analyze', 'Evaluate', 'Create']
    return ['Apply', 'Analyze']


def _split_sentences(text):
    import re
    if not text:
        return []
    # Split on sentence boundaries but keep abbreviations simple
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]


def _format_numbered_html(items):
    return ''.join(f'{i+1}. {items[i]}<br>' for i in range(len(items)))


def _inject_teacher_phrases(lesson_text):
    try:
        def _replace_teacher_cell(match):
            open_tag, content, close_tag = match.groups()
            content_text = re.sub(r'<[^>]+>', ' ', content).strip().lower()
            if 'very good' not in content_text:
                content += ' Very good!'
            if 'may i call on' not in content_text:
                content += ' May I call on a student to answer the next question.'
            return f'{open_tag}{content}{close_tag}'

        # Limit injection to the teacher activity cells in the learning procedure table.
        if 'teacher activity' in lesson_text.lower() and 'iv. learning procedure' in lesson_text.lower():
            pattern = re.compile(r'(<td[^>]*>)(.*?)(</td>)', re.IGNORECASE | re.DOTALL)
            # Apply only within the procedure section to avoid unrelated td cells.
            section_match = re.search(r'(iv\. learning procedure.*?)(<table[^>]*>.*?</table>)', lesson_text, re.IGNORECASE | re.DOTALL)
            if section_match:
                start = section_match.start(1)
                end = section_match.end(2)
                section = lesson_text[start:end]
                section = pattern.sub(_replace_teacher_cell, section)
                lesson_text = lesson_text[:start] + section + lesson_text[end:]
    except Exception as e:
        print(f'[Formatter] Teacher phrase injection failed: {e}')
    return lesson_text


def _ensure_remarks_reflection(lesson_text):
    try:
        def _rewrite_section(title, required_sentences, add_sentence):
            pattern = re.compile(rf'(<th[^>]*>\s*{re.escape(title)}\s*</th>\s*</tr>\s*<tr>\s*<td[^>]*>)(.*?)(</td>)', re.IGNORECASE | re.DOTALL)
            def repl(match):
                prefix, content, suffix = match.groups()
                content_text = re.sub(r'<[^>]+>', ' ', content).strip()
                sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', content_text) if s.strip()]
                if len(sentences) < required_sentences or not any(add_sentence.lower() in c.lower() for c in sentences):
                    content = content.rstrip() + ' ' + add_sentence
                return prefix + content + suffix
            return pattern.sub(repl, lesson_text)

        lesson_text = _rewrite_section('VII. REMARKS', 2,
                                      'The teacher noted which learners need follow-up support and what was accomplished during the lesson.')
        lesson_text = _rewrite_section('VIII. REFLECTION', 3,
                                      'The teacher reflected that the lesson worked well, identified one improvement, and noted what the next session will focus on.')
    except Exception as e:
        print(f'[Formatter] Remarks/Reflection adjustment failed: {e}')
    return lesson_text


def enforce_strict_structured_formatting(lesson_text, lesson_struct):
    """Normalize lesson_struct fields without rewriting formatted lesson_text."""
    try:
        if not lesson_struct:
            return lesson_text, lesson_struct

        for key in ('evaluation', 'assignment', 'remarks', 'reflection'):
            val = lesson_struct.get(key)
            if not val or not isinstance(val, str):
                continue

            if '<table' in val.lower():
                continue

            if '<br' in val or '<strong>' in val or '\n' in val:
                lesson_struct[key] = val.replace('\r\n', '\n').replace('\n\n', '<br><br>').replace('\n', '<br>')
                continue

            sentences = _split_sentences(val)
            if not sentences:
                continue

            if key == 'evaluation':
                lesson_struct[key] = val.replace('\r\n', '\n').replace('\n\n', '<br><br>').replace('\n', '<br>')

            elif key == 'assignment':
                ext = sentences[:3]
                curios = sentences[3:6] if len(sentences) > 3 else []
                submit = sentences[6:] if len(sentences) > 6 else sentences[3:]
                html = '<strong>Assignment</strong><br>' + _format_numbered_html(ext)
                if curios:
                    html += '<br><strong>Curiosity Tasks</strong><br>' + _format_numbered_html(curios)
                if submit:
                    html += '<br><strong>Submission Requirement</strong><br>' + _format_numbered_html(submit)
                lesson_struct[key] = html

            elif key == 'remarks':
                lesson_struct[key] = '<strong>Remarks</strong><br>' + _format_numbered_html(sentences)

            elif key == 'reflection':
                lesson_struct[key] = '<strong>Reflection</strong><br>' + _format_numbered_html(sentences)

        return lesson_text, lesson_struct
    except Exception as e:
        print(f'[Formatter] ERROR: {e}')
        return lesson_text, lesson_struct


def validate_dlp(text):
    """Validate that the generated DLP contains the exact required section headings.

    Rules (strict): each required heading must appear as the exact text listed below
    inside either a <th> tag or a prominent <td> cell. Matching is case-insensitive
    but the literal text (including punctuation and numbering) must be present.
    Returns a dict with score, total, missing, passed, and percentage.
    """
    import re

    required_headings = [
        'I. OBJECTIVES',
        'II. CONTENT',
        'III. LEARNING RESOURCES',
        'IV. LEARNING PROCEDURE',
        'V. EVALUATION',
        'ANSWER KEY',
        'VI. ASSIGNMENT',
        'VII. REMARKS',
        'VIII. REFLECTION',
    ]

    if not text or not isinstance(text, str):
        return {
            'score': 0, 'total': len(required_headings), 'missing': required_headings,
            'passed': False, 'percentage': 0
        }

    missing = []
    # We'll search the raw HTML for each heading appearing inside a <th> or <td> tag.
    for heading in required_headings:
        pattern = re.compile(rf'<(?:th|td)[^>]*>\s*{re.escape(heading)}\s*</(?:th|td)>', re.IGNORECASE)
        if not pattern.search(text):
            # Also accept the heading appearing as a standalone text at the start of a row
            # like <tr><th> I. OBJECTIVES </th></tr> or as a bold cell <td><strong>I. OBJECTIVES</strong></td>
            # Check for simple occurrences where tags wrap the heading with optional inner tags.
            inner_pattern = re.compile(rf'<(?:th|td)[^>]*>\s*(?:<[^>]+>\s*)*{re.escape(heading)}\s*(?:</[^>]+>\s*)*</(?:th|td)>', re.IGNORECASE)
            if not inner_pattern.search(text):
                missing.append(heading)

    score = len(required_headings) - len(missing)
    percentage = 0
    try:
        percentage = round((score / len(required_headings)) * 100)
    except Exception:
        percentage = 0

    return {
        'score': score,
        'total': len(required_headings),
        'missing': missing,
        'passed': len(missing) == 0,
        'percentage': percentage,
    }


def extract_decisions(data):
    grade = data.get('gradeLevel') or data.get('grade') or 'Grade not specified'
    difficulty = data.get('difficulty', 'Intermediate')
    duration = data.get('duration', '')
    curriculum = data.get('curriculum') or ''
    subject = data.get('subject') or ''
    topic = data.get('topic') or ''
    quarter = data.get('quarter') or ''
    output_format = data.get('outputFormat') or data.get('output_format') or ''

    grade_num = int(''.join(filter(str.isdigit, str(grade))) or '7')
    decisions = [f"Grade Level: {grade}"]
    if grade_num <= 3:
        decisions.append("Primary grade → Simple vocabulary, play-based activities, Remember/Understand objectives")
    elif grade_num <= 6:
        decisions.append("Intermediate grade → Concrete-to-abstract progression, Understand/Apply objectives")
    elif grade_num <= 10:
        decisions.append("Junior High grade → Analytical tasks, Apply/Analyze objectives")
    else:
        decisions.append("Senior High grade → Research-based tasks, Evaluate/Create objectives")

    if subject:   decisions.append(f"Subject: {subject} → All competencies and examples scoped to this learning area")
    if topic:     decisions.append(f"Topic: {topic} → All objectives, activities, and assessments centered on this concept")
    if quarter:   decisions.append(f"Quarter: {quarter} → Pacing and references framed for this grading period")
    if difficulty: decisions.append(f"Difficulty: {difficulty} → Depth and scaffolding calibrated accordingly")
    if duration:   decisions.append(f"Duration: {duration} → All 6 RRMLAG steps time-allocated to fit exactly")
    if curriculum: decisions.append(f"Curriculum: {curriculum} → Lesson aligned to this framework")
    if output_format: decisions.append(f"Output format: {output_format} → Layout generated accordingly")
    return decisions


def build_section_completeness(missing_sections):
    names = ['Objectives', 'Content Standards', 'Performance Standards', 'Learning Competencies',
             'Subject Matter', 'Learning Resources', 'Procedures', 'Teacher Activity',
             'Student Activity', 'Evaluation', 'Answer Key', 'Assignment', 'Remarks', 'Reflection']
    missing_norm = {str(m).strip().lower() for m in (missing_sections or [])}
    return [{'section': n, 'complete': n.lower() not in missing_norm} for n in names]


# Normalize metadata and response-level information
def normalize_response_metadata(data, lesson_text, lesson_struct=None, output_format='narrative'):
    curriculum = data.get('curriculum', 'K-12 MELCs (DepEd Order No. 12, s. 2020)')
    strand = data.get('strand', '')
    grade = data.get('gradeLevel') or data.get('grade') or ''
    difficulty = data.get('difficulty', 'Intermediate')
    competency_codes = data.get('competencyCodes') or []
    objectives = data.get('objectives') or []
    warnings = data.get('warnings') or []

    blooms_levels = derive_bloom_levels(grade, difficulty, curriculum)
    advisory = build_curriculum_advisory(grade, curriculum)
    validation = validate_dlp(lesson_text)
    section_completeness = build_section_completeness(validation.get('missing'))

    if lesson_struct:
        competency_codes = lesson_struct.get('competencyCodes') or competency_codes
        objectives = lesson_struct.get('objectives') or objectives
        warnings = lesson_struct.get('warnings') or warnings

    if not objectives:
        # Attempt to extract objectives from the generated HTML lesson plan if the structure payload did not include them
        try:
            objectives = []
            if lesson_text and '<th' in lesson_text.upper() and 'I. OBJECTIVES' in lesson_text.upper():
                obj_match = re.search(r'<table[^>]*>.*?<th[^>]*>\s*I\. OBJECTIVES\s*</th>(.*?)</table>', lesson_text, flags=re.IGNORECASE|re.DOTALL)
                if obj_match:
                    obj_html = obj_match.group(1)
                    td_texts = re.findall(r'<td[^>]*>(.*?)</td>', obj_html, flags=re.IGNORECASE|re.DOTALL)
                    for td in td_texts:
                        text_value = re.sub(r'<[^>]+>', ' ', td).strip()
                        if text_value:
                            objectives.append(text_value)
        except Exception as _e:
            print(f'[Normalize] Objective extraction failed: {_e}')

    if not objectives:
        topic = data.get('topic') or 'the topic'
        objectives = [
            f'Identify key ideas related to {topic}',
            f'Demonstrate understanding through a class activity on {topic}',
            f'Show appreciation for {topic} in daily life',
        ]

    return {
        'validation': validation,
        'decisions': extract_decisions({**data, 'curriculum': curriculum, 'outputFormat': output_format}),
        'curriculum': curriculum,
        'strand': strand,
        'competencyCodes': competency_codes,
        'objectives': objectives,
        'warnings': list(dict.fromkeys([*warnings, *validation.get('missing', [])] + ([advisory] if advisory else []))),
        'bloomsLevels': blooms_levels,
        'advisory': advisory,
        'sectionCompleteness': section_completeness,
        'outputFormat': output_format,
        'source': data.get('source', 'groq'),
    }

# ─────────────────────────────────────────────
# SYSTEM PROMPT BUILDER
# ─────────────────────────────────────────────
def build_system_prompt(is_detailed):
    plan_label = 'DETAILED LESSON PLAN' if is_detailed else 'SEMI-DETAILED LESSON PLAN'

    if is_detailed:
        proc_structure = (
            'Section IV uses exactly 3 columns with this header row: Step | Teacher Activity | Expected Student Response. '
            'The Expected Student Response column contains the actual answer or output the student is expected to produce — '
            'written as content points, not as quoted dialogue. '
            'Format: short statements showing what the student should know, say, or produce based on the teacher question. '
            'Example: Teacher asks "What is a noun?" — Expected Student Response: "Names a person, place, thing, or idea. '
            'Examples: teacher, Manila, book, love." '
            'Never write it as: "Ma\'am, the answer is..." or "Yes, I can..." '
            'Every step must have a filled Expected Student Response column — never leave it empty or write a placeholder.'
        )
    else:
        proc_structure = (
            'Section IV uses exactly 2 columns with this header row: Step | Teacher Activity. '
            'Do NOT add a third column. Do NOT write student responses or expected answers anywhere in Section IV. '
            'The Teacher Activity column must still be fully detailed, scripted, and rich — '
            'Semi-Detailed means no student column, not a shorter or vague lesson. '
            'The depth and quality of Teacher Activity must be identical to a Detailed DLP.'
        )

    return f"""You are an expert Filipino DepEd lesson-plan writer. Generate a complete {plan_label}.

ABSOLUTE OUTPUT RULES:
- Return ONLY raw HTML tables. Zero markdown. Zero code fences. Zero explanatory text. Zero JSON.
- Begin your response with the first <table> tag. Nothing before it.
- Generate exactly 9 tables in the exact order below. Never skip, rename, or reorder any table.
- All section headings must appear EXACTLY as written below inside a <th> tag with colspan spanning all columns.

TABLE ORDER AND EXACT HEADINGS:
Table 1: Header (no section heading — just rows for school info)
Table 2: I. OBJECTIVES
Table 3: II. CONTENT
Table 4: III. LEARNING RESOURCES
Table 5: IV. LEARNING PROCEDURE
Table 6: V. EVALUATION
Table 7: VI. ASSIGNMENT
Table 8: VII. REMARKS
Table 9: VIII. REFLECTION

TABLE STYLE — apply to every table and every cell:
- Table tag: border="1" cellspacing="0" cellpadding="10" style="width:100%;border-collapse:collapse;margin-bottom:20px;"
- Section title <th> (I. OBJECTIVES, II. CONTENT, etc.): style="background:#2e7d32;color:#ffffff;padding:12px;border:1px solid #999;text-align:left;font-weight:bold;"
- Column header <th> (Category, Description, Step, Teacher Activity, etc.): style="background:#d0e8f0;padding:10px;border:1px solid #999;text-align:left;font-weight:bold;"
- Data <td>: style="padding:10px;border:1px solid #999;vertical-align:top;background:#ffffff;"

TABLE 1 — HEADER:
A 2-column table. No section title row. Rows:
School Name | [LEAVE EMPTY — never fill this in]
Teacher Name | [LEAVE EMPTY — never fill this in]
Subject | [value from input]
Grade Level | [value from input]
Date | [LEAVE EMPTY — never fill this in]
Quarter | [value from input]
Duration | [value from input]
Lesson Plan Type | [value from input]
Difficulty | [value from input]
Curriculum | [value from input]
RULE: School Name, Teacher Name, and Date must ALWAYS be empty. Never generate values for these three fields.

TABLE 2 — I. OBJECTIVES:
2-column table. Title row colspan="2". Column headers: Category | Description.
Generate these exact rows in this order:
1. Content Standards — Write a noun phrase describing what learners demonstrate understanding of, derived entirely from the topic and subject. Never start with "At the end of..."
2. Performance Standards — Write a performance noun phrase describing what learners should be able to transfer or perform, derived from the topic. Never start with "At the end of..."
3. Learning Competencies — Write the specific MELC or MATATAG competency code and its full description for the topic in the subject at the given grade level. If the exact code is unknown, write the closest accurate competency description.
4. Cognitive Objective — Start with: "At the end of the [duration] lesson, the students must be able to:" followed by a Bloom's Revised Taxonomy verb appropriate for the grade level and difficulty, then a specific measurable outcome about the topic.
5. Psychomotor Objective — Start with: "At the end of the [duration] lesson, the students must be able to:" followed by a physical or skill performance verb (demonstrate, perform, construct, present, produce, execute), then a specific physical or skill outcome about the topic.
6. Affective Objective — Start with: "At the end of the [duration] lesson, the students must be able to:" followed by a values or attitude verb (appreciate, value, exhibit, internalize, reflect on, show), then a specific values outcome about the topic.
RULE: All three objectives must use different verbs. All must be specifically about the topic — not about the subject in general.
RULE: Bloom's Revised Taxonomy levels by grade — Remember/Understand for Grades 1-3, Understand/Apply for Grades 4-6, Apply/Analyze for Grades 7-10 Basic/Intermediate, Analyze/Evaluate for Grades 7-10 Advanced, Evaluate/Create for Grades 11-12.

TABLE 3 — II. CONTENT:
2-column table. Title row colspan="2". Column headers: Category | Description.
Rows:
1. Subject Matter — Must be exactly the topic name from the input. Nothing else.
2. References — Must be a real, specific DepEd publication with order number, or a real URL to DepEd learning materials. Never write generic references like "Grade X English textbook." Format: Title. Author/Publisher. URL if available.
3. Materials — List specific physical classroom items appropriate for teaching this topic at this grade level. Must be actual teaching materials, not generic placeholders.
4. Values Infused — Values connected to the topic that the lesson naturally develops.

TABLE 4 — III. LEARNING RESOURCES:
2-column table. Title row colspan="2". Column headers: Resource | Description.
List 5-7 specific resources that directly support learning this topic. Include textbooks, visual aids, printed materials, digital tools, and physical equipment appropriate for the grade level and topic.

TABLE 5 — IV. LEARNING PROCEDURE:
{proc_structure}
Title row spans all columns. Column header row follows immediately after title row.
Steps must appear in this EXACT order with these EXACT names — no letters, no numbers before the step names:
Routine | Review | Motivation | Lesson Proper | Application | Generalization

ROUTINE Teacher Activity — script all four parts with actual classroom dialogue:
- Prayer: Teacher nominates a student to lead. Write the actual nomination line.
- Greetings: Teacher greets the class. Write the actual greeting.
- Classroom Management: Teacher gives specific instructions about physical readiness — chairs, desks, materials, attention.
- Attendance: Teacher asks the class secretary to report. Write the actual request line.

REVIEW Teacher Activity — write 2 to 3 real, specific questions about the previous lesson that connect to the current topic. Write the actual full question text. Do not write "teacher asks questions about the previous lesson." Write the questions themselves.

MOTIVATION Teacher Activity — create a named activity, game, icebreaker, or glimpse of the lesson that connects directly to the topic. Write: the activity title, the full mechanics/instructions, and how it connects to the topic. This must be topic-specific, not generic. It must be engaging for the grade level.

LESSON PROPER Teacher Activity — write the actual teaching content:
- Define the key concept of the topic in clear, grade-appropriate language.
- Give concrete, real examples of the topic appropriate for the grade level and subject.
- Write teacher questions and the content of what students should answer.
- Include explanations, board work descriptions, and follow-up questions.
- This must read like a real teaching script. Never write "teacher explains the topic" as the entire content.

APPLICATION Teacher Activity — write:
- The activity title and its direct connection to the topic.
- Division of the class into 3 to 4 groups.
- What each group specifically does — not generic "students do a task."
- Must incorporate at least one of: reading, writing, listening, or speaking.
- A rubric with specific observable criteria names and point values tied directly to the topic and activity output.

GENERALIZATION Teacher Activity — write out all three questions in full in this exact order:
1. Cognitive question: about what students learned about the topic today.
2. Psychomotor question: about how students can apply or demonstrate the topic.
3. Affective question: about why the topic matters in their life or community.
Do not summarize. Write the actual question text.

TABLE 6 — V. EVALUATION:
2-column table. Title row colspan="2" with heading "V. EVALUATION".
- Write a minimum of 5 numbered evaluation items, all specifically about the topic.
- Each item must have a real, specific correct answer — never vague entries.
- If the evaluation is a quiz or identification: number each item clearly.
- If the evaluation is an essay or performance task: include a rubric with criteria names and point values specific to the task output.
- After all items, add a second colspan="2" heading row with the text "ANSWER KEY" in the same table.
- Below the ANSWER KEY heading, list each item number with its specific correct answer.
- Never write "Students will answer" or "Yes I can" as answer key entries.

TABLE 7 — VI. ASSIGNMENT:
2-column table. Title row colspan="2".
- Write a specific task about the topic that students will submit on the next class meeting.
- State the deadline clearly.
- If the output is written, creative, or performance-based: include a rubric with criteria and point values.

TABLE 8 — VII. REMARKS:
2-column table. Title row colspan="2".
- Write at least 2 to 3 professional observations about lesson delivery, learner participation, and pacing.
- Must be specific to the lesson — not generic statements.

TABLE 9 — VIII. REFLECTION:
2-column table. Title row colspan="2".
- Write at least 3 sentences from the teacher's perspective.
- Address: what worked well, what needs improvement, and what the next session will focus on.
- Must be specific to the topic and lesson taught.

TOPIC ANCHORING — NON-NEGOTIABLE:
The topic from the input is the sole subject of every section. Every objective, every activity, every question, every evaluation item, every assignment must be specifically about that topic. If the topic is a specific concept within a broader subject, teach only that specific concept. Never expand to the broader subject. Never substitute the topic with a related concept.

DEVELOPMENTAL APPROPRIATENESS:
Match all content, vocabulary, and activity complexity to the grade level:
- Grades 1-3: simple vocabulary, short sentences, concrete and play-based activities.
- Grades 4-6: concrete-to-abstract, guided tasks, familiar contexts.
- Grades 7-10: analytical thinking, real-world application, group collaboration.
- Grades 11-12: research-based, evaluative, independent creative output.
The difficulty input adjusts depth within the appropriate range for the grade. Never apply vocabulary or tasks beyond what is developmentally appropriate.

LESSON PLAN TYPE ENFORCEMENT:
{proc_structure}
"""

# ─────────────────────────────────────────────
# PROMPT BUILDER
# ─────────────────────────────────────────────
def build_prompt(data, output_format='narrative'):
    subject = data.get('subject') or ''
    grade = data.get('gradeLevel') or data.get('grade') or ''
    topic = data.get('topic') or ''
    quarter = data.get('quarter') or ''
    duration = data.get('duration') or ''
    difficulty = data.get('difficulty') or ''
    notes = data.get('specialNotes') or data.get('special_notes') or ''
    curriculum = data.get('curriculum') or ''
    lesson_type = (data.get('lessonPlanType') or data.get('lesson_plan_type') or data.get('dlp_type') or '').strip()

    return f"""Generate a complete DepEd lesson plan using these inputs:

Subject: {subject}
Grade Level: {grade}
Topic: {topic}
Quarter: {quarter}
Duration: {duration}
Difficulty: {difficulty}
Curriculum: {curriculum}
Lesson Plan Type: {lesson_type}
Special Notes: {notes}

Apply Special Notes as mandatory requirements throughout every section.
All content must be derived from the Topic above. Every objective, activity, question, evaluation item, and assignment must be specifically about: {topic}."""
# ─────────────────────────────────────────────
# GEMINI CALL
# ─────────────────────────────────────────────
def call_gemini(data, output_format='narrative'):
    lesson_type = (data.get('lessonPlanType') or data.get('lesson_plan_type') or data.get('dlp_type') or '').strip()
    is_detailed = 'semi' not in lesson_type.lower()

    system_prompt = build_system_prompt(is_detailed)
    user_prompt = build_prompt(data, output_format)

    use_reference = bool(data.get('use_reference') or data.get('useReference'))
    if use_reference:
        user_prompt = build_strict_prompt(user_prompt, data, output_format)

    subject = data.get('subject') or ''
    grade = data.get('gradeLevel') or data.get('grade') or ''
    topic = data.get('topic') or ''
    quarter = data.get('quarter') or ''
    duration = data.get('duration') or ''
    difficulty = data.get('difficulty') or ''
    curriculum = data.get('curriculum') or ''

    print(f'[Groq] System prompt length: {len(system_prompt)} chars')
    print(f'[Groq] User prompt length: {len(user_prompt)} chars')
    print(f'[Groq] use_reference={use_reference}')

    part1_addition = (
        "\n\nIMPORTANT FOR THIS CALL ONLY:\n"
        "Generate ONLY Tables 1 through 5 in this exact order:\n"
        "Table 1: Header\n"
        "Table 2: I. OBJECTIVES\n"
        "Table 3: II. CONTENT\n"
        "Table 4: III. LEARNING RESOURCES\n"
        "Table 5: IV. LEARNING PROCEDURE\n\n"
        "Stop after Table 5. Skip V. EVALUATION, VI. ASSIGNMENT, VII. REMARKS, VIII. REFLECTION entirely."
    )
    part1_system = system_prompt + part1_addition

    part2_prompt = (
        "Generate ONLY these 4 tables for a DepEd lesson plan. "
        "Start immediately with the first <table> tag. Nothing before it.\n\n"
        f"Subject: {subject}\nGrade Level: {grade}\nTopic: {topic}\n"
        f"Quarter: {quarter}\nDuration: {duration}\nDifficulty: {difficulty}\n"
        f"Curriculum: {curriculum}\nLesson Plan Type: {lesson_type}\n\n"
        "TABLE STYLE: Table border=1 cellspacing=0 cellpadding=10 width=100% border-collapse=collapse. "
        "Section title th background=#2e7d32 color=white. Column header th background=#d0e8f0. Data td background=white.\n\n"
        f"TABLE A - V. EVALUATION: 2-col table. Heading: V. EVALUATION. Min 5 numbered items about {topic}. "
        f"Real specific answers. Then ANSWER KEY heading row. List answers below.\n\n"
        f"TABLE B - VI. ASSIGNMENT: 2-col table. Heading: VI. ASSIGNMENT. Task about {topic} due next meeting. Include rubric.\n\n"
        "TABLE C - VII. REMARKS: 2-col table. Heading: VII. REMARKS. Min 2 specific observations about delivery and pacing.\n\n"
        f"TABLE D - VIII. REFLECTION: 2-col table. Heading: VIII. REFLECTION. Min 3 sentences about {topic} lesson. "
        "What worked, what to improve, next session focus.\n\n"
        "Generate all 4 tables. Never skip any."
    )

    last_error = None
    model = groq_model_primary

    part1_text = None
    for attempt in range(1, 4):
        print(f'[Groq] Call1 Attempt {attempt} using model: {model}')
        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {'role': 'system', 'content': part1_system},
                    {'role': 'user', 'content': user_prompt}
                ],
                max_tokens=8000,
                temperature=0.2,
            )
            raw = response.choices[0].message.content
            text = str(raw or '').strip()
            if not text or len(text) < 300:
                raise ValueError('Empty or too short response')
            if '<table' not in text.lower():
                raise ValueError('No tables in response')
            print(f'[Groq] Call1 Success: {len(text)} chars (model={model})')
            part1_text = text
            break
        except Exception as e:
            last_error = e
            err_text = str(e).lower()
            print(f'[Groq] Call1 Attempt {attempt} ERROR: {type(e).__name__}: {e}')
            if ('token' in err_text or 'limit' in err_text or '413' in err_text or 'request too large' in err_text) and model != groq_model_strong:
                model = groq_model_strong
                continue
            if attempt < 3:
                model = groq_model_strong if model == groq_model_primary else groq_model_primary
                continue

    if not part1_text:
        print('[Groq] Call1 all attempts failed')
        return None, None

    part2_text = None
    model = groq_model_primary
    for attempt in range(1, 4):
        print(f'[Groq] Call2 Attempt {attempt} using model: {model}')
        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {'role': 'system', 'content': 'You are an expert Filipino DepEd lesson-plan writer. Return ONLY raw HTML tables. Zero markdown. Zero code fences. Zero explanatory text. Begin with the first <table> tag.'},
                    {'role': 'user', 'content': part2_prompt}
                ],
                max_tokens=4000,
                temperature=0.2,
            )
            raw = response.choices[0].message.content
            text = str(raw or '').strip()
            if not text or len(text) < 200:
                raise ValueError('Empty or too short response')
            if '<table' not in text.lower():
                raise ValueError('No tables in response')
            required = ['VI. ASSIGNMENT', 'VII. REMARKS', 'VIII. REFLECTION', 'ANSWER KEY']
            missing = [s for s in required if s not in text.upper()]
            if missing:
                print(f'[Groq] Call2 incomplete, missing: {missing} - retrying')
                raise ValueError(f'Incomplete: {missing}')
            print(f'[Groq] Call2 Success: {len(text)} chars (model={model})')
            part2_text = text
            break
        except Exception as e:
            last_error = e
            err_text = str(e).lower()
            print(f'[Groq] Call2 Attempt {attempt} ERROR: {type(e).__name__}: {e}')
            if ('token' in err_text or 'limit' in err_text or '413' in err_text or 'request too large' in err_text) and model != groq_model_strong:
                model = groq_model_strong
                continue
            if attempt < 3:
                model = groq_model_strong if model == groq_model_primary else groq_model_primary
                continue

    if not part2_text:
        print('[Groq] Call2 failed - using part1 only')
        return part1_text, None

    combined = part1_text + '\n' + part2_text
    print(f'[Groq] Combined output: {len(combined)} chars')
    return combined, None


def call_gemini_fallback(data):
    lesson_type = (data.get('lessonPlanType') or data.get('lesson_plan_type') or data.get('dlp_type') or '').strip()
    is_detailed = 'semi' not in lesson_type.lower()

    system_prompt = build_system_prompt(is_detailed)

    subject = data.get('subject') or 'Subject'
    grade = data.get('gradeLevel') or data.get('grade') or 'Grade not specified'
    topic = data.get('topic') or 'Topic'
    quarter = data.get('quarter') or '1st Quarter'
    duration = data.get('duration') or '50 Minutes'
    curriculum = data.get('curriculum') or 'K-12 MELCs (DepEd Order No. 12, s. 2020)'
    special_notes = data.get('specialNotes') or data.get('special_notes') or 'None'
    difficulty = data.get('difficulty') or 'Intermediate'

    user_prompt = f"""Generate a complete DepEd lesson plan using these inputs:

Subject: {subject}
Grade Level: {grade}
Topic: {topic}
Quarter: {quarter}
Duration: {duration}
Difficulty: {difficulty}
Curriculum: {curriculum}
Lesson Plan Type: {lesson_type}
Special Notes: {special_notes}

All content must be specifically about: {topic}
Apply Special Notes as mandatory requirements throughout every section."""

    print('[Groq Fallback] Trying focused fallback with system/user split')
    model = groq_model_primary

    for attempt in range(1, 4):
        print(f'[Groq Fallback] Attempt {attempt} using model: {model}')
        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                temperature=0.3,
            )
            raw = response.choices[0].message.content
            text = str(raw or '').strip()
            if text and len(text) >= 300 and '<table' in text.lower():
                print(f'[Groq Fallback] Success: {len(text)} chars (model={model})')
                return text
            print(f'[Groq Fallback] Invalid response: {len(text)} chars, has_table={"<table" in text.lower()}')
            if attempt < 3:
                model = groq_model_strong if model == groq_model_primary else groq_model_primary
                continue
            return None
        except Exception as e:
            err_text = str(e).lower()
            print(f'[Groq Fallback] Attempt {attempt} ERROR: {type(e).__name__}: {e}')
            if ('413' in err_text or 'request too large' in err_text or 'token' in err_text or 'limit' in err_text) and model != groq_model_strong:
                model = groq_model_strong
                continue
            if attempt < 3:
                model = groq_model_strong if model == groq_model_primary else groq_model_primary
                continue
            return None
    return None


def format_lesson_plan(lesson_html, data):
    if not lesson_html or not isinstance(lesson_html, str):
        print('[Format] No lesson HTML to format or invalid type')
        return lesson_html

    subject = data.get('subject') or ''
    topic = data.get('topic') or ''
    grade = data.get('gradeLevel') or data.get('grade') or ''
    quarter = data.get('quarter') or ''
    duration = data.get('duration') or ''
    notes = data.get('specialNotes') or data.get('special_notes') or ''

    prompt = {
        'content': (
            'Please transform the following DepEd lesson plan HTML into properly structured DepEd DLP HTML tables. '
            'Preserve headings, table layout, and all existing content. Use complete HTML tables only, with no markdown, code fences, or extra narrative outside tables.'
        ),
        'lesson_html': lesson_html,
        'subject': subject,
        'topic': topic,
        'grade': grade,
        'quarter': quarter,
        'duration': duration,
        'special_notes': notes,
    }

    text = lesson_html
    last_error = None
    model = groq_model_strong

    for attempt in range(1, 3):
        print(f'[Format] Attempt {attempt} using model: {model}')
        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=[{'role': 'user', 'content': json.dumps(prompt)}],
                max_tokens=3000,
                temperature=0.0,
            )
            formatted = str(response.choices[0].message.content or '').strip()
            if formatted and len(formatted) > 300:
                text = formatted
                break
            print(f'[Format] Formatter response invalid or too short: {len(formatted)} chars')
            if attempt == 1 and groq_model_primary:
                model = groq_model_primary
                continue
            break
        except Exception as e:
            print(f'[Format] Formatter ERROR attempt {attempt}: {type(e).__name__}: {e}')
            err_text = str(e).lower()
            if ('token' in err_text or 'limit' in err_text or '413' in err_text or 'request too large' in err_text) and model != groq_model_primary and groq_model_primary:
                model = groq_model_primary
                continue
            last_error = e
            break
    if last_error:
        print(f'[Format] Formatter failed: {type(last_error).__name__}: {last_error}')
    print('[Format] Returning original HTML after formatter fallback')
    print(f'[Format] Sample of returned output: {text[:300]}')
    return text


def _grade_number(value):
    return int(''.join(filter(str.isdigit, str(value))) or '0')


def _is_english_subject(subject):
    return 'english' in str(subject or '').lower()


def _safe_topic(subject, topic):
    subject_text = str(subject or '').strip() or 'the subject'
    topic_text = str(topic or '').strip() or 'the topic'
    return subject_text, topic_text


def build_last_resort_evaluation_text(data):
    subject = data.get('subject') or 'the subject'
    topic = data.get('topic') or 'the topic'
    return (
        '<strong>Evaluation</strong><br><br>'
        f'This is a last-resort fallback evaluation placeholder for {topic} in {subject}. '
        'The teacher should replace this section with the actual evaluation items, answer key, or rubric to match the lesson objectives and student needs.'
    )

def build_last_resort_assignment_text(data):
    topic = data.get('topic') or 'the topic'
    subject = data.get('subject') or 'the subject'
    grade = data.get('gradeLevel') or data.get('grade') or 'the grade level'
    return (
        '<strong>Assignment</strong><br><br>'
        f'Write a short summary of what you learned about {topic} in {subject}.<br>'
        'Include one real-life example connected to your community or daily life.<br>'
        'Submit it on your next meeting using the format required by the teacher.'
    )


def build_last_resort_remarks_text(data):
    return (
        '<strong>Remarks</strong><br><br>'
        'Lesson delivered as planned.<br>'
        'Learner participation and pacing were monitored throughout the session.<br>'
        'Follow-up support will be provided as needed.'
    )


def build_last_resort_reflection_text(data):
    topic = data.get('topic') or 'the topic'
    return (
        '<strong>Reflection</strong><br><br>'
        f'Most learners demonstrated understanding of {topic}.<br>'
        'Additional support will be given to learners who need remediation.<br>'
        'The next session will reinforce the key concepts through guided practice.'
    )


def build_last_resort_objectives(data):
    subject = data.get('subject') or 'Subject'
    topic = data.get('topic') or 'Topic'
    return [
        f'Identify key concepts related to {topic} in {subject}.',
        f'Demonstrate understanding of {topic} through a suitable task in {subject}.',
        f'Appreciate the relevance of {topic} in daily life and learning.'
    ]

# ─────────────────────────────────────────────
# FALLBACK HTML
# ─────────────────────────────────────────────
def build_fallback_lesson_plan(data):
    subject  = data.get('subject') or 'Subject'
    topic    = data.get('topic') or 'Topic'
    grade    = data.get('gradeLevel') or data.get('grade') or 'Grade not specified'
    quarter  = data.get('quarter') or '1st Quarter'
    duration = data.get('duration') or '50 Minutes'
    lesson_type = (data.get('lessonPlanType') or data.get('lesson_plan_type') or 'D-DLP').upper()
    is_detailed = lesson_type in ('D-DLP', 'DETAILED', 'DETAILED LESSON PLAN')

    td = 'style="padding:10px;border:1px solid #999;vertical-align:top;"'
    th = 'style="background:#e8f4f8;padding:10px;border:1px solid #999;text-align:left;"'
    tbl = 'border="1" cellspacing="0" cellpadding="10" style="width:100%;border-collapse:collapse;margin-bottom:20px;"'
    plan_label = 'DETAILED LESSON PLAN' if is_detailed else 'SEMI-DETAILED LESSON PLAN'

    if is_detailed:
        routine_teacher = (
            f"Teacher: \"Class, please settle and prepare your materials for our {subject} lesson. First, write your name and date, then listen carefully to the instructions.\"<br><br>"
            "Teacher: \"Check your seating, sharpen your pencil, and make sure your notebook is ready. Is everyone ready to begin?\""
        )
        routine_student = (
            "Student: \"Yes, Ma'am/Sir. We have our materials ready and we are prepared to learn.\""
        )
        review_teacher = (
            f"Teacher: \"Let us review what we learned last class before we begin the {subject} topic. What was the main idea from our previous lesson?\"<br><br>"
            "Teacher: \"Very good. Now, how does that idea help us understand today\'s activity?\""
        )
        review_student = (
            "Student: \"Last lesson we learned the basic concept, and it helps us connect to the new topic by showing the steps we follow.\""
        )
        motivation_teacher = (
            f"Teacher: \"Today\'s topic is <strong>{topic}</strong>. Think of one way this idea appears in real life. Share your idea with a partner and then we will discuss it together.\""
        )
        motivation_student = (
            "Student: \"I can see this concept in my daily life because [insert example], and it helps me understand the lesson better.\""
        )
        lesson_teacher = (
            f"Teacher: \"Our lesson about {topic} in {subject} will focus on the important concepts and how they apply to your daily life.\"<br><br>"
            "Teacher: \"I will explain the main points, show examples, and ask you to respond with complete answers.\""
        )
        lesson_student = (
            f"Student: \"{topic} is important because it helps us understand the main idea and use it in real situations.\""
        )
        app_teacher = (
            f"Teacher: \"Now let us practice with a group activity related to {topic}. Each group will prepare one example, explain it clearly, and show how it connects to the lesson.\""
        )
        app_student = (
            "Student: \"We will work together, share our example, and explain how it connects to the topic.\""
        )
        gen_teacher = (
            f"Teacher: \"To conclude, summarize one major idea from {topic} and how it helps you in {subject}.\""
        )
        gen_student = (
            "Student: \"I learned that this topic helps me understand the subject better and apply it at school or home.\""
        )
        evaluation_text = build_last_resort_evaluation_text(data)
        assignment_text = build_last_resort_assignment_text(data)
        remarks_text = build_last_resort_remarks_text(data)
        reflection_text = build_last_resort_reflection_text(data)
    else:
        routine_teacher = "Teacher facilitates opening routine and classroom management procedures."
        routine_student = "Students participate in routine tasks and prepare for class."
        review_teacher = "Teacher asks review questions linked to the previous lesson."
        review_student = "Students answer and connect prior knowledge."
        motivation_teacher = f"Teacher presents a motivation prompt connected to {topic}."
        motivation_student = "Students share initial ideas."
        lesson_teacher = f"Teacher discusses key concepts, examples, and applications of {topic}."
        lesson_student = "Students listen, respond, and take notes."
        app_teacher = "Teacher facilitates a collaborative application task."
        app_student = "Students complete and present task outputs."
        gen_teacher = "Teacher synthesizes learning with guide questions."
        gen_student = "Students state key takeaways."
        evaluation_text = f"Answer 5 short questions about {topic}; include one real-life example and one concept explanation."
        assignment_text = f"Write a 5-7 sentence summary about {topic} with one community-based example."
        remarks_text = "Lesson delivered using semi-detailed format."
        reflection_text = f"Learners showed developing understanding of {topic}; follow-up checks will continue."

    return f"""
<table {tbl}>
    <tr><th {th} colspan="2">{plan_label}</th></tr>
    <tr><td {td}><strong>School Name</strong></td><td {td}></td></tr>
    <tr><td {td}><strong>Teacher Name</strong></td><td {td}></td></tr>
    <tr><td {td}><strong>Subject</strong></td><td {td}>{subject}</td></tr>
    <tr><td {td}><strong>Grade Level</strong></td><td {td}>{grade}</td></tr>
    <tr><td {td}><strong>Date</strong></td><td {td}></td></tr>
    <tr><td {td}><strong>Quarter</strong></td><td {td}>{quarter}</td></tr>
    <tr><td {td}><strong>Duration</strong></td><td {td}>{duration}</td></tr>
    <tr><td {td}><strong>Lesson Plan Type</strong></td><td {td}>{lesson_type}</td></tr>
    <tr><td {td}><strong>Difficulty</strong></td><td {td}>{data.get('difficulty') or 'Moderate'}</td></tr>
    <tr><td {td}><strong>Curriculum</strong></td><td {td}>{data.get('curriculum') or 'MATATAG'}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>I. OBJECTIVES</th></tr>
  <tr><td {td}>At the end of the lesson, 85% of the students should be able to:<br><br>
  <strong>C – Cognitive:</strong> Identify the key concepts of {topic} and their importance in {subject}.<br><br>
  <strong>P – Psychomotor:</strong> Demonstrate understanding of {topic} through a collaborative group activity.<br><br>
  <strong>A – Affective:</strong> Appreciate the relevance of {topic} in daily Filipino life.<br><br>
  <strong>Content Standards:</strong> The learners demonstrate understanding of {topic} in {subject} for {grade}.<br>
  <strong>Performance Standards:</strong> The learners apply knowledge of {topic} through guided and independent tasks.</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>II. CONTENT</th></tr>
  <tr><td {td}><strong>Topic:</strong> {topic}<br><br><strong>Subject:</strong> {subject}<br><br><strong>Grade Level:</strong> {grade}<br><br><strong>Quarter:</strong> {quarter}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>III. LEARNING RESOURCES</th></tr>
  <tr><td {td}>1. Learner's Module / MELC-aligned material<br>2. Teacher-made slides on {topic}<br>3. Activity sheets for guided practice<br>4. Whiteboard and markers<br>5. Reference charts and visuals</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>IV. LEARNING PROCEDURE</th></tr>
  <tr>
    <th {th}>Step</th>
    <th {th}>Time</th>
    <th {th}>Teacher Activity</th>
    <th {th}>Student Activity</th>
  </tr>
    <tr><td {td}>Routine</td><td {td}>5 min</td><td {td}>{routine_teacher}</td><td {td}>{routine_student}</td></tr>
    <tr><td {td}>Review</td><td {td}>5 min</td><td {td}>{review_teacher}</td><td {td}>{review_student}</td></tr>
    <tr><td {td}>Motivation</td><td {td}>5 min</td><td {td}>{motivation_teacher}</td><td {td}>{motivation_student}</td></tr>
    <tr><td {td}>Lesson Proper</td><td {td}>15 min</td><td {td}>{lesson_teacher}</td><td {td}>{lesson_student}</td></tr>
    <tr><td {td}>Application</td><td {td}>10 min</td><td {td}>{app_teacher}</td><td {td}>{app_student}</td></tr>
    <tr><td {td}>Generalization</td><td {td}>5 min</td><td {td}>{gen_teacher}</td><td {td}>{gen_student}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>V. EVALUATION</th></tr>
    <tr><td {td}>{evaluation_text}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>VI. ASSIGNMENT</th></tr>
    <tr><td {td}>{assignment_text}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>VII. REMARKS</th></tr>
    <tr><td {td}>{remarks_text}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>VIII. REFLECTION</th></tr>
    <tr><td {td}>{reflection_text}</td></tr>
</table>
<table {tbl}>
  <tr><th {th}>NOTE</th></tr>
  <tr><td {td}>The AI fallback did not produce a full Groq lesson plan response. This template is a last-resort fallback and should be reviewed and completed by the teacher.</td></tr>
</table>
"""


def build_fallback_lesson_struct(data):
    subject = data.get('subject') or 'Subject'
    topic = data.get('topic') or 'Topic'
    grade = data.get('gradeLevel') or data.get('grade') or 'Grade not specified'
    quarter = data.get('quarter') or '1st Quarter'
    duration = data.get('duration') or '50 Minutes'
    lesson_type = (data.get('lessonPlanType') or data.get('lesson_plan_type') or 'D-DLP').upper()
    is_detailed = lesson_type in ('D-DLP', 'DETAILED', 'DETAILED LESSON PLAN')

    if is_detailed:
        procedures = [
            {
                'step': 'Routine',
                'time': '5 min',
                'teacher': (
                    f"Teacher: Prepare your notebooks and materials for our {subject} lesson. Check your seating and make sure you are ready to focus.\n\n"
                    'Teacher: Review the classroom norms and let me know if you have any questions before we begin.'
                ),
                'student': (
                    'Student: Prepare materials, arrange the workspace neatly, and confirm readiness for the lesson.\n\n'
                    'Student: Listen to classroom reminders and follow instructions promptly.'
                )
            },
            {
                'step': 'Review',
                'time': '7 min',
                'teacher': (
                    'Teacher: Let us recall what we discussed last time and connect it to today\'s topic.\n\n'
                    'Teacher: Ask two review questions that highlight important vocabulary or ideas from the previous lesson.\n\n'
                    'Teacher: Confirm the correct answers and explain how they help with today\'s learning. '
                ),
                'student': (
                    'Student: Answer the review questions with complete statements and refer to the previous lesson\'s main idea.\n\n'
                    'Student: Describe how the reviewed idea relates to the current topic.'
                )
            },
            {
                'step': 'Motivation',
                'time': '8 min',
                'teacher': (
                    f"Teacher: Introduce the topic {topic} and ask learners to share one example from their daily life or their community.\n\n"
                    'Teacher: Encourage pairs or small groups to discuss and then report one idea aloud. '
                ),
                'student': (
                    'Student: Share examples of the topic from everyday situations and listen to peers\' observations.\n\n'
                    'Student: Explain how the example connects to the learning objective. '
                )
            },
            {
                'step': 'Lesson Proper',
                'time': '15 min',
                'teacher': (
                    f"Teacher: Present the main concepts of {topic} in {subject} with clear examples and definitions.\n\n"
                    'Teacher: Ask learners to respond with the actual meaning or explanation in complete sentences.\n\n'
                    'Teacher: Monitor understanding and provide corrective feedback when needed.'
                ),
                'student': (
                    f"Student: Explain {topic} in their own words and give a relevant example from the lesson.\n\n"
                    'Student: Respond to teacher questions with accurate details and academic language. '
                )
            },
            {
                'step': 'Application',
                'time': '12 min',
                'teacher': (
                    'Teacher: Assign a hands-on or written activity that requires learners to apply the concept in a specific context.\n\n'
                    'Teacher: Provide clear instructions, monitor group work, and ask learners to show their output. '
                ),
                'student': (
                    'Student: Complete the activity, work with classmates, and demonstrate understanding through a real example.\n\n'
                    'Student: Share the output and explain how it applies to the topic. '
                )
            },
            {
                'step': 'Generalization',
                'time': '8 min',
                'teacher': (
                    'Teacher: Summarize the lesson and ask learners to verbalize the main takeaway in relation to the topic.\n\n'
                    'Teacher: Connect the learning to future lessons or real-life decisions. '
                ),
                'student': (
                    'Student: State the main idea of the lesson and describe how it will help them outside the classroom.\n\n'
                    'Student: Reflect on one key point and say why it matters. '
                )
            },
        ]
    else:
        procedures = [
            {'step': 'Routine', 'time': '5 min', 'teacher': 'Facilitates opening routine procedures and readiness checks.', 'student': 'Prepares learning materials and follows class routines.'},
            {'step': 'Review', 'time': '5 min', 'teacher': 'Asks review questions from the previous lesson and clarifies misconceptions.', 'student': 'Answers review questions and recalls prior concepts.'},
            {'step': 'Motivation', 'time': '5 min', 'teacher': f'Introduces a motivation prompt connected to {topic}.', 'student': 'Shares initial observations and predictions.'},
            {'step': 'Lesson Proper', 'time': '15 min', 'teacher': f'Presents key concepts and examples about {topic}.', 'student': 'Listens, responds, and records key points.'},
            {'step': 'Application', 'time': '10 min', 'teacher': 'Facilitates collaborative class task and feedback.', 'student': 'Completes output and shares results.'},
            {'step': 'Generalization', 'time': '5 min', 'teacher': 'Leads synthesis questions and summary closure.', 'student': 'States key takeaways and relevance.'},
        ]

    return {
        'header': {
            'grade_level': grade,
            'learning_area': subject,
            'quarter': quarter,
            'duration': duration,
        },
        'content': {
            'topic': topic,
            'subject': subject,
            'grade_level': grade,
            'quarter': quarter,
        },
        'objectives': [
            f'Cognitive: To be generated by AI based on {topic} in {subject}.',
            f'Psychomotor: To be generated by AI based on {topic} in {subject}.',
            f'Affective: To be generated by AI based on {topic} in {subject}.',
        ],
        'learningResources': [
            "Learner's Module (MELC-aligned)",
            f'Teacher-made slides on {topic}',
            'Activity sheets for guided practice',
            'Whiteboard and markers',
            'Reference charts and visuals',
        ],
        'procedures': procedures,
        'evaluation': f'Evaluation for {topic} in {subject} will be determined by the teacher based on the lesson objectives and learner capacity.',
        'assignment': f'Assignment for {topic} in {subject} will be provided by the teacher at the end of the lesson.',
        'remarks': 'Lesson delivered. Follow-up support will be provided as needed.',
        'reflection': f'Most learners demonstrated understanding of {topic}. Additional support will be given to learners who need remediation.',
    }

# ─────────────────────────────────────────────
# FILE EXTRACTION HELPERS
# ─────────────────────────────────────────────
def extract_text_from_upload(upload):
    filename = (upload.filename or '').lower()
    raw = upload.read() or b''
    if filename.endswith('.txt'):
        return raw.decode('utf-8', errors='ignore')
    if filename.endswith('.pdf'):
        try:
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(raw))
            return '\n'.join(p.extract_text() or '' for p in reader.pages)
        except Exception:
            return raw.decode('utf-8', errors='ignore')
    if filename.endswith('.docx'):
        try:
            from docx import Document
            doc = Document(BytesIO(raw))
            return '\n'.join(p.text for p in doc.paragraphs)
        except Exception:
            return raw.decode('utf-8', errors='ignore')
    return raw.decode('utf-8', errors='ignore')

def parse_json_response(text):
    if not text:
        return None
    first, last = text.find('{'), text.rfind('}')
    if first == -1 or last <= first:
        return None
    try:
        return json.loads(text[first:last+1])
    except Exception:
        return None

def heuristic_extract_metadata(file_text, filename=''):
    text = file_text or ''
    lower = text.lower()
    subject_m = re.search(r'(?:subject|learning area)\s*[:\-]\s*([A-Za-z &/]+)', text, re.IGNORECASE)
    grade_m   = re.search(r'grade\s*(?:level)?\s*[:\-]\s*([A-Za-z0-9 ]+)', text, re.IGNORECASE)
    topic_m   = re.search(r'topic\s*[:\-]\s*([^\n\r]+)', text, re.IGNORECASE)
    quarter_m = re.search(r'(1st|2nd|3rd|4th)\s*quarter', text, re.IGNORECASE)
    duration_m= re.search(r'(\d{1,3})\s*minutes?', text, re.IGNORECASE)
    curriculum = ('MATATAG Curriculum (DepEd Order No. 10, s. 2024)' if 'matatag' in lower
                  else 'K-12 MELCs (DepEd Order No. 12, s. 2020)')
    return {
        'subject':    subject_m.group(1).strip() if subject_m else '',
        'gradeLevel': grade_m.group(1).strip()   if grade_m   else '',
        'topic':      topic_m.group(1).strip()    if topic_m   else '',
        'quarter':    (quarter_m.group(1).capitalize() + ' Quarter') if quarter_m else '',
        'duration':   (duration_m.group(1) + ' Minutes') if duration_m else '',
        'curriculum': curriculum,
        'objectives': [], 'competencyCodes': [], 'references': [],
        'contentStandard': '', 'performanceStandard': '', 'assessmentType': '',
        'valuesIntegrated': [], 'bloomsLevels': [], 'incompleteSections': [], 'warnings': [],
    }

# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
@app.route('/api/generate', methods=['POST'])
def generate():
    print(f'[Debug] GROQ_API_KEY loaded: {bool(os.getenv("GROQ_API_KEY"))}')
    print(f'[Debug] Key starts with: {os.getenv("GROQ_API_KEY", "")[:8]}')
    data = request.get_json(force=True) or {}
    output_format = (data.get('outputFormat') or data.get('output_format') or 'narrative').lower()
    used_fallback = False

    def strip_html(value):
        return re.sub(r'<[^>]+>', '', str(value or '')).strip()

    required_inputs = {
        'subject': ['subject'],
        'gradeLevel': ['gradeLevel', 'grade'],
        'topic': ['topic'],
        'quarter': ['quarter'],
        'duration': ['duration'],
        'curriculum': ['curriculum'],
    }
    missing_required = [key for key, aliases in required_inputs.items() if not any(strip_html(data.get(alias)) for alias in aliases)]
    if missing_required:
        return jsonify({
            'error': 'Missing required fields',
            'missing': missing_required
        }), 400

    try:
        lesson_text, lesson_struct = call_gemini(data, output_format)
        source = 'groq'

        if not lesson_text or len(str(lesson_text).strip()) < 300:
            print('[Generate] Primary Groq failed, trying focused fallback AI prompt')
            fallback_text = call_gemini_fallback(data)
            if fallback_text and len(str(fallback_text).strip()) >= 300:
                lesson_text = fallback_text
                lesson_struct = None
                used_fallback = True
                source = 'fallback'
            else:
                print('[Generate] Focused fallback AI failed, using last-resort static fallback')
                lesson_text = build_fallback_lesson_plan(data)
                lesson_struct = build_fallback_lesson_struct(data)
                used_fallback = True
                source = 'fallback'

        print(f'[Generate] About to call format_lesson_plan, used_fallback={used_fallback}')
        if not used_fallback and '<table' not in str(lesson_text).lower():
            lesson_text = format_lesson_plan(lesson_text, data)
            print(f'[Generate] After format_lesson_plan, lesson length: {len(lesson_text)}')
            print(f'[Generate] Sample after format: {lesson_text[:300]}')
            # Normalize table styles to global spacing rules when formatter returns tables
            if '<table' in str(lesson_text).lower():
                lesson_text = normalize_table_styles(lesson_text)
                print('[Generate] Normalized table styles after formatter')
        else:
            print('[Generate] Skipping formatter (already has tables or used fallback)')
        # Enforce strict internal reformatting on critical sections regardless of source
        lesson_text, lesson_struct = enforce_strict_structured_formatting(lesson_text, lesson_struct)
        print(f'[Generate] After enforce_strict_structured_formatting, lesson length: {len(lesson_text)}')
        print(f'[Generate] Sample after enforce: {lesson_text[:300]}')
        # Ensure normalized table styles after any enforcement changes
        if '<table' in str(lesson_text).lower():
            lesson_text = normalize_table_styles(lesson_text)
            print('[Generate] Normalized table styles after enforcement')

        # If the frontend requested table output but the result contains no <table>,
        # try a deterministic conversion from the structured data before falling back.
        if output_format == 'table' and '<table' not in str(lesson_text or '').lower():
            print('[Generate] Table output requested but no <table> found — attempting deterministic conversion')
            converted = None
            if lesson_struct:
                converted = ensure_table_format(lesson_text, lesson_struct, data)
            if converted and '<table' in converted.lower():
                lesson_text = converted
                print('[Generate] Deterministic conversion produced tables')
            else:
                print('[Generate] Deterministic conversion failed — using fallback table template')
                lesson_text = build_fallback_lesson_plan(data)
                lesson_struct = build_fallback_lesson_struct(data)
                used_fallback = True
                source = 'fallback'

        meta = normalize_response_metadata(data, lesson_text, lesson_struct, output_format)

        result = {
            'lesson_plan':           lesson_text,
            'lesson_plan_struct':    lesson_struct,
            'lesson_plan_narrative': lesson_text if output_format != 'table' else '',
            'lesson_plan_table':     lesson_text if output_format == 'table'  else '',
            'validation':            meta['validation'],
            'decisions':             meta['decisions'],
            'curriculum':            meta['curriculum'],
            'strand':                meta['strand'],
            'competencyCodes':       meta['competencyCodes'],
            'objectives':            meta['objectives'],
            'warnings':              meta['warnings'],
            'bloomsLevels':          meta['bloomsLevels'],
            'advisory':              meta['advisory'],
            'sectionCompleteness':   meta['sectionCompleteness'],
            'outputFormat':          output_format,
            'source':                source,
            'usedFallback':          used_fallback,
            'generated_at':          datetime.now(timezone.utc).isoformat()
        }

        try:
            save_history_item({
                'id': str(uuid.uuid4()),
                'input': data,
                'result': result,
                'created_at': datetime.now(timezone.utc).isoformat()
            })
        except Exception:
            pass

        return jsonify(result)

    except Exception as e:
        print(f'[Generate] FATAL ERROR: {type(e).__name__}: {e}')
        fallback = build_fallback_lesson_plan(data)
        fallback_struct = build_fallback_lesson_struct(data)
        meta = normalize_response_metadata(data, fallback, fallback_struct, output_format)
        return jsonify({
            'lesson_plan':           fallback,
            'lesson_plan_struct':    fallback_struct,
            'lesson_plan_narrative': fallback,
            'lesson_plan_table':     fallback,
            'validation':            meta['validation'],
            'decisions':             meta['decisions'],
            'curriculum':            meta['curriculum'],
            'strand':                meta['strand'],
            'competencyCodes':       meta['competencyCodes'],
            'objectives':            meta['objectives'],
            'warnings':              meta['warnings'],
            'bloomsLevels':          meta['bloomsLevels'],
            'advisory':              meta['advisory'],
            'sectionCompleteness':   meta['sectionCompleteness'],
            'outputFormat':          output_format,
            'source':                'fallback',
            'usedFallback':          True,
            'generated_at':          datetime.now(timezone.utc).isoformat()
        }), 500


@app.route('/api/extract', methods=['POST'])
def extract_lesson_plan():
    try:
        upload = request.files.get('file')
        if not upload:
            return jsonify({'error': 'No file uploaded'}), 400

        filename = upload.filename or 'uploaded-file'
        file_text = extract_text_from_upload(upload)

        prompt = f"""
You are a Filipino lesson-plan extraction assistant.
Extract all lesson plan metadata from the provided file text and return ONLY valid JSON.

Required shape:
{{
  "subject": "",
  "gradeLevel": "",
  "topic": "",
  "quarter": "",
  "duration": "",
  "curriculum": "",
  "objectives": [],
  "competencyCodes": [],
  "references": [],
  "contentStandard": "",
  "performanceStandard": "",
  "assessmentType": "",
  "valuesIntegrated": [],
  "bloomsLevels": [],
  "incompleteSections": [],
  "warnings": []
}}

Rules:
- Infer the curriculum framework from context clues (MATATAG, MELC codes, ALS codes, etc.).
- Preserve exact competency codes and reference URLs.
- List blank or missing sections in incompleteSections.
- List structural issues in warnings.
- Return ONLY the JSON object — no markdown, no explanation.

Filename: {filename}
File text:
{file_text[:20000]}
"""
        extracted = None
        try:
            resp = groq_client.chat.completions.create(
                model=groq_model_primary,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4096,
                temperature=0.0
            )
            extracted = parse_json_response(resp.choices[0].message.content or '')
        except Exception as e:
            print(f'[Extract] Groq error: {e}')

        if not extracted:
            extracted = heuristic_extract_metadata(file_text, filename)

        # Normalize missing fields
        extracted['advisory'] = build_curriculum_advisory(
            extracted.get('gradeLevel', ''), extracted.get('curriculum', ''))
        extracted['source'] = 'uploaded file'
        extracted['filename'] = filename
        return jsonify(extracted)

    except Exception as e:
        print(f'[Extract] FATAL: {e}')
        return jsonify({'error': 'Unable to extract lesson plan data'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(load_history())


@app.route('/api/history/save', methods=['POST'])
def save_history():
    item = (request.json or {}).copy()
    item['id'] = item.get('id') or str(uuid.uuid4())
    item['saved_at'] = datetime.now(timezone.utc).isoformat()
    save_history_item(item)
    return jsonify({'success': True, 'id': item['id']})


@app.route('/api/history/save', methods=['OPTIONS'])
def save_history_options():
    # Explicitly accept preflight requests for saving history
    return ('', 200)


# Catch-all OPTIONS handler for any /api/* path to ensure preflight succeeds
@app.route('/api/<path:any_path>', methods=['OPTIONS'])
def api_options(any_path):
    return ('', 200)


# New explicit save endpoint (alternate) to ensure POSTs from the frontend succeed
@app.route('/api/history/save2', methods=['POST', 'OPTIONS'])
def save_history_v2():
    if request.method == 'OPTIONS':
        return ('', 200)
    item = (request.json or {}).copy()
    item['id'] = item.get('id') or str(uuid.uuid4())
    item['saved_at'] = datetime.now(timezone.utc).isoformat()
    save_history_item(item)
    return jsonify({'success': True, 'id': item['id']})


# ─────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────
if __name__ == '__main__':
    key = os.getenv('GROQ_API_KEY')
    if not key:
        print('[STARTUP] WARNING: GROQ_API_KEY not set — fallback mode only')
    else:
        print(f'[STARTUP] Groq API key: {key[:8]}...')
    print(f'[STARTUP] Primary model: {groq_model_primary}')
    print(f'[STARTUP] Strong model: {groq_model_strong}')
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
