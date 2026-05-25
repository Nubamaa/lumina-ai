import json
import urllib.request
import urllib.error

url = 'http://127.0.0.1:5000/api/generate'
payloads = [
    {'subject':'Math','gradeLevel':'Grade 1','topic':'Shapes','curriculum':'MATATAG','specialNotes':'none','quarter':'1st Quarter','duration':'50 Minutes'},
    {'subject':'PE','gradeLevel':'Grade 3','topic':'Running','curriculum':'MATATAG','specialNotes':'Focus only on breathing techniques','quarter':'1st Quarter','duration':'50 Minutes'},
    {'subject':'Entrepreneurship','gradeLevel':'Grade 11','topic':'Business Planning','curriculum':'MATATAG','specialNotes':'Include only financial literacy activities','quarter':'1st Quarter','duration':'50 Minutes'},
    {'subject':'English','gradeLevel':'Grade 6','topic':'Nouns','curriculum':'MATATAG','specialNotes':'none','quarter':'1st Quarter','duration':'50 Minutes'},
]
results = []
for i, payload in enumerate(payloads, start=1):
    print('--- Test', i, '---')
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode('utf-8')
            parsed = json.loads(body)
            results.append({'test': i, 'payload': payload, 'response': parsed})
            print('Status:', resp.status)
            print('source:', parsed.get('source'), 'usedFallback:', parsed.get('usedFallback'))
            print('lesson_plan_len:', len(parsed.get('lesson_plan','')))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print('Status:', e.code)
        print('Body:', body)
        results.append({'test': i, 'payload': payload, 'error': True, 'body': body})
    except Exception as e:
        print('ERROR', type(e).__name__, e)
        results.append({'test': i, 'payload': payload, 'error': str(e)})
    print()
with open('test_generate_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print('Saved results to test_generate_results.json')
