import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { usePlanillas } from '../hooks/usePlanillas';
import { useTeams } from '../hooks/useTeams';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from '../components/base/Table';
import { StatusBadge } from '../components/base/StatusBadge';
import { Button } from '../components/base/Button';
import { FormInput } from '../components/base/FormInput';
import { PlanillaStatus } from '../types';
import { Plus, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './DashboardPage.css';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { planillas, loading } = usePlanillas();
  const { teams } = useTeams();
  const [statusFilter, setStatusFilter] = useState<PlanillaStatus | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlanillas = useMemo(() => {
    return planillas.filter((planilla) => {
      const matchesStatus = statusFilter === 'all' || planilla.status === statusFilter;
      const matchesTeam = teamFilter === 'all' || planilla.team_id === teamFilter;
      const matchesSearch =
        searchTerm === '' ||
        planilla.team?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesTeam && matchesSearch;
    });
  }, [planillas, statusFilter, teamFilter, searchTerm]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">Cargando planillas...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">Planillas</h2>
            <p className="dashboard-subtitle">
              Gestiona las planillas de buena fe de los equipos
            </p>
          </div>
          {profile?.is_admin && (
            <Button onClick={() => navigate('/admin/planillas/nueva')}>
              <Plus size={20} />
              Nueva Planilla
            </Button>
          )}
        </div>

        <div className="dashboard-filters">
          <div className="filters-header">
            <Filter size={20} />
            <span>Filtros</span>
          </div>
          <div className="filters-grid">
            <FormInput
              type="text"
              placeholder="Buscar por equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PlanillaStatus | 'all')}
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente de envío">Pendiente de envío</option>
              <option value="Pendiente de aprobación">Pendiente de aprobación</option>
              <option value="Aprobada">Aprobada</option>
            </select>

            <select
              className="filter-select"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="all">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPlanillas.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron planillas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Equipo</TableHeadCell>
                <TableHeadCell>Estado</TableHeadCell>
                <TableHeadCell>Fecha de creación</TableHeadCell>
                <TableHeadCell>Acciones</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanillas.map((planilla) => (
                <TableRow key={planilla.id}>
                  <TableCell>{planilla.team?.nombre || 'N/A'}</TableCell>
                  <TableCell>
                    <StatusBadge status={planilla.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(planilla.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/planillas/${planilla.id}`)}
                    >
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Layout>
  );
};
