import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppContent } from './AppContent';
import { Toaster } from 'sonner'; // Importando Toaster

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Toaster richColors theme="dark" position="top-right" />
      <AppContent />
    </ErrorBoundary>
  );
};