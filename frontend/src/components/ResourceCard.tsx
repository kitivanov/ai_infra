import { Link, useNavigate } from 'react-router-dom';
import type { ResourceKind } from '../stores/resourceStore';
import { getResourceDescription, getResourceDetailsPath, type Resource } from '../utils/resources';
import { StatusPill } from './StatusPill';

type ResourceCardProps = {
  kind: ResourceKind;
  item: Resource;
  canManage: boolean;
  onDelete: (item: Resource) => void;
};

export function ResourceCard({ kind, item, canManage, onDelete }: ResourceCardProps) {
  const navigate = useNavigate();
  const detailPath = getResourceDetailsPath(kind, item.id);

  return (
    <article className="agent-card">
      <div className="agent-card-top">
        <span className="agent-number">{kind === 'models' ? 'МОДЕЛЬ' : kind === 'rags' ? 'RAG-ИСТОЧНИК' : 'MCP-СЕРВЕР'}</span>
        <StatusPill status={item.status} />
      </div>
      <Link className="agent-card-main" to={detailPath}>
        <h2>{item.name}</h2>
        <p>{getResourceDescription(kind, item)}</p>
      </Link>
      <div className="agent-card-bottom">
        <span>ВЛАДЕЛЕЦ {item.owner.username}</span>
        <div className="agent-actions">
          <button type="button" onClick={() => navigate(detailPath)}>Открыть</button>
          {canManage && <>
            <button type="button" onClick={() => navigate(`/resources/${kind}/${item.id}/edit`)}>Изменить</button>
            <button className="delete-action" type="button" onClick={() => onDelete(item)}>Удалить</button>
          </>}
        </div>
      </div>
    </article>
  );
}
