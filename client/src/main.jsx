/**
 * @file main.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Mounts the Family Feud SPA into the root DOM node.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
