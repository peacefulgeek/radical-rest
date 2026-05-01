import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

declare global {
  interface Window {
    __SSR_DATA__: any;
  }
}

const data = (window as any).__SSR_DATA__ || {};

hydrateRoot(
  document.getElementById('app')!,
  <BrowserRouter>
    <App data={data} />
  </BrowserRouter>
);
