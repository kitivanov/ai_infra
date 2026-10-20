import { Link } from 'react-router-dom';
import type { Agent } from '../stores/agentStore';

type AgentConfigurationPanelProps = {
  agent: Agent;
};

export function AgentConfigurationPanel({ agent }: AgentConfigurationPanelProps) {
  return (
    <>
      <div className="configuration-grid">
        <section className="configuration-card">
          <span className="eyebrow">МОДЕЛЬ</span>
          {agent.model ? (
            <Link to={`/resources/models/${agent.model.id}`}><strong>{agent.model.name}</strong><span>{agent.model.provider} · {agent.model.model_name}</span></Link>
          ) : <p>Модель не выбрана.</p>}
        </section>
        <section className="configuration-card">
          <span className="eyebrow">RAG ИСТОЧНИКИ</span>
          {agent.rags.length ? agent.rags.map((rag) => <Link key={rag.id} to={`/resources/rags/${rag.id}`}><strong>{rag.name}</strong><span>{rag.type}</span></Link>) : <p>Источники не подключены.</p>}
        </section>
        <section className="configuration-card">
          <span className="eyebrow">MCP СЕРВЕРЫ</span>
          {agent.mcps.length ? agent.mcps.map((mcp) => <Link key={mcp.id} to={`/resources/mcps/${mcp.id}`}><strong>{mcp.name}</strong><span>{mcp.type}</span></Link>) : <p>Серверы не подключены.</p>}
        </section>
      </div>
      <section className="prompt-panel">
        <div className="prompt-panel-heading"><span className="eyebrow">SYSTEM PROMPT</span><span>ИНСТРУКЦИЯ АГЕНТА</span></div>
        <p>{agent.system_prompt}</p>
      </section>
    </>
  );
}
