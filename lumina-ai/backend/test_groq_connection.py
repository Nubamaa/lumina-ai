from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

print(f'[Test Script] GROQ_API_KEY loaded: {bool(os.getenv("GROQ_API_KEY"))}')
print(f'[Test Script] Key starts with: {os.getenv("GROQ_API_KEY", "")[:8]}')

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

try:
    response = client.chat.completions.create(
        model='llama-3.1-8b-instant',
        messages=[{'role': 'user', 'content': 'Say hello in one sentence.'}],
        max_tokens=100,
        temperature=0.3
    )
    print('[Test Script] Response:')
    print(response.choices[0].message.content)
except Exception as e:
    print(f'[Test Script] ERROR: {type(e).__name__}: {e}')
