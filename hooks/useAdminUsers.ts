import { useState, useEffect, useCallback } from 'react';
import { AdminUser, UserRole } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

export const useAdminUsers = (userRole: UserRole, currentUserId: string | undefined) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (userRole !== 'admin' && userRole !== 'dev' && userRole !== 'owner') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await api.getAdminUsers();
            setUsers(data);
        } catch (e: any) {
            console.error("Failed to fetch admin users:", e);
            setError(e.message || "Falha ao carregar lista de usuários.");
        } finally {
            setIsLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const deleteUser = useCallback(async (userId: string) => {
        if (userRole !== 'admin' && userRole !== 'dev' && userRole !== 'owner') {
            toast.error("Acesso negado.");
            return;
        }
        
        if (userId === currentUserId) {
            toast.error("Você não pode deletar sua própria conta.");
            return;
        }
        
        try {
            await api.deleteUserAccount(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success("Conta de usuário deletada com sucesso.");
        } catch (e: any) {
            console.error("Failed to delete user:", e);
            toast.error(e.message || "Falha ao deletar conta.");
        }
    }, [userRole, currentUserId]);

    return {
        adminUsers: users,
        isLoadingAdminUsers: isLoading,
        errorAdminUsers: error,
        fetchUsers,
        deleteUser
    };
};