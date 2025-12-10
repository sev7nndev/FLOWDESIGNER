// @ts-check
// Force Refresh 2025-12-08
import React, { useState, useRef } from 'react';
import { Upload, Wand2, Download, Loader2, Type, MapPin, Mail, Phone, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

interface LayoutItem {
    type: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color?: string;
    align?: CanvasTextAlign;
    fontWeight?: string;
    strokeColor?: string;
    strokeWidth?: number;
    shadowColor?: string;
    shadowBlur?: number;
    backgroundColor?: string;
    padding?: number;
    textShadow?: string;
    rotation?: number;
}

interface LayoutData {
    layout: LayoutItem[];
    analysis: string;
}

const AITextOverlay = () => {
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LayoutData | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [formData, setFormData] = useState({
        titulo: '',
        subtitulo: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        endereco: '',
        email: '',
        descricao: ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const analyzeImageAndGenerateLayout = async () => {
        if (!image || !imagePreview) {
            toast.error('Por favor, carregue uma imagem primeiro!');
            return;
        }

        setLoading(true);

        try {
            // Safe Token Retrieval
            let token = '';
            const storageItem = localStorage.getItem('supabase.auth.token');
            if (storageItem) {
                try {
                    const parsed = JSON.parse(storageItem);
                    token = parsed.currentSession?.access_token || '';
                } catch (e) {
                    console.warn('Failed to parse auth token', e);
                }
            }

            const response = await fetch("http://localhost:3001/api/analyze-layout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    imageBase64: imagePreview,
                    formData: formData
                })
            });

            if (!response.ok) throw new Error('Falha na análise da IA');

            const layoutData: LayoutData = await response.json();

            setResult(layoutData);

            // Render on canvas
            await renderCanvas(layoutData);
            toast.success("Design Inteligente Gerado!");

        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao processar com IA. Tentando layout padrão...');
            createDefaultLayout();
        } finally {
            setLoading(false);
        }
    };

    const createDefaultLayout = () => {
        const defaultLayout: LayoutData = {
            layout: [
                formData.titulo && {
                    type: "titulo",
                    text: formData.titulo,
                    x: 50,
                    y: 15,
                    fontSize: 60,
                    fontFamily: "Impact",
                    color: "#FFFFFF",
                    align: "center" as CanvasTextAlign,
                    fontWeight: "bold",
                    strokeColor: "#000000",
                    strokeWidth: 4,
                    shadowColor: "rgba(0,0,0,1)",
                    shadowBlur: 10
                },
                formData.subtitulo && {
                    type: "subtitulo",
                    text: formData.subtitulo,
                    x: 50,
                    y: 25,
                    fontSize: 30,
                    fontFamily: "Arial",
                    color: "#FFD700",
                    align: "center" as CanvasTextAlign,
                    fontWeight: "bold",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    padding: 8
                },
                formData.whatsapp && {
                    type: "contact",
                    text: `WhatsApp: ${formData.whatsapp}`,
                    x: 50,
                    y: 85,
                    fontSize: 24,
                    fontFamily: "Arial",
                    color: "#FFFFFF",
                    align: "center" as CanvasTextAlign,
                    backgroundColor: "#25D366",
                    padding: 5,
                    fontWeight: "bold"
                },
                formData.instagram && {
                    type: "contact",
                    text: `@${formData.instagram}`,
                    x: 50,
                    y: 90,
                    fontSize: 24,
                    fontFamily: "Arial",
                    color: "#FFFFFF",
                    align: "center" as CanvasTextAlign,
                    textShadow: "2px 2px 4px #000"
                },
                formData.endereco && {
                    type: "address",
                    text: formData.endereco,
                    x: 50,
                    y: 95,
                    fontSize: 20,
                    fontFamily: "Arial",
                    color: "#FFFFFF",
                    align: "center" as CanvasTextAlign,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    padding: 5
                }
            ].filter(Boolean) as LayoutItem[],
            analysis: "Layout padrão aplicado devido a erro na IA."
        };

        setResult(defaultLayout);
        renderCanvas(defaultLayout);
    };

    const renderCanvas = async (layoutData: LayoutData) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw Base Image
            ctx.drawImage(img, 0, 0);

            layoutData.layout.forEach((item) => {
                ctx.save();

                const x = (item.x / 100) * canvas.width;
                const y = (item.y / 100) * canvas.height;

                // Font Setup
                const fontSize = item.fontSize || 40;
                ctx.font = `${item.fontWeight || 'bold'} ${fontSize}px ${item.fontFamily || 'Arial'}`;
                ctx.textAlign = item.align || 'center';
                ctx.textBaseline = 'middle';

                // Rotation
                if (item.rotation) {
                    ctx.translate(x, y);
                    ctx.rotate((item.rotation * Math.PI) / 180);
                    ctx.translate(-x, -y);
                }

                // Measure Text 
                const text = item.text || '';
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const textHeight = fontSize;

                // Background Box
                if (item.backgroundColor) {
                    const pad = item.padding || 10;
                    ctx.fillStyle = item.backgroundColor;

                    let boxX = x;
                    if (item.align === 'center') boxX = x - (textWidth / 2);
                    if (item.align === 'right') boxX = x - textWidth;

                    ctx.fillRect(boxX - pad, y - (textHeight / 2) - pad, textWidth + (pad * 2), textHeight + (pad * 2));
                }

                // Shadows
                if (item.textShadow) {
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 4;
                    ctx.shadowOffsetY = 4;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 5;
                }

                // Stroke
                if (item.strokeColor) {
                    ctx.strokeStyle = item.strokeColor;
                    ctx.lineWidth = item.strokeWidth || 3;
                    ctx.strokeText(text, x, y);
                }

                // Fill Text
                ctx.fillStyle = item.color || '#FFFFFF';
                ctx.fillText(text, x, y);

                ctx.restore();
            });
        };

        img.src = imagePreview || '';
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'arte-profissional.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 rounded-xl">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">🎨 Smart Designer (IA)</h1>
                    <p className="text-purple-200">A IA analisa sua imagem e posiciona os textos onde não atrapalha!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* INPUT PANEL */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <Upload className="mr-2" /> 1. Upload & Dados
                        </h2>

                        <div className="mb-4">
                            <label className="block w-full">
                                <div className="border-4 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-500 cursor-pointer transition-all bg-purple-50">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 mx-auto text-purple-500 mb-2" />
                                            <p className="text-gray-600">Clique para carregar a arte base</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>

                        <div className="space-y-3">
                            <input type="text" name="titulo" placeholder="📌 Título Principal" value={formData.titulo} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200" />
                            <input type="text" name="subtitulo" placeholder="📝 Subtítulo (Opcional)" value={formData.subtitulo} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200" />
                            <input type="text" name="whatsapp" placeholder="📱 WhatsApp" value={formData.whatsapp} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200" />
                            <input type="text" name="instagram" placeholder="📷 Instagram" value={formData.instagram} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200" />
                            <input type="text" name="endereco" placeholder="📍 Endereço" value={formData.endereco} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border-2 border-gray-200" />
                        </div>

                        <button
                            onClick={analyzeImageAndGenerateLayout}
                            disabled={loading || !image}
                            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center transform hover:scale-[1.02]"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                            {loading ? 'IA Analisando Layout...' : 'Gerar Design Inteligente'}
                        </button>
                    </div>

                    {/* PREVIEW PANEL */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ Resultado Final</h2>

                        <div className="bg-gray-100 rounded-xl p-4 mb-4 min-h-[500px] flex items-center justify-center overflow-hidden">
                            {result ? (
                                <div className="w-full">
                                    <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-lg" />
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Type className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>A arte final aparecerá aqui</p>
                                </div>
                            )}
                        </div>

                        {result && (
                            <button onClick={downloadImage} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg flex items-center justify-center">
                                <Download className="mr-2" /> Baixar Imagem Pronta
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITextOverlay;
