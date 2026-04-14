from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests


MUDRIK_V8_SYSTEM_PROMPT = (
    "Senior Saudi consultant for Etimad tenders. Technical Compliance Structure: zero narrative fluff; "
    "contractual procedural Arabic (تلتزم الجهة المنفذة، يتم التنفيذ وفقاً، تخضع الأعمال). "
    "Each subsection: Requirement -> Technical solution -> Reference code. Numbering 1.0/1.1/1.1.1; "
    "steps as (أ، ب، ج) or (1، 2، 3) in prose; text tables for spec comparison. "
    "No # headers; no dash bullets. Use **SBC 201**, **ASTM**, **NFPA**, **SASO** only for key standard acronyms. "
    "Output like a Technical Method Statement / QCP from a Grade-A firm. No chat intro or closing."
)


def _load_env_from_dotfiles() -> None:
    """Load .env.local then .env from repo root (no python-dotenv dependency)."""
    root = Path(__file__).resolve().parent
    for name in (".env.local", ".env"):
        path = root / name
        if not path.is_file():
            continue
        try:
            for raw in path.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
        except OSError:
            pass


_load_env_from_dotfiles()


def _resolve_timeout_sec(explicit: Optional[int] = None) -> int:
    if explicit is not None:
        return max(60, min(600, explicit))
    raw = (os.getenv("MUDRIK_API_TIMEOUT_SEC") or "120").strip()
    try:
        n = int(raw)
    except ValueError:
        n = 120
    return max(60, min(600, n))


class ApiManager:
    """Direct cloud LLM manager (Gemini/OpenAI) with retries and timeout."""

    def __init__(
        self,
        provider: str = "gemini",
        timeout_sec: Optional[int] = None,
        max_retries: int = 2,
        backoff_sec: float = 1.0,
    ) -> None:
        self.provider = provider.lower().strip()
        self.timeout_sec = _resolve_timeout_sec(timeout_sec)
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

