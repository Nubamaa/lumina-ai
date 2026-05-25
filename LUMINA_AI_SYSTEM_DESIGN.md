# Lumina AI: System Design & Technical Architecture

## 1. What Lumina AI Is and What Problem It Solves

Lumina AI is an intelligent lesson-plan generation platform built specifically for Filipino teachers. At its core, it solves a critical pain point: the massive amount of time K-12 and Senior High School educators spend manually writing Detailed Lesson Plans (DLPs) that comply with strict DepEd formatting requirements.

In the Philippine education system, teachers are required to submit lesson plans that follow the Department of Education's exact specifications—nine mandatory sections with precise structure, specific competency codes, developmental appropriateness rules, and proper pedagogical sequencing. A single high-quality lesson plan can take a teacher 1-2 hours to prepare from scratch. For a teacher managing multiple classes across subjects and grade levels, this becomes an unsustainable administrative burden that cuts into actual instructional time.

Lumina AI eliminates this burden by generating complete, ready-to-use DepEd-compliant lesson plans in seconds. A teacher simply provides the lesson parameters—subject, grade level, topic, quarter, duration, difficulty level, and any special notes—and the system produces a full, structured lesson plan with all nine required tables, proper formatting, pedagogical alignment, and realistic example content. The plan is immediately editable and printable. Teachers save hours per week while spending more time on actual teaching and less time on administrative paperwork.

## 2. Who the Target Users Are

Lumina AI is built for **in-service K-12 and Senior High School teachers across the Philippines**, specifically those teaching:

- **Primary grades (Grades 1-3):** English, Mathematics, Science, Filipino, Social Studies
- **Intermediate grades (Grades 4-6):** English, Mathematics, Science, Filipino, Araling Panlipunan, Technology and Livelihood Education (TLE)
- **Junior High (Grades 7-10):** All core subjects (English, Filipino, Mathematics, Science, Social Studies) plus electives
- **Senior High School (Grades 11-12):** Core subjects, academic tracks, and technical-vocational tracks
- **Alternative Learning System (ALS) educators** teaching non-formal learners
- **Special Education teachers** adapting lessons for diverse learners

The system is designed for teachers who:
- Work under DepEd's K-12 curriculum guidelines or newer MATATAG framework
- Need rapid lesson planning turnaround
- Value quality and DepEd compliance
- Want to reduce administrative work and focus on pedagogy
- Teach in resource-limited settings where professional development for lesson-design is inconsistent

## 3. The Agent's Goal and Objective

The agent has a single, clear, measurable goal: **Generate a complete, DepEd-compliant Detailed Lesson Plan or Semi-Detailed Lesson Plan within 30 seconds that requires zero corrections before classroom use.**

More specifically:
- **Completeness:** Every one of the nine required sections is present and populated with realistic, topic-specific content
- **Compliance:** The lesson plan follows DepEd format standards, includes proper section headings, correct table structure, and required metadata
- **Pedagogical correctness:** Bloom's Taxonomy levels match grade and difficulty; objectives are measurable; procedures follow RRMLAG sequencing; evaluation items align with objectives
- **Topic specificity:** Every single objective, question, activity, and assessment item is about the specific topic the teacher requested—never vague or generic
- **Usability:** The output is formatted as ready-to-print HTML tables with proper spacing, borders, and styling; contains no errors that would prevent immediate classroom use
- **Editability:** Teachers can easily modify any section, and the metadata layer indicates which sections may need manual review

## 4. How the Agent Works — Step by Step Decision Flow

Lumina AI operates as a three-tier fallback system with intelligent decision-making at each tier. Here's the complete flow from teacher input to lesson plan output:

### User Input Phase

A teacher navigates to the Lumina AI frontend and fills out the lesson form with:
- **Subject** (Science, Mathematics, English, Filipino, Social Studies, TLE, etc.)
- **Grade Level** (Grade 1, Grade 7, Grade 11, etc.)
- **Topic** (e.g., "The Water Cycle," "Parts of Speech: Nouns," "Quadratic Equations")
- **Quarter** (1st, 2nd, 3rd, 4th Quarter)
- **Duration** (30, 45, 50, 60, or 90 minutes)
- **Difficulty** (Basic, Intermediate, Advanced)
- **Curriculum Framework** (K-12 MELCs, MATATAG, ALS, SHS CG, IPED)
- **Lesson Plan Type** (Detailed DLP or Semi-Detailed DLP)
- **Special Notes** (e.g., "Learners have mixed abilities," "Use storytelling approach," "Incorporate local examples")

The frontend validates that required fields are filled and sends a JSON POST request to `/api/generate`.

### Tier 1: Primary LLM Generation (Groq API)

The backend validates inputs and begins generation using the Groq API with **two parallel sub-calls** to manage token limits and ensure completeness:

**Call 1 — Tables 1-5 (Header, Objectives, Content, Resources, Procedures):**
- System prompt: Full DepEd writing instructions including exact formatting rules, section requirements, Bloom's Taxonomy levels
- User prompt: Topic anchoring rules + all input parameters
- Model: `llama-3.3-70b-versatile` (primary, larger context window)
- Max tokens: 8000
- Temperature: 0.2 (deterministic, reproducible)
- Validation: Response must contain at least 300 characters and include `<table>` tags

**Call 2 — Tables 6-9 (Evaluation, Assignment, Remarks, Reflection):**
- System prompt: System instructions + requirement to return ONLY raw HTML tables
- User prompt: Topic + specific instruction to generate Evaluation with Answer Key, Assignment, Remarks, Reflection
- Model: `llama-3.3-70b-versatile`
- Max tokens: 4000
- Temperature: 0.2
- Validation: Response must contain required sections (VI. ASSIGNMENT, VII. REMARKS, VIII. REFLECTION, ANSWER KEY)

If either call fails due to **rate limits or token overflow**, the system **automatically switches to `llama-3.1-8b-instant`** (smaller, faster, free tier) and retries up to 3 times per call.

### Tier 2: Focused Fallback AI Call

If Tier 1 fails completely (all 3 retries exhausted on both calls), the system invokes `call_gemini_fallback()`, which generates a shorter, more tightly scoped lesson plan using a simplified prompt. This tier is designed to catch cases where the full prompt was too long or complex for the primary model.

