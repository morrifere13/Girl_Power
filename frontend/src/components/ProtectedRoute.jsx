import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role if allowedRoles is specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
                    <p className="text-xl text-gray-700">Accès refusé</p>
                    <p className="text-gray-500 mt-2">Vous n'avez pas les permissions nécessaires.</p>
                </div>
            </div>
        );
    }

    return children;
}
