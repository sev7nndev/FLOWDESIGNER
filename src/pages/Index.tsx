import React, { useState, useEffect } from 'react';
import { GenerationForm } from '../components/GenerationForm';
import { ArtDisplay } from '../components/ArtDisplay';
import { Header } from '../components/Header';
import { BusinessInfo, GenerationStatus, Image } from '../types';
import { generationService } from '../services/generationService';
import { imageService } from '../services/imageService';
import { toast } from 'sonner';

const initialFormState: BusinessInfo = {
    companyName: '',
    details: '',
    logo: '',
    addressStreet: '',
    addressNumber: '',
    addressNeighborhood: '',
    addressCity: '',
    phone: '',
};

const exampleFormState: BusinessInfo = {
    companyName: 'Calors Automóveis',
    details: 'Oficina especializada em carros importados. Crie uma arte para uma promoção de troca de óleo e filtro. Use cores escuras, como preto e cinza, com detalhes em neon azul ou roxo para um visual moderno e tecnológico.',
    logo: '',
    addressStreet: 'Avenida das Américas',
    addressNumber: '1200',
    addressNeighborhood: 'Barra da Tijuca',
    addressCity: 'Rio de Janeiro',
    phone: '(21) 98765-4321',
};

const IndexPage: React.FC = () => {
    const [form, setForm] = useState<BusinessInfo>(initialFormState);
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [error, setError] = useState<string | undefined>(undefined);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | undefined>(undefined);
    const [history, setHistory] = useState<Image[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const userHistory = await imageService.getImages();
            setHistory(userHistory);
        } catch (err: any) {
            console.error("Failed to fetch history:", err);
            toast.error('Não foi possível carregar seu histórico.');
        }
    };

    const handleInputChange = (field: keyof BusinessInfo, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoUpload = (file: File) => {
        setForm(prev => ({ ...prev, logo: file.name }));
    };

    const handleGenerate = async () => {
        setError(undefined);
        setStatus(GenerationStatus.THINKING);
        setGeneratedImageUrl(undefined);
        setShowHistory(false);

        try {
            const result = await generationService.generateArt(form);
            setGeneratedImageUrl(result.imageUrl);
            setStatus(GenerationStatus.DONE);
            toast.success('Sua arte foi gerada com sucesso!');
            await fetchHistory(); // Refresh history after generation
        } catch (err: any) {
            const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
            setError(errorMessage);
            setStatus(GenerationStatus.ERROR);
            toast.error(errorMessage);
        }
    };

    const loadExample = () => {
        setForm(exampleFormState);
        toast.info('Dados de exemplo carregados!');
    };

    const handleViewHistory = () => {
        setShowHistory(true);
        setGeneratedImageUrl(undefined);
        setStatus(GenerationStatus.IDLE);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
            <Header />
            <main className="container mx-auto px-4 py-8 md:py-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    <div className="lg:pr-8">
                        <GenerationForm
                            form={form}
                            status={status}
                            error={error}
                            handleInputChange={handleInputChange}
                            handleLogoUpload={handleLogoUpload}
                            handleGenerate={handleGenerate}
                            loadExample={loadExample}
                        />
                    </div>
                    <div className="lg:pl-8">
                        <ArtDisplay
                            status={status}
                            imageUrl={generatedImageUrl}
                            history={history}
                            showHistory={showHistory}
                            onViewHistory={handleViewHistory}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IndexPage;