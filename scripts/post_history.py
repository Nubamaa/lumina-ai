import requests
r = requests.post('http://127.0.0.1:5000/api/history/save', json={'title':'x'})
print(r.status_code)
print(r.text)
print(dict(r.headers))
