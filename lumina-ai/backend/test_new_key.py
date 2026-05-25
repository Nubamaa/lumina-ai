import os
from groq import Groq
from dotenv import load_dotenv
import sys

# Force reload
if 'app' in sys.modules:
    del sys.modules['app']

# Clear env
for key in list(os.environ.keys()):
    if 'GROQ' in key:
        del os.environ[key]

# Reload with new key
load_dotenv(override=True)

key = os.getenv('GROQ_API_KEY')
print(f'API Key loaded: {key[:20]}...')

from app import build_system_prompt, build_prompt

client = Groq(api_key=key)

test_data = {
    'subject': 'English',
    'gradeLevel': '6',
    'topic': 'Nouns',
    'quarter': '1st Quarter',
    'duration': '50 minutes',
    'difficulty': 'Beginner',
    'curriculum': 'DepEd MELCs',
    'lessonPlanType': 'Detailed',
    'specialNotes': 'Keep examples simple'
}

sys_prompt = build_system_prompt(True)
user_prompt = build_prompt(test_data)

print(f'System prompt: {len(sys_prompt)} chars')
print(f'User prompt: {len(user_prompt)} chars')
print('Testing 70B model...')

try:
    response = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': user_prompt}
        ],
        max_tokens=4000,
        temperature=0.2,
    )
    
    result = response.choices[0].message.content
    print(f'SUCCESS! Got {len(result)} chars')
    print(f'First 400 chars:\n{result[:400]}')
    has_table = '<table' in result.lower()
    print(f'Has table tag: {has_table}')
    
except Exception as e:
    print(f'ERROR: {type(e).__name__}: {str(e)[:300]}')
