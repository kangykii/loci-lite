import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/env';
import App from './App';
import { isTauri } from './lib/tauri';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import './styles/tokens.css';
import './styles/scrollbars.css';
import './styles/transitions.css';
import './styles/base.css';
import './styles/segmented-control.css';
import './styles/shell.css';
import './styles/search-field.css';
import './styles/sidebar.css';
import './styles/settings.css';
import './styles/home.css';
import './styles/documents.css';
import './styles/atoms.css';
import './styles/bookmark-stack-folder.css';
import './styles/atom-popup.css';
import './styles/bookmark-stack-popup.css';
import './styles/confirm-dialog.css';
import './styles/notifications.css';
import './styles/editor.css';

if (isTauri()) {
  document.documentElement.classList.add('is-tauri');
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
