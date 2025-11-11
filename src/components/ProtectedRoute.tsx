import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    // O loader global já está no AuthProvider, mas podemos retornar null aqui
    // para evitar piscar o conteúdo.
    return null; 
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;