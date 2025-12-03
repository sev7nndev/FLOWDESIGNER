import React from 'react';

const TestApp: React.FC = () => {
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
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Flow Designer</h1>
        <p>App está funcionando! ✅</p>
      </div>
    </div>
  );
};

export default TestApp;