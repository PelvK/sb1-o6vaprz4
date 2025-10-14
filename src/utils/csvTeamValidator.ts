import { Category } from '../types';

export interface TeamCSVRow {
  nombre: string;
  category: number;
}

export interface ValidationResult {
  success: boolean;
  data?: TeamCSVRow[];
  errors?: ValidationError[];
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

const VALID_CATEGORIES = Object.values(Category).filter(
  (value) => typeof value === 'number'
) as number[];

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

export const validateTeamCSV = (csvText: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const validTeams: TeamCSVRow[] = [];

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


    if (errors.length > 0) {
      return { success: false, errors };
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      if (row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      const nombre = row[0]?.trim() || '';
      const categoryStr = row[1]?.trim() || '';

      if (!nombre) {
        errors.push({
          row: rowNumber,
          field: 'nombre',
          value: '',
          message: 'El nombre del equipo es obligatorio',
        });
      }

      if (!categoryStr) {
        errors.push({
          row: rowNumber,
          field: 'categoria',
          value: '',
          message: 'La categoría es obligatoria',
        });
        continue;
      }

      const category = parseInt(categoryStr, 10);

      if (isNaN(category)) {
        errors.push({
          row: rowNumber,
          field: 'categoria',
          value: categoryStr,
          message: 'La categoría debe ser un número válido',
        });
        continue;
      }

      if (!VALID_CATEGORIES.includes(category)) {
        errors.push({
          row: rowNumber,
          field: 'categoria',
          value: categoryStr,
          message: `La categoría debe ser una de las siguientes: ${VALID_CATEGORIES.join(', ')}`,
        });
        continue;
      }

      if (errors.some(e => e.row === rowNumber)) {
        continue;
      }

      validTeams.push({
        nombre,
        category,
      });
    }

    if (validTeams.length === 0 && errors.length === 0) {
      errors.push({
        row: 0,
        field: 'archivo',
        value: '',
        message: 'No se encontraron equipos válidos en el archivo',
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: validTeams };
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

export const createCSVTemplate = (): string => {
  const examples = [
    'Equipo A,2010',
    'Equipo B,2015',
    'Equipo C,2018',
  ];

  return [...examples].join('\n');
};

export const downloadCSVTemplate = (): void => {
  const csvContent = createCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'plantilla_equipos.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
