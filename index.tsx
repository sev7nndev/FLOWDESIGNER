import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('index.tsx carregado');

const rootElement = document.getElementById('root');
console.log('Elemento root:', rootElement);

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log('Root criado');

// Teste simples
const Teste = () => {
  console.log('Componente Teste renderizando');
  return React.createElement('div', {
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
  }, 'TESTE REACT');

};

root.render(React.createElement(Teste));