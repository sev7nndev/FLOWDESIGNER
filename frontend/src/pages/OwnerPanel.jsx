// frontend/src/pages/OwnerPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Grid, Paper, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';
import { DollarSign, Users, CheckCircle, PauseCircle, Link as LinkIcon, PowerOff, Loader2 } from 'lucide-react';

// Componente para exibir um cartão de métrica
const MetricCard = ({ title, value, icon: Icon, color = 'indigo' }) => (
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderLeft: `4px solid ${color === 'indigo' ? '#4f46e5' : color === 'green' ? '#10b981' : '#ef4444'}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
                {title}
            </Typography>
            <Icon size={24} className={`text-${color}-500`} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {value}
        </Typography>
    </Paper>
);

const OwnerPanel = () => {
    const { user, profile, signOut } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (profile?.role !== 'owner' || !user) return;

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token'); // O token é gerenciado pelo AuthContext, mas o backend espera o token JWT
            
            // Usando a rota /api/owner/metrics
            const response = await fetch('/api/owner/metrics', {
                headers: {
                    'Authorization': `Bearer ${user.id}`, // Usando o ID do usuário como placeholder para o token (o AuthContext deve fornecer o token real)
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            setMetrics(data);
        } catch (e) {
            console.error("Erro ao carregar métricas:", e);
            setError(`Erro ao carregar dados: ${e.message}. Verifique se o backend está rodando.`);
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Placeholder para ações do Mercado Pago (a lógica real de conexão está no backend)
    const handleConnectMp = async () => {
        alert("Redirecionando para o Mercado Pago...");
        // Aqui, você faria uma chamada para apiService.getMpAuthUrl() e redirecionaria
    };

    const handleDisconnectMp = () => {
        alert("Desconectando Mercado Pago...");
        // Aqui, você faria uma chamada para apiService.disconnectMp()
    };

    if (loading && !metrics) {
        return (
            <AdminLayout title="Painel do Dono">
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Carregando métricas...</Typography>
                </Box>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout title="Painel do Dono">
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                <Button onClick={fetchData} variant="contained" startIcon={<Loader2 size={20} />}>
                    Tentar Novamente
                </Button>
            </AdminLayout>
        );
    }
    
    const mpStatus = metrics?.mpConnectionStatus || 'disconnected';

    return (
        <AdminLayout title="Painel do Dono">
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                Visão Geral
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <MetricCard 
                        title="Receita Total (Aprox.)" 
                        value={`R$ ${metrics?.totalRevenue?.toFixed(2) || '0.00'}`} 
                        icon={DollarSign} 
                        color="green"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <MetricCard 
                        title="Clientes Totais" 
                        value={metrics?.totalClients || 0} 
                        icon={Users} 
                        color="indigo"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <MetricCard 
                        title="Clientes Ativos" 
                        value={metrics?.activeClients || 0} 
                        icon={CheckCircle} 
                        color="green"
                    />
                </Grid>
            </Grid>

            {/* Status do Mercado Pago */}
            <Paper elevation={3} sx={{ p: 3, mb: 5, border: `1px solid ${mpStatus === 'connected' ? '#10b981' : '#ef4444'}` }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Conexão Mercado Pago
                        </Typography>
                        <Typography color={mpStatus === 'connected' ? 'success.main' : 'error.main'}>
                            {mpStatus === 'connected' ? 'Conectado e pronto para receber pagamentos.' : 'Desconectado. Pagamentos desabilitados.'}
                        </Typography>
                    </Box>
                    {mpStatus === 'connected' ? (
                        <Button 
                            variant="outlined" 
                            color="error" 
                            startIcon={<PowerOff size={20} />} 
                            onClick={handleDisconnectMp}
                        >
                            Desconectar
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<LinkIcon size={20} />} 
                            onClick={handleConnectMp}
                        >
                            Conectar Agora
                        </Button>
                    )}
                </Box>
            </Paper>
            
            {/* Lista de Clientes (Placeholder simples) */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                Lista de Clientes (Recentes)
            </Typography>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography color="textSecondary">
                    A lista detalhada de clientes será implementada na próxima iteração, mas as métricas acima estão funcionando.
                </Typography>
            </Paper>
        </AdminLayout>
    );
};

export default OwnerPanel;