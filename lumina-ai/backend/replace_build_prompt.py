from pathlib import Path

path = Path(__file__).parent / 'app.py'
text = path.read_text(encoding='utf-8')
start = text.index("def build_prompt(data, output_format='narrative'):")
end = text.index("# ─────────────────────────────────────────────", start)

new_function = '''def build_prompt(data, output_format='narrative'):
    subject = data.get('subject') or 'English'
    grade = data.get('gradeLevel') or data.get('grade') or 'Grade 9'
    topic = data.get('topic') or 'Topic'
    quarter = data.get('quarter') or '1st Quarter'
    duration = data.get('duration') or '50 Minutes'
    difficulty = data.get('difficulty') or 'Intermediate'
    notes = data.get('specialNotes') or data.get('special_notes') or 'None'
    curriculum = data.get('curriculum') or 'K-12 MELCs (DepEd Order No. 12, s. 2020)'
    strand = data.get('strand') or ''

    bloom_cog_level, bloom_analyze_level, cog_verbs, analyze_verbs = get_blooms_level(grade, difficulty)
    cog_verb = cog_verbs[0]
    procedure_cols = (
        "3 columns: Teacher's Questions/Activities | Expected Students' Response | Time"
        if output_format != 'semi' else
        "2 columns: Teacher's Activity | Time"
    )
    curriculum_instruction = build_curriculum_instruction(curriculum, strand)
    advisory = build_curriculum_advisory(grade, curriculum)

    return f"""
You are an expert Filipino curriculum designer and master teacher.
Generate a COMPLETE lesson plan as clean HTML tables only.
Do NOT return JSON, markdown, or any explanation outside the HTML.
Start immediately with the first table.

OUTPUT RULES:
1. Use only valid HTML tables.
2. Use <strong> for bold.
3. Use border=\"1\" cellspacing=\"0\" cellpadding=\"10\" style=\"width:100%;border-collapse:collapse;margin-bottom:20px;\".
4. Use actual student responses. Do not use placeholders.
5. Use subject-specific activities and grade-appropriate language.
6. Special Notes are mandatory and override other instructions.
7. If curriculum is MATATAG, use MATATAG competencies and avoid MELC codes.
8. Do not use radio drama, doomscrolling, diction analysis, motifs, narrator perspective, literary voice, or media literacy unless the subject is English and the topic explicitly requires them.
9. Evaluation must match Bloom's level and include an answer key for objective items.
10. Rubric criteria must describe the actual task and student actions.

LESSON INPUTS:
Subject: {subject}
Grade: {grade}
Topic: {topic}
Quarter: {quarter}
Duration: {duration}
Difficulty: {difficulty}
Curriculum: {curriculum}
{f"Strand: {strand}\n" if strand else ""}Bloom's Cognitive Level: {bloom_cog_level}
Special Notes: {notes}
Curriculum Rule: {curriculum_instruction}
{f"Advisory: {advisory}\n" if advisory else ""}

SECTION 1 — HEADER TABLE
Generate a bordered table with title \"DETAILED LESSON PLAN\" or \"SEMI-DETAILED LESSON PLAN\" depending on output format.

SECTION 2 — I. OBJECTIVES
Generate a bordered table with 3 objectives.
Use Bloom's verbs and include Content Standards, Performance Standards, Learning Competencies, and Values Integration.

SECTION 3 — II. SUBJECT MATTER
Generate a bordered table with topic, subject, grade, quarter, reference, materials, and values infused.

SECTION 4 — III. LEARNING RESOURCES
Generate a bordered table with at least 5 resources relevant to {topic}.

SECTION 5 — IV. PROCEDURE
Generate a bordered table with header \"IV. PROCEDURE\" and columns: {procedure_cols}.
Use 6 steps: Routine, Review, Motivation, Lesson Proper, Application, Generalization.
Include full teacher script and real student responses. Do not summarize.
Keep the language age-appropriate and subject-specific.

SECTION 6 — V. EVALUATION ({t('evaluation')} min)
Generate a bordered table with header \"V. EVALUATION\".
Choose the correct evaluation type based on subject, grade, and topic.
Include a complete answer key for objective assessments.
Use task-specific rubric criteria only when appropriate.

Grade rules:
- Kindergarten and Grade 1: teacher observation checklist only.
- Grade 2 and Grade 3: simple identification, matching, drawing, or oral questions.
- Grade 4 to Grade 6: quiz or fill-in-the-blank for knowledge topics.
- Grade 7 to Grade 10: short answer or problem solving.
- Grade 11 and Grade 12: essay, structured analysis, or research output.

Subject rules:
- Math: use a written problem-solving test or quiz with answer key.
- Science: use identification, diagram labeling, or short answer with answer key.
- Physical Education: use a performance checklist.
- English: use grammar, reading, or writing tasks; answer key for objective items.
- Values Education / Self Improvement: use reflection or self-assessment, not a right/wrong quiz.

SECTION 7 — VI. ASSIGNMENT
Generate a bordered table with header \"VI. ASSIGNMENT\".
Include the teacher announcement and a rubric table with at least 4 specific criteria.

SECTION 8 — VII. REMARKS
Generate a bordered table with header \"VII. REMARKS\".
Include lesson completion status and follow-up notes.

SECTION 9 — VIII. REFLECTION
Generate a bordered table with header \"VIII. REFLECTION\".
Include learner performance counts, strategies that worked, and difficulties.

GLOBAL RULES:
- Always say \"Very good!\" after correct student answers.
- Always elaborate on student answers before moving on.
- Always call students with \"May I call on _____ to...\" or \"Yes, _____?\"
- Use only HTML, no markdown or placeholder text.
- Keep all content relevant to Filipino learners.
"""
'''

p.write_text(text[:start] + new_function + text[end:], encoding='utf-8')
print('Replaced build_prompt with compact version.')
