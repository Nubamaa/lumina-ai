import json
import urllib.request

url = 'http://localhost:5000/api/generate'
payload = {
    'subject': 'English',
    'grade': 'Grade 6',
    'topic': 'Nouns'
}
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
print(resp.read().decode('utf-8'))
