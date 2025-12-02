import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppContent } from './AppContent';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};