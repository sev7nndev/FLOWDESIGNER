// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, signOut, profile } = useAuth();
    const role = profile?.role;
    const isAdminPanel = role === 'owner' || role === 'dev';

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600">
                    Flow Designer
                </Link>
                
                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            {isAdminPanel && (
                                <Link 
                                    to={role === 'owner' ? '/owner-panel' : '/dev-panel'} 
                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    {role === 'owner' ? 'Painel Dono' : 'Painel Dev'}
                                </Link>
                            )}
                            <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                                Dashboard
                            </Link>
                            <button 
                                onClick={signOut} 
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                                Preços
                            </Link>
                            <Link 
                                to="/auth" 
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Entrar
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;