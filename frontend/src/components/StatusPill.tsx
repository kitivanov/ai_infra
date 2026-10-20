type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const normalizedStatus = status.toLowerCase();
  const isActive = normalizedStatus === 'active';
  const label = isActive ? 'Активен' : normalizedStatus === 'inactive' ? 'Отключён' : 'Другой статус';

  return (
    <span className={`status-pill ${isActive ? 'is-active' : ''}`}>
      <i />
      {label}
    </span>
  );
}
