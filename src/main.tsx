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
import './styles/document-projects.css';
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

const rootElement = document.getElementById('root');
const missingRootError = rootElement
  ? null
  : new Error('Root element not found. The built index.html may be incomplete.');

const mountElement =
  rootElement ??
  document.body.appendChild(Object.assign(document.createElement('div'), { id: 'root' }));

const root = createRoot(mountElement);

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

function reportStartupError(title: string, error: unknown) {
  const message = describeError(error);

  console.error(title, error);

  root.render(
    <StrictMode>
      <main className="boot-screen" role="alert">
        <div className="boot-screen-copy">
          <span>Startup failed</span>
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
      </main>
    </StrictMode>,
  );
}

window.addEventListener('error', (event) => {
  console.error('Uncaught error', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection', event.reason);
  event.preventDefault();
});

if (missingRootError) {
  reportStartupError('App shell could not be mounted', missingRootError);
} else {
  root.render(
    <StrictMode>
      <BootScreen />
    </StrictMode>,
  );
}

async function boot() {
  if (missingRootError) {
    return;
  }

  if (isTauri()) {
    try {
      await initDb();
      await initInstallDate();
      await seedBaseDocumentsIfNeeded();
      await resurfaceDueReminders();
    } catch (error) {
      reportStartupError('Local database could not be initialized', error);
      return;
    }
  }

  if (hasRemote) {
    void getSession()
      .then((session) => {
        if (session) {
          return syncRemoteProfile();
        }
        return undefined;
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
