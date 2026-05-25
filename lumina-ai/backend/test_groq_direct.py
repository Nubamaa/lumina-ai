import os
from groq import Groq
from app import build_system_prompt, build_prompt

# Load env
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Create test data
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

print(f"Calling Groq API...")
print(f"System prompt: {len(sys_prompt)} chars")
print(f"User prompt: {len(user_prompt)} chars")

try:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=4000,
        temperature=0.2,
    )
    
    result = response.choices[0].message.content
    print(f"\nGROQ RESPONSE ({len(result)} chars):")
    print(f"First 500 chars:\n{result[:500]}")
    print(f"\nLast 200 chars:\n{result[-200:]}")
    print(f"\nHas <table: {'<table' in result.lower()}")
    print(f"\nFirst table tag position: {result.lower().find('<table')}")
    
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
