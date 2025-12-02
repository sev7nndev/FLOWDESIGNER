// frontend/src/pages/DevPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { apiService } from '../services/apiService';
import { Button, Box, Typography, Paper, TextField, Alert, CircularProgress, Grid } from '@mui/material';
import { Zap, Settings, RefreshCw, Image, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- Componente de Gerenciamento de Planos ---
const PlanManager = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getPlans();
            setPlans(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleUpdatePlan = async (planId, price, image_quota) => {
        setStatus(`Atualizando ${planId}...`);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/dev/update-plan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId, price, image_quota }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            setStatus(`Plano ${planId} atualizado com sucesso!`);
            fetchPlans(); // Recarrega os planos
        } catch (e) {
            setError(e.message);
            setStatus('');
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <Zap size={20} className="mr-2" /> Gerenciar Planos
            </Typography>
            
            {status && <Alert severity={status.includes('sucesso') ? 'success' : 'info'} sx={{ mb: 2 }}>{status}</Alert>}

            <Grid container spacing={3}>
                {plans.map((plan) => (
                    <Grid item xs={12} md={4} key={plan.id}>
                        <PlanForm plan={plan} onUpdate={handleUpdatePlan} />
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

// --- Formulário de Edição de Plano ---
const PlanForm = ({ plan, onUpdate }) => {
    const [price, setPrice] = useState(plan.price);
    const [quota, setQuota] = useState(plan.image_quota);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        await onUpdate(plan.id, price, quota);
        setIsUpdating(false);
    };

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textTransform: 'uppercase' }}>
                {plan.name}
            </Typography>
            <form onSubmit={handleSubmit} className="space-y-3">
                <TextField
                    label="Preço (R$)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    fullWidth
                    size="small"
                    required
                />
                <TextField
                    label="Quota de Imagens"
                    type="number"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    fullWidth
                    size="small"
                    required
                />
                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    disabled={isUpdating}
                    startIcon={isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Settings size={20} />}
                >
                    {isUpdating ? 'Salvando...' : 'Salvar'}
                </Button>
            </form>
        </Paper>
    );
};

// --- Componente de Manutenção e Carrossel ---
const MaintenanceAndCarousel = () => {
    const { user } = useAuth();
    const [maintenanceStatus, setMaintenanceStatus] = useState('');
    const [carouselUrls, setCarouselUrls] = useState('');
    const [carouselStatus, setCarouselStatus] = useState('');
    const [loadingMaintenance, setLoadingMaintenance] = useState(false);
    const [loadingCarousel, setLoadingCarousel] = useState(false);

    // 1. Fetch current carousel images on load
    useEffect(() => {
        apiService.getCarouselImages().then(urls => {
            setCarouselUrls(urls.join('\n'));
        }).catch(e => {
            console.error("Failed to load carousel images:", e);
            setCarouselUrls('Erro ao carregar URLs.');
        });
    }, []);

    // 2. Handle Fix App
    const handleFixApp = async () => {
        setLoadingMaintenance(true);
        setMaintenanceStatus('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/dev/fix-app', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            setMaintenanceStatus(data.message);
        } catch (e) {
            setMaintenanceStatus(`Erro: ${e.message}`);
        } finally {
            setLoadingMaintenance(false);
        }
    };

    // 3. Handle Carousel Update
    const handleUpdateCarousel = async () => {
        setLoadingCarousel(true);
        setCarouselStatus('');
        try {
            const imagesArray = carouselUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/dev/carousel-images', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ images: imagesArray }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            setCarouselStatus('Imagens do carrossel atualizadas com sucesso!');
        } catch (e) {
            setCarouselStatus(`Erro: ${e.message}`);
        } finally {
            setLoadingCarousel(false);
        }
    };

    return (
        <Grid container spacing={4}>
            {/* Manutenção */}
            <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={20} className="mr-2" /> Rotina de Manutenção
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Executa tarefas de limpeza e reindexação no banco de dados. Use com cautela.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={handleFixApp} 
                        disabled={loadingMaintenance}
                        startIcon={loadingMaintenance ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                    >
                        {loadingMaintenance ? 'Executando...' : 'Executar Fix App'}
                    </Button>
                    {maintenanceStatus && <Alert severity={maintenanceStatus.includes('Erro') ? 'error' : 'success'} sx={{ mt: 2 }}>{maintenanceStatus}</Alert>}
                </Paper>
            </Grid>

            {/* Gerenciamento de Carrossel */}
            <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <Image size={20} className="mr-2" /> Carrossel da Landing Page
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Insira uma URL de imagem por linha.
                    </Typography>
                    <TextField
                        label="URLs das Imagens"
                        multiline
                        rows={6}
                        value={carouselUrls}
                        onChange={(e) => setCarouselUrls(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleUpdateCarousel} 
                        disabled={loadingCarousel}
                        startIcon={loadingCarousel ? <Loader2 size={20} className="animate-spin" /> : <Settings size={20} />}
                    >
                        {loadingCarousel ? 'Salvando...' : 'Atualizar Carrossel'}
                    </Button>
                    {carouselStatus && <Alert severity={carouselStatus.includes('Erro') ? 'error' : 'success'} sx={{ mt: 2 }}>{carouselStatus}</Alert>}
                </Paper>
            </Grid>
        </Grid>
    );
};


const DevPanel = () => {
    return (
        <AdminLayout title="Painel do Desenvolvedor">
            <PlanManager />
            <MaintenanceAndCarousel />
        </AdminLayout>
    );
};

export default DevPanel;