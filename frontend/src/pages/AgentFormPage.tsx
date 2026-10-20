import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAgentStore } from '../stores/agentStore';
import { useAuthStore } from '../stores/authStore';
import type { AgentPayload } from '../stores/agentStore';
import { useResourceStore } from '../stores/resourceStore';

const emptyForm: AgentPayload = { name: '', description: '', system_prompt: '', status: 'active', model_id: null, rag_ids: [], mcp_ids: [] };

export function AgentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const agentId = Number(id);
  const agents = useAgentStore((state) => state.agents);
  const fetchAgent = useAgentStore((state) => state.fetchAgent);
  const createAgent = useAgentStore((state) => state.createAgent);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const storeError = useAgentStore((state) => state.error);
  const userId = useAuthStore((state) => state.userId);
  const models = useResourceStore((state) => state.models);
  const rags = useResourceStore((state) => state.rags);
  const mcps = useResourceStore((state) => state.mcps);
  const fetchResources = useResourceStore((state) => state.fetchAll);
  const navigate = useNavigate();
  const currentAgent = agents.find((item) => item.id === agentId);
  const [form, setForm] = useState<AgentPayload>(() => {
    const agent = currentAgent;
    return agent ? { name: agent.name, description: agent.description ?? '', system_prompt: agent.system_prompt, status: agent.status, model_id: agent.model_id, rag_ids: agent.rags.map((rag) => rag.id), mcp_ids: agent.mcps.map((mcp) => mcp.id) } : emptyForm;
  });
  const [isLoading, setIsLoading] = useState(isEdit && !agents.some((item) => item.id === agentId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void fetchResources().catch(() => undefined); }, [fetchResources]);

  useEffect(() => {
    if (!isEdit || !Number.isInteger(agentId) || agentId < 1) return;
    const existing = agents.find((item) => item.id === agentId);
    if (existing) {
      setForm({ name: existing.name, description: existing.description ?? '', system_prompt: existing.system_prompt, status: existing.status, model_id: existing.model_id, rag_ids: existing.rags.map((rag) => rag.id), mcp_ids: existing.mcps.map((mcp) => mcp.id) });
      setIsLoading(false);
      return;
    }
    void fetchAgent(agentId)
      .then((agent) => setForm({ name: agent.name, description: agent.description ?? '', system_prompt: agent.system_prompt, status: agent.status, model_id: agent.model_id, rag_ids: agent.rags.map((rag) => rag.id), mcp_ids: agent.mcps.map((mcp) => mcp.id) }))
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [agentId, agents, fetchAgent, isEdit]);

  function updateField<K extends keyof AgentPayload>(field: K, value: AgentPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const payload: AgentPayload = { ...form, name: form.name.trim(), description: form.description?.trim() || null, system_prompt: form.system_prompt.trim(), status: form.status.trim() };
    try {
      if (isEdit) {
        await updateAgent(agentId, payload);
      } else {
        await createAgent(payload);
      }
      navigate('/agents', { replace: true });
    } catch {
      setError(storeError || 'Не удалось сохранить агента. Проверьте соединение и попробуйте снова.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout activeSection="agents" footerRight={isEdit ? 'ИЗМЕНЕНИЕ АГЕНТА' : 'НОВЫЙ АГЕНТ'}>
      <section className="form-page-content">
        <Link className="back-link" to="/agents">← Все агенты</Link>
        {isLoading ? <div className="agents-state"><span className="loading-mark" />Загружаем агента...</div> : isEdit && !currentAgent ? (
          <div className="detail-not-found"><span className="eyebrow">АГЕНТ НЕ НАЙДЕН</span><h1>Не удалось загрузить агента</h1><p>{storeError || 'Возможно, агент был удалён или у вас нет к нему доступа.'}</p><Link className="primary-link" to="/agents">Вернуться к списку</Link></div>
        ) : isEdit && currentAgent && currentAgent.owner?.id !== userId ? (
          <div className="detail-not-found"><span className="eyebrow">НЕТ ДОСТУПА</span><h1>Изменение недоступно</h1><p>Вы можете просматривать агента, но изменить его может только владелец.</p><Link className="primary-link" to={`/agents/${agentId}`}>Открыть агента</Link></div>
        ) : (
          <>
            <div className="form-page-heading"><span className="eyebrow">{isEdit ? 'НАСТРОЙКИ АГЕНТА' : 'НОВЫЙ АГЕНТ'}</span><h1>{isEdit ? 'Изменить агента' : 'Добавить агента'}</h1><p>{isEdit ? 'Обновите описание и инструкцию для агента.' : 'Укажите, для каких задач предназначен агент и как ему следует работать.'}</p></div>
            <form className="agent-form" onSubmit={handleSubmit}>
              <label className="agent-field"><span>НАЗВАНИЕ <i>ОБЯЗАТЕЛЬНО</i></span><input autoFocus maxLength={150} onChange={(event) => updateField('name', event.target.value)} placeholder="Например, Агент по документации" required value={form.name} /></label>
              <label className="agent-field"><span>КРАТКОЕ ОПИСАНИЕ <i>НЕОБЯЗАТЕЛЬНО</i></span><textarea maxLength={2000} onChange={(event) => updateField('description', event.target.value)} placeholder="Какие задачи решает этот агент?" rows={3} value={form.description ?? ''} /></label>
              <label className="agent-field"><span>МОДЕЛЬ</span><select value={form.model_id ?? ''} onChange={(event) => updateField('model_id', event.target.value ? Number(event.target.value) : null)}><option value="">Без модели</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.provider}</option>)}</select></label>
              <label className="agent-field"><span>RAG ИСТОЧНИКИ</span><select multiple size={Math.min(Math.max(rags.length, 2), 5)} value={form.rag_ids.map(String)} onChange={(event) => updateField('rag_ids', Array.from(event.target.selectedOptions, (option) => Number(option.value)))} disabled={!rags.length}>{rags.length ? rags.map((rag) => <option key={rag.id} value={rag.id}>{rag.name}</option>) : <option value="">Нет созданных RAG</option>}</select><small className="select-hint">Можно выбрать несколько источников: Ctrl+клик (Windows) или Cmd+клик (Mac).</small></label>
              <label className="agent-field"><span>MCP СЕРВЕРЫ</span><select multiple size={Math.min(Math.max(mcps.length, 2), 5)} value={form.mcp_ids.map(String)} onChange={(event) => updateField('mcp_ids', Array.from(event.target.selectedOptions, (option) => Number(option.value)))} disabled={!mcps.length}>{mcps.length ? mcps.map((mcp) => <option key={mcp.id} value={mcp.id}>{mcp.name}</option>) : <option value="">Нет созданных MCP</option>}</select><small className="select-hint">Можно выбрать несколько серверов: Ctrl+клик (Windows) или Cmd+клик (Mac).</small></label>
              <label className="agent-field"><span>ИНСТРУКЦИЯ ДЛЯ АГЕНТА <i>ОБЯЗАТЕЛЬНО</i></span><textarea className="prompt-input" onChange={(event) => updateField('system_prompt', event.target.value)} placeholder="Опишите задачи агента, правила работы и требования к ответам" required rows={8} value={form.system_prompt} /></label>
              <label className="agent-field status-field"><span>СОСТОЯНИЕ</span><select onChange={(event) => updateField('status', event.target.value)} value={form.status}><option value="active">Включён</option><option value="inactive">Отключён</option></select></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="agent-form-actions"><Link className="cancel-link" to="/agents">Отмена</Link><button className="primary-link" disabled={isSaving} type="submit">{isSaving ? 'Сохраняем...' : isEdit ? 'Сохранить изменения' : 'Создать агента'} <span aria-hidden="true">↗</span></button></div>
            </form>
          </>
        )}
      </section>
    </AppLayout>
  );
}