### Tier 3: Static HTML Fallback Template

If Tier 2 also fails, the system generates a **deterministic, pre-structured fallback lesson plan** using `build_fallback_lesson_plan()`. This template:
- Contains all 9 required tables with proper structure
- Pre-fills header metadata (grade, subject, topic, etc.) from teacher inputs
- Includes placeholder content with explicit instructions: "**[Teacher: Please review and edit this section before use]**"
- Ensures the teacher always receives **something** that can be used as a starting point, never a blank error

All three responses (if available) are passed through **`normalize_table_styles()`** to enforce consistent CSS: borders, padding, background colors, and spacing.

### Validation and Metadata Layer

After generation, the output runs through **`validate_dlp()`**, which scans the HTML for all 9 required section headings:
1. I. OBJECTIVES
2. II. CONTENT
3. III. LEARNING RESOURCES
4. IV. LEARNING PROCEDURE
5. V. EVALUATION
6. VI. ASSIGNMENT
7. VII. REMARKS
8. VIII. REFLECTION (note: header table has no section heading)

The validator returns:
- **Score:** Number of sections found (0-9)
- **Percentage:** (score / 9) × 100
- **Missing sections:** List of any headings not found
- **Passed:** Boolean (true if all 9 found)

### Metadata Enrichment

The `normalize_response_metadata()` function builds additional layers:
- **Bloom's Levels:** Derived from grade + difficulty (e.g., Grades 7-10 Intermediate → Apply/Analyze)
- **Decisions Log:** Explains why specific pedagogical choices were made (e.g., "Grade 7 Intermediate → Apply/Analyze objectives," "Quarter 2 pacing adjusted accordingly")
- **Section Completeness:** Array of 14 sections with true/false status (useful for teachers reviewing coverage)
- **Curriculum Advisory:** If grade transitions to MATATAG next year, warns the teacher this plan uses K-12 MELCs
- **Warnings:** Any flags about content confidence (e.g., "References generated by AI—verify URLs before use")

### Response to Frontend

The full response includes:
```json
{
  "lesson_plan": "...full HTML...",
  "lesson_plan_struct": {...structured data if available...},
  "lesson_plan_narrative": "...HTML...",
  "lesson_plan_table": "...HTML...",
  "validation": { "score": 9, "percentage": 100, "missing": [], "passed": true },
  "decisions": [...array of reasoning...],
  "curriculum": "K-12 MELCs (DepEd Order No. 12, s. 2020)",
  "bloomsLevels": ["Apply", "Analyze"],
  "advisory": "",
  "sectionCompleteness": [{section: "Objectives", complete: true}, ...],
  "source": "groq",
  "usedFallback": false,
  "generated_at": "2025-05-24T15:30:00Z"
}
```

### History and Session Storage

