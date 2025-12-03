import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Fatal: O elemento root não foi encontrado.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div style={{ 
        color: 'white', 
        fontSize: '24px', 
        textAlign: 'center',
        padding: '20px' 
      }}>
        <p>Teste de Renderização ✅</p>
        <p style={{ fontSize: '16px', color: '#a1a1aa', marginTop: '1rem' }}>
          Se você vê esta mensagem, o React está funcionando. O problema está no componente App.tsx.
        </p>
      </div>
    </React.StrictMode>
  );
}