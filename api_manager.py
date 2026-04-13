from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional

import requests


MUDRIK_V8_SYSTEM_PROMPT = (
    "Act as a Senior Saudi Engineering Consultant. "
    "Use formal Arabic. Avoid fluff and introductory phrases. "
    "Focus strictly on technical specifications and compliance with the Saudi Building Code (SBC). "
    "Structure outputs with clear hierarchical headings."
)


class ApiManager:
    """Direct cloud LLM manager (Gemini/OpenAI) with retries and timeout."""

    def __init__(
        self,
        provider: str = "gemini",
        timeout_sec: int = 600,
        max_retries: int = 2,
        backoff_sec: float = 1.0,
    ) -> None:
        self.provider = provider.lower().strip()
        self.timeout_sec = timeout_sec
        self.max_retries = max_retries
        self.backoff_sec = backoff_sec

    def generate(self, user_prompt: str, model: Optional[str] = None) -> str:
        if not user_prompt or not user_prompt.strip():
            raise ValueError("user_prompt is required")

        if self.provider == "openai":
            return self._with_retry(lambda: self._generate_openai(user_prompt, model or "gpt-4o"))
        return self._with_retry(lambda: self._generate_gemini(user_prompt, model or "gemini-1.5-flash"))

    def _with_retry(self, fn):
        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                return fn()
            except requests.RequestException as exc:
                last_error = exc
                if attempt < self.max_retries:
                    time.sleep(self.backoff_sec * (attempt + 1))
                else:
                    break
        raise RuntimeError(f"API request failed after retries: {last_error}")

    def _generate_openai(self, user_prompt: str, model: str) -> str:
        api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")

        base = (os.getenv("OPENAI_API_BASE") or "https://api.openai.com/v1").rstrip("/")
        url = f"{base}/chat/completions"
        payload: Dict[str, Any] = {
            "model": model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": MUDRIK_V8_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        }
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=self.timeout_sec,
        )
        response.raise_for_status()
        body = response.json()
        return body["choices"][0]["message"]["content"]

    def _generate_gemini(self, user_prompt: str, model: str) -> str:
        api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={api_key}"
        )
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [
                        {"text": MUDRIK_V8_SYSTEM_PROMPT},
                        {"text": user_prompt},
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.2},
        }
        response = requests.post(url, json=payload, timeout=self.timeout_sec)
        response.raise_for_status()
        body = response.json()
        candidates: List[Dict[str, Any]] = body.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()
        if not text:
            raise RuntimeError("Gemini returned empty text")
        return text

