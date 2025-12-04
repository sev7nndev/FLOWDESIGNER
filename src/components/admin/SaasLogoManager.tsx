import React, { useState, useCallback } from 'react';
import { Upload, Trash2, CheckCircle2, AlertTriangle, ImageUp } from 'lucide-react';
import { Button } from '../Button';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { FlowDesignerIcon } from '../FlowDesignerLogo';
import { User } from '@/types';

interface ImageUploadProps {
    onUpload: (file: File) => Promise<void>;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                setUploadError("Apenas arquivos de imagem são permitidos.");
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                setUploadError("O arquivo é muito grande (Máx: 5MB).");
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setUploadError(null);
            setUploadSuccess(false);
        }
    };

    const handleUpload = useCallback(async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            await onUpload(file); 
            setUploadSuccess(true);
            setFile(null);
            if (document.getElementById('logo-upload-input')) {
                (document.getElementById('logo-upload-input') as HTMLInputElement).value = '';
            }
        } catch (e: any) {
            setUploadError(e.message || "Falha no upload.");
        } finally {
            setIsUploading(false);
        }
    }, [file, onUpload]);

    return (
        <div className="p-4 border border-white/10 rounded-xl bg-zinc-800/50 space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
                <Upload size={18} className="text-primary" /> Upload de Novo Logo
            </h4>
            <input 
                type="file" 
                id="logo-upload-input"
                accept="image/*" 
                onChange={handleFileChange} 
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            
            {file && (
                <p className="text-xs text-gray-400">Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            )}

            {uploadError && (
                <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={14} /> {uploadError}</p>
            )}
            
            {uploadSuccess && (
                <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={14} /> Upload realizado com sucesso!</p>
            )}

            <Button 
                onClick={handleUpload} 
                isLoading={isUploading} 
                disabled={!file || isUploading}
                className="w-full h-10 text-sm"
            >
                {isUploading ? 'Enviando...' : 'Confirmar Upload'}
            </Button>
        </div>
    );
};

export const SaasLogoManager: React.FC<{ user: User, saasLogoUrl: string | null, refreshConfig: () => void }> = ({ saasLogoUrl, refreshConfig }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleUploadLogo = useCallback(async (file: File) => {
        setDeleteError(null);
        try {
            await api.uploadSaasLogo(file);
            toast.success("Logo atualizado com sucesso!");
            refreshConfig();
        } catch (e: any) {
            toast.error(e.message || "Falha ao fazer upload do logo.");
            throw e;
        }
    }, [refreshConfig]);
    
    const handleDeleteLogo = useCallback(async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await api.deleteSaasLogo();
            toast.success("Logo removido. Revertendo para o logo padrão.");
            refreshConfig();
        } catch (e: any) {
            setDeleteError(e.message || "Falha ao deletar o logo.");
            toast.error(e.message || "Falha ao deletar o logo.");
        } finally {
            setIsDeleting(false);
        }
    }, [refreshConfig]);

    return (
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <ImageUp size={20} className="text-primary" /> Gerenciamento do Logo Principal
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex items-center justify-center bg-black rounded-lg border border-white/10">
                        {saasLogoUrl ? (
                            <img src={saasLogoUrl} alt="Logo Atual" className="h-10 w-10 object-contain" />
                        ) : (
                            <FlowDesignerIcon size={24} className="text-primary" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Logo Atual</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{saasLogoUrl || 'Usando SVG Padrão'}</p>
                    </div>
                </div>
                
                {saasLogoUrl && (
                    <Button 
                        variant="danger" 
                        onClick={handleDeleteLogo}
                        isLoading={isDeleting}
                        className="h-8 px-3 text-xs"
                        icon={<Trash2 size={14} />}
                    >
                        Deletar
                    </Button>
                )}
            </div>
            
            {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{deleteError}</div>
            )}

            <ImageUpload onUpload={handleUploadLogo} />
            
            <p className="text-xs text-gray-500 pt-2">
                O upload de um novo arquivo substituirá o logo atual em todas as telas do aplicativo.
            </p>
        </div>
    );
};