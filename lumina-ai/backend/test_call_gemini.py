from app import call_gemini

data = {
    'subject': 'Math',
    'grade': 'Grade 1',
    'topic': 'Shapes',
    'quarter': '1st Quarter',
    'duration': '45 Minutes',
    'curriculum': 'K-12 MELC',
    'difficulty': 'Basic',
    'specialNotes': 'Use concrete objects and hands-on sorting activities.'
}

result = call_gemini(data, 'narrative')
print(result)
