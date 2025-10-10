import { AuditLog as AuditLogType } from '../types';
import { Clock, UserPlus, UserMinus, FileEdit } from 'lucide-react';
import './AuditLog.css';

interface AuditLogProps {
  auditLogs: AuditLogType[];
  loading: boolean;
}

const getActionText = (log: AuditLogType): string => {
  switch (log.action) {
    case 'jugador_added':
      return `agregó al jugador ${log.details.name} (${log.details.dni})`;
    case 'jugador_deleted':
      return `eliminó al jugador ${log.details.name} (${log.details.dni})`;
    case 'persona_added':
      return `agregó a ${log.details.charge} ${log.details.name} (${log.details.dni})`;
    case 'persona_deleted':
      return `eliminó a ${log.details.charge} ${log.details.name} (${log.details.dni})`;
    case 'status_changed':
      return `cambió el estado de "${log.details.old_status}" a "${log.details.new_status}"`;
    default:
      return 'realizó una acción';
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'jugador_added':
    case 'persona_added':
      return <UserPlus size={18} className="audit-icon audit-icon-add" />;
    case 'jugador_deleted':
    case 'persona_deleted':
      return <UserMinus size={18} className="audit-icon audit-icon-delete" />;
    case 'status_changed':
      return <FileEdit size={18} className="audit-icon audit-icon-edit" />;
    default:
      return <Clock size={18} className="audit-icon" />;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const AuditLog = ({ auditLogs, loading }: AuditLogProps) => {
  if (loading) {
    return (
      <div className="audit-log-section">
        <h3 className="audit-log-title">Historial de Acciones</h3>
        <div className="audit-log-loading">Cargando historial...</div>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="audit-log-section">
        <h3 className="audit-log-title">Historial de Acciones</h3>
        <div className="audit-log-empty">No hay acciones registradas aún</div>
      </div>
    );
  }

  return (
    <div className="audit-log-section">
      <h3 className="audit-log-title">Historial de Acciones</h3>
      <div className="audit-log-list">
        {auditLogs.map((log) => (
          <div key={log.id} className="audit-log-item">
            <div className="audit-log-content">
              <div className="audit-log-icon-wrapper">
                {getActionIcon(log.action)}
              </div>
              <div className="audit-log-details">
                <div className="audit-log-text">
                  <span className="audit-log-user">
                    {log.username || 'Usuario desconocido'}
                  </span>{' '}
                  {getActionText(log)}
                </div>
                <div className="audit-log-time">
                  <Clock size={14} />
                  {formatDate(log.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
