/**
 * @file main.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Mounts the Family Feud SPA into the root DOM node.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/index.css';

import AuthProvider from './components/auth/AuthProvider.jsx';
import { AccountsProvider } from './context/accounts.context.jsx';
import { QuestionsProvider } from './context/questions.context.jsx';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AccountsProvider>
        <QuestionsProvider>
          <App />
        </QuestionsProvider>
      </AccountsProvider>
    </AuthProvider>
  </StrictMode>,
);
