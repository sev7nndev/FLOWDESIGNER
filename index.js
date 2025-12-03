import React from 'react';
import { createRoot } from 'react-dom/client';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  React.createElement('div', {
    style: {
      width: '100vw',
      height: '100vh',
      backgroundColor: '#09090b',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter'
    }
  }, 'REACT ESTÁ FUNCIONANDO!')
);