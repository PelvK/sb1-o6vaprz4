import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { updatePlanilla, usePlanilla, usePlanillas } from '../hooks/usePlanillas';
import { useAuth } from '../hooks/useAuth';
import { useAuditLog } from '../hooks/useAuditLog';
import { StatusBadge } from '../components/base/StatusBadge';
import { Button } from '../components/base/Button';
import { FormInput } from '../components/base/FormInput';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from '../components/base/Table';
import { AuditLog } from '../components/AuditLog.tsx';
import { categoryLimits, Jugador, Persona, PersonaCharge, PlanillaStatus } from '../types';
import { ArrowLeft, Plus, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import './PlanillaDetailPage.css';
import { createJugador, deleteJugador } from '../hooks/useJugadores.ts';
import { createPersona, deletePersona } from '../hooks/usePersonas.ts';

export const PlanillaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { refetch: refetchPlanillas } = usePlanillas();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planilla, loading, refetch } = usePlanilla(id!);
  const { auditLogs, loading: auditLoading, refetch: refetchAudit } = useAuditLog(id!);
  const [saving, setSaving] = useState(false);

  const [newJugador, setNewJugador] = useState<Partial<Jugador>>({
    dni: '',
    number: 0,
    name: '',
    second_name: '',
  });

  const [newPersona, setNewPersona] = useState<Partial<Persona>>({
    dni: '',
    name: '',
    second_name: '',
    phone_number: '',
    charge: 'Técnico',
  });

  const canEdit = planilla?.status === 'Pendiente de envío' || user?.is_admin;

  const limit = categoryLimits.find(item => item.year == planilla?.team?.category)?.limit;

  if(planilla) {
    planilla.jugadores.sort((a, b) => a.number - b.number);
  }


  const handleBack = () => {
    navigate(-1);
  };

  /** Migrated! */
  const handleAddJugador = async () => {
    if (!planilla || !newJugador.dni || !newJugador.name || !newJugador.second_name) {
      alert('Por favor completa todos los campos del jugador');
      return;
    }

    try {
      const response = await createJugador({
        planilla_id: planilla.id,
        dni: newJugador.dni,
        number: newJugador.number || 0,
        name: newJugador.name,
        second_name: newJugador.second_name,
      });

      if (!response) {
        throw new Error(response || "Error al crear equipo");
      }

      setNewJugador({ dni: '', number: 0, name: '', second_name: '' });
      await refetch();
      await refetchAudit();
    } catch (error) {
      console.error('Error adding jugador:', error);
      alert('Error al agregar jugador');
    }
  };

  /** Migrated! */
  const handleDeleteJugador = async (jugadorId: string) => {
    if (!confirm('¿Estás seguro de eliminar este jugador?')) return;

    try {
      const response = await deleteJugador(jugadorId);
      if (!response) throw response;
      await refetch();
      await refetchAudit();
    } catch (error) {
      console.error('Error deleting jugador:', error);
      alert('Error al eliminar jugador');
    }
  };

  /** Migrated! */
  const handleAddPersona = async () => {
  if (!planilla || !newPersona.dni || !newPersona.name || !newPersona.second_name || !newPersona.phone_number || !newPersona.charge) {
    alert('Por favor completa todos los campos');
    return;
  }

  if(newPersona.charge === 'Técnico' && planilla.personas.filter(p => p.charge === 'Técnico').length >= 1) {
    alert('Solo se permite un técnico por planilla');
    return;
  }
  if(newPersona.charge === 'Delegado' && planilla.personas.filter(p => p.charge === 'Delegado').length >= 1) {
    alert('Solo se permite un delegado por planilla');
    return;
  }
  if(newPersona.charge === 'Médico' && planilla.personas.filter(p => p.charge === 'Médico').length >= 1) {
    alert('Solo se permite un médico por planilla');
    return;
  }

  try {
    const response = await createPersona({
      planilla_id: planilla.id,
      dni: newPersona.dni,
      name: newPersona.name,
      second_name: newPersona.second_name,
      phone_number: newPersona.phone_number,
      charge: newPersona.charge,
    });

    if (!response || !response.message) {
      throw new Error(response?.message || "Error al crear persona");
    }

    setNewPersona({ dni: '', name: '', second_name: '', phone_number: '', charge: 'Técnico' });
    await refetch();
    await refetchAudit();
  } catch (error) {
    console.error('Error adding persona:', error);
    alert('Error al agregar persona');
  }
};

