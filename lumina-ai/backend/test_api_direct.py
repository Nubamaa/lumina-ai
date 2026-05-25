import requests
import json

# Test the /api/generate endpoint
url = "http://127.0.0.1:5000/api/generate"

test_data = {
    "subject": "English",
    "gradeLevel": "6",
    "topic": "Nouns",
    "quarter": "1st Quarter",
    "duration": "50 minutes",
    "difficulty": "Beginner",
    "curriculum": "DepEd MELCs",
    "lessonPlanType": "Detailed",
    "specialNotes": "Keep examples simple"
}

print("Sending test request to backend...")
print(f"URL: {url}")
print(f"Data: {json.dumps(test_data, indent=2)}")

try:
    response = requests.post(url, json=test_data)
    print(f"\nResponse status: {response.status_code}")
    
    result = response.json()
    
    # Check key fields
    print(f"\nResponse keys: {list(result.keys())}")
    print(f"Source: {result.get('source')}")
    print(f"Used fallback: {result.get('usedFallback')}")
    
    lesson_plan = result.get('lesson_plan', '')
    print(f"\nLesson plan length: {len(lesson_plan)} chars")
    print(f"First 500 chars:\n{lesson_plan[:500]}")
    print(f"\nHas <table: {'<table' in lesson_plan.lower()}")
    
    # Check validation
    validation = result.get('validation', {})
    print(f"\nValidation score: {validation.get('score')}/{validation.get('total')}")
    print(f"Validation passed: {validation.get('passed')}")
    print(f"Missing sections: {validation.get('missing')}")
    
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
