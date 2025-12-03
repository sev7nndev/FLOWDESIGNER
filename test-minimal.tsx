import React from 'react';

const TestMinimal: React.FC = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#09090b', 
      color: '#fafafa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#8b5cf6' }}>Flow Designer</h1>
        <p style={{ fontSize: '1.2rem' }}>React está funcionando! ✅</p>
        <p style={{ fontSize: '0.9rem', marginTop: '1rem', color: '#a1a1aa' }}>Se você vê isso, o problema está no App.tsx</p>
      </div>
    </div>
  );
};

export default TestMinimal;