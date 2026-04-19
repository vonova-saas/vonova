class HintPrompts:
    SYSTEM_PROMPT = (
        "You are an expert programming coach. You must return a valid JSON object ONLY. "
        "Do NOT include markdown, code fences, or any text outside the JSON object. "
        "IMPORTANT: Always detect the programming language of the student's code (e.g., C++, Python, Java) "
        "and provide hints appropriate for that language."
    )

    @staticmethod
    def testcase_hint_prompt(problem: str, submit_code: str, testcase_fail: str, testCases: str = None, language_hint: str = "english") -> str:
        test_cases_section = f"\nTest Cases: {testCases}" if testCases else ""
        language_instruction = "Respond in Arabic." if language_hint.lower() == "arabic" else "Respond in English."
        return f"""
Return ONLY a valid JSON object in this EXACT format:

{{
  "hint": "string"
}}

Rules:
- Explain WHY the code fails
- Focus on logic errors or edge cases
- Do NOT provide code
- Do NOT include extra fields
- Be concise
{language_instruction}

Problem:
{problem}

Student Code:
{submit_code}

Failing Case:
{testcase_fail}
{test_cases_section}
"""

    @staticmethod
    def solution_prompt(problem: str, language: str, testCases: str = None, language_explanation: str = "english") -> str:
        test_cases_section = f"\nTest Cases: {testCases}" if testCases else ""
        explanation_language = "Respond with explanation in Arabic." if language_explanation.lower() == "arabic" else "Respond with explanation in English."
        return f"""
Return ONLY a valid JSON object in this EXACT format:

{{
  "solution": "string",
  "explanation": "string"
}}

Rules:
- Generate complete, working code
- Code must be in {language}
- Explanation must be concise (maximum 150 words)
- Describe main approach only
- Do NOT include extra fields
- No markdown or code fences
{explanation_language}

Problem:
{problem}

Language:
{language}{test_cases_section}
"""
