// One job: define the plugin contract and maintain the registry.
// No plugins are built yet — this is the architecture only.
// Plugins register themselves by importing this file and calling registerPlugin().

export interface LociPlugin {
  slug: string;
  name: string;
  description: string;
  tier: 'standard' | 'modern_writer';
  version: string;

  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onNoteOpen?: (fileId: string) => Promise<void>;
  onNoteClose?: (fileId: string, wordCount: number) => Promise<void>;
  onBookmark?: (bookmark: { text: string; type: string }) => Promise<void>;
}

type PluginHook = keyof Pick<
  LociPlugin,
  'onInstall' | 'onUninstall' | 'onNoteOpen' | 'onNoteClose' | 'onBookmark'
>;

type PluginHookArgs = {
  onInstall: [];
  onUninstall: [];
  onNoteOpen: [fileId: string];
  onNoteClose: [fileId: string, wordCount: number];
  onBookmark: [bookmark: { text: string; type: string }];
};

const _registry = new Map<string, LociPlugin>();

export function registerPlugin(plugin: LociPlugin): void {
  if (_registry.has(plugin.slug)) {
    console.warn(`Plugin '${plugin.slug}' already registered — skipping`);
    return;
  }
  _registry.set(plugin.slug, plugin);
}

export function getPlugin(slug: string): LociPlugin | undefined {
  return _registry.get(slug);
}

export function getAllPlugins(): LociPlugin[] {
  return Array.from(_registry.values());
}

export function getInstalledPlugins(entitlements: string[]): LociPlugin[] {
  return getAllPlugins().filter(
    (plugin) => plugin.tier === 'standard' || entitlements.includes(plugin.slug),
  );
}

export async function dispatchHook<H extends PluginHook>(
  hook: H,
  entitlements: string[],
  ...args: PluginHookArgs[H]
): Promise<void> {
  const plugins = getInstalledPlugins(entitlements);
  for (const plugin of plugins) {
    const fn = plugin[hook];
    if (typeof fn !== 'function') continue;
    try {
      await (fn as (...fnArgs: PluginHookArgs[H]) => Promise<void>)(...args);
    } catch (err) {
      console.warn(`Plugin '${plugin.slug}' hook '${hook}' failed:`, err);
    }
  }
}
