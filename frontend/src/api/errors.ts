import axios from 'axios';

type ValidationError = { msg?: unknown };
type ApiErrorDetail = string | ValidationError[];
type ApiErrorResponse = { detail?: ApiErrorDetail };

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item.msg)
        .filter((message): message is string => typeof message === 'string');
      if (messages.length) return messages.join(', ');
    }
    if (!error.response) {
      return 'Не удалось подключиться к API. Проверьте, запущен ли backend.';
    }
  }

  return fallback;
}
