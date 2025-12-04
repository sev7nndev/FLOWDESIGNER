import React, { useState, useCallback } from 'react';
import { Users, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { User } from '@/types';

export const UserManagement: React.FC<{ user: User }> = ({ user }) => {
    const { adminUsers, isLoadingAdminUsers, errorAdminUsers, deleteUser } = useAdminUsers(user.role, user.id);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const handleDelete = useCallback(async (userId: string) => {
        setDeletingId(userId);
        await deleteUser(userId);
        setDeletingId(null);
    }, [deleteUser]);

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Users size={20} className="text-accent" /> Gestão de Clientes ({adminUsers.length})
            </h3>
            
            {isLoadingAdminUsers && <div className="text-center py-10"><Loader2 size={20} className="animate-spin text-accent" /></div>}
            {errorAdminUsers && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorAdminUsers}</div>}

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-white/10">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {adminUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{u.email}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{u.first_name} {u.last_name}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.role === 'owner' ? 'bg-purple-800' : u.role === 'admin' ? 'bg-red-600' : u.role === 'dev' ? 'bg-cyan-600' : u.role === 'pro' ? 'bg-primary' : 'bg-gray-500'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <Button 
                                        variant="danger" 
                                        onClick={() => handleDelete(u.id)}
                                        isLoading={deletingId === u.id}
                                        disabled={u.id === user.id}
                                        className="h-8 px-3 text-xs"
                                        icon={<Trash2 size={14} />}
                                    >
                                        {deletingId === u.id ? 'Deletando' : 'Excluir'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};