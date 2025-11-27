import React from 'react';
import { GenerationStatus, Image } from '../types';
import { Sparkles, Clock, Download } from 'lucide-react';

interface ArtDisplayProps {
    status: GenerationStatus;
    imageUrl?: string;
    history: Image[];
    showHistory: boolean;
    onViewHistory: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <h3 className="text-lg font-semibold text-white">A I.A. está criando...</h3>
        <p className="text-sm text-gray-400 max-w-xs">Isso pode levar até 30 segundos. A criatividade precisa de um tempinho para florescer!</p>
    </div>
);

const EmptyState: React.FC<{ onViewHistory: () => void; historyCount: number }> = ({ onViewHistory, historyCount }) => (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Sparkles size={48} className="text-primary/50" />
        <h3 className="text-lg font-semibold text-white">Sua arte aparecerá aqui</h3>
        <p className="text-sm text-gray-400 max-w-xs">Preencha os dados ao lado e clique em GERAR ARTE FLOW para começar.</p>
        <button 
            onClick={onViewHistory}
            className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
        >
            <Clock size={14} /> Ver Histórico ({historyCount})
        </button>
    </div>
);

const HistoryView: React.FC<{ history: Image[] }> = ({ history }) => (
    <div className="space-y-4 w-full">
        <h3 className="text-xl font-bold text-white text-center mb-4">Seu Histórico</h3>
        {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Você ainda não gerou nenhuma arte.</p>
        ) : (
            <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {history.map(item => (
                    <div key={item.id} className="group relative rounded-lg overflow-hidden aspect-square">
                        <img src={item.image_url} alt={item.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <a href={item.image_url} target="_blank" rel="noopener noreferrer" download className="p-3 bg-primary/80 rounded-full hover:bg-primary">
                                <Download size={20} className="text-white" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const ArtDisplay: React.FC<ArtDisplayProps> = ({ status, imageUrl, history, showHistory, onViewHistory }) => {
    const isGenerating = status === GenerationStatus.THINKING || status === GenerationStatus.GENERATING;

    const renderContent = () => {
        if (isGenerating) {
            return <LoadingSpinner />;
        }
        if (imageUrl) {
            return (
                <div className="space-y-4 animate-fade-in w-full">
                    <h3 className="text-xl font-bold text-white text-center">Sua arte está pronta!</h3>
                    <div className="relative group aspect-square">
                        <img src={imageUrl} alt="Arte gerada por IA" className="rounded-lg w-full h-full object-contain shadow-lg" />
                        <a 
                            href={imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download 
                            className="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Download size={16} /> Baixar
                        </a>
                    </div>
                     <button 
                        onClick={onViewHistory}
                        className="mt-4 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Clock size={14} /> Ver Histórico ({history.length})
                    </button>
                </div>
            );
        }
        if (showHistory) {
            return <HistoryView history={history} />;
        }
        return <EmptyState onViewHistory={onViewHistory} historyCount={history.length} />;
    };

    return (
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl h-full flex items-center justify-center sticky top-24 min-h-[600px]">
            {renderContent()}
        </div>
    );
};