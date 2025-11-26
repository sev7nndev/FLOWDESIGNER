import React, { useState, useEffect } from 'react';
import { AppSettings, User } from '../types';
import { Button } from './Button';
import { Save, Shield, Users, ArrowLeft, Database } from 'lucide-react';

interface AdminDashboardProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, onSaveSettings, onBack }) => {
  const [keys, setKeys] = useState(settings);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users from LS simulating DB
    const loadedUsers = JSON.parse(localStorage.getItem("flow_users") || "[]");
    setUsers(loadedUsers);
  }, []);

  const handleSave = () => {
    onSaveSettings(keys);
    alert("Configurações salvas com sucesso! O App tentará conectar ao Supabase.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-12 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft />
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="text-primary" /> Painel do Administrador
          </h1>
        </div>

        <div className="grid gap-8">
          {/* Supabase Section */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database size={20} className="text-green-400" /> Banco de Dados (Supabase)
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Conecte seu banco de dados para salvar usuários e histórico na nuvem.
            </p>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Supabase Project URL</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 font-mono text-sm focus:border-primary outline-none"
                  value={keys.supabaseUrl || ''}
                  onChange={e => setKeys({...keys, supabaseUrl: e.target.value})}
                  placeholder="https://your-project.supabase.co"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Supabase Anon Key</label>
                <input 
                  type="password" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 font-mono text-sm focus:border-primary outline-none"
                  value={keys.supabaseKey || ''}
                  onChange={e => setKeys({...keys, supabaseKey: e.target.value})}
                  placeholder="eyJh..."
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            <Save size={16} className="mr-2" /> Salvar Todas as Configurações
          </Button>

          {/* Users List (Only shows local users for now) */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mt-4 opacity-50 pointer-events-none">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-400" /> Usuários (Cache Local)
            </h2>
            <p className="text-xs text-gray-500 mb-2">A lista de usuários do Supabase deve ser gerenciada pelo dashboard oficial deles.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-white/5">
                  <tr>
                    <th className="px-6 py-3">Nome</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};