import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { StatusPill } from '../../components/StatusPill';
import { useAuthStore } from '../../stores/authStore';
import { useResourceStore } from '../../stores/resourceStore';
import { isModelResource } from '../../utils/resources';
import { resourceSingular, resourceTitles, useResourceKind } from './ResourcesPage';

export function ResourceDetailPage() {
  const kind = useResourceKind();
  const { id } = useParams();
  const resourceId = Number(id);
  const items = useResourceStore((state) => kind === 'models' ? state.models : kind === 'rags' ? state.rags : state.mcps);
  const fetchAll = useResourceStore((state) => state.fetchAll);
  const deleteResource = useResourceStore((state) => state.deleteResource);
  const error = useResourceStore((state) => state.error);
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const item = items.find((entry) => entry.id === resourceId);

  useEffect(() => { if (!item) void fetchAll().catch(() => undefined); }, [fetchAll, item]);

  async function remove() {
    if (!item || !window.confirm(`Удалить «${item.name}»?`)) return;
    try {
      await deleteResource(kind, item.id);
      navigate(`/resources/${kind}`, { replace: true });
    } catch { /* The store displays the error. */ }
  }

  return (
    <AppLayout activeSection={kind} footerRight={resourceTitles[kind]}>
      <section className="detail-content">
        <Link className="back-link" to={`/resources/${kind}`}>← Все ресурсы</Link>
        {!item ? (
          <div className="agents-state">{error || 'Загружаем ресурс...'}</div>
        ) : (
          <>
            <div className="detail-heading">
              <div>
                <span className="eyebrow">{resourceSingular[kind].toUpperCase()} · {item.id}</span>
                <h1>{item.name}</h1>
                <p>{item.description || 'Описание не добавлено.'}</p>
              </div>
              <StatusPill status={item.status} />
            </div>
            <div className="resource-attributes">
              {isModelResource(kind, item) ? (
                <>
                  <p><b>Провайдер</b>{item.provider}</p>
                  <p><b>Название модели</b>{item.model_name}</p>
                  <p><b>Base URL</b>{item.base_url || 'Не указан'}</p>
                  <p><b>API-ключ</b>Секрет скрыт</p>
                </>
              ) : (
                <>
                  <p><b>Тип</b>{item.type}</p>
                  <p><b>Endpoint</b>{item.endpoint || 'Не указан'}</p>
                </>
              )}
              <p><b>Владелец</b>{item.owner.username}</p>
            </div>
            {item.owner.id === userId && (
              <div className="detail-actions">
                <Link className="primary-link" to={`/resources/${kind}/${item.id}/edit`}>Изменить</Link>
                <button className="danger-button" type="button" onClick={() => void remove()}>Удалить ресурс</button>
              </div>
            )}
          </>
        )}
      </section>
    </AppLayout>
  );
}
