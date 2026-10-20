import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { ResourceCard } from '../../components/ResourceCard';
import { useAuthStore } from '../../stores/authStore';
import { useResourceStore, type ResourceKind } from '../../stores/resourceStore';

export const resourceTitles: Record<ResourceKind, string> = { models: 'Модели', rags: 'RAG', mcps: 'MCP' };
export const resourceSingular: Record<ResourceKind, string> = { models: 'Модель', rags: 'RAG-источник', mcps: 'MCP-сервер' };

export function useResourceKind(): ResourceKind {
  const { kind } = useParams();
  return kind === 'rags' || kind === 'mcps' || kind === 'models' ? kind : 'models';
}

export function ResourcesPage() {
  const kind = useResourceKind();
  const items = useResourceStore((state) => kind === 'models' ? state.models : kind === 'rags' ? state.rags : state.mcps);
  const fetchAll = useResourceStore((state) => state.fetchAll);
  const isLoading = useResourceStore((state) => state.isLoading);
  const error = useResourceStore((state) => state.error);
  const deleteResource = useResourceStore((state) => state.deleteResource);
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => { void fetchAll().catch(() => undefined); }, [fetchAll]);

  async function remove(id: number, name: string) {
    if (!window.confirm(`Удалить «${name}»?`)) return;
    try { await deleteResource(kind, id); } catch { /* The store displays the error. */ }
  }

  return (
    <AppLayout activeSection={kind} footerRight="РЕСУРСЫ ПЛАТФОРМЫ">
      <section className="agents-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">КОНФИГУРАЦИЯ ПЛАТФОРМЫ</span>
            <h1>{resourceTitles[kind]}<span className="heading-count">{items.length}</span></h1>
            <p>Ресурсы конфигурации, доступные для подключения к агентам.</p>
          </div>
          <Link className="primary-link" to={`/resources/${kind}/new`}>＋ Добавить</Link>
        </div>
        {error && <div className="api-alert" role="alert">{error}</div>}
        {isLoading && !items.length ? (
          <div className="agents-state"><span className="loading-mark" />Загрузка...</div>
        ) : !items.length ? (
          <div className="empty-state">
            <div className="empty-symbol">＋</div>
            <h2>Пока нет ресурсов</h2>
            <p>Создайте первую конфигурацию, чтобы подключать её к агентам.</p>
            <Link className="primary-link" to={`/resources/${kind}/new`}>Создать {resourceSingular[kind]}</Link>
          </div>
        ) : (
          <div className="agent-grid">
            {items.map((item) => (
              <ResourceCard
                key={item.id}
                kind={kind}
                item={item}
                canManage={item.owner.id === userId}
                onDelete={(resource) => void remove(resource.id, resource.name)}
              />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
