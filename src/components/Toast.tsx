import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'loading';

interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// --- Componente de Item de Toast ---

interface ToastItemProps {
    toast: ToastItem;
    onClose: (id: string) => void;
}

const ToastItemComponent: React.FC<ToastItemProps> = ({ toast, onClose }) => {
    const { id, message, variant, duration = 5000 } = toast;

    useEffect(() => {
        if (variant !== 'loading') {
            const timer = setTimeout(() => onClose(id), duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose, variant]);

    const variantStyles = {
        success: 'bg-green-600 border-green-700',
        error: 'bg-red-600 border-red-700',
        info: 'bg-blue-600 border-blue-700',
        loading: 'bg-primary border-primary/80',
    };

    const Icon = {
        success: CheckCircle,
        error: AlertTriangle,
        info: Info,
        loading: Loader2,
    }[variant];

    return (
        <div
            className={cn(
                "relative flex items-center p-4 rounded-lg shadow-xl text-white border transition-all duration-300 transform translate-x-0 opacity-100",
                variantStyles[variant]
            )}
        >
            <Icon size={20} className={cn("flex-shrink-0 mr-3", variant === 'loading' && 'animate-spin')} />
            <p className="text-sm font-medium flex-grow">{message}</p>
            
            {variant !== 'loading' && (
                <button onClick={() => onClose(id)} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0">
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

// --- Componente de Container e Provider ---

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration?: number) => {
        const id = Date.now().toString();
        const newToast: ToastItem = { id, message, variant, duration };
        setToasts((prev) => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[2000] space-y-3 max-w-xs w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItemComponent toast={toast} onClose={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};