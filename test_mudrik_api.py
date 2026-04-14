#!/usr/bin/env python3
"""
Diagnostic: call Mudrik ApiManager (direct Gemini/OpenAI) with a short tender stub.
Loads .env / .env.local from the project root without requiring python-dotenv.

Usage:
  export GEMINI_API_KEY=...   # or OPENAI_API_KEY for --provider openai
  python3 test_mudrik_api.py
  python3 test_mudrik_api.py --provider openai
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# Project root = directory containing this script
_ROOT = Path(__file__).resolve().parent


def _load_env_files() -> None:
    for name in (".env.local", ".env"):
        path = _ROOT / name
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
        except OSError as exc:
            print(f"[warn] could not read {path}: {exc}", file=sys.stderr)


def main() -> int:
    _load_env_files()

    parser = argparse.ArgumentParser(description="Mudrik API smoke test")
    parser.add_argument(
        "--provider",
        choices=("gemini", "openai"),
        default=os.getenv("MUDRIK_TEST_PROVIDER", "gemini"),
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=int(os.getenv("MUDRIK_API_TIMEOUT_SEC", "120")),
        help="HTTP read timeout in seconds (60–600)",
    )
    args = parser.parse_args()

    tender = "مشروع توريد وتركيب أنظمة تكييف لمستشفى حكومي"

    # Import after env is loaded
    from api_manager import ApiManager  # pylint: disable=import-outside-toplevel

    timeout = max(60, min(600, args.timeout))
    mgr = ApiManager(provider=args.provider, timeout_sec=timeout)

    print(f"Provider: {args.provider}  timeout_sec={timeout}")
    print("Sending tender stub…")

    t0 = time.perf_counter()
    try:
        out = mgr.generate(
            f"أعد صياغة فقرة فنية قصيرة جداً (أقل من 200 كلمة) عن: {tender}",
            model=None,
        )
    except Exception as exc:  # noqa: BLE001
        elapsed = time.perf_counter() - t0
        print(f"STATUS: error elapsed_sec={elapsed:.2f}")
        print(f"ERROR: {exc}")
        return 1

    elapsed = time.perf_counter() - t0
    print(f"STATUS: ok  elapsed_sec={elapsed:.2f}")
    preview = (out or "").strip()
    if len(preview) > 1200:
        preview = preview[:1200] + "\n… [truncated]"
    print("--- output ---")
    print(preview)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
