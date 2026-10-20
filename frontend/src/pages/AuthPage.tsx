import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';
import { useAuthStore } from '../stores/authStore';

type AuthPageProps = {
  mode: 'login' | 'register';
};

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type LocationState = {
  from?: { pathname: string };
};

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get('returnTo');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token && !returnTo) return <Navigate to="/agents" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await api.post('/auth/register', { email, username, password });
      }

      const form = new URLSearchParams({ username, password });
      const response = await api.post<TokenResponse>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setToken(response.data.access_token);
      const state = location.state as LocationState | null;
      navigate(returnTo ?? state?.from?.pathname ?? '/agents', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не удалось выполнить запрос. Попробуйте ещё раз.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="form-panel">
        <div className="form-wrap">
          <div className="auth-brand">AI Infra</div>
          <div className="form-heading">
            <h1>{isRegister ? 'Регистрация' : 'Вход'}</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label className="field">
                <span>ЭЛЕКТРОННАЯ ПОЧТА</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="имя@компания.рф" autoComplete="email" required />
              </label>
            )}
            <label className="field">
              <span>ИМЯ ПОЛЬЗОВАТЕЛЯ</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Введите имя пользователя" autoComplete="username" minLength={1} maxLength={100} required />
            </label>
            <label className="field">
              <span>ПАРОЛЬ</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Подождите...' : isRegister ? 'Зарегистрироваться' : 'Войти'}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <p className="switch-mode">
            {isRegister ? 'Уже зарегистрированы?' : 'Нет учётной записи?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Войти' : 'Зарегистрироваться'}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
