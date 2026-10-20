import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AgentCard } from '../components/AgentCard';
import { AppLayout } from '../components/AppLayout';
import { useAgentStore } from '../stores/agentStore';
import { useAuthStore } from '../stores/authStore';

export function AgentsPage() {
  const agents = useAgentStore((state) => state.agents);
  const isLoading = useAgentStore((state) => state.isLoading);
  const error = useAgentStore((state) => state.error);
  const fetchAgents = useAgentStore((state) => state.fetchAgents);
  const deleteAgent = useAgentStore((state) => state.deleteAgent);
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    void fetchAgents().catch(() => undefined);
  }, [fetchAgents]);

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Удалить агента «${name}»? Это действие нельзя отменить.`)) return;
    try {
      await deleteAgent(id);
    } catch {
      // Ошибка отображается через общее состояние agentStore.
    }
  }

  return (
    <AppLayout activeSection="agents" footerRight="ПОРТАЛ ИИ-ИНФРАСТРУКТУРЫ">
      <section className="agents-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">РАЗДЕЛ ПЛАТФОРМЫ · ИИ-АГЕНТЫ</span>
            <h1>ИИ-агенты<span className="heading-count">{agents.length}</span></h1>
            <p>Создавайте и настраивайте агентов для задач вашей компании.</p>
          </div>
          <Link className="primary-link" to="/agents/new"><span>＋</span> Добавить агента</Link>
        </div>

        {error && <div className="api-alert" role="alert"><span>{error}</span><button type="button" onClick={() => void fetchAgents().catch(() => undefined)}>Повторить</button></div>}

        {isLoading && agents.length === 0 ? (
          <div className="agents-state"><span className="loading-mark" />Загружаем агентов...</div>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-index">1 / СПИСОК ПУСТ</span>
            <div className="empty-symbol">＋</div>
            <h2>Пока нет агентов</h2>
            <p>Добавьте первого ИИ-агента: укажите его назначение и инструкцию для выполнения задач.</p>
            <Link className="primary-link" to="/agents/new">Добавить агента <span aria-hidden="true">↗</span></Link>
          </div>
        ) : (
          <div className="agent-grid">
            {agents.map((agent, index) => (
              <AgentCard key={agent.id} agent={agent} index={index} canManage={agent.owner?.id === userId} onDelete={(item) => void handleDelete(item.id, item.name)} />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
