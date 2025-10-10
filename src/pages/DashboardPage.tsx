import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { usePlanillas } from '../hooks/usePlanillas';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from '../components/base/Table';
import { StatusBadge } from '../components/base/StatusBadge';
import { Button } from '../components/base/Button';
import { FormInput } from '../components/base/FormInput';
import { PlanillaStatus, Category } from '../types';
import { Filter } from 'lucide-react';
import './DashboardPage.css';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { planillas, loading } = usePlanillas();
  const [statusFilter, setStatusFilter] = useState<PlanillaStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');


  const categories = Object.values(Category).filter((value) => typeof value === "number") as number[];



  const filteredPlanillas = useMemo(() => {
    return planillas.filter((planilla) => {
      const matchesStatus = statusFilter === 'all' || planilla.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || planilla.team?.category === Number(categoryFilter);
      const matchesSearch =
        searchTerm === '' ||
        planilla.team?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [planillas, statusFilter, categoryFilter, searchTerm]);

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
          {/* {profile?.is_admin && (
            <Button onClick={() => navigate('/admin/planillas/nueva')}>
              <Plus size={20} />
              Nueva Planilla
            </Button>
          )} */}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as number | 'all')}
            >
              <option value="all">Todos las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
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
                <TableHeadCell>Categoría</TableHeadCell>
                <TableHeadCell>Estado</TableHeadCell>
                <TableHeadCell>Fecha de creación</TableHeadCell>
                <TableHeadCell>Acciones</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanillas.map((planilla) => (
                <TableRow key={planilla.id}>
                  <TableCell>{planilla.team?.nombre}</TableCell>
                  <TableCell>{planilla.team?.category}</TableCell>
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
