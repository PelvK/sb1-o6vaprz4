import { Team } from "../types";

export interface PlanillaCSVRow {
  team_id: string;
  shortname: string;
  email: string;
  password: string;
  username: string;
}

export interface ValidationResult {
  success: boolean;
  data?: PlanillaCSVRow[];
  errors?: ValidationError[];
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  });
};

export const validatePlanillaCSV = (csvText: string, existingTeams: Team[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const validPlanillas: PlanillaCSVRow[] = [];

  try {
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      errors.push({
        row: 0,
        field: 'archivo',
        value: '',
        message: 'El archivo CSV está vacío',
      });
      return { success: false, errors };
    }

    const teamsWithShortname = existingTeams.filter(t => t.shortname);
    const teamsWithoutPlanilla = teamsWithShortname;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      if (row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      const teamId = row[0]?.trim() || '';

      if (!teamId) {
        errors.push({
          row: rowNumber,
          field: 'team_id',
          value: '',
          message: 'El ID del equipo es obligatorio',
        });
        continue;
      }

      const team = teamsWithoutPlanilla.find(t => t.id === teamId);

      if (!team) {
        errors.push({
          row: rowNumber,
          field: 'team_id',
          value: teamId,
          message: 'El equipo no existe o ya tiene una planilla asignada',
        });
        continue;
      }

      if (!team.shortname) {
        errors.push({
          row: rowNumber,
          field: 'shortname',
          value: teamId,
          message: 'El equipo no tiene un shortname configurado',
        });
        continue;
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const email = `${team.shortname}@valesanito`;
      const password = `${team.shortname}${team.category}${randomNum}`;
      const username = team.shortname;

      validPlanillas.push({
        team_id: teamId,
        shortname: team.shortname,
        email,
        password,
        username,
      });
    }

    if (validPlanillas.length === 0 && errors.length === 0) {
      errors.push({
        row: 0,
        field: 'archivo',
        value: '',
        message: 'No se encontraron planillas válidas en el archivo',
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: validPlanillas };
  } catch (error) {
    errors.push({
      row: 0,
      field: 'archivo',
      value: '',
      message: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    });
    return { success: false, errors };
  }
};

export const createCSVTemplate = (teamsWithoutPlanilla: Array<{id: string, nombre: string, shortname?: string | null}>): string => {
  const header = 'team_id,nombre_equipo,shortname';
  const examples = teamsWithoutPlanilla
    .filter(t => t.shortname)
    .slice(0, 3)
    .map(t => `${t.id},${t.nombre},${t.shortname}`);

  return [header, ...examples].join('\n');
};

export const downloadCSVTemplate = (teamsWithoutPlanilla: Array<{id: string, nombre: string, shortname?: string | null}>): void => {
  const csvContent = createCSVTemplate(teamsWithoutPlanilla);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'plantilla_planillas.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
