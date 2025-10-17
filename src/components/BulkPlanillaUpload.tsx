import { useState, ChangeEvent } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from './base/Button';
import {
  validatePlanillaCSV,
  downloadCSVTemplate,
  ValidationError,
  PlanillaCSVRow,
} from '../utils/csvPlanillaValidator';
import { useBulkPlanillas } from '../hooks/useBulkPlanillas';
import { Team } from '../types';
import './BulkPlanillaUpload.css';

interface BulkPlanillaUploadProps {
  onClose: () => void;
  onSuccess: () => void;
  teams: Team[];
  existingPlanillas: Array<{ team_id: string }>;
}

export const BulkPlanillaUpload = ({ onClose, onSuccess, teams, existingPlanillas }: BulkPlanillaUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validPlanillas, setValidPlanillas] = useState<PlanillaCSVRow[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'validated' | 'uploading' | 'success' | 'error'>('idle');
  const { createBulkPlanillas, loading } = useBulkPlanillas();
  const [uploadResult, setUploadResult] = useState<{ created: number; failed: number; planillas?: Array<{ team_id: string; username: string; email: string; password: string }>; errors?: Array<{ team_id: string; error: string }> } | null>(null);

  const teamsWithoutPlanilla = teams.filter(
    team => !existingPlanillas.some(p => p.team_id === team.id) && team.shortname
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationErrors([]);
      setValidPlanillas([]);
      setUploadStatus('idle');
      setUploadResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setUploadStatus('validating');

    try {
      const text = await file.text();
      const result = validatePlanillaCSV(text, teamsWithoutPlanilla);

      if (result.success && result.data) {
        setValidPlanillas(result.data);
        setValidationErrors([]);
        setUploadStatus('validated');
      } else if (result.errors) {
        setValidationErrors(result.errors);
        setValidPlanillas([]);
        setUploadStatus('error');
      }
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          field: 'archivo',
          value: '',
          message: `Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        },
      ]);
      setUploadStatus('error');
    }
  };

  const handleUpload = async () => {
    if (validPlanillas.length === 0) return;

    setUploadStatus('uploading');

    try {
      const result = await createBulkPlanillas(validPlanillas);

      setUploadResult({
        created: result.created,
        failed: result.failed,
        planillas: result.planillas,
        errors: result.errors,
      });

      if (result.created > 0) {
        setUploadStatus('success');
        onSuccess();
      } else {
        setUploadStatus('error');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setUploadStatus('error');
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationErrors([]);
    setValidPlanillas([]);
    setUploadStatus('idle');
    setUploadResult(null);
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(teamsWithoutPlanilla);
  };

  return (
    <div className="bulk-upload-modal">
      <div className="bulk-upload-overlay" onClick={handleClose} />
      <div className="bulk-upload-content">
        <div className="bulk-upload-header">
          <h3>Carga Masiva de Planillas</h3>
          <button className="bulk-upload-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="bulk-upload-body">
          <div className="bulk-upload-instructions">
            <p>Descarga la plantilla CSV con los equipos disponibles (sin planilla asignada) y súbela para crear planillas automáticamente.</p>
            <p className="instruction-note">Se crearán usuarios automáticamente con credenciales basadas en el shortname del equipo.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={teamsWithoutPlanilla.length === 0}
            >
              <Download size={18} />
              Descargar Plantilla CSV ({teamsWithoutPlanilla.length} equipos disponibles)
            </Button>
            {teamsWithoutPlanilla.length === 0 && (
              <p className="warning-text">No hay equipos disponibles para crear planillas. Todos los equipos ya tienen planillas asignadas o no tienen shortname configurado.</p>
            )}
          </div>

          <div className="bulk-upload-file-input">
            <label htmlFor="csv-file" className="file-input-label">
              <Upload size={24} />
              <span>{file ? file.name : 'Seleccionar archivo CSV'}</span>
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
          </div>

          {file && uploadStatus === 'idle' && (
            <div className="bulk-upload-actions">
              <Button onClick={handleValidate} disabled={loading}>
                Validar Archivo
              </Button>
            </div>
          )}

          {uploadStatus === 'validating' && (
            <div className="bulk-upload-status">
              <p>Validando archivo...</p>
            </div>
          )}

          {uploadStatus === 'validated' && validPlanillas.length > 0 && (
            <div className="bulk-upload-preview">
              <div className="validation-success">
                <CheckCircle size={20} />
                <span>Validación exitosa: {validPlanillas.length} planilla(s) lista(s) para crear</span>
              </div>

              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>ID Equipo</th>
                      <th>Shortname</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Contraseña</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validPlanillas.map((planilla, index) => (
                      <tr key={index}>
                        <td>{planilla.team_id}</td>
                        <td>{planilla.shortname}</td>
                        <td>{planilla.username}</td>
                        <td>{planilla.email}</td>
                        <td className="password-cell">{planilla.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bulk-upload-actions">
                <Button onClick={handleUpload} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Planillas y Usuarios'}
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && validationErrors.length > 0 && (
            <div className="bulk-upload-errors">
              <div className="validation-error-header">
                <AlertCircle size={20} />
                <span>Se encontraron {validationErrors.length} error(es) en el archivo</span>
              </div>

              <div className="error-list">
                {validationErrors.map((error, index) => (
                  <div key={index} className="error-item">
                    <strong>Fila {error.row}:</strong> {error.message}
                    {error.field !== 'archivo' && error.field !== 'header' && (
                      <span className="error-detail">
                        Campo: {error.field}, Valor: "{error.value}"
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="bulk-upload-actions">
                <Button variant="ghost" onClick={() => {
                  setFile(null);
                  setValidationErrors([]);
                  setUploadStatus('idle');
                }}>
                  Intentar de Nuevo
                </Button>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && uploadResult && (
            <div className="bulk-upload-result">
              <div className="result-success">
                <CheckCircle size={24} />
                <h4>Carga Completada</h4>
                <p>{uploadResult.created} planilla(s) y usuario(s) creado(s) exitosamente</p>
                {uploadResult.failed > 0 && (
                  <p className="result-warning">{uploadResult.failed} planilla(s) fallaron</p>
                )}
              </div>

              {uploadResult.planillas && uploadResult.planillas.length > 0 && (
                <div className="result-credentials">
                  <h5>Credenciales generadas:</h5>
                  <div className="credentials-table-container">
                    <table className="credentials-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Email</th>
                          <th>Contraseña</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.planillas.map((planilla, index) => (
                          <tr key={index}>
                            <td>{planilla.username}</td>
                            <td>{planilla.email}</td>
                            <td className="password-cell">{planilla.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="result-errors">
                  <h5>Errores:</h5>
                  <div className="error-list">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        <strong>{error.team_id}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bulk-upload-actions">
                <Button onClick={handleClose}>Cerrar</Button>
              </div>
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="bulk-upload-status">
              <p>Creando planillas y usuarios...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
