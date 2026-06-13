import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/env';
import { getSession } from './lib/auth';
import { hasRemote } from './lib/env';
import { seedBaseDocumentsIfNeeded } from './lib/seedDocuments';
import { resurfaceDueReminders } from './lib/resurfaceReminders';
import { syncRemoteProfile } from './lib/syncRemoteProfile';
import { isTauri } from './lib/tauri';
import { initDb } from './store/db';
import { initInstallDate } from './store/onboarding.store';
import './plugins/index';
import App from './App';
import BootScreen from './components/shell/BootScreen';
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
import './styles/sidebar-edge-pull.css';
import './styles/settings.css';
import './styles/home.css';
import './styles/documents.css';
import './styles/atoms.css';
import './styles/bookmark-stack-folder.css';
import './styles/atom-popup.css';
import './styles/bookmark-stack-popup.css';
import './styles/confirm-dialog.css';
import './styles/profile.css';
import './styles/notifications.css';
import './styles/editor.css';

if (isTauri()) {
  document.documentElement.classList.add('is-tauri');
}

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <BootScreen />
  </StrictMode>,
);

async function boot() {
  if (isTauri()) {
    try {
      await initDb();
      await initInstallDate();
      await seedBaseDocumentsIfNeeded();
      await resurfaceDueReminders();
    } catch (error) {
      console.error('Failed to initialize local database', error);
    }
  }

  if (hasRemote) {
    void getSession()
      .then((session) => {
        if (session) {
          void syncRemoteProfile();
        }
      })
      .catch((err) => {
        console.warn('Remote session check failed — app continues offline:', err);
      });
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
