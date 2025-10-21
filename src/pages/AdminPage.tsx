import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import {
  createPlanilla,
  deletePlanilla,
  updatePlanilla,
  usePlanillas,
} from "../hooks/usePlanillas";
import { useTeams } from "../hooks/useTeams";
import { useProfiles } from "../hooks/useProfiles";
import { useUsers } from "../hooks/useUsers";
import { Button } from "../components/base/Button";
import { FormInput } from "../components/base/FormInput";
import { Checkbox } from "../components/base/Checkbox";
import { PasswordInput } from "../components/base/PasswordInput";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from "../components/base/Table";
import { StatusBadge } from "../components/base/StatusBadge";
import { Category, PlanillaStatus } from "../types";
import {
  Plus,
  CreditCard as Edit2,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import "./AdminPage.css";
import { PdfDownloader } from "../components/PdfDownloader";
import { createTeam, updateTeam } from "../hooks/useTeams";
import { BulkTeamUpload } from "../components/BulkTeamUpload";
import { BulkPlanillaUpload } from "../components/BulkPlanillaUpload";

export const AdminPage = () => {
  const navigate = useNavigate();
  const { planillas, refetch: refetchPlanillas } = usePlanillas();
  const [pdfPlanillaId, setPdfPlanillaId] = useState<string | null>(null);
  const { teams, refetch: refetchTeams } = useTeams();
  const { profiles, refetch: refetchProfiles } = useProfiles();
  const {
    users,
    createUser,
    updateUser,
    deleteUser /* refetch: refetchUsers */,
  } = useUsers();
  const [showNewPlanillaForm, setShowNewPlanillaForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkPlanillaUpload, setShowBulkPlanillaUpload] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamShortName, setNewTeamShortName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [newPlanilla, setNewPlanilla] = useState({
    team_id: "",
    user_ids: [] as string[],
  });
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    is_admin: false,
  });
  const [editUser, setEditUser] = useState({
    username: "",
    email: "",
    password: "",
    is_admin: false,
  });
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<Category | "">(
    ""
  );
  const [planillaCategoryFilter, setPlanillaCategoryFilter] = useState<
    Category | ""
  >("");
  const [planillaStatusFilter, setPlanillaStatusFilter] = useState<
    PlanillaStatus | ""
  >("");
  const [planillaTeamSearch, setPlanillaTeamSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [planillaUserSearch, setPlanillaUserSearch] = useState("");
  const [planillaSearchTerm, setPlanillaSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "equipos" | "planillas" | "usuarios"
  >("planillas");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedPlanillaIds, setSelectedPlanillaIds] = useState<string[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState({
    nombre: "",
    shortname: "",
    category: "" as Category | "",
  });

  const categoryOptions = Object.values(Category).filter(
    (value) => typeof value === "number"
  ) as number[];

  const statusOptions = [
    "Pendiente de envío",
    "Pendiente de aprobación",
    "Aprobada",
    "Eliminada",
  ];

  const [onlyAdmins, setOnlyAdmins] = useState<boolean>(false);
  /** Migrated! */
  const handleCreateTeam = async (e: FormEvent) => {
    e.preventDefault();

    if (!newTeamName.trim()) return;
    if (!categoryFilter) {
      alert("Por favor selecciona una categoría");
      return;
    }

    try {
      setSaving(true);

      const response = await createTeam({
        nombre: newTeamName,
        shortname: newTeamShortName,
        category: Number(categoryFilter),
      });

      if (!response || !response.id) {
        throw new Error(response?.message || "Error al crear equipo");
      }

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

  /** Migrated! */
  const handleCreatePlanilla = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPlanilla.team_id || newPlanilla.user_ids.length === 0) {
      alert("Por favor selecciona un equipo y al menos un usuario");
      return;
    }

    try {
      setSaving(true);

      const res = await createPlanilla({
        team_id: newPlanilla.team_id,
        user_ids: newPlanilla.user_ids,
        status: "Pendiente de envío",
      });

      if (!res?.id) throw new Error(res?.message || "Error al crear planilla");

      // reset UI
      setNewPlanilla({ team_id: "", user_ids: [] });
      setSelectedTeamId(null);
      setPlanillaTeamSearch("");
      setPlanillaUserSearch("");
      setShowNewPlanillaForm(false);

      await refetchPlanillas();

      alert(`Planilla creada y asignada a ${res.assigned_count} usuario(s).`);
    } catch (error) {
      console.error("Error creating planilla:", error);
      alert("Error al crear planilla");
    } finally {
      setSaving(false);
    }
  };

  /** Migrated! */
  const handleDeletePlanilla = async (planillaId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta planilla?")) return;

    try {
      setSaving(true);
      const response = await deletePlanilla(planillaId);

      alert(response.message || "Planilla eliminada correctamente");
      await refetchPlanillas();
    } catch (error) {
      console.error("Error deleting planilla:", error);
      alert("Error al eliminar la planilla");
    } finally {
      setSaving(false);
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
    } catch (error) {
      console.error("Error updating planilla status:", error);
      alert("Error al actualizar el estado de la planilla");
    } finally {
      setSaving(false);
    }
  };

  /** Migrated! */
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !newUser.email.trim() ||
      !newUser.username.trim() ||
      !newUser.password.trim()
    ) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      setSaving(true);
      const result = await createUser(
        newUser.email,
        newUser.password,
        newUser.username,
        newUser.is_admin
      );

      if (result.success) {
        setNewUser({ email: "", username: "", password: "", is_admin: false });
        setShowNewUserForm(false);
        alert("Usuario creado exitosamente");
      } else {
        alert(result.error || "Error al crear usuario");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };
  /** Migrated! */
  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUserId(userId);
      setEditUser({
        username: user.username,
        email: user.email,
        password: "",
        is_admin: user.is_admin,
      });
    }
  };
  /** Migrated! */
  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editUser.username.trim() || !editUser.email.trim()) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      const result = await updateUser(
        editingUserId,
        editUser.username,
        editUser.is_admin,
        editUser.email,
        editUser.password || undefined
      );

      if (result.success) {
        setEditingUserId(null);
        setEditUser({ username: "", email: "", password: "", is_admin: false });
        alert("Usuario actualizado exitosamente");
      } else {
        alert(result.error || "Error al actualizar usuario");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  };
  /** @todo make this in the next migration */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
      setSaving(true);
      const result = await deleteUser(userId);

      if (result.success) {
        alert("Usuario eliminado exitosamente");
      } else {
        alert(result.error || "Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar usuario");
    } finally {
      setSaving(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    const filtered = users
      .filter((user) => {
        if (!userSearchTerm) return true;
        const searchLower = userSearchTerm.toLowerCase();
        return (
          user.email.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower)
        );
      })
      .filter((user) => !onlyAdmins || user.is_admin);

    if (selectedUserIds.length === filtered.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filtered.map((u) => u.id));
    }
  };

  const handleDownloadUsersCSV = () => {
    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
    const csvHeader = "Email,Username,Password,Is Admin,Created At\n";
    const csvRows = selectedUsers.map((user) => {
      return `"${user.email}","${user.username}","${user.password}","${user.is_admin}","${user.created_at}"`;
    });
    const csvContent = csvHeader + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePlanillaSelection = (planillaId: string) => {
    setSelectedPlanillaIds((prev) =>
      prev.includes(planillaId)
        ? prev.filter((id) => id !== planillaId)
        : [...prev, planillaId]
    );
  };

  const toggleAllPlanillas = () => {
    const filtered = planillas
      .filter((planilla) => {
        if (!planillaSearchTerm) return true;
        return planilla.team?.nombre
          .toLowerCase()
          .includes(planillaSearchTerm.toLowerCase());
      })
      .filter((planilla) => {
        return (
          planillaCategoryFilter === "" ||
          planilla.team?.category === Number(planillaCategoryFilter)
        );
      })
      .filter((planilla) => {
        return (
          planillaStatusFilter === "" ||
          planilla.status === planillaStatusFilter
        );
      });

    if (selectedPlanillaIds.length === filtered.length) {
      setSelectedPlanillaIds([]);
    } else {
      setSelectedPlanillaIds(filtered.map((p) => p.id));
    }
  };

  const handleDeleteSelectedPlanillas = async () => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar ${selectedPlanillaIds.length} planilla(s)?`
      )
    )
      return;

    try {
      setSaving(true);
      const deletePromises = selectedPlanillaIds.map((id) =>
        deletePlanilla(id)
      );
      await Promise.all(deletePromises);
      alert("Planillas eliminadas correctamente");
      setSelectedPlanillaIds([]);
      await refetchPlanillas();
    } catch (error) {
      console.error("Error deleting planillas:", error);
      alert("Error al eliminar las planillas");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      setEditingTeamId(teamId);
      setEditTeam({
        nombre: team.nombre,
        shortname: team.shortname || "",
        category: team.category,
      });
    }
  };

  const handleUpdateTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTeamId || !editTeam.nombre.trim() || !editTeam.category) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      await updateTeam(editingTeamId, {
        nombre: editTeam.nombre,
        shortname: editTeam.shortname,
        category: Number(editTeam.category) as Category,
      });
      setEditingTeamId(null);
      setEditTeam({ nombre: "", shortname: "", category: "" });
      await refetchTeams();
      alert("Equipo actualizado exitosamente");
    } catch (error) {
      console.error("Error updating team:", error);
      alert("Error al actualizar equipo");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === "equipos") {
      refetchTeams();
    } else if (activeTab === "planillas") {
      refetchPlanillas();
    } else if (activeTab === "usuarios") {
      refetchProfiles();
    }
  }, [activeTab]);

  return (
    <Layout>
      <div className="admin-page">
        <div className="admin-header">
          <h2 className="admin-title">Panel de Administración</h2>
          <p className="admin-subtitle">
            Gestiona equipos, planillas y usuarios
          </p>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === "equipos" ? "active" : ""}`}
            onClick={() => setActiveTab("equipos")}
          >
            Equipos ({teams.length})
          </button>
          <button
            className={`tab-button ${
              activeTab === "planillas" ? "active" : ""
            }`}
            onClick={() => setActiveTab("planillas")}
          >
            Planillas ({planillas.length})
          </button>
          <button
            className={`tab-button ${activeTab === "usuarios" ? "active" : ""}`}
            onClick={() => setActiveTab("usuarios")}
          >
            Usuarios ({users.length})
          </button>
        </div>

        {activeTab === "equipos" && (
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Equipos</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBulkUpload(true)}
                >
                  <Upload size={18} />
                  Carga Masiva
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowNewTeamForm(!showNewTeamForm)}
                >
                  <Plus size={18} />
                  Nuevo Equipo
                </Button>
              </div>
            </div>

            {showBulkUpload && (
              <BulkTeamUpload
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                  refetchTeams();
                  setShowBulkUpload(false);
                }}
              />
            )}

            {showNewTeamForm && (
              <form onSubmit={handleCreateTeam} className="admin-form">
                <FormInput
                  placeholder="Nombre del equipo"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />
                <FormInput
                  placeholder="Nombre corto (solo letras y números, sin espacios)"
                  value={newTeamShortName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    setNewTeamShortName(value);
                  }}
                  required
                  type="text"
                  pattern="^[a-zA-Z0-9]+$"
                  title="Solo letras y números, sin espacios"
                  maxLength={20}
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
                    e.target.value === ""
                      ? ""
                      : (Number(e.target.value) as Category)
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

            {editingTeamId && (
              <form onSubmit={handleUpdateTeam} className="admin-form">
                <FormInput
                  placeholder="Nombre del equipo"
                  value={editTeam.nombre}
                  onChange={(e) =>
                    setEditTeam({ ...editTeam, nombre: e.target.value })
                  }
                  required
                />
                <FormInput
                  placeholder="Nombre corto (solo letras y números, sin espacios)"
                  value={editTeam.shortname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    setEditTeam({ ...editTeam, shortname: value });
                  }}
                  required
                  type="text"
                  pattern="^[a-zA-Z0-9]+$"
                  title="Solo letras y números, sin espacios"
                  maxLength={20}
                />
                <select
                  className="filter-select"
                  value={editTeam.category}
                  onChange={(e) =>
                    setEditTeam({
                      ...editTeam,
                      category:
                        e.target.value === ""
                          ? ""
                          : (Number(e.target.value) as Category),
                    })
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
                    Actualizar Equipo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTeamId(null);
                      setEditTeam({ nombre: "", shortname: "", category: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadCell>Nombre del Equipo</TableHeadCell>
                  <TableHeadCell>Nombre Corto</TableHeadCell>
                  <TableHeadCell>Categoría</TableHeadCell>
                  <TableHeadCell>Fecha de Creación</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
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
                      <TableCell>{team.shortname}</TableCell>
                      <TableCell>Categoría {team.category}</TableCell>
                      <TableCell>
                        {new Date(team.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTeam(team.id)}
                          >
                            <Pencil size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "planillas" && (
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Planillas</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBulkPlanillaUpload(true)}
                >
                  <Upload size={18} />
                  Carga Masiva
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowNewPlanillaForm(!showNewPlanillaForm)}
                >
                  <Plus size={18} />
                  Nueva Planilla
                </Button>
              </div>
            </div>

            {showBulkPlanillaUpload && (
              <BulkPlanillaUpload
                onClose={() => setShowBulkPlanillaUpload(false)}
                onSuccess={() => {
                  refetchPlanillas();
                  setShowBulkPlanillaUpload(false);
                }}
                teams={teams}
                existingPlanillas={planillas}
              />
            )}

            <div className="team-filters">
              <FormInput
                type="text"
                placeholder="Buscar planilla por equipo..."
                value={planillaSearchTerm}
                onChange={(e) => setPlanillaSearchTerm(e.target.value)}
              />
              <select
                className="filter-select"
                value={planillaCategoryFilter}
                onChange={(e) =>
                  setPlanillaCategoryFilter(
                    e.target.value === ""
                      ? ""
                      : (Number(e.target.value) as Category)
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
              <select
                className="filter-select"
                value={planillaStatusFilter}
                onChange={(e) =>
                  setPlanillaStatusFilter(
                    e.target.value === ""
                      ? ""
                      : (e.target.value as PlanillaStatus)
                  )
                }
              >
                <option value="">Todos los estados</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {showNewPlanillaForm && (
              <div className="admin-form-container">
                <form onSubmit={handleCreatePlanilla} className="admin-form">
                  <div className="form-actions">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        saving ||
                        !selectedTeamId ||
                        newPlanilla.user_ids.length === 0
                      }
                    >
                      Crear Planilla ({newPlanilla.user_ids.length} usuario
                      {newPlanilla.user_ids.length !== 1 ? "s" : ""}{" "}
                      seleccionado{newPlanilla.user_ids.length !== 1 ? "s" : ""}
                      )
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewPlanillaForm(false);
                        setSelectedTeamId(null);
                        setPlanillaTeamSearch("");
                        setPlanillaUserSearch("");
                        setNewPlanilla({ team_id: "", user_ids: [] });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>

                <div className="team-selector">
                  <h4 className="team-selector-title">
                    1. Selecciona un equipo:
                  </h4>
                  <FormInput
                    type="text"
                    placeholder="Buscar equipo..."
                    value={planillaTeamSearch}
                    onChange={(e) => setPlanillaTeamSearch(e.target.value)}
                  />
                  <div className="teams-list-small">
                    {teams
                      .filter((team) =>
                        team.nombre
                          .toLowerCase()
                          .includes(planillaTeamSearch.toLowerCase())
                      )
                      .map((team) => (
                        <div
                          key={team.id}
                          className={`team-list-item-selectable ${
                            selectedTeamId === team.id ? "selected" : ""
                          }`}
                          onClick={() => {
                            setSelectedTeamId(team.id);
                            setNewPlanilla({
                              ...newPlanilla,
                              team_id: team.id,
                            });
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

                <div className="user-selector">
                  <h4 className="team-selector-title">
                    2. Selecciona usuarios:
                  </h4>
                  <FormInput
                    type="text"
                    placeholder="Buscar usuario..."
                    value={planillaUserSearch}
                    onChange={(e) => setPlanillaUserSearch(e.target.value)}
                  />
                  <div className="users-table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeadCell>Seleccionar</TableHeadCell>
                          <TableHeadCell>Nombre de Usuario</TableHeadCell>
                          <TableHeadCell>Email</TableHeadCell>
                          <TableHeadCell>Admin</TableHeadCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles
                          .filter((profile) => {
                            const user = users.find((u) => u.id === profile.id);
                            const searchLower =
                              planillaUserSearch.toLowerCase();
                            return (
                              profile.username
                                .toLowerCase()
                                .includes(searchLower) ||
                              user?.email
                                ?.toLowerCase()
                                .includes(searchLower) ||
                              false
                            );
                          })
                          .map((profile) => {
                            const user = users.find((u) => u.id === profile.id);
                            const isSelected = newPlanilla.user_ids.includes(
                              profile.id
                            );
                            return (
                              <TableRow
                                key={profile.id}
                                className={isSelected ? "selected-row" : ""}
                                onClick={() => {
                                  const userIds = isSelected
                                    ? newPlanilla.user_ids.filter(
                                        (id) => id !== profile.id
                                      )
                                    : [...newPlanilla.user_ids, profile.id];
                                  setNewPlanilla({
                                    ...newPlanilla,
                                    user_ids: userIds,
                                  });
                                }}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={(checked) => {
                                      const userIds = checked
                                        ? [...newPlanilla.user_ids, profile.id]
                                        : newPlanilla.user_ids.filter(
                                            (id) => id !== profile.id
                                          );
                                      setNewPlanilla({
                                        ...newPlanilla,
                                        user_ids: userIds,
                                      });
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{profile.username}</TableCell>
                                <TableCell>{user?.email || "N/A"}</TableCell>
                                <TableCell>
                                  {profile.is_admin ? "Sí" : "No"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {selectedPlanillaIds.length > 0 && (
              <div className="selection-action-bar">
                <span className="selection-count">
                  {selectedPlanillaIds.length} planilla(s) seleccionada(s)
                </span>
                <Button
                  size="sm"
                  onClick={handleDeleteSelectedPlanillas}
                  variant="primary"
                  disabled={saving}
                >
                  Eliminar
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadCell>
                    <Checkbox
                      checked={
                        selectedPlanillaIds.length > 0 &&
                        selectedPlanillaIds.length ===
                          planillas
                            .filter((planilla) => {
                              if (!planillaSearchTerm) return true;
                              return planilla.team?.nombre
                                .toLowerCase()
                                .includes(planillaSearchTerm.toLowerCase());
                            })
                            .filter((planilla) => {
                              return (
                                planillaCategoryFilter === "" ||
                                planilla.team?.category ===
                                  Number(planillaCategoryFilter)
                              );
                            })
                            .filter((planilla) => {
                              return (
                                planillaStatusFilter === "" ||
                                planilla.status === planillaStatusFilter
                              );
                            }).length
                      }
                      onChange={toggleAllPlanillas}
                    />
                  </TableHeadCell>
                  <TableHeadCell>Equipo</TableHeadCell>
                  <TableHeadCell>Categoria</TableHeadCell>
                  <TableHeadCell>Estado</TableHeadCell>
                  <TableHeadCell>Fecha</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planillas
                  .filter((planilla) => {
                    if (!planillaSearchTerm) return true;
                    return planilla.team?.nombre
                      .toLowerCase()
                      .includes(planillaSearchTerm.toLowerCase());
                  })
                  .filter((planilla) => {
                    return (
                      planillaCategoryFilter === "" ||
                      planilla.team?.category === Number(planillaCategoryFilter)
                    );
                  })
                  .filter((planilla) => {
                    return (
                      planillaStatusFilter === "" ||
                      planilla.status === planillaStatusFilter
                    );
                  })
                  .map((planilla) => (
                    <TableRow
                      key={planilla.id}
                      className={
                        planilla.status === "Eliminada"
                          ? "deleted-planilla-row"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedPlanillaIds.includes(planilla.id)}
                          onChange={() => togglePlanillaSelection(planilla.id)}
                        />
                      </TableCell>
                      <TableCell>{planilla.team?.nombre}</TableCell>
                      <TableCell>{planilla.team?.category}</TableCell>
                      <TableCell>
                        <StatusBadge status={planilla.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(planilla.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/planillas/${planilla.id}`)
                            }
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePlanilla(planilla.id)}
                          >
                            <Trash2 size={16} />
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
        )}

        {activeTab === "usuarios" && (
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Usuarios</h3>
              <Button
                size="sm"
                onClick={() => setShowNewUserForm(!showNewUserForm)}
              >
                <Plus size={18} />
                Nuevo Usuario
              </Button>
            </div>

            {showNewUserForm && (
              <form onSubmit={handleCreateUser} className="admin-form">
                <FormInput
                  type="email"
                  placeholder="Correo electrónico"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                />
                <FormInput
                  placeholder="Nombre de usuario"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  required
                />
                <PasswordInput
                  placeholder="Contraseña"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                />
                <Checkbox
                  label="Admin"
                  checked={newUser.is_admin}
                  onChange={(checked) =>
                    setNewUser({ ...newUser, is_admin: checked })
                  }
                />
                <div className="form-actions">
                  <Button type="submit" size="sm" disabled={saving}>
                    Crear Usuario
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewUserForm(false);
                      setNewUser({
                        email: "",
                        username: "",
                        password: "",
                        is_admin: false,
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <div className="team-filters">
              <FormInput
                type="text"
                placeholder="Buscar usuario..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
              <div className="only-admins-filter">
                <Checkbox
                  label="Solo administradores"
                  checked={onlyAdmins}
                  onChange={(checked) => setOnlyAdmins(checked)}
                />
              </div>
            </div>

            {editingUserId && (
              <form onSubmit={handleUpdateUser} className="admin-form">
                <FormInput
                  type="email"
                  placeholder="Correo electrónico"
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser({ ...editUser, email: e.target.value })
                  }
                  required
                />
                <FormInput
                  placeholder="Nombre de usuario"
                  value={editUser.username}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                  required
                />
                <PasswordInput
                  placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                  value={editUser.password}
                  onChange={(e) =>
                    setEditUser({ ...editUser, password: e.target.value })
                  }
                />
                <Checkbox
                  label="Admin"
                  checked={editUser.is_admin}
                  onChange={(checked) =>
                    setEditUser({ ...editUser, is_admin: checked })
                  }
                />
                <div className="form-actions">
                  <Button type="submit" size="sm" disabled={saving}>
                    Actualizar Usuario
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingUserId(null);
                      setEditUser({
                        username: "",
                        email: "",
                        password: "",
                        is_admin: false,
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {selectedUserIds.length > 0 && (
              <div className="selection-action-bar">
                <span className="selection-count">
                  {selectedUserIds.length} usuario(s) seleccionado(s)
                </span>
                <Button
                  size="sm"
                  onClick={handleDownloadUsersCSV}
                  variant="primary"
                >
                  Descargar datos
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeadCell>
                    <Checkbox
                      checked={
                        selectedUserIds.length > 0 &&
                        selectedUserIds.length ===
                          users
                            .filter((user) => {
                              if (!userSearchTerm) return true;
                              const searchLower = userSearchTerm.toLowerCase();
                              return (
                                user.email
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                user.username
                                  .toLowerCase()
                                  .includes(searchLower)
                              );
                            })
                            .filter((user) => !onlyAdmins || user.is_admin)
                            .length
                      }
                      onChange={toggleAllUsers}
                    />
                  </TableHeadCell>
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell>Nombre de Usuario</TableHeadCell>
                  <TableHeadCell>Admin</TableHeadCell>
                  <TableHeadCell>Fecha de Creación</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter((user) => {
                    if (!userSearchTerm) return true;
                    const searchLower = userSearchTerm.toLowerCase();
                    return (
                      user.email.toLowerCase().includes(searchLower) ||
                      user.username.toLowerCase().includes(searchLower)
                    );
                  })
                  .filter((user) => {
                    return !onlyAdmins || user.is_admin;
                  })
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.is_admin ? "Sí" : "No"}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
};
