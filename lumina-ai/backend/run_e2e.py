import json
import urllib.request

BASE = 'http://127.0.0.1:5000'

def post_generate(payload):
    url = BASE + '/api/generate'
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

def post_save(item):
    url = BASE + '/api/history/save'
    data = json.dumps(item).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

def get_history():
    url = BASE + '/api/history'
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)

if __name__ == '__main__':
    payload = {'subject':'English','grade':'Grade 6','topic':'Nouns'}
    print('Requesting generate...')
    gen = post_generate(payload)
    print('Generate response keys:', list(gen.keys()))
    lp = gen.get('lesson_plan')
    struct = gen.get('lesson_plan_struct')
    save_item = {'lesson_plan': lp, 'subject': payload['subject']}
    print('Saving generated plan to history...')
    saved = post_save(save_item)
    print('Save response:', saved)
    print('Fetching history...')
    h = get_history()
    print('History items:', len(h))
    if len(h)>0:
        print('Most recent subject:', h[0].get('subject'))
