import { useState, FormEvent } from "react";
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
} from "lucide-react";
import "./AdminPage.css";
import { PdfDownloader } from "../components/PdfDownloader";
import { createTeam } from "../hooks/useTeams";

export const AdminPage = () => {
  const navigate = useNavigate();
  const { planillas, refetch: refetchPlanillas } = usePlanillas();
  const [pdfPlanillaId, setPdfPlanillaId] = useState<string | null>(null);
  const { teams, refetch: refetchTeams } = useTeams();
  const { profiles } = useProfiles();
  const {
    users,
    createUser,
    updateUser,
    deleteUser /* refetch: refetchUsers */,
  } = useUsers();
  const [showNewPlanillaForm, setShowNewPlanillaForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
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
    is_admin: false,
  });
  const [saving, setSaving] = useState(false);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<Category | "">(
    ""
  );
  const [planillaTeamSearch, setPlanillaTeamSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [planillaUserSearch, setPlanillaUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "equipos" | "planillas" | "usuarios"
  >("planillas");

  const categoryOptions = Object.values(Category).filter(
    (value) => typeof value === "number"
  ) as number[];

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
  /** @todo make this in the next migration */
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
  /** @todo make this in the next migration */
  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUserId(userId);
      setEditUser({
        username: user.username,
        is_admin: user.is_admin,
      });
    }
  };
  /** @todo make this in the next migration */
  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editUser.username.trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      setSaving(true);
      const result = await updateUser(
        editingUserId,
        editUser.username,
        editUser.is_admin
      );

      if (result.success) {
        setEditingUserId(null);
        setEditUser({ username: "", is_admin: false });
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
        )}

        {activeTab === "planillas" && (
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Planillas</h3>
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
                          onClick={() => navigate(`/planillas/${planilla.id}`)}
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
                <FormInput
                  type="password"
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

            {editingUserId && (
              <form onSubmit={handleUpdateUser} className="admin-form">
                <FormInput
                  placeholder="Nombre de usuario"
                  value={editUser.username}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                  required
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
                      setEditUser({ username: "", is_admin: false });
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
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell>Nombre de Usuario</TableHeadCell>
                  <TableHeadCell>Admin</TableHeadCell>
                  <TableHeadCell>Fecha de Creación</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
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
