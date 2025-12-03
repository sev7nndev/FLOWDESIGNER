// frontend/src/pages/OwnerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider,
    Card,
    CardContent,
    CardHeader,
} from '@mui/material';
import { CheckCircle, Error, Link as LinkIcon, PowerOff } from '@mui/icons-material';

const OwnerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mpAuthUrl, setMpAuthUrl] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Token de autenticação não encontrado.");
            }

            const response = await fetch('/api/owner/metrics', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorDetails = `HTTP error! Status: ${response.status}`;
                
                // FIX CRÍTICO: Tenta analisar JSON apenas se o Content-Type indicar JSON.
                // Isso previne o erro 'Unexpected end of JSON input' se o servidor enviar um corpo vazio em caso de erro.
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    try {
                        const errorData = await response.json();
                        errorDetails = errorData.error || errorDetails;
                    } catch (e) {
                        // Se a análise falhar (corpo vazio/truncado), usamos a mensagem de erro padrão.
                        console.warn("Falha ao analisar JSON de erro (corpo vazio/truncado):", e);
                    }
                }
                
                throw new Error(errorDetails);
            }

            const data = await response.json();
            setMetrics(data);
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            setError(`Erro ao carregar dados: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMpAuthUrl = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/owner/mp-auth-url', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setMpAuthUrl(data.authUrl);
        } catch (e) {
            console.error("Failed to fetch MP auth URL:", e);
        }
    }, []);

    const handleDisconnectMp = async () => {
        if (!window.confirm("Tem certeza que deseja desconectar sua conta do Mercado Pago?")) return;
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/owner/disconnect-mp', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchData(); // Refresh metrics
        } catch (e) {
            alert("Falha ao desconectar Mercado Pago.");
            console.error("Disconnect error:", e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMpAuthUrl();

        // Handle Mercado Pago callback status from URL
        const urlParams = new URLSearchParams(window.location.search);
        const mpStatus = urlParams.get('mp_status');
        const mpMessage = urlParams.get('message');

        if (mpStatus) {
            if (mpStatus === 'success') {
                alert('Conexão com Mercado Pago estabelecida com sucesso!');
            } else if (mpStatus === 'error') {
                alert(`Erro ao conectar Mercado Pago: ${mpMessage || 'Detalhes desconhecidos.'}`);
            }
            // Clean up URL
            navigate('/owner/dashboard', { replace: true });
        }
    }, [fetchData, fetchMpAuthUrl, navigate]);

    // ... (restante do componente, incluindo renderização)

    const renderMetricCard = (title, value, color = 'primary') => (
        <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={color} gutterBottom>
                    {value}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    {title}
                </Typography>
            </Paper>
        </Grid>
    );

    const renderMpStatus = () => {
        const isConnected = metrics?.mpConnectionStatus === 'connected';
        return (
            <Card sx={{ mt: 4 }}>
                <CardHeader
                    title="Status da Conexão Mercado Pago"
                    avatar={isConnected ? <CheckCircle color="success" /> : <Error color="error" />}
                    action={
                        isConnected ? (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<PowerOff />}
                                onClick={handleDisconnectMp}
                            >
                                Desconectar
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<LinkIcon />}
                                href={mpAuthUrl}
                                disabled={!mpAuthUrl}
                            >
                                Conectar Agora
                            </Button>
                        )
                    }
                />
                <CardContent>
                    <Typography color={isConnected ? 'success.main' : 'error.main'}>
                        {isConnected ? 'Conectado e pronto para receber pagamentos.' : 'Desconectado. Conecte para habilitar pagamentos.'}
                    </Typography>
                </CardContent>
            </Card>
        );
    };

    if (loading && !metrics) {
        return (
            <Container sx={{ mt: 5, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Carregando métricas...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 5 }}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={fetchData} sx={{ mt: 2 }}>Tentar Novamente</Button>
            </Container>
        );
    }

    const totalUsers = (metrics?.planCounts?.free || 0) + (metrics?.planCounts?.starter || 0) + (metrics?.planCounts?.pro || 0);
    const totalClients = (metrics?.statusCounts?.on || 0) + (metrics?.statusCounts?.paused || 0) + (metrics?.statusCounts?.cancelled || 0);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Painel do Proprietário
                </Typography>
                <Button variant="outlined" color="secondary" onClick={logout}>
                    Sair
                </Button>
            </Box>

            {renderMpStatus()}

            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                Métricas Gerais
            </Typography>
            <Grid container spacing={3}>
                {renderMetricCard("Total de Usuários (Incluindo Admin/Dev)", totalUsers)}
                {renderMetricCard("Total de Clientes (Excluindo Admin/Dev)", totalClients, 'secondary')}
                {renderMetricCard("Clientes Ativos", metrics?.statusCounts?.on || 0, 'success')}
                {renderMetricCard("Clientes Cancelados", metrics?.statusCounts?.cancelled || 0, 'error')}
            </Grid>

            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                Contagem por Plano
            </Typography>
            <Grid container spacing={3}>
                {renderMetricCard("Plano Free", metrics?.planCounts?.free || 0)}
                {renderMetricCard("Plano Starter", metrics?.planCounts?.starter || 0)}
                {renderMetricCard("Plano Pro", metrics?.planCounts?.pro || 0)}
            </Grid>

            <Card sx={{ mt: 4 }}>
                <CardHeader title="Lista de Clientes Recentes" />
                <CardContent>
                    {metrics?.clients && metrics.clients.length > 0 ? (
                        <List>
                            <ListItem sx={{ fontWeight: 'bold' }}>
                                <ListItemText primary="Nome" sx={{ flex: 2 }} />
                                <ListItemText primary="Email" sx={{ flex: 3 }} />
                                <ListItemText primary="Plano" sx={{ flex: 1 }} />
                                <ListItemText primary="Status" sx={{ flex: 1 }} />
                            </ListItem>
                            <Divider />
                            {metrics.clients.slice(0, 10).map((client) => (
                                <React.Fragment key={client.id}>
                                    <ListItem>
                                        <ListItemText primary={client.name} sx={{ flex: 2 }} />
                                        <ListItemText primary={client.email} sx={{ flex: 3 }} />
                                        <ListItemText primary={client.plan} sx={{ flex: 1 }} />
                                        <ListItemText primary={client.status} sx={{ flex: 1 }} />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography>Nenhum cliente encontrado.</Typography>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default OwnerDashboard;