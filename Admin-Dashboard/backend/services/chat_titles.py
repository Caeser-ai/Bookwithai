"""Generate concise AI-powered chat titles for recent conversations."""

import os
import re
from typing import Iterable, Mapping

from openai import OpenAI


TITLE_MODEL = os.getenv("OPENAI_CHAT_TITLE_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

STOP_WORDS = {
    "a", "an", "and", "are", "at", "book", "booking", "by", "can", "for", "from",
    "get", "help", "i", "if", "in", "into", "is", "it", "me", "my", "of", "on",
    "or", "plan", "planning", "please", "the", "to", "travel", "trip", "with",
}


def _normalize_title(title: str) -> str:
    cleaned = re.sub(r"\s+", " ", title or "").strip()
    cleaned = cleaned.strip("\"'`")
    cleaned = re.sub(r"^[\-\*\d\.\)\s]+", "", cleaned)
    cleaned = cleaned.rstrip(" .,:;!?-")
    return cleaned[:60].rstrip()


def _extract_title_words(text: str) -> list[str]:
    words = re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?", text or "")
    meaningful_words = [word for word in words if word.lower() not in STOP_WORDS]
    return meaningful_words or words


def _format_word_window(words: list[str]) -> str:
    normalized_words = [word.strip(" .,:;!?-") for word in words if word.strip(" .,:;!?-")]
    if not normalized_words:
        return "Travel Chat"

    if len(normalized_words) == 1:
        normalized_words.append("Trip")

    limited_words = normalized_words[:3]
    if len(limited_words) < 2:
        limited_words.append("Chat")

    return " ".join(word.capitalize() for word in limited_words[:3])


def _enforce_title_length(candidate: str, fallback: str) -> str:
    candidate_words = _extract_title_words(_normalize_title(candidate))
    if len(candidate_words) >= 2:
        return _format_word_window(candidate_words)

    fallback_words = _extract_title_words(fallback)
    return _format_word_window(candidate_words + fallback_words)


def _fallback_title(messages: Iterable[Mapping[str, str]]) -> str:
    for message in messages:
        if (message.get("role") or "").lower() != "user":
            continue

        content = re.sub(r"\s+", " ", (message.get("content") or "").strip())
        if not content:
            continue

        return _format_word_window(_extract_title_words(content))

    return "Travel Chat"


def build_fallback_chat_title(messages: Iterable[Mapping[str, str]]) -> str:
    return _fallback_title(messages)


def generate_chat_title(messages: Iterable[Mapping[str, str]]) -> str:
    source_messages = list(messages)
    fallback = _fallback_title(source_messages)

    if client is None:
        return fallback

    normalized_messages = []
    for message in source_messages:
        role = (message.get("role") or "user").strip().lower()
        content = re.sub(r"\s+", " ", (message.get("content") or "").strip())
        if not content:
            continue

        normalized_messages.append({
            "role": role,
            "content": content[:500],
        })

        if len(normalized_messages) >= 6:
            break

    if not normalized_messages:
        return fallback

    transcript = "\n".join(
        f"{message['role'].title()}: {message['content']}"
        for message in normalized_messages
    )

    try:
        response = client.chat.completions.create(
            model=TITLE_MODEL,
            temperature=0.2,
            max_completion_tokens=24,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write short sidebar topics for a travel assistant chat app. "
                        "Return only the topic text. Keep it concise, specific, and natural. "
                        "Use exactly 2 or 3 words. Never exceed 3 words. No quotes. No emoji."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Create a concise topic for this conversation:\n\n{transcript}",
                },
            ],
        )
    except Exception:
        return fallback

    title = response.choices[0].message.content or ""
    return _enforce_title_length(title, fallback)