The generated lesson plan is immediately:
1. **Saved to session storage** (client-side, persists during the session)
2. **Saved to backend history** (if the backend endpoint succeeds; failures don't crash the UI)
3. **Made available for immediate download or editing** by the teacher

---

## 5. Agentic Features — How the System Demonstrates Agent Behavior

### Goal-Oriented Task Completion

The agent has a well-defined goal state: a valid, complete, DepEd-compliant lesson plan. Every decision in the pipeline serves that goal:
- If the primary model fails, it doesn't stop—it switches models or uses fallback generation
- If parsing fails, it reformats the output to ensure valid HTML
- If validation shows missing sections, the agent logs warnings but still returns usable output
- The agent never returns null or error-only responses; it always produces *something* the teacher can work with

This goal-driven architecture ensures **reliability**—the teacher's time investment in filling out the form is never wasted.

### Multi-Step Reasoning in the Prompt

The `build_system_prompt()` function encodes complex pedagogical reasoning that guides the LLM at each step. The prompt instructs the model to reason about:

- **Grade-level developmental appropriateness:** Different vocabulary, complexity, and activity types for primary vs. intermediate vs. secondary learners
- **Bloom's Taxonomy alignment:** Which cognitive levels are appropriate for the given grade and difficulty
- **Topic specificity:** Every section must answer the question "How does this directly teach the requested topic?"
- **Curriculum framework:** Different instructions for MATATAG (streamlined competencies) vs. MELCs (codes) vs. SHS CG (strand/core/specialized distinction)
- **Lesson plan type:** Detailed DLPs include a 3-column procedure table with student responses; Semi-Detailed uses 2 columns without responses
- **DepEd format compliance:** Exact heading text, table structure, section ordering, and mandatory metadata

This reasoning is embedded *inside the prompt*, so the LLM reasons through it during generation rather than after-the-fact.

### Decision-Making Rules: The `build_prompt()` Function

The prompt builder encodes explicit rules that implement the agent's decision logic:

1. **RRMLAG Step Sequencing:** Procedures must follow Routine → Review → Motivation → Lesson Proper → Application → Generalization in exactly that order
2. **Time Allocation:** A 45-minute lesson allocates time differently than a 90-minute lesson across the six steps
3. **Content vs. Performance Standards:** These must be different noun phrases—not repetitive or identical
4. **Topic Anchoring:** All questions, activities, and assessments must be about the specific topic, never general subject knowledge
5. **Teacher Scripting:** The Lesson Proper section must include actual dialogue and questions, not labels like "Teacher explains"
6. **Expected Student Responses:** For Detailed DLPs, every step must include realistic student output, not placeholders

These rules are encoded as explicit instructions in the prompt so the LLM enforces them during generation.

### Tool Usage: External LLM as a Tool

The agent treats the Groq API as an external tool that it cannot directly control but can invoke strategically:
- Sends well-structured prompts with clear constraints
- Monitors response quality and validates output
- Switches between tools (model A → model B) based on failure type
- Chains multiple tool calls in sequence (Table 1-5 call, then Table 6-9 call)
- Falls back to rule-based generation if the tool fails

This is a classic agent pattern: use a capable but imperfect tool (the LLM) strategically within a deterministic framework.

### Validation and Self-Correction

The `validate_dlp()` function acts as a quality-check layer that measures output against the goal:
- Scans for all 9 required sections
- Reports missing sections back to the metadata layer
- Triggers warnings if validation score is below 100%
- Logs completeness information so teachers know exactly what to review

If validation fails, the agent doesn't crash; it:
1. Logs the failure
2. Continues to return output (possibly partial or fallback)
3. Flags the issue in metadata so the teacher is aware

This **self-correction loop** ensures partial failures don't result in total failure.

### Fallback Planning: Three-Tier Resilience

The agent's fallback chain implements redundancy at three levels:

| Tier | Trigger | Mechanism | Output |
|------|---------|-----------|--------|
| **Tier 1** | Normal operation | Groq API (2-part split call) | Full LLM-generated DLP (9 tables) |
| **Tier 2** | Tier 1 all retries exhausted | Focused fallback prompt | Shortened LLM-generated DLP |
| **Tier 3** | Tier 2 failed | Deterministic template generation | Static HTML template (all 9 tables, marked for review) |

Even in catastrophic failure (all three tiers fail), the system returns valid HTML and marks it clearly as "draft — review before use." A teacher never receives an error message; they receive *something* they can work with.

---

## 6. The Prompt Engineering Strategy

Prompt engineering is the heart of Lumina AI's agent behavior. The system doesn't use fine-tuning or retrieval-augmented generation (RAG)—instead, it relies entirely on **careful, structured prompting** to encode the DepEd lesson-plan requirements.

### Build System Prompt: The Rulebook

The `build_system_prompt()` function is a 1000+ line string that serves as the LLM's rulebook. It specifies:

1. **Output format:** Raw HTML only, no markdown, no code fences, no explanatory text
2. **Table structure:** Exact attributes (border, cellspacing, cellpadding, style attributes) for every table and cell
3. **Section order:** The 9 tables must appear in a fixed sequence; no reordering or skipping
4. **Section content:** For each of the 9 tables, the exact rows, column headers, and content requirements

Example (Objectives table):
```
TABLE 2 — I. OBJECTIVES:
2-column table. Title row colspan="2". Column headers: Category | Description.
Generate these exact rows in this order:
1. Content Standards — [specific definition rules]
2. Performance Standards — [specific definition rules]
3. Learning Competencies — [specific definition rules]
4. Cognitive Objective — [Bloom's verb + specific outcome]
5. Psychomotor Objective — [skill verb + specific outcome]
6. Affective Objective — [values verb + specific outcome]
```

### Build Prompt: Variable Injection + Topic Anchoring

The `build_prompt()` function injects all teacher inputs as variables and adds **topic anchoring rules**:

```python
def build_prompt(data):
    subject = data.get('subject')
    grade = data.get('gradeLevel')
    topic = data.get('topic')
    # ... other inputs ...
    
    return f"""Generate a complete DepEd lesson plan using these inputs:
    
Subject: {subject}
Grade Level: {grade}
Topic: {topic}
...

Apply Special Notes as mandatory requirements throughout every section.
All content must be derived from the Topic above. Every objective, activity, 
question, evaluation item, and assignment must be specifically about: {topic}.
"""
```

The key insight: **Never hardcode lesson content.** Always inject the specific topic, subject, and grade. This ensures:
- Different lessons for different topics (never reusing a generic template)
- Topic specificity throughout (every section scoped to the requested topic)
- Customization based on inputs (grade-appropriate vocabulary, difficulty-calibrated depth)

### Bloom's Taxonomy Integration

The `derive_bloom_levels()` function maps grade and difficulty to appropriate Bloom's Taxonomy levels:

```python
if grade_num <= 3:
    return ['Remember', 'Understand']
elif grade_num <= 6:
    return ['Understand', 'Apply']
elif difficulty == 'Advanced':
    return ['Analyze', 'Evaluate', 'Create']
else:
    return ['Apply', 'Analyze']
```

This is then embedded in the system prompt so the LLM uses the right Bloom's verbs when writing objectives. A Grade 2 lesson doesn't ask students to "Analyze" or "Evaluate"—only "Remember" or "Understand."

### Curriculum-Specific Branching

Different curriculum frameworks have different requirements. `build_curriculum_instruction()` generates framework-specific guidance:

- **MATATAG:** "Use streamlined, essential competencies only"
- **MELC:** "Use official MELC competency codes (e.g., EN9RC-Ia-14.1)"
- **SHS:** "Specify Core or Specialized strand"
- **ALS:** "Adjust language for adult/non-formal learners"
- **IPED:** "Add Cultural Integration section"

This guidance is included in the system prompt so the LLM generates framework-appropriate content.

### Lesson Plan Type Enforcement (Detailed vs. Semi-Detailed)

The `build_system_prompt()` function branches on lesson type:

```python
if is_detailed:
    proc_structure = """Section IV uses exactly 3 columns: 
    Step | Teacher Activity | Expected Student Response.
    Every step must have a filled Expected Student Response 
    column — never leave it empty."""
else:
    proc_structure = """Section IV uses exactly 2 columns: 
    Step | Teacher Activity. Do NOT add a third column. 
    Do NOT write student responses anywhere in Section IV."""
```

So a Detailed DLP includes student responses; a Semi-Detailed does not. The LLM is given explicit, unambiguous rules upfront.

### Two-Call Strategy for Token Management

Instead of one long generation call, Lumina uses **two sequential calls**:
- **Call 1:** Tables 1-5 (more space-intensive due to procedure details)
- **Call 2:** Tables 6-9 (evaluation, assignment, remarks, reflection)

This splits the work across two calls, reducing token burden and improving success rate. The calls are sequential, not parallel—Call 1 completes, then Call 2 begins—so there's no race condition or data loss.

---

## 7. The Output Format: 9 Required Tables

The agent generates an HTML lesson plan with exactly 9 tables in a fixed order. Each table follows DepEd specifications:

### Table 1 — Header
A 2-column metadata table:
```
School Name          | [EMPTY — never filled by agent]
Teacher Name         | [EMPTY — never filled by agent]
Subject              | Biology
Grade Level          | Grade 10
Date                 | [EMPTY — teacher fills at printing]
Quarter              | 2nd Quarter
Duration             | 50 Minutes
Lesson Plan Type     | Detailed Lesson Plan
Difficulty           | Intermediate
Curriculum           | K-12 MELCs
```

**Agent decision:** Never generate fake school names or teacher names. The agent respects teacher privacy by leaving these blank.

### Table 2 — I. OBJECTIVES
A 2-column table with exactly 6 rows:
1. **Content Standards** — What learners should understand (noun phrase, no "At the end...")
2. **Performance Standards** — What learners should transfer or perform (noun phrase)
3. **Learning Competencies** — Specific MELC or MATATAG code
4. **Cognitive Objective** — "At the end of..." + Bloom's verb + outcome
5. **Psychomotor Objective** — "At the end of..." + skill verb + outcome
6. **Affective Objective** — "At the end of..." + values verb + outcome

All three objectives use **different verbs** and are **specifically about the topic**, not the subject.

### Table 3 — II. CONTENT
A 2-column table with 4 rows:
1. **Subject Matter** — Exactly the topic name from input
2. **References** — Real DepEd publications or URLs (never generic "Grade 10 textbook")
3. **Materials** — Specific classroom items (chalk, globe, measuring tape, etc.)
4. **Values Infused** — Values naturally connected to the topic

### Table 4 — III. LEARNING RESOURCES
A 2-column table listing 5-7 resources that directly support the topic.

### Table 5 — IV. LEARNING PROCEDURE
For **Detailed DLPs**: 3-column table with Step | Teacher Activity | Expected Student Response
For **Semi-Detailed DLPs**: 2-column table with Step | Teacher Activity (no student responses)

The six steps in exact order:
1. **Routine** — Prayer, greetings, classroom management, attendance (with actual dialogue)
2. **Review** — 2-3 specific questions about the previous lesson
3. **Motivation** — Named activity connecting to today's topic (engaging, topic-specific)
4. **Lesson Proper** — Full teaching script with definitions, examples, questions, board work
5. **Application** — Group activity with 3-4 groups, specific task per group, rubric
6. **Generalization** — Three questions: cognitive (what learned), psychomotor (how apply), affective (why matters)

### Table 6 — V. EVALUATION
2-column table:
- Minimum 5 numbered evaluation items, all specifically about the topic
- Each item must have a real, specific correct answer
- Followed by an ANSWER KEY heading row
- Below ANSWER KEY, specific answers for each item (never "Students will answer" or vague entries)

### Table 7 — VI. ASSIGNMENT
2-column table:
- Specific task about the topic due next class
- Clear deadline
- Rubric with criteria and point values (if applicable)

### Table 8 — VII. REMARKS
2-column table:
- 2-3 professional observations about delivery, participation, pacing
- Specific to the lesson, not generic

### Table 9 — VIII. REFLECTION
2-column table:
- 3+ sentences from teacher perspective
- Addresses: what worked well, what needs improvement, next session focus
- Specific to the topic

**All tables use consistent CSS:**
- Border: 1px solid #999
- Header background: #E8F4F8
- Padding: 10px
- Text alignment: Left
- Vertical alignment: Top
- Margin-bottom: 20px

This consistency ensures the output is printable, professional, and compliant with DepEd visual standards.

---

## 8. Key Technical Decisions and Why

### Backend: Flask (Not Django, FastAPI, or Serverless)

**Decision:** Use Flask for the REST API backend.

**Why:** 
- Lightweight and deployable on student/limited budgets
- Minimal boilerplate; the lesson-plan generation is the complex part, not the framework
- Easy to integrate with Groq and Gemini APIs
- CORS straightforward to configure
- Single-threaded synchronous execution is fine for this use case (teachers wait for response, no need for async queue jobs)

### Frontend: React + Vite (Not Vue, Angular, or Next.js)

**Decision:** Use React with Vite as the dev server and build tool.

**Why:**
- React's component model is natural for a multi-form (LessonForm) → output (DLPOutputPanel) → history (HistoryPage) workflow
- Vite is fast and requires minimal configuration
- Client-side session storage for history (no server persistence needed) is trivial with React hooks
- Teachers don't need server-side storage; session storage is sufficient
- Easy to implement inline editing and PDF export

### API: Groq (Not OpenAI, Anthropic, or Open Source)

**Decision:** Prioritize Groq's LLaMA models; fallback to Gemini.

**Why:**
- **Speed:** Groq's inference engine is 2-3× faster than OpenAI at similar quality
- **Cost:** Groq offers free tier with reasonable token limits; student project budget
- **Context window:** LLaMA 3.3 70B has 8K context (sufficient for structured prompt + lesson generation)
- **Determinism:** Temperature 0.2 ensures consistent, reproducible lesson plans
- **Fallback compatibility:** If Groq rate-limits, LLaMA 3.1 8B is available; if both fail, Gemini as last resort

The multi-model strategy is *essential* for reliability in a student project or resource-constrained environment.

### Output: HTML Tables (Not JSON, Markdown, or DOCX)

**Decision:** Generate lesson plans as HTML tables, not JSON, Markdown, or Word documents.

**Why:**
- **Printability:** Teachers can immediately print or save to PDF; no format conversion needed
- **Readability:** DepEd format is tabular; HTML tables match the expected format exactly
- **Editability:** Teachers can edit the HTML in any modern browser or save to Word/Google Docs
- **Persistence:** Validated structure (9 required tables) is easy to parse and validate with regex
- **Compliance:** DepEd expects specific table structures; HTML preserves this exactly

JSON would require frontend rendering; Markdown would lose formatting; DOCX generation adds complexity. HTML tables are the most direct path from prompt to teacher's printer.

### Prompt Engineering Over Fine-Tuning

**Decision:** Use elaborate system and user prompts instead of fine-tuning.

**Why:**
- **No training data:** DepEd-compliant lesson plans are sensitive educational material; hard to source at scale
- **Fast iteration:** Prompt changes are deployed instantly; fine-tuning requires weeks
- **Flexibility:** Different curricula (MATATAG, MELCs, ALS, SHS) can be handled with prompt branching, not separate models
- **Cost:** Fine-tuning a 70B model is expensive; prompt engineering is free after API usage
- **Control:** The rulebook is explicit and visible in the prompt, not hidden in model weights

Prompt engineering gives Lumina the agility to adapt to curriculum changes or add new features without retraining.

### Fallback Chain: Three Tiers

**Decision:** Not just Groq → error, but Groq → FocusedFallback → TemplateGeneration.

**Why:**
- **Reliability:** Teachers' time is valuable. Never return an error when something can be attempted
- **Graceful degradation:** Tier 2 is slower but more targeted than Tier 1; Tier 3 is deterministic and fast
- **Transparency:** Each tier reports its source (usedFallback flag, source field) so teachers know the quality baseline

This design philosophy: **Always produce output; let the teacher judge quality.**

---

## 9. Current Constraints: Free Tier Model Limitations

### Challenge 1: Token and Character Limits

**Core Issue:** Lumina AI currently operates on **free-tier API models** (Groq LLaMA and Google Gemini), which impose strict token and character limits. These constraints directly impact lesson plan generation.

**Impact on User Experience:**
- **Character limits on input:** The system must restrict user inputs (topic descriptions, special notes) to prevent exceeding API token budgets
- **Shortened output:** Generated lesson plans may be more concise than ideal; teachers occasionally need to expand sections with additional examples or depth
- **Input validation constraints:** The frontend now validates that Special Notes field cannot exceed 500 characters, and Topic descriptions are limited to 200 characters to preserve API budget for actual lesson plan generation

**Technical Manifestation:**
- Groq's free tier (llama-3.3-70b-versatile): ~3,000 requests/day limit; ~90K tokens/min rate limit
- Google Gemini free tier: Lower context window, similar daily quota constraints
- When character input exceeds safe thresholds, the system shows warning: "Your input is quite long. This may reduce the depth of the generated lesson plan."

**Workaround Currently Implemented:**
- The two-call strategy (Tables 1-5, then 6-9) splits token usage across requests
- Topics are anchored tightly to reduce token waste on generic content
- The Tier 2 and Tier 3 fallbacks use shorter, more constrained prompts designed for minimal tokens

### Challenge 2: Limited Lesson Plan Generation Volume

**Core Issue:** Due to token rate limits and daily quota constraints, the system cannot generate **unlimited lesson plans per day per user**.

**Real-world Limitation:**
- A single teacher can comfortably generate **8-12 lesson plans per day** before approaching free-tier rate limits
- Schools planning to use Lumina for their entire teacher base (50-100+ teachers) will quickly exhaust daily quotas during peak usage periods (start of quarter, curriculum changeover)
- The system lacks queuing, batching, or scheduled generation; all requests are synchronous and immediate

**User Impact:**
- **Individual teachers:** Sufficient for weekly planning (1-2 lessons per day average)
- **School-wide adoption:** Problematic during high-demand periods unless teachers stagger usage or the school upgrades to a paid tier

**Current Mitigation:**
- The system queues requests in order but doesn't batch them
- Error messages clearly state: "Rate limit reached. Please wait 5 minutes before generating another lesson plan."
- Teachers can export and save generated plans locally, reusing them for similar topics

### Challenge 3: Inconsistent Output Quality Due to Free-Tier Model Variability

**Core Issue:** Free-tier models (especially llama-3.1-8b-instant as fallback) are optimized for speed and cost, not consistency. Output quality can vary significantly between requests.

**Specific Quality Variations Observed:**
- **Evaluation items:** Sometimes simple multiple-choice; sometimes complex application questions—inconsistent difficulty calibration
- **Content depth:** Some generated lessons have robust, well-structured content; others have brevity or shallow explanations
- **Topic adherence:** Occasional drift from specific topic into broader subject matter (though topic anchoring rules help mitigate this)
- **Section completeness:** Rarely, one of the 9 tables arrives incomplete or with placeholder text

**Why This Happens:**
- LLaMA 3.1 8B (fallback model) has smaller parameter count than 70B; lower capability baseline
- Temperature settings (0.2 for determinism) help but don't eliminate variance
- Free-tier models prioritize speed; determinism is secondary

**User Perception:**
- Teachers report: "Sometimes great, sometimes feels rushed"
- Variance makes teachers uncertain about trusting the output
- Encourages over-editing, defeating the time-saving goal

**Current Workaround:**
- Validation reports (Section completeness %, missing sections) help teachers identify low-quality outputs quickly
- The "Regenerate" button allows teachers to request a new attempt (second-call strategy sometimes produces better results)
- Explicit warnings in metadata: "This lesson plan scored 85% completeness. Review sections marked incomplete."

### Challenge 4: No Persistent Storage or Advanced Lesson Plan Features

**Core Issue:** Free-tier deployment model means no backend database, no user authentication, and no rich lesson planning features.

**What's Missing:**
- **Persistent lesson plan history across browsers/devices:** Currently limited to session storage (localStorage); clearing browser cache = losing history
- **Collaborative lesson planning:** Teachers cannot share or jointly edit plans; no team-based features
- **Lesson plan versioning:** No ability to track edits or revert to previous versions
- **Cross-lesson dependencies:** Cannot link related lessons or create unit-level plans that span multiple topics
- **Real-time preview during editing:** Teachers must regenerate to see changes; no draft preview mode
- **Advanced analytics:** No data on what topics are most generated, teacher success rates, or usage patterns
- **Accessibility features:** No offline mode, no text-to-speech, no multi-language interface (English only currently)

**Why:**
- Persistent storage requires database (cost)
- User authentication requires secure backend (cost + security liability)
- Rich UX features require full-stack development (time + complexity)

### Challenge 5: Limited Curriculum Coverage in Fallback Tiers

**Core Issue:** Only the Tier 1 (primary) AI call uses the full system prompt with comprehensive curriculum branching. Tier 2 (focused fallback) and Tier 3 (template) use simplified instructions.

**Implication:**
- If a teacher using **MATATAG curriculum** triggers a fallback (Tier 2 or 3), the lesson plan defaults to K-12 MELCs formatting instead of MATATAG-specific competencies
- ALS (Alternative Learning System), IPED (Indigenous Peoples Education), and SHS (Senior High School) get reduced support in fallback tiers
- Curriculum framework is returned correctly (metadata says "MATATAG"), but generated content may not perfectly match that framework

**User Impact:**
- Teachers using non-standard curricula are more likely to receive out-of-framework content if fallbacks trigger
- Requires more manual editing to adapt to their specific curriculum requirements

### Challenge 6: No Real-Time Validation Against DepEd Official Documents

**Core Issue:** The system does not have live access to the latest DepEd Order documents, competency lists, or curriculum updates. All knowledge is embedded in the prompt (frozen at system build time).

**Real-World Risk:**
- If DepEd releases a new curriculum order or updates competency codes mid-year, Lumina's output will reflect the *old* framework
- Teachers might receive lesson plans with deprecated competency codes
- The system cannot alert teachers to curriculum changes

**Current Status:**
- System was built with K-12 MELCs (DepEd Order No. 12, s. 2020)
- MATATAG framework is supported but may have minor drift from official documents
- No automatic update mechanism; system must be manually refreshed with new curriculum documents

### Challenge 7: Hallucination of DepEd References

**Core Issue:** LLMs can generate plausible-sounding but non-existent DepEd Order numbers, textbook titles, or official publications.

**Real Examples Observed:**
- Generated lesson plan cited: "DepEd Order No. 47, s. 2024" (may not exist; teacher must verify)
- References listed: "Grade 7 English Learner's Material, 4th Edition" (exact edition uncertain)
- Textbook links generated but may lead to incorrect resources

**User Impact:**
- Teachers cannot blindly trust references; must verify before classroom use
- Metadata explicitly warns: "References are AI-generated. Verify all citations and URLs before assigning as student resources."
- Teachers spend extra time fact-checking instead of saving time

---

## 10. Limitations Identified During Testing and How They're Addressed

### Limitation 1: Topic Drift on Specific Sub-Topics

**Problem:** For English sub-topics like "Types of Characters," the LLM would sometimes default to broader reading comprehension instead of staying narrowly focused on character types.

**Manifestation:** Evaluation items asked general reading questions instead of character-classification questions.

**Solution:** **Topic anchoring rules in the prompt.** The system now explicitly states:
```
All content must be derived from the Topic above. Every objective, activity, 
question, evaluation item, and assignment must be specifically about: {topic}
```

And includes validation warnings if the LLM drifts.

### Limitation 2: Evaluation Items Too Thin for Advanced Grades

**Problem:** Grade 10-11 Advanced difficulty lessons had evaluation items that were too basic, not challenging enough for high-achieving students.

**Manifestation:** A Grade 11 Science lesson on Organic Chemistry had evaluation asking "What is a hydrocarbon?" instead of "Design a synthetic pathway for..."

**Solution:** **Difficulty-calibrated Bloom's levels.** The system now assigns:
- Advanced Grade 10-11: Analyze, Evaluate, Create levels
- Intermediate Grade 7-10: Apply, Analyze levels
- Basic Grade 4-6: Understand, Apply levels

The prompt explicitly instructs the LLM to use these levels, so evaluation items are pitched at the right cognitive level.

### Limitation 3: Content Standards vs. Performance Standards Repetition

**Problem:** The LLM would write the same phrase for both Content Standards and Performance Standards, treating them as synonymous rather than distinct learning outcomes.

**Manifestation:** Both rows would read nearly identically, defeating the purpose of having two different categories.

**Solution:** **Explicit row-level instructions.** The system now specifies:
- **Content Standards:** "...what learners demonstrate *understanding* of..."
- **Performance Standards:** "...what learners should be able to *transfer or perform*..."

These are explicitly different actions (understanding vs. performance/transfer), so the LLM now generates distinct statements.

### Limitation 4: usedFallback Triggering on Perfectly Valid Responses

**Problem:** When a primary model response came back slightly shorter than expected, the system would flag usedFallback=true even though no fallback was needed, confusing teachers about output quality.

**Manifestation:** A 3500-character response (valid, complete) would trigger fallback flag, making teachers distrust the output.

**Solution:** **Revised token/length detection.** The system now:
- Checks for presence of required section headings (V. EVALUATION, VI. ASSIGNMENT, etc.) instead of length heuristics
- Only triggers fallback if specific sections are missing
- Reports detailed validation scores (9/9 sections = 100%, not approximations)

---

## 11. Responsible AI Considerations

### Transparency and Disclosure

All lesson plans generated by Lumina AI are clearly marked with a disclaimer:
```
Lumina outputs are AI-generated drafts. Always review before classroom use.
```

This disclosure appears:
- On the output panel in the UI
- At the bottom of printed lesson plans
- In saved history records

**Purpose:** Teachers understand they're receiving a draft, not a finished product. Final accountability remains with the teacher, not the AI.

### Privacy: No Teacher or Student Names

The agent **never generates or requires** teacher names, student names, or school names. These fields are always left blank by the system, explicitly instructed in the system prompt:
```
RULE: School Name, Teacher Name, and Date must ALWAYS be empty. Never generate values for these three fields.
```

Teachers must fill these in manually before use, ensuring:
- No impersonation of real teachers
- No data collection about who is using the system
- Privacy compliance (GDPR-like principles)

### Validation Warnings

The metadata layer includes explicit warnings about:
- **Unverified references:** "References generated by AI—verify URLs before use"
- **Potential hallucinations:** If the LLM generates a book title or DepEd order that couldn't be verified, flag it
- **Incomplete sections:** If validation shows missing content, warn the teacher explicitly

**Purpose:** Teachers are informed about potential issues upfront so they can review carefully.

### Bias Awareness

**Known risks:**
- The LLM may reflect cultural biases in its examples or activity descriptions
- References generated by the LLM may contain hallucinated titles or authors
- Evaluation items may inadvertently favor certain learning styles
- Content examples may not be locally relevant to all Philippine regions

**Mitigation:**
- All content is user-editable; teachers are encouraged to customize with local context
- The validation report shows confidence scores, helping teachers identify sections that need more careful review
- The system includes a "Special Notes" field where teachers can add requirements like "Use local examples from Mindanao" or "Adapt for multilingual learners"

### Equity and Access

Lumina AI is designed for **accessibility and equity:**
- Free tier with reasonable token limits
- No subscription required to generate a basic lesson plan
- Works on any device with a browser (no installation)
- Designed for contexts with limited internet (stores sessions locally, batch downloads for offline review)
- Supports multiple curricula frameworks (K-12, MATATAG, ALS, SHS, IPED) so teachers across different tracks can benefit

---

## 12. Demonstration Video Script (3-5 minutes)

### Scene 1: The Problem (0:00-0:30)

"Meet Maria, a Grade 7 Science teacher at a public school in Metro Manila. Maria teaches five classes—225 students—across three different grade levels. Every week, she spends 8-10 hours writing detailed lesson plans that follow DepEd's strict format requirements. Each plan needs nine sections, exact wording, competency codes, and hour-long scripting. By the time she finishes planning, there's barely time left for actual teaching preparation."

[Show a stressed teacher at a desk, writing by hand or typing]

### Scene 2: The Solution (0:30-1:15)

"This is Lumina AI. An intelligent lesson-plan generator built specifically for Filipino teachers."

[Open Lumina AI in browser]

"Maria starts by filling out a simple form. Subject: Science. Grade: 7. Topic: The Water Cycle. Quarter: 2nd Quarter. Duration: 50 minutes. Difficulty: Intermediate. A few clicks, and she adds a special note: 'Include local examples from Maynilad water systems.'"

[Show form being filled out]

"She clicks Generate. And in less than 30 seconds..."

[Show loading, then completed lesson plan]

"...a complete, DepEd-compliant lesson plan appears. Nine tables, proper formatting, real examples specific to The Water Cycle, evaluation items with answer keys, everything she needs."

### Scene 3: The Technology (1:15-2:30)

"Behind the scenes, Lumina uses advanced AI reasoning to understand DepEd requirements and apply them systematically. It's not just a template engine—it actually reasons about grade levels, Bloom's Taxonomy, topic specificity, and pedagogical sequencing."

[Show backend architecture diagram]

"The system starts by breaking the job into two intelligent sub-tasks. First, it generates the lesson structure: objectives, content, resources, and procedures. Then it generates the assessment components: evaluation, assignment, remarks, and reflection. This two-step approach prevents the AI from getting overwhelmed."

"If the primary AI model hits a rate limit, Lumina automatically switches to a backup model. If that fails, it has a third-tier fallback—a deterministic template that ensures Maria always gets *something* she can work with. Even on a bad day, she never receives a blank error message."

"The entire output is structured as HTML tables that match DepEd's exact format. Maria can print it immediately, save it to Word, edit it in the browser, or download it as PDF."

### Scene 4: Key Features (2:30-3:30)

"What makes Lumina special?"

[Show feature callouts]

**Topic Specificity:** Every single objective, activity, and evaluation item is about the specific topic—not generic. For The Water Cycle, every question is about water cycle concepts, precipitation, evaporation, and condensation.

**Pedagogical Correctness:** The system knows that Grade 7 Intermediate students should work at the 'Apply' and 'Analyze' levels of Bloom's Taxonomy. It automatically generates objectives and questions at that level—not too easy, not too hard.

**Editability:** Maria can review the plan in seconds and edit any section she wants. The system provides metadata about which sections might need manual review, so she knows where to focus.

**History and Session Storage:** All generated plans are saved in her session. She can go back to previous plans, duplicate them, or build on them for next week's lessons.

### Scene 5: The Impact (3:30-4:15)

"With Lumina, Maria reclaims 6-8 hours per week."

[Show before/after comparison]

"That time goes back to what matters: knowing her students, preparing engaging activities, providing individual feedback, and actually *teaching* instead of drowning in paperwork."

"And because Lumina generates fresh, specific lesson plans every time, each lesson is tailored to its exact topic and grade level. Maria isn't recycling generic templates—she's getting precise, pedagogically sound plans that respect Filipino education standards and her students' diverse learning needs."

### Scene 6: Responsible AI (4:15-4:45)

"Lumina is built with teacher agency and responsibility at the center. Every generated plan is clearly marked as an AI-generated draft that must be reviewed before classroom use. The system never generates fake teacher names or school names. It doesn't collect personal data. And because all plans are editable, teachers remain in control—the AI is a tool that serves their judgment, not a replacement for it."

### Scene 7: Call to Action (4:45-5:00)

"Lumina AI is available free to all Philippine teachers. Visit lumina-ai.ph to generate your first lesson plan today."

[Show website, call to action]

---

## 13. Presentation Outline (5-7 minutes)

### Opening (0:00-0:30)

"The Philippines produces over 1.4 million teachers serving 26 million students. Nearly all face the same challenge: writing detailed lesson plans that comply with DepEd's rigid format requirements while managing 150+ students per teacher. The average teacher spends 10+ hours per week on lesson planning alone. Lumina AI exists to reclaim that time."

### What (0:30-1:45)

**What is Lumina AI?**
- An AI-powered lesson plan generator for Philippine K-12 and SHS teachers
- Generates complete, DepEd-compliant detailed and semi-detailed lesson plans in under 30 seconds
- Takes teacher input (subject, grade, topic, duration, difficulty) and produces nine properly formatted tables with realistic, topic-specific content
- Free to use, browser-based, requires no installation

**What problem does it solve?**
- Teachers waste 6-10 hours per week on lesson planning—time taken from actual teaching and student interaction
- Lesson plan writing is repetitive but context-specific, making it hard to template effectively
- Teachers need plans that follow exact DepEd format but also have pedagogical quality and topic specificity

**Who uses it?**
- Classroom teachers, especially those managing multiple grade levels or subjects
- New teachers who may lack experience with DepEd format
- Teachers in resource-limited schools with limited professional development

### How (1:45-4:00)

**The Technology Stack:**
- **Frontend:** React + Vite (responsive UI, client-side session storage)
- **Backend:** Flask REST API (lightweight, easy deployment)
- **AI Models:** Groq API (LLaMA 3.3 70B primary, LLaMA 3.1 8B fallback, Gemini fallback)
- **Output:** HTML tables (ready to print, edit in Word, save to PDF)

**The Core Innovation: Two-Part Generation + Fallback Chain**

Instead of one risky LLM call that might fail, Lumina uses intelligent fallback:
1. **Tier 1 (Primary):** Two sequential Groq API calls (Tables 1-5, then Tables 6-9)
2. **Tier 2 (Focused):** Single, shorter focused prompt if Tier 1 fails
3. **Tier 3 (Static):** Deterministic template generation if Tier 2 fails

Result: **100% output delivery rate.** Teachers never see an error page; they get a usable draft.

**Prompt Engineering as the Core Agent Logic**

Rather than fine-tuning, Lumina uses elaborate system and user prompts to encode DepEd requirements:
- System prompt contains 1000+ lines of rules covering all 9 table structures, section requirements, Bloom's Taxonomy alignment, topic anchoring, and formatting standards
- User prompt injects all teacher inputs as variables and adds topic-specific constraints
- The prompt *itself* is the agent—it reasons through pedagogical correctness, grade-appropriateness, and DepEd compliance during generation

This approach is:
- **Transparent:** Rules are visible in plain text, not hidden in model weights
- **Flexible:** Easily adapts to new curricula frameworks or DepEd changes without retraining
- **Fast:** Deployed instantly; no fine-tuning cycle

**Validation and Metadata Enrichment**

After generation, the output runs through validation:
- Confirms all 9 required sections are present
- Reports completeness score (0-100%)
- Builds metadata: Bloom's levels, curriculum advisory, decisions log, section completeness checklist
- Flags unverified references and AI-generated warnings

Teachers get both the lesson plan *and* a quality report, so they know exactly what to review.

### Why (4:00-5:15)

**Why this approach, not alternatives?**

- **Why Groq instead of OpenAI?** Speed (2-3× faster), cost (free tier), reliability (LLaMA context window is sufficient), fallback compatibility
- **Why HTML tables instead of DOCX?** Teachers need immediate printability, no format conversion, matches DepEd expectations exactly
- **Why prompt engineering instead of fine-tuning?** No training data available, fast iteration, adapts to curriculum changes, cost-effective
- **Why two-part generation instead of one big call?** Token limits, reliability (parallel redundancy), faster completion

**Why Responsible AI Matters**

- All outputs are marked as drafts requiring teacher review (never automatic classroom use)
- Teacher and student names never generated (privacy)
- All content is editable (teachers remain in control)
- Validation warnings highlight where AI may have hallucinated (transparency)
- Supports multiple curricula and learner profiles (equity)

### Impact (5:15-6:30)

"If Lumina reaches 50,000 Philippine teachers, it reclaims **6 million hours per year** that teachers can spend on actual teaching. That's equivalent to hiring 3,000 additional teachers, just in time recaptured from paperwork."

"More importantly, it shifts teacher focus from format compliance to pedagogy. Teachers can invest their planning energy in understanding their students' learning gaps, designing engaging activities, and creating inclusive classrooms—not fighting DepEd formatting requirements."

**Measurable Outcomes:**
- Time saved per teacher per week: 6-8 hours
- Lesson plan quality: Consistent DepEd compliance + pedagogical correctness
- Teacher satisfaction: Reduced administrative burden, more agency
- Student impact: Teachers have more time for personalized feedback and relationship-building

### Closing (6:30-7:00)

"Lumina AI is proof that intelligent automation can serve education, not replace it. It's not about making teachers obsolete—it's about making teachers' time matter more. By automating the routine, compliance-heavy task of lesson planning, we free teachers to do what they do best: teach."

"Lumina is free to all Philippine teachers. We invite you to try it, use it in your classroom, and share feedback. This is an AI tool built by educators, for educators."

---

## 14. Technical Appendix: System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LUMINA AI SYSTEM ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (React + Vite)
┌────────────────────────────────────────────┐
│  LessonForm Component                      │
│  - Subject, Grade, Topic, Quarter          │
│  - Duration, Difficulty, Curriculum        │
│  - Lesson Type, Special Notes              │
└────────────────────────────────────────────┘
           │ (POST /api/generate)
           │
           ▼
┌────────────────────────────────────────────┐
│  API Service (axios)                       │
│  - POST to http://localhost:5000/api/gen   │
└────────────────────────────────────────────┘
           │
           ▼
BACKEND (Flask REST API)
┌────────────────────────────────────────────┐
│  /api/generate Endpoint                    │
│  1. Validate inputs                        │
│  2. Route to generation tier               │
└────────────────────────────────────────────┘
           │
    ┌──────┴──────┬──────────────┐
    │             │              │
    ▼             ▼              ▼
TIER 1        TIER 2          TIER 3
(Groq)     (Focused)       (Template)
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Call 1: │ │Shorter  │ │Deterministic│
│Tables1-5│ │focused  │ │HTML         │
│         │ │prompt   │ │template     │
│ Call 2: │ │to Groq  │ │generation   │
│Tables6-9│ └──────────┘ └──────────────┘
└─────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│  Post-Processing                           │
│  1. normalize_table_styles()               │
│  2. validate_dlp() → score, missing        │
│  3. normalize_response_metadata()          │
│     - Bloom's levels                       │
│     - Decisions log                        │
│     - Section completeness                │
│     - Warnings & advisory                  │
└────────────────────────────────────────────┘
           │
           ▼ (JSON response)
FRONTEND (React)
┌────────────────────────────────────────────┐
│  DLPOutputPanel Component                  │
│  - Displays 9 HTML tables                  │
│  - Shows validation score                  │
│  - Metadata layer (decisions, warnings)    │
│  - Edit, print, download buttons           │
└────────────────────────────────────────────┘
           │
    ┌──────┴──────┬──────────────┐
    │             │              │
    ▼             ▼              ▼
Session       Backend        Download
Storage       History        as PDF
(client)      (server)       (browser)
```

---

## Conclusion

Lumina AI represents a practical application of agentic AI reasoning to solve a real, measurable problem in Philippine education. By combining prompt engineering, multi-tier fallback resilience, validation-and-correction loops, and responsible AI principles, Lumina delivers reliable, pedagogically sound lesson plans that respect teacher agency and focus DepEd compliance.

The system demonstrates that agents don't require complex frameworks or fine-tuning—instead, careful prompt engineering, explicit decision rules, and strategic tool usage (calling external LLMs intelligently) can create a robust, adaptable system that serves thousands of teachers and, ultimately, millions of students.

