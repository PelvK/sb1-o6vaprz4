import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontSize: '1.125rem', color: '#6B7280',
      }}>
        Cargando...
      </div>
    );
  }
  if (user) return <Navigate to="/planillas" replace />;
  return <Navigate to="/login" replace />;
}
