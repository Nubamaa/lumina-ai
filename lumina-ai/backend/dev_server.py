from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

def simple_fallback(data):
    subject = data.get('subject') or 'Subject'
    topic = data.get('topic') or 'Topic'
    grade = data.get('gradeLevel') or data.get('grade') or 'Grade not specified'
    quarter = data.get('quarter') or '1st Quarter'
    duration = data.get('duration') or '45 Minutes'
    header = f"<table border=\"1\" cellspacing=\"0\" cellpadding=\"8\" style=\"width:100%;border-collapse:collapse;margin-bottom:16px;\"><tr><th colspan=\"2\">DETAILED LESSON PLAN</th></tr><tr><td>Grade Level</td><td>{grade}</td></tr><tr><td>Learning Area</td><td>{subject}</td></tr><tr><td>Topic</td><td>{topic}</td></tr></table>"
    body = f"<p>Fallback lesson plan for {topic} ({grade}) — brief placeholder.</p>"
    return header + body

@app.route('/api/generate', methods=['POST','OPTIONS'])
def generate():
    data = request.get_json(force=True, silent=True) or {}
    lesson_html = simple_fallback(data)
    resp = {
        'lesson_plan': lesson_html,
        'lesson_plan_struct': None,
        'lesson_plan_narrative': lesson_html,
        'lesson_plan_table': '',
        'validation': {},
        'decisions': {},
        'curriculum': data.get('curriculum',''),
        'strand': '',
        'competencyCodes': [],
        'objectives': [],
        'warnings': [],
        'bloomsLevels': [],
        'advisory': '',
        # Frontend expects an array for sectionCompleteness
        'sectionCompleteness': [],
        'outputFormat': 'both',
        'source': 'dev-fallback',
        'usedFallback': True,
        'generated_at': datetime.now(timezone.utc).isoformat()
    }
    return jsonify(resp)


@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify([])


@app.route('/api/history/save', methods=['POST','OPTIONS'])
def save_history():
    if request.method == 'OPTIONS':
        return ('', 200)
    item = (request.get_json(force=True, silent=True) or {})
    item['id'] = item.get('id') or 'dev-' + datetime.now(timezone.utc).isoformat()
    return jsonify({'success': True, 'id': item['id']})


@app.route('/api/history/save2', methods=['POST','OPTIONS'])
def save_history_v2():
    if request.method == 'OPTIONS':
        return ('', 200)
    item = (request.get_json(force=True, silent=True) or {})
    item['id'] = item.get('id') or 'dev-' + datetime.now(timezone.utc).isoformat()
    return jsonify({'success': True, 'id': item['id']})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
