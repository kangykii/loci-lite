import { useId } from 'react';

import SettingsFontChoiceControl from '../components/settings/SettingsFontChoiceControl';
import SettingsFontSizeControl from '../components/settings/SettingsFontSizeControl';
import SettingsRow from '../components/settings/SettingsRow';
import SettingsSection from '../components/settings/SettingsSection';
import SettingsThemePicker from '../components/settings/SettingsThemePicker';
import AppleToggle from '../components/ui/AppleToggle';
import { useDefaultEditorFontSetting } from '../hooks/useDefaultEditorFontSetting';
import { useDefaultFontSizeSetting } from '../hooks/useDefaultFontSizeSetting';
import { useEditorModeDefaultSettings } from '../hooks/useEditorModeDefaultSettings';
import { useOpenAIKeySetting } from '../hooks/useOpenAIKeySetting';
import { useTypewriterSoundSetting } from '../hooks/useTypewriterSoundSetting';
import type { Theme, ThemeDefaults } from '../lib/theme';

const appVersion = '0.0.0';

type SettingsViewProps = {
  theme: Theme;
  themeDefaults: ThemeDefaults;
  onThemeSelect: (theme: Theme) => void;
  onThemeDefaultSelect: (theme: Theme) => void;
};

export default function SettingsView({ onThemeDefaultSelect, onThemeSelect, theme, themeDefaults }: SettingsViewProps) {
  const typewriterSoundId = useId();
  const focusModeId = useId();
  const bookmarkHighlightId = useId();
  const openAIKeyId = useId();
  const { soundOn, soundReady, toggleSound } = useTypewriterSoundSetting();
  const {
    apiKey: openAIKey,
    ready: openAIKeyReady,
    setApiKey: setOpenAIKey,
  } = useOpenAIKeySetting();
  const {
    fontChoice,
    ready: editorFontReady,
    selectFont,
  } = useDefaultEditorFontSetting();
  const {
    atMax,
    atMin,
    fontSize,
    ready: fontSizeReady,
    stepDown,
    stepUp,
  } = useDefaultFontSizeSetting();
  const {
    bookmarkHighlight,
    focusMode,
    ready: modeDefaultsReady,
    toggleBookmarkHighlight,
    toggleFocusMode,
  } = useEditorModeDefaultSettings();

  return (
    <main className="app-shell settings-view">
      <div className="settings-stack">
        <h1 className="settings-page-title">Settings</h1>

        <SettingsSection title="Editor">
          <SettingsRow description="Applied to all notes" label="Editor font">
            <SettingsFontChoiceControl
              disabled={!editorFontReady}
              fontChoice={fontChoice}
              onSelect={(choice) => void selectFont(choice)}
            />
          </SettingsRow>
          <SettingsRow
            description="Starting size for new notes; per-note overrides from the editor bar arrows"
            label="Default font size"
          >
            <SettingsFontSizeControl
              atMax={atMax}
              atMin={atMin}
              disabled={!fontSizeReady}
              fontSize={fontSize}
              onStepDown={stepDown}
              onStepUp={stepUp}
            />
          </SettingsRow>
          <SettingsRow description="Dim paragraphs outside the active block" label="Default focus mode">
            <AppleToggle
              checked={focusMode}
              disabled={!modeDefaultsReady}
              id={focusModeId}
              label="Default focus mode"
              layout="switch-only"
              onChange={toggleFocusMode}
            />
          </SettingsRow>
          <SettingsRow
            description="Show bookmark highlight wash when a note opens; per-session toggle stays in the editor overflow menu"
            label="Default bookmark highlight"
          >
            <AppleToggle
              checked={bookmarkHighlight}
              disabled={!modeDefaultsReady}
              id={bookmarkHighlightId}
              label="Default bookmark highlight"
              layout="switch-only"
              onChange={toggleBookmarkHighlight}
            />
          </SettingsRow>
          <SettingsRow
            description="Subtle keyclick feedback while typing"
            label="Typewriter sounds"
          >
            <AppleToggle
              checked={soundOn}
              disabled={!soundReady}
              id={typewriterSoundId}
              label="Typewriter sounds"
              layout="switch-only"
              onChange={toggleSound}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Personalisation">
          <div className="settings-theme-section">
            <div>
              <h3 className="settings-theme-title">Notebook theme</h3>
              <p className="settings-row-description">Click to apply. Double-click a cover to make it the Sun or Moon sidebar quick-switch default.</p>
            </div>
            <SettingsThemePicker
              onSelect={onThemeSelect}
              onSetDefault={onThemeDefaultSelect}
              theme={theme}
              themeDefaults={themeDefaults}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Keyboard shortcuts">
          <SettingsRow label="Open outline">
            <input className="settings-input" disabled type="text" value="⌘⇧O" readOnly />
          </SettingsRow>
          <SettingsRow label="Save document">
            <input className="settings-input" disabled type="text" value="⌘S" readOnly />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="AI">
          <SettingsRow label="Provider">
            <input className="settings-input" disabled placeholder="OpenAI" type="text" />
          </SettingsRow>
          <SettingsRow
            description="Stored locally for welcome-message generation"
            label="API key"
          >
            <div className="settings-ai-key-control">
              <input
                autoComplete="off"
                className="settings-input settings-api-key-input"
                disabled={!openAIKeyReady}
                id={openAIKeyId}
                onChange={(event) => void setOpenAIKey(event.target.value)}
                placeholder={openAIKeyReady ? 'sk-...' : 'Loading'}
                type="password"
                value={openAIKey}
              />
              <span className="settings-hint" role="status">
                {openAIKey ? 'Saved locally' : 'Required for AI welcome'}
              </span>
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsRow label="Export atoms">
            <button className="settings-text-button" disabled type="button">
              Coming soon
            </button>
          </SettingsRow>
          <SettingsRow label="Clear local cache">
            <button className="settings-text-button" disabled type="button">
              Coming soon
            </button>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="Version">
            <span className="settings-meta">
              Loci Notepad <span className="settings-version">{appVersion}</span>
            </span>
          </SettingsRow>
        </SettingsSection>
      </div>
    </main>
  );
}
