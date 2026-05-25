import os
import re
from io import BytesIO

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None


REF_DIR = os.path.join(os.path.dirname(__file__), 'reference lesson plans')


def _extract_text_from_pdf_bytes(raw: bytes) -> str:
    if not PdfReader:
        try:
            return raw.decode('utf-8', errors='ignore')
        except Exception:
            return ''
    try:
        reader = PdfReader(BytesIO(raw))
        pages = [p.extract_text() or '' for p in reader.pages]
        return '\n'.join(pages)
    except Exception:
        try:
            return raw.decode('utf-8', errors='ignore')
        except Exception:
            return ''


def load_reference_examples(max_examples: int = 3, chars_per_example: int = 2000):
    """Load up to `max_examples` reference files and return short text snippets."""
    out = []
    if not os.path.isdir(REF_DIR):
        return out
    files = sorted(os.listdir(REF_DIR))
    for fn in files[:max_examples]:
        path = os.path.join(REF_DIR, fn)
        try:
            with open(path, 'rb') as f:
                raw = f.read()
            text = ''
            if fn.lower().endswith('.pdf'):
                text = _extract_text_from_pdf_bytes(raw)
            else:
                try:
                    text = raw.decode('utf-8', errors='ignore')
                except Exception:
                    text = ''
            if not text:
                text = f'[Could not extract text from {fn}]'
            # normalize whitespace and trim
            text = re.sub(r"\s+", ' ', text).strip()
            out.append({'filename': fn, 'snippet': text[:chars_per_example]})
        except Exception:
            out.append({'filename': fn, 'snippet': f'[Error reading {fn}]'})
    return out


def build_strict_prompt(base_prompt: str, data: dict, output_format: str = 'narrative') -> str:
    """Return a prompt that includes reference examples and a strict instruction to follow them.

    `base_prompt` is expected to be the existing full instruction (from app.build_prompt).
    """
    examples = load_reference_examples(max_examples=3, chars_per_example=2000)
    header = (
        """
You have access to canonical reference lesson-plan samples. Follow their structure, tone, and format exactly.
Use Filipino classroom examples and the Revised Bloom's Taxonomy. Do not add or remove required sections.

"""
    )

    ex_texts = []
    for i, ex in enumerate(examples, start=1):
        ex_texts.append(f"Reference Example {i}: {ex['filename']}\n{ex['snippet']}\n---\n")

    examples_block = '\n'.join(ex_texts) if ex_texts else ''

    followup = (
        """
IMPORTANT: Match the EXACT HTML formatting conventions used in the examples. Use the header and table
styles specified. Where the examples use real student responses, produce similarly realistic responses.
"""
    )

    prompt = f"{header}\n{examples_block}\n{followup}\n\n{base_prompt}"
    return prompt
