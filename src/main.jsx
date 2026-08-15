import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return React.createElement(
    'main',
    {
      style: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        margin: 0,
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        background: '#f4f7fb'
      }
    },
    React.createElement(
      'div',
      {
        style: {
          background: '#fff',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,.08)'
        }
      },
      React.createElement('h1', null, 'ПУТЁВКА'),
      React.createElement('p', null, 'React работает'),
      React.createElement('p', null, 'Vercel работает')
    )
  );
}

createRoot(document.getElementById('root')).render(React.createElement(App));