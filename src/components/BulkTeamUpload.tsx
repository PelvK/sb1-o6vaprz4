import { useState, ChangeEvent } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from './base/Button';
import {
  validateTeamCSV,
  downloadCSVTemplate,
  ValidationError,
  TeamCSVRow,
} from '../utils/csvTeamValidator';
import { useBulkTeams } from '../hooks/useBulkTeams';
import './BulkTeamUpload.css';

interface BulkTeamUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkTeamUpload = ({ onClose, onSuccess }: BulkTeamUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validTeams, setValidTeams] = useState<TeamCSVRow[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'validated' | 'uploading' | 'success' | 'error'>('idle');
  const { createBulkTeams, loading } = useBulkTeams();
  const [uploadResult, setUploadResult] = useState<{ created: number; failed: number; errors?: Array<{ nombre: string; error: string }> } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationErrors([]);
      setValidTeams([]);
      setUploadStatus('idle');
      setUploadResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setUploadStatus('validating');

    try {
      const text = await file.text();
      const result = validateTeamCSV(text);

      if (result.success && result.data) {
        setValidTeams(result.data);
        setValidationErrors([]);
        setUploadStatus('validated');
      } else if (result.errors) {
        setValidationErrors(result.errors);
        setValidTeams([]);
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
    if (validTeams.length === 0) return;

    setUploadStatus('uploading');

    try {
      const result = await createBulkTeams(validTeams);

      setUploadResult({
        created: result.created,
        failed: result.failed,
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
    setValidTeams([]);
    setUploadStatus('idle');
    setUploadResult(null);
    onClose();
  };

  return (
    <div className="bulk-upload-modal">
      <div className="bulk-upload-overlay" onClick={handleClose} />
      <div className="bulk-upload-content">
        <div className="bulk-upload-header">
          <h3>Carga Masiva de Equipos</h3>
          <button className="bulk-upload-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="bulk-upload-body">
          <div className="bulk-upload-instructions">
            <p>Descarga la plantilla CSV, complétala con los datos de los equipos y súbela para validar.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadCSVTemplate}
            >
              <Download size={18} />
              Descargar Plantilla CSV
            </Button>
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

          {uploadStatus === 'validated' && validTeams.length > 0 && (
            <div className="bulk-upload-preview">
              <div className="validation-success">
                <CheckCircle size={20} />
                <span>Validación exitosa: {validTeams.length} equipo(s) listo(s) para crear</span>
              </div>

              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>NombreCorto</th>
                      <th>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validTeams.map((team, index) => (
                      <tr key={index}>
                        <td>{team.nombre}</td>
                        <td>{team.shortname}</td>
                        <td>{team.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bulk-upload-actions">
                <Button onClick={handleUpload} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Equipos'}
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
                <p>{uploadResult.created} equipo(s) creado(s) exitosamente</p>
                {uploadResult.failed > 0 && (
                  <p className="result-warning">{uploadResult.failed} equipo(s) fallaron</p>
                )}
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="result-errors">
                  <h5>Errores:</h5>
                  <div className="error-list">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        <strong>{error.nombre}:</strong> {error.error}
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
              <p>Creando equipos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
