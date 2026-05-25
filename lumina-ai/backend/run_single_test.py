from app import app
import json

payload = {
    'subject': 'Math',
    'gradeLevel': 'Grade 1',
    'topic': 'Shapes',
    'quarter': '1st Quarter',
    'duration': '40 Minutes',
    'difficulty': 'Intermediate',
    'specialNotes': '',
    'curriculum': 'MATATAG'
}

with app.test_client() as client:
    resp = client.post('/api/generate', json=payload)
    print('STATUS', resp.status_code)
    print(resp.get_data(as_text=True))
