import { useId } from 'react';

import SettingsFontChoiceControl from '../components/settings/SettingsFontChoiceControl';
import SettingsFontSizeControl from '../components/settings/SettingsFontSizeControl';
import SettingsRow from '../components/settings/SettingsRow';
import SettingsSection from '../components/settings/SettingsSection';
import AppleToggle from '../components/ui/AppleToggle';
import { useDefaultEditorFontSetting } from '../hooks/useDefaultEditorFontSetting';
import { useDefaultFontSizeSetting } from '../hooks/useDefaultFontSizeSetting';
import { useEditorModeDefaultSettings } from '../hooks/useEditorModeDefaultSettings';
import { useOpenAIKeySetting } from '../hooks/useOpenAIKeySetting';
import { useTypewriterSoundSetting } from '../hooks/useTypewriterSoundSetting';

const appVersion = '0.0.0';

export default function SettingsView() {
  const typewriterSoundId = useId();
  const focusModeId = useId();
  const authorshipId = useId();
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
    authorship,
    bookmarkHighlight,
    focusMode,
    ready: modeDefaultsReady,
    toggleAuthorship,
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
            description="Show paste provenance wash when a note opens"
            label="Default authorship highlights"
          >
            <AppleToggle
              checked={authorship}
              disabled={!modeDefaultsReady}
              id={authorshipId}
              label="Default authorship highlights"
              layout="switch-only"
              onChange={toggleAuthorship}
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

        <SettingsSection title="Keyboard shortcuts">
          <SettingsRow label="Open outline">
            <input className="settings-input" disabled type="text" value="⌘⇧O" readOnly />
          </SettingsRow>
          <SettingsRow label="Bookmark selection">
            <input className="settings-input" disabled type="text" value="⌘⇧A" readOnly />
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
