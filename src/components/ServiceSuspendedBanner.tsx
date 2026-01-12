import React from 'react';

export const ServiceSuspendedBanner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-red-900/95 backdrop-blur-sm text-white p-6 text-center">
      <div className="max-w-2xl bg-black/40 p-8 rounded-2xl border-4 border-red-500 shadow-2xl animate-pulse">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 uppercase tracking-wider drop-shadow-lg">
          ⚠️ SITE PARADO ⚠️
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-red-100">
          POR FALTA DE PAGAMENTO
        </h2>
        <div className="space-y-4 text-lg md:text-xl font-medium text-gray-100">
          <p>
            O acesso a este sistema foi temporariamente suspenso.
          </p>
          <p className="bg-red-800/50 p-4 rounded-lg border border-red-400/30">
            Para restabelecer o acesso, o proprietário deve regularizar a pendência financeira.
          </p>
          <p className="text-sm opacity-75 mt-8">
            Entre em contato com o suporte técnico para regularização.
          </p>
        </div>
      </div>
    </div>
  );
};
