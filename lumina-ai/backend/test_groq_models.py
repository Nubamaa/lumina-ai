from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))
models = [
    'mixtral-8x7b',
    'mixtral-8x7b-instant',
    'llama-3.1-8b',
    'llama-3.1-8b-instant',
]

for model in models:
    try:
        print(f'== Testing model: {model} ==')
        response = client.chat.completions.create(
            model=model,
            messages=[{'role': 'user', 'content': 'Say hello in one sentence.'}],
            max_tokens=50,
            temperature=0.3,
        )
        print('SUCCESS:', response.choices[0].message.content)
    except Exception as e:
        print('ERROR:', type(e).__name__, e)
    print()
