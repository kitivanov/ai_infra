from collections.abc import Callable
import json

import httpx
from google import genai
from google.genai import types

from app.models import Model


class ChatConfigurationError(Exception):
    pass


class ChatProviderError(Exception):
    pass


def _generate_gemini_reply(model: Model, system_prompt: str, history: list[tuple[str, str]]) -> str:
    http_options = types.HttpOptions(base_url=model.base_url) if model.base_url else None
    with genai.Client(api_key=model.api_key.strip(), http_options=http_options) as client:
        contents = [
            types.Content(role="model" if role == "assistant" else "user", parts=[types.Part(text=content)])
            for role, content in history
        ]
        response = client.models.generate_content(
            model=model.model_name,
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_prompt),
        )
    return response.text or ""


def _generate_openai_compatible_reply(model: Model, system_prompt: str, history: list[tuple[str, str]]) -> str:
    base_url = (model.base_url or "https://openrouter.ai/api/v1").rstrip("/")
    messages = []
    if system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt})
    messages.extend({"role": role, "content": content} for role, content in history)

    response = httpx.post(
        f"{base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {model.api_key.strip()}",
            "Content-Type": "application/json",
        },
        json={"model": model.model_name, "messages": messages},
        timeout=60.0,
    )
    response.raise_for_status()
    data = response.json()
    answer = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        raise ChatProviderError("Модель не вернула текстовый ответ")
    return answer


PROVIDERS: dict[str, Callable[[Model, str, list[tuple[str, str]]], str]] = {
    "google": _generate_gemini_reply,
    "gemini": _generate_gemini_reply,
    "openrouter": _generate_openai_compatible_reply,
    "qwen": _generate_openai_compatible_reply,
}


def generate_reply(model: Model, system_prompt: str, history: list[tuple[str, str]]) -> str:
    provider = model.provider.strip().lower()
    adapter = PROVIDERS.get(provider)
    if not adapter:
        raise ChatConfigurationError(f"Провайдер «{model.provider}» пока не поддерживается")
    if model.status.strip().lower() not in {"active", "enabled"}:
        raise ChatConfigurationError("Выбранная модель отключена")
    if not model.api_key or not model.api_key.strip():
        raise ChatConfigurationError("Для выбранной модели не настроен API key")
    if not model.model_name.strip():
        raise ChatConfigurationError("Не задано имя модели")

    try:
        answer = adapter(model, system_prompt, history)
        if not answer.strip():
            raise ChatProviderError("Модель не вернула текстовый ответ")
        return answer
    except ChatProviderError:
        raise
    except httpx.HTTPStatusError as exc:
        provider_label = "Google Gemini" if provider in {"google", "gemini"} else "OpenRouter"
        try:
            provider_error = exc.response.json().get("error")
            detail = provider_error.get("message") if isinstance(provider_error, dict) else provider_error
        except (ValueError, AttributeError):
            detail = exc.response.text
        if not isinstance(detail, str) or not detail.strip():
            detail = exc.response.text or "провайдер не предоставил описание ошибки"
        detail = detail.replace(model.api_key, "[скрыто]")[:500]
        raise ChatProviderError(
            f"{provider_label} вернул HTTP {exc.response.status_code}: {detail}"
        ) from exc
    except httpx.RequestError as exc:
        provider_label = "Google Gemini" if provider in {"google", "gemini"} else "OpenRouter"
        raise ChatProviderError(
            f"Не удалось подключиться к {provider_label}. Проверьте интернет-соединение и Base URL."
        ) from exc
    except Exception as exc:
        provider_label = "Google Gemini" if provider in {"google", "gemini"} else "OpenRouter"
        raise ChatProviderError(
            f"Не удалось получить ответ от {provider_label}. Проверьте настройки модели и повторите запрос."
        ) from exc
