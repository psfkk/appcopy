import React from 'react';
import ReactDOM from 'react-dom/client';
import MinhwaApp from './MinhwaApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <MinhwaApp />
  </React.StrictMode>
);
