// frontend/src/components/AdminLayout.jsx
import React from 'react';
import Navbar from './Navbar';

const AdminLayout = ({ title, children }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="container mx-auto p-6 py-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">
                    {title}
                </h1>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;