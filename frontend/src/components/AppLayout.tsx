import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

type AppLayoutProps = {
  children: ReactNode;
  activeSection: 'agents' | 'models' | 'rags' | 'mcps';
  footerRight: string;
};

export function AppLayout({ children, activeSection, footerRight }: AppLayoutProps) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="app-brand" to="/agents">
          <span className="brand-mark">AI</span>
          <span>AI Infra</span>
        </Link>
        <nav className="main-nav" aria-label="Основная навигация">
          <NavLink end className={activeSection === 'agents' ? 'is-current' : ''} to="/agents">Агенты</NavLink>
          <NavLink className={activeSection === 'models' ? 'is-current' : ''} to="/resources/models">Модели</NavLink>
          <NavLink className={activeSection === 'rags' ? 'is-current' : ''} to="/resources/rags">RAG</NavLink>
          <NavLink className={activeSection === 'mcps' ? 'is-current' : ''} to="/resources/mcps">MCP</NavLink>
        </nav>
        <button className="logout-button" onClick={logout} type="button">Выйти</button>
      </header>

      {children}

      <footer className="app-footer">
        <span>AI INFRA</span>
        <span>{footerRight}</span>
      </footer>
    </main>
  );
}
