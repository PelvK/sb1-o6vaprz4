export type PlanillaStatus = 'Pendiente de envío' | 'Pendiente de aprobación' | 'Aprobada';

export type PersonaCharge = 'Técnico' | 'Delegado' | 'Médico';

export interface Team {
  id: string;
  nombre: string;
  category: Category;
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

export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface Session {
  access_token: string;
  expires_at: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
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

export enum Category {
  Y2010 = 2010,
  Y2011 = 2011,
  Y2012 = 2012,
  Y2013 = 2013,
  Y2014 = 2014,
  Y2015 = 2015,
  Y2016 = 2016,
  Y2017 = 2017,
  Y2018 = 2018,
}


export const categoryLimits: { year: Category; limit: number }[] = [
  { year: Category.Y2010, limit: 8 },
  { year: Category.Y2011, limit: 14 },
  { year: Category.Y2012, limit: 14 },
  { year: Category.Y2013, limit: 14 },
  { year: Category.Y2014, limit: 14 },
  { year: Category.Y2015, limit: 14 },
  { year: Category.Y2016, limit: 14 },
  { year: Category.Y2017, limit: 14 },
  { year: Category.Y2018, limit: 14 },
  { year: 2019 as Category, limit: 14 },
  { year: 2020 as Category, limit: 14 },
];


export type AuditAction =
  | 'jugador_added'
  | 'jugador_deleted'
  | 'jugador_updated'
  | 'persona_added'
  | 'persona_deleted'
  | 'persona_updated'
  | 'status_changed'
  | 'planilla_created'
  | 'planilla_updated'
  | 'planilla_deleted';

export type AuditEntityType = 'jugador' | 'persona' | 'planilla';

export interface AuditLog {
  id: string;
  planilla_id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: AuditEntityType | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  username: string | null;
}

