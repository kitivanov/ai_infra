import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { useResourceStore, type ModelPayload, type ResourceKind, type StubPayload } from '../../stores/resourceStore';
import { resourceTitles, useResourceKind } from './ResourcesPage';

const initialModel: ModelPayload = { name: '', description: '', provider: '', model_name: '', base_url: '', api_key: '', status: 'active' };
const initialStub: StubPayload = { name: '', description: '', type: 'document', endpoint: '', status: 'active' };

function getResourceList(kind: ResourceKind) {
  const state = useResourceStore.getState();
  return kind === 'models' ? state.models : kind === 'rags' ? state.rags : state.mcps;
}

function createInitialForm(kind: ResourceKind, id: number) {
  const found = getResourceList(kind).find((item) => item.id === id);
  if (!found) return kind === 'models' ? { ...initialModel } : { ...initialStub };
  if (kind === 'models' && 'provider' in found) {
    return { name: found.name, description: found.description, provider: found.provider, model_name: found.model_name, base_url: found.base_url, api_key: '', status: found.status } satisfies ModelPayload;
  }
  if ('type' in found) {
    return { name: found.name, description: found.description, type: found.type, endpoint: found.endpoint, status: found.status } satisfies StubPayload;
  }
  return kind === 'models' ? { ...initialModel } : { ...initialStub };
}

export function ResourceFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const kind = useResourceKind();
  const { id } = useParams();
  const resourceId = Number(id);
  const resources = useResourceStore((state) => kind === 'models' ? state.models : kind === 'rags' ? state.rags : state.mcps);
  const fetchAll = useResourceStore((state) => state.fetchAll);
  const createResource = useResourceStore((state) => state.createResource);
  const updateResource = useResourceStore((state) => state.updateResource);
  const error = useResourceStore((state) => state.error);
  const navigate = useNavigate();
  const [form, setForm] = useState<ModelPayload | StubPayload>(() => createInitialForm(kind, resourceId));
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const isModel = kind === 'models';

  useEffect(() => { if (!resources.length) void fetchAll().catch(() => undefined); }, [fetchAll, resources.length]);
  useEffect(() => {
    if (mode === 'edit' && resources.length) setForm(createInitialForm(kind, resourceId));
  }, [kind, mode, resourceId, resources]);

  function setField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setLocalError('');
    try {
      const payload = { ...form, name: form.name.trim(), description: form.description?.trim() || null };
      if (mode === 'edit') await updateResource(kind, resourceId, payload);
      else await createResource(kind, payload);
      navigate(`/resources/${kind}`, { replace: true });
    } catch {
      setLocalError(error || 'Не удалось сохранить ресурс.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout activeSection={kind} footerRight="РЕДАКТОР РЕСУРСА">
      <section className="form-page-content">
        <Link className="back-link" to={`/resources/${kind}`}>← Все ресурсы</Link>
        <div className="form-page-heading">
          <span className="eyebrow">{resourceTitles[kind].toUpperCase()}</span>
          <h1>{mode === 'edit' ? 'Изменить' : 'Новая конфигурация'}</h1>
          <p>Добавьте параметры ресурса для подключения к агентам.</p>
        </div>
        <form className="agent-form" onSubmit={submit}>
          <label className="agent-field"><span>НАЗВАНИЕ</span><input required value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
          <label className="agent-field"><span>ОПИСАНИЕ</span><textarea rows={3} value={form.description ?? ''} onChange={(event) => setField('description', event.target.value)} /></label>
          {isModel && 'provider' in form ? (
            <>
              <label className="agent-field"><span>ПРОВАЙДЕР</span><input required value={form.provider} onChange={(event) => setField('provider', event.target.value)} placeholder="google, openrouter, qwen" /></label>
              <label className="agent-field"><span>НАЗВАНИЕ МОДЕЛИ</span><input required value={form.model_name} onChange={(event) => setField('model_name', event.target.value)} placeholder="qwen/qwen3.8-27b:free" /></label>
              <label className="agent-field"><span>BASE URL</span><input value={form.base_url ?? ''} onChange={(event) => setField('base_url', event.target.value)} placeholder="https://openrouter.ai/api/v1" /></label>
              <label className="agent-field"><span>API KEY <i>СЕКРЕТ</i></span><input type="password" autoComplete="new-password" value={form.api_key ?? ''} onChange={(event) => setField('api_key', event.target.value)} placeholder={mode === 'edit' ? 'Оставьте пустым, чтобы не менять ключ' : 'Необязательно'} /></label>
            </>
          ) : 'type' in form ? (
            <>
              <label className="agent-field"><span>ТИП</span><input required value={form.type} onChange={(event) => setField('type', event.target.value)} /></label>
              <label className="agent-field"><span>ENDPOINT</span><input value={form.endpoint ?? ''} onChange={(event) => setField('endpoint', event.target.value)} /></label>
            </>
          ) : null}
          <label className="agent-field status-field"><span>СТАТУС</span><select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="active">Активен</option><option value="inactive">Отключён</option></select></label>
          {(localError || error) && <p className="form-error" role="alert">{localError || error}</p>}
          <div className="agent-form-actions">
            <Link className="cancel-link" to={`/resources/${kind}`}>Отмена</Link>
            <button className="primary-link" disabled={isSaving} type="submit">{isSaving ? 'Сохраняем...' : 'Сохранить'} <span>↗</span></button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
}
