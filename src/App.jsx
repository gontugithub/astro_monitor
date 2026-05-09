import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wind from './pages/Wind';
import Aurora from './pages/Aurora';
import AppLayout from './components/AppLayout';

/*
define todas las rutas de la app — /en/login es pública, 
el resto pasan por ProtectedRoute que redirige al login si no hay sesión. 
El /:lang en la URL es lo que permite el sistema de idiomas (/en/dashboard vs /es/dashboard).
*/

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-on-surface-variant font-mono text-sm tracking-widest animate-pulse">
          ESTABLISHING SECURE LINK…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/en/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en/dashboard" replace />} />
      <Route path="/:lang/login" element={<Login />} />
      <Route
        path="/:lang"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="wind" element={<Wind />} />
        <Route path="aurora" element={<Aurora />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/en/dashboard" replace />} />
    </Routes>
  );
}