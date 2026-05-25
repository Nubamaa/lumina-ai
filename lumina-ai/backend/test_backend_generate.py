import json
import http.client

conn = http.client.HTTPConnection('127.0.0.1', 5000, timeout=60)
body = json.dumps({
    'subject': 'Math',
    'grade': 'Grade 1',
    'topic': 'Shapes',
    'quarter': '1st Quarter',
    'duration': '45 Minutes',
    'curriculum': 'K-12 MELC',
    'difficulty': 'Basic',
    'specialNotes': 'Use concrete objects and hands-on sorting activities.'
})
headers = {'Content-Type': 'application/json'}
conn.request('POST', '/api/generate', body, headers)
res = conn.getresponse()
print(res.status, res.reason)
print(res.read().decode('utf-8'))
