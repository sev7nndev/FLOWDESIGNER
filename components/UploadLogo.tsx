import React, { useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface UploadLogoProps {
    onLogoUpload: (file: File | null) => void;
    currentLogo: string | undefined;
    disabled: boolean;
}

// Max Base64 length for logo (approx 30KB original file size)
const MAX_LOGO_BASE64_LENGTH = 40000; 
const MAX_LOGO_KB = Math.round(MAX_LOGO_BASE64_LENGTH / 1.33 / 1024);

export const UploadLogo: React.FC<UploadLogoProps> = ({ onLogoUpload, currentLogo, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert("Apenas arquivos de imagem são permitidos.");
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (base64String.length > MAX_LOGO_BASE64_LENGTH) {
                    alert(`O logo é muito grande. O tamanho máximo permitido é de ${MAX_LOGO_KB}KB.`);
                    onLogoUpload(null);
                } else {
                    onLogoUpload(file); // Passa o File para o hook, que fará a conversão final
                }
            };
            reader.readAsDataURL(file);
        }
    }, [onLogoUpload]);
    
    const handleRemoveLogo = useCallback(() => {
        onLogoUpload(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onLogoUpload]);

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Logo da Empresa (Opcional)
            </label>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden"
                disabled={disabled}
            />

            {currentLogo ? (
                <div className="flex items-center justify-between p-3 bg-black/50 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <img 
                            src={currentLogo} 
                            alt="Logo Preview" 
                            className="h-8 w-8 object-contain bg-white p-1 rounded"
                        />
                        <span className="text-sm text-white">Logo Carregado</span>
                    </div>
                    <Button 
                        variant="danger" 
                        onClick={handleRemoveLogo} 
                        className="h-8 px-3 text-xs"
                        icon={<X size={14} />}
                        disabled={disabled}
                    >
                        Remover
                    </Button>
                </div>
            ) : (
                <Button 
                    variant="secondary" 
                    onClick={handleButtonClick} 
                    className="w-full h-12 text-sm"
                    icon={<Upload size={16} />}
                    disabled={disabled}
                >
                    Fazer Upload do Logo (Máx: {MAX_LOGO_KB}KB)
                </Button>
            )}
            <p className="text-xs text-gray-500">O logo será incorporado na arte gerada pela IA.</p>
        </div>
    );
};