// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ImageGenerator from '../components/ImageGenerator';

const Dashboard = () => {
    const { user, profile } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto p-6">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                    Bem-vindo, {user?.email}!
                </h1>
                <p className="text-lg text-indigo-600 mb-8">
                    Seu plano atual: <span className="font-semibold capitalize">{profile?.role || 'Carregando...'}</span>
                </p>

                <ImageGenerator />
            </main>
        </div>
    );
};

export default Dashboard;