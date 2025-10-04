export type PlanillaStatus = 'Pendiente de envío' | 'Pendiente de aprobación' | 'Aprobada';

export type PersonaCharge = 'Técnico' | 'Delegado';

export interface Team {
  id: string;
  nombre: string;
  created_at: string;
}

export interface Planilla {
  id: string;
  team_id: string;
  status: PlanillaStatus;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Jugador {
  id: string;
  planilla_id: string;
  dni: string;
  number: number;
  name: string;
  second_name: string;
  created_at: string;
}

export interface Persona {
  id: string;
  planilla_id: string;
  dni: string;
  name: string;
  second_name: string;
  phone_number: string;
  charge: PersonaCharge;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface UserPlanilla {
  id: string;
  user_id: string;
  planilla_id: string;
  created_at: string;
}

export interface PlanillaWithDetails extends Planilla {
  jugadores: Jugador[];
  personas: Persona[];
  assigned_users?: Profile[];
}
