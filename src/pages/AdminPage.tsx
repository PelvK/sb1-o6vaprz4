import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { usePlanillas } from "../hooks/usePlanillas";
import { useTeams } from "../hooks/useTeams";
import { useProfiles } from "../hooks/useProfiles";
import { Button } from "../components/base/Button";
import { FormInput } from "../components/base/FormInput";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from "../components/base/Table";
import { StatusBadge } from "../components/base/StatusBadge";
import { supabase } from "../libs/supabase";
import { Category, PlanillaStatus } from "../types";
import { Plus, CreditCard as Edit2, CheckCircle, XCircle } from "lucide-react";
import "./AdminPage.css";
import { PdfDownloader } from "../components/PdfDownloader";

export const AdminPage = () => {
  const navigate = useNavigate();
  const { planillas, refetch: refetchPlanillas } = usePlanillas();
  const [pdfPlanillaId, setPdfPlanillaId] = useState<string | null>(null);
  const { teams, refetch: refetchTeams } = useTeams();
  const { profiles } = useProfiles();
  const [showNewPlanillaForm, setShowNewPlanillaForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [newPlanilla, setNewPlanilla] = useState({
    team_id: "",
    user_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<Category | "">("");
  const [planillaTeamSearch, setPlanillaTeamSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const categoryOptions = Object.values(Category).filter(
    (value) => typeof value === "number"
  ) as number[];

  const handleCreateTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    if (!categoryFilter) {
      alert("Por favor selecciona una categoría");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("teams").insert({
        nombre: newTeamName,
        category: Number(categoryFilter),
      });
      if (error) throw error;

      setNewTeamName("");
      setCategoryFilter("");
      setShowNewTeamForm(false);
      await refetchTeams();
      alert("Equipo creado exitosamente");
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Error al crear equipo");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlanilla = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlanilla.team_id || !newPlanilla.user_id) {
      alert("Por favor selecciona un equipo y un usuario");
      return;
    }

    try {
      setSaving(true);
      const { data: planillaData, error: planillaError } = await supabase
        .from("planillas")
        .insert({
          team_id: newPlanilla.team_id,
          status: "Pendiente de envío",
        })
        .select()
        .single();

      if (planillaError) throw planillaError;

      const { error: assignmentError } = await supabase
        .from("user_planillas")
        .insert({
          user_id: newPlanilla.user_id,
          planilla_id: planillaData.id,
        });

      if (assignmentError) throw assignmentError;

      setNewPlanilla({ team_id: "", user_id: "" });
      setShowNewPlanillaForm(false);
      await refetchPlanillas();
      alert("Planilla creada y asignada exitosamente");
    } catch (error) {
      console.error("Error creating planilla:", error);
      alert("Error al crear planilla");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (
    planillaId: string,
    newStatus: PlanillaStatus
  ) => {
    if (!confirm(`¿Deseas cambiar el estado de la planilla a "${newStatus}"?`))
      return;

    try {
      const { error } = await supabase
        .from("planillas")
        .update({ status: newStatus })
        .eq("id", planillaId);

      if (error) throw error;
      await refetchPlanillas();
      alert("Estado actualizado exitosamente");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar estado");
    }
  };

  return (
    <Layout>
      <div className="admin-page">
        <div className="admin-header">
          <h2 className="admin-title">Panel de Administración</h2>
          <p className="admin-subtitle">
            Gestiona equipos, planillas y usuarios
          </p>
        </div>

        <div className="admin-section">
          <div className="section-header">
            <h3 className="section-title">Equipos ({teams.length})</h3>
            <Button
              size="sm"
              onClick={() => setShowNewTeamForm(!showNewTeamForm)}
            >
              <Plus size={18} />
              Nuevo Equipo
            </Button>
          </div>

          {showNewTeamForm && (
            <form onSubmit={handleCreateTeam} className="admin-form">
              <FormInput
                placeholder="Nombre del equipo"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
              <select
                className="filter-select"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value === ""
                      ? ""
                      : (Number(e.target.value) as Category)
                  )
                }
                required
              >
                <option value="">Selecciona una categoría</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="form-actions">
                <Button type="submit" size="sm" disabled={saving}>
                  Crear Equipo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewTeamForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="team-filters">
            <FormInput
              type="text"
              placeholder="Buscar equipo..."
              value={teamSearchTerm}
              onChange={(e) => setTeamSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={teamCategoryFilter}
              onChange={(e) =>
                setTeamCategoryFilter(
                  e.target.value === "" ? "" : (Number(e.target.value) as Category)
                )
              }
            >
              <option value="">Todas las categorías</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Nombre del Equipo</TableHeadCell>
                <TableHeadCell>Categoría</TableHeadCell>
                <TableHeadCell>Fecha de Creación</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams
                .filter((team) => {
                  const matchesSearch = team.nombre
                    .toLowerCase()
                    .includes(teamSearchTerm.toLowerCase());
                  const matchesCategory =
                    teamCategoryFilter === "" ||
                    team.category === Number(teamCategoryFilter);
                  return matchesSearch && matchesCategory;
                })
                .map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.nombre}</TableCell>
                    <TableCell>Categoría {team.category}</TableCell>
                    <TableCell>
                      {new Date(team.created_at).toLocaleDateString("es-ES")}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="admin-section">
          <div className="section-header">
            <h3 className="section-title">Planillas ({planillas.length})</h3>
            <Button
              size="sm"
              onClick={() => setShowNewPlanillaForm(!showNewPlanillaForm)}
            >
              <Plus size={18} />
              Nueva Planilla
            </Button>
          </div>

          {showNewPlanillaForm && (
            <div className="admin-form-container">
              <form onSubmit={handleCreatePlanilla} className="admin-form">
                <select
                  className="filter-select"
                  value={newPlanilla.user_id}
                  onChange={(e) =>
                    setNewPlanilla({ ...newPlanilla, user_id: e.target.value })
                  }
                  required
                >
                  <option value="">Asignar a usuario</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username}
                    </option>
                  ))}
                </select>

                <div className="form-actions">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving || !selectedTeamId || !newPlanilla.user_id}
                  >
                    Crear Planilla
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewPlanillaForm(false);
                      setSelectedTeamId(null);
                      setPlanillaTeamSearch("");
                      setNewPlanilla({ team_id: "", user_id: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>

              <div className="team-selector">
                <h4 className="team-selector-title">Selecciona un equipo:</h4>
                <FormInput
                  type="text"
                  placeholder="Buscar equipo..."
                  value={planillaTeamSearch}
                  onChange={(e) => setPlanillaTeamSearch(e.target.value)}
                />
                <div className="teams-list-small">
                  {teams
                    .filter((team) =>
                      team.nombre.toLowerCase().includes(planillaTeamSearch.toLowerCase())
                    )
                    .map((team) => (
                      <div
                        key={team.id}
                        className={`team-list-item-selectable ${
                          selectedTeamId === team.id ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setNewPlanilla({ ...newPlanilla, team_id: team.id });
                        }}
                      >
                        <span className="team-list-name">{team.nombre}</span>
                        <span className="team-list-category">
                          Categoría {team.category}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Equipo</TableHeadCell>
                <TableHeadCell>Categoria</TableHeadCell>
                <TableHeadCell>Estado</TableHeadCell>
                <TableHeadCell>Fecha</TableHeadCell>
                <TableHeadCell>Acciones</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planillas.map((planilla) => (
                <TableRow key={planilla.id}>
                  <TableCell>
                    {planilla.team?.nombre}
                  </TableCell>
                  <TableCell>
                    {planilla.team?.category}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={planilla.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(planilla.created_at).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell>
                    <div className="action-buttons">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/planillas/${planilla.id}`)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      {planilla.status === "Pendiente de aprobación" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleChangeStatus(planilla.id, "Aprobada")
                            }
                          >
                            <CheckCircle size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleChangeStatus(
                                planilla.id,
                                "Pendiente de envío"
                              )
                            }
                          >
                            <XCircle size={16} />
                          </Button>
                        </>
                      )}
                      {planilla.status === "Aprobada" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleChangeStatus(
                                planilla.id,
                                "Pendiente de envío"
                              )
                            }
                          >
                            <XCircle size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                             onClick={() => setPdfPlanillaId(planilla.id)}
                            title="Descargar como PDF"
                          >
                            📄 PDF
                          </Button>
                        </>
                      )}
                      {pdfPlanillaId && (
                        <PdfDownloader
                          planillaId={pdfPlanillaId}
                          onClose={() => setPdfPlanillaId(null)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};
