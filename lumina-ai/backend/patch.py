with open('app.py', 'r') as f:
    content = f.read()

start = content.find('\ndef call_gemini(data, output_format=')
end = content.find('\ndef call_gemini_fallback(data):')

new_func = '''
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
        "\\n\\nIMPORTANT FOR THIS CALL ONLY:\\n"
        "Generate ONLY Tables 1 through 5 in this exact order:\\n"
        "Table 1: Header\\n"
        "Table 2: I. OBJECTIVES\\n"
        "Table 3: II. CONTENT\\n"
        "Table 4: III. LEARNING RESOURCES\\n"
        "Table 5: IV. LEARNING PROCEDURE\\n\\n"
        "Stop after Table 5. Skip V. EVALUATION, VI. ASSIGNMENT, VII. REMARKS, VIII. REFLECTION entirely."
    )
    part1_system = system_prompt + part1_addition

    part2_prompt = (
        "Generate ONLY these 4 tables for a DepEd lesson plan. "
        "Start immediately with the first <table> tag. Nothing before it.\\n\\n"
        f"Subject: {subject}\\nGrade Level: {grade}\\nTopic: {topic}\\n"
        f"Quarter: {quarter}\\nDuration: {duration}\\nDifficulty: {difficulty}\\n"
        f"Curriculum: {curriculum}\\nLesson Plan Type: {lesson_type}\\n\\n"
        "TABLE STYLE: Table border=1 cellspacing=0 cellpadding=10 width=100% border-collapse=collapse. "
        "Section title th background=#2e7d32 color=white. Column header th background=#d0e8f0. Data td background=white.\\n\\n"
        f"TABLE A - V. EVALUATION: 2-col table. Heading: V. EVALUATION. Min 5 numbered items about {topic}. "
        f"Real specific answers. Then ANSWER KEY heading row. List answers below.\\n\\n"
        f"TABLE B - VI. ASSIGNMENT: 2-col table. Heading: VI. ASSIGNMENT. Task about {topic} due next meeting. Include rubric.\\n\\n"
        "TABLE C - VII. REMARKS: 2-col table. Heading: VII. REMARKS. Min 2 specific observations about delivery and pacing.\\n\\n"
        f"TABLE D - VIII. REFLECTION: 2-col table. Heading: VIII. REFLECTION. Min 3 sentences about {topic} lesson. "
        "What worked, what to improve, next session focus.\\n\\n"
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

    combined = part1_text + '\\n' + part2_text
    print(f'[Groq] Combined output: {len(combined)} chars')
    return combined, None

'''

new_content = content[:start] + new_func + content[end:]

with open('app.py', 'w') as f:
    f.write(new_content)

print('Done. Verifying...')
with open('app.py', 'r') as f:
    verify = f.read()
idx = verify.find('def call_gemini(')
print('Has Call1:', 'Call1' in verify[idx:idx+3000])
print('Has Call2:', 'Call2' in verify[idx:idx+3000])