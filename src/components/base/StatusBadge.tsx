import { PlanillaStatus } from '../../types';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: PlanillaStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Pendiente de envío':
        return 'status-pending';
      case 'Pendiente de aprobación':
        return 'status-approval';
      case 'Aprobada':
        return 'status-approved';
      case 'Eliminada':
        return 'status-deleted';
      default:
        return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
};
