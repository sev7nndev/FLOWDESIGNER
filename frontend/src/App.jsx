// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import OwnerPanel from './pages/OwnerPanel';
import DevPanel from './pages/DevPanel';
import PricingPage from './pages/PricingPage';

// Componente de Rota Protegida
const ProtectedRoute = ({ element: Element, allowedRoles, ...rest }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-xl">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Se houver restrição de role
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Redireciona usuários comuns para o dashboard se tentarem acessar painéis
        return <Navigate to="/dashboard" replace />; 
    }

    return <Element {...rest} />;
};

// Componente de Rota de Redirecionamento (para usuários logados)
const AuthRedirect = ({ element: Element, ...rest }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-xl">Carregando...</div>;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Element {...rest} />;
};


const AppRoutes = () => (
    <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Rota de Autenticação (Redireciona se já estiver logado) */}
        <Route path="/auth" element={<AuthRedirect element={Auth} />} />

        {/* Rotas Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
        
        {/* Painéis de Administração */}
        <Route 
            path="/owner-panel" 
            element={<ProtectedRoute element={OwnerPanel} allowedRoles={['owner']} />} 
        />
        <Route 
            path="/dev-panel" 
            element={<ProtectedRoute element={DevPanel} allowedRoles={['dev']} />} 
        />

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

const App = () => (
    <Router>
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    </Router>
);

export default App;