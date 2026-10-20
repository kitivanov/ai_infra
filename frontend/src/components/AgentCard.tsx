import { Link, useNavigate } from 'react-router-dom';
import type { Agent } from '../stores/agentStore';
import { StatusPill } from './StatusPill';

type AgentCardProps = {
  agent: Agent;
  index: number;
  canManage: boolean;
  onDelete: (agent: Agent) => void;
};

export function AgentCard({ agent, index, canManage, onDelete }: AgentCardProps) {
  const navigate = useNavigate();

  return (
    <article className="agent-card">
      <div className="agent-card-top">
        <span className="agent-number">АГЕНТ / {index + 1}</span>
        <StatusPill status={agent.status} />
      </div>
      <Link className="agent-card-main" to={`/agents/${agent.id}`}>
        <h2>{agent.name}</h2>
        <p>{agent.description || 'Описание пока не добавлено.'}</p>
        <span className="agent-resource-summary">{agent.model?.name ?? 'Без модели'} · {agent.rags.length} RAG · {agent.mcps.length} MCP</span>
      </Link>
      <div className="agent-card-bottom">
        <span>ВЛАДЕЛЕЦ {agent.owner?.username ?? 'Платформа'}</span>
        <div className="agent-actions">
          <button type="button" aria-label={`Открыть ${agent.name}`} onClick={() => navigate(`/agents/${agent.id}`)}>Открыть</button>
          {canManage && <>
            <button type="button" aria-label={`Редактировать ${agent.name}`} onClick={() => navigate(`/agents/${agent.id}/edit`)}>Изменить</button>
            <button className="delete-action" type="button" aria-label={`Удалить ${agent.name}`} onClick={() => onDelete(agent)}>Удалить</button>
          </>}
        </div>
      </div>
    </article>
  );
}