/** Migrated! */
const handleDeletePersona = async (personaId: string) => {
  if (!confirm('¿Estás seguro de eliminar esta persona?')) return;

  try {
    await deletePersona(personaId);
    await refetch();
    await refetchAudit();
  } catch (error) {
    console.error('Error deleting persona:', error);
    alert('Error al eliminar persona');
  }
};

/** Migrated! */
const handleChangeStatus = async (
    planillaId: string,
    newStatus: PlanillaStatus
  ) => {
    if (!confirm(`¿Deseas cambiar el estado de la planilla a "${newStatus}"?`))
      return;

    try {
      setSaving(true);
      const response = await updatePlanilla(planillaId, { status: newStatus });
      alert(response.message || "Estado actualizado exitosamente");
      await refetchPlanillas();
      await refetch();
      await refetchAudit();
    } catch (error) {
      console.error("Error updating planilla status:", error);
      alert("Error al actualizar el estado de la planilla");
    } finally {
      setSaving(false);
    }
  };


  /** Migrated! */
  const handleSubmitForApproval = async () => {
  if (!planilla) return;
  if (!confirm('¿Deseas enviar la planilla para aprobación? No podrás editarla después.')) return;
  if(planilla.jugadores.length === 0) {
    alert('La planilla debe tener al menos un jugador para ser enviada.');
    return;
  }
  if(planilla.personas.filter(p => p.charge === 'Técnico').length === 0) {
    alert('La planilla debe tener al menos un técnico para ser enviada.');
    return;
  }
  if(planilla.personas.filter(p => p.charge === 'Delegado').length === 0) {
    alert('La planilla debe tener al menos un delegado para ser enviada.');
    return;
  }

  try {
    setSaving(true);
    const { message } = await updatePlanilla(planilla.id, { status: 'Pendiente de aprobación' });
    if (!message) throw new Error('No se pudo enviar la planilla');
    await refetch();
    await refetchAudit();
    alert('Planilla enviada para aprobación');
  } catch (error) {
    console.error('Error submitting planilla:', error);
    alert('Error al enviar planilla');
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">Cargando planilla...</div>
      </Layout>
    );
  }

  if (!planilla) {
    return (
      <Layout>
        <div className="error-container">Planilla no encontrada</div>
      </Layout>
    );
  }

  const tecnicos = planilla.personas.filter((p) => p.charge === 'Técnico');
  const delegados = planilla.personas.filter((p) => p.charge === 'Delegado');
  const medicos = planilla.personas.filter((p) => p.charge === 'Médico');

  return (
    <Layout>
      <div className="planilla-detail-page">
        <div className="page-header">
          <Button variant="ghost" onClick={() => handleBack()}>
            <ArrowLeft size={20} />
            Volver
          </Button>
        </div>

        <div className="planilla-header">
          <div>
            <h2 className="planilla-title">{planilla.team?.nombre} - Categoría {planilla.team?.category}</h2>
            <StatusBadge status={planilla.status} />
          </div>
          <div className="planilla-actions">
            {canEdit && planilla.status === 'Pendiente de envío' && (
              <Button onClick={handleSubmitForApproval} disabled={saving}>
                <Send size={18} />
                Enviar para aprobación
              </Button>
            )}
            {canEdit && planilla.status === 'Pendiente de aprobación' && (
              <>
                <Button onClick={() => handleChangeStatus(planilla.id, "Aprobada")} disabled={saving}>
                  <CheckCircle size={18} />
                  Aprobar planilla
                </Button>
                <Button onClick={() => handleChangeStatus(planilla.id, "Pendiente de envío")} disabled={saving}>
                  <XCircle size={18} />
                  Rechazar planilla
                </Button>
              </>
            )}
            {canEdit && planilla.status === 'Aprobada' && (
              <>
                <Button onClick={() => handleChangeStatus(planilla.id, "Pendiente de envío")} disabled={saving}>
                  <XCircle size={18} />
                  Restaurar a pendiente de envío
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-header-detail">
            <h3 className="section-title">Jugadores: {planilla.jugadores.length} de {limit} (máximo por categoría)</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Dorsal</TableHeadCell>
                <TableHeadCell>DNI</TableHeadCell>
                <TableHeadCell>Nombre</TableHeadCell>
                <TableHeadCell>Apellido</TableHeadCell>
                {canEdit && <TableHeadCell>Acciones</TableHeadCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {planilla.jugadores.map((jugador) => (
                <TableRow key={jugador.id}>
                  <TableCell>{jugador.number}</TableCell>
                  <TableCell>{jugador.dni}</TableCell>
                  <TableCell>{jugador.name}</TableCell>
                  <TableCell>{jugador.second_name}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteJugador(jugador.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {canEdit && (
            <div className="add-form">
              <h4 className="add-form-title">Agregar Jugador</h4>
              <div className="add-form-grid">
                <FormInput
                  type="number"
                  placeholder="Dorsal"
                  value={newJugador.number || ''}
                  onChange={(e) => setNewJugador({ ...newJugador, number: parseInt(e.target.value) || 0 })}
                />
                <FormInput
                  type='number'
                  placeholder="DNI"
                  value={newJugador.dni}
                  onChange={(e) => setNewJugador({ ...newJugador, dni: e.target.value })}
                />
                <FormInput
                  type='text'
                  placeholder="Nombre"
                  value={newJugador.name}
                  onChange={(e) => setNewJugador({ ...newJugador, name: e.target.value })}
                />
                <FormInput
                  type='text'
                  placeholder="Apellido"
                  value={newJugador.second_name}
                  onChange={(e) => setNewJugador({ ...newJugador, second_name: e.target.value })}
                />
              </div>
              <Button onClick={handleAddJugador} size="sm" disabled={planilla.jugadores.length >= (limit || Infinity)}>
                <Plus size={18} />
                Agregar Jugador
              </Button>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Técnicos: {tecnicos.length} de 1 (máximo permitido)</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>DNI</TableHeadCell>
                <TableHeadCell>Nombre</TableHeadCell>
                <TableHeadCell>Apellido</TableHeadCell>
                <TableHeadCell>Teléfono</TableHeadCell>
                {canEdit && <TableHeadCell>Acciones</TableHeadCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tecnicos.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>{persona.dni}</TableCell>
                  <TableCell>{persona.name}</TableCell>
                  <TableCell>{persona.second_name}</TableCell>
                  <TableCell>{persona.phone_number}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeletePersona(persona.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Delegados: {delegados.length} de 1 (máximo permitido)</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>DNI</TableHeadCell>
                <TableHeadCell>Nombre</TableHeadCell>
                <TableHeadCell>Apellido</TableHeadCell>
                <TableHeadCell>Teléfono</TableHeadCell>
                {canEdit && <TableHeadCell>Acciones</TableHeadCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {delegados.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>{persona.dni}</TableCell>
                  <TableCell>{persona.name}</TableCell>
                  <TableCell>{persona.second_name}</TableCell>
                  <TableCell>{persona.phone_number}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeletePersona(persona.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          <div className="section">
          <div className="section-header">
            <h3 className="section-title">Medicos: {medicos.length} de 1 (máximo permitido)</h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>DNI</TableHeadCell>
                <TableHeadCell>Nombre</TableHeadCell>
                <TableHeadCell>Apellido</TableHeadCell>
                <TableHeadCell>Teléfono</TableHeadCell>
                {canEdit && <TableHeadCell>Acciones</TableHeadCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicos.map((medico) => (
                <TableRow key={medico.id}>
                  <TableCell>{medico.dni}</TableCell>
                  <TableCell>{medico.name}</TableCell>
                  <TableCell>{medico.second_name}</TableCell>
                  <TableCell>{medico.phone_number}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeletePersona(medico.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

          {canEdit && (
            <div className="add-form">
              <h4 className="add-form-title">Agregar Técnico, Médico o Delegado</h4>
              <div className="add-form-grid">
                <FormInput
                  type="number"
                  placeholder="DNI"
                  value={newPersona.dni}
                  onChange={(e) => setNewPersona({ ...newPersona, dni: e.target.value })}
                />
                <FormInput
                  type="text"
                  placeholder="Nombre"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                />
                <FormInput
                  type="text"
                  placeholder="Apellido"
                  value={newPersona.second_name}
                  onChange={(e) => setNewPersona({ ...newPersona, second_name: e.target.value })}
                />
                <FormInput
                  type="number"
                  placeholder="Teléfono"
                  value={newPersona.phone_number}
                  onChange={(e) => setNewPersona({ ...newPersona, phone_number: e.target.value })}
                />
                <select
                  className="filter-select"
                  value={newPersona.charge}
                  onChange={(e) => setNewPersona({ ...newPersona, charge: e.target.value as PersonaCharge })}
                >
                  <option value="Técnico">Técnico</option>
                  <option value="Delegado">Delegado</option>
                  <option value="Médico">Médico</option>
                </select>
              </div>
              <Button onClick={handleAddPersona} size="sm">
                <Plus size={18} />
                Agregar
              </Button>
            </div>
          )}


        <AuditLog auditLogs={auditLogs} loading={auditLoading} />
      </div>
    </Layout>
  );
};
