import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { PluginUITab, GingerMediaProvider, MediaSource } from '../../shared/types/media';

export interface PluginSetting {
    id: string;
    label: string;
    type: 'boolean' | 'string' | 'number' | 'select';
    default: any;
    options?: { label: string; value: any }[];
}

export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    main: string;
    author?: string;
    permissions?: string[];
    settingsSchema?: PluginSetting[];
}

export interface Plugin {
    manifest: PluginManifest;
    path: string;
    module: any;
    enabled: boolean;
    settings: Record<string, any>;
}

export class PluginService extends EventEmitter {
    private pluginsPath: string;
    private plugins: Map<string, Plugin> = new Map();
    private uiRegistry: PluginUITab[] = [];
    private providerRegistry: Map<string, GingerMediaProvider> = new Map();

    constructor() {
        super();
        const userDataPath = app.getPath('userData');
        this.pluginsPath = path.join(userDataPath, 'plugins');
        
        if (!fs.existsSync(this.pluginsPath)) {
            fs.mkdirSync(this.pluginsPath, { recursive: true });
        }
    }

    public async init() {
        console.log('[PluginService] Initializing...');
        await this.discoverPlugins();
        await this.loadPlugins();
    }

    private async discoverPlugins() {
        const dirs = fs.readdirSync(this.pluginsPath, { withFileTypes: true });
        
        for (const dir of dirs) {
            if (dir.isDirectory()) {
                const pluginPath = path.join(this.pluginsPath, dir.name);
                const manifestPath = path.join(pluginPath, 'manifest.json');
                
                if (fs.existsSync(manifestPath)) {
                    try {
                        const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                        
                        // Load stored settings or pick defaults
                        const settingsPath = path.join(pluginPath, 'settings.json');
                        let storedSettings: Record<string, any> = {};
                        if (fs.existsSync(settingsPath)) {
                            try {
                                storedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                            } catch (e) {
                                console.error(`[PluginService] Failed to load settings for ${manifest.name}:`, e);
                            }
                        }

                        const settings: Record<string, any> = {};
                        if (manifest.settingsSchema) {
                            for (const schema of manifest.settingsSchema) {
                                settings[schema.id] = storedSettings[schema.id] ?? schema.default;
                            }
                        }

                        this.plugins.set(manifest.name, {
                            manifest,
                            path: pluginPath,
                            module: null,
                            enabled: true,
                            settings
                        });
                        console.log(`[PluginService] Discovered plugin: ${manifest.name} v${manifest.version}`);
                    } catch (e) {
                        console.error(`[PluginService] Failed to parse manifest for ${dir.name}:`, e);
                    }
                }
            }
        }
    }

    private async loadPlugins() {
        for (const [name, plugin] of this.plugins) {
            if (plugin.enabled) {
                try {
                    const entryPoint = path.join(plugin.path, plugin.manifest.main);
                    
                    // Define the API exposed to the plugin
                    const gingerAPI = {
                        version: app.getVersion(),
                        env: process.env.NODE_ENV,
                        logger: {
                            info: (msg: string) => console.log(`[Plugin:${name}] ${msg}`),
                            error: (msg: string) => console.error(`[Plugin:${name}] ${msg}`)
                        },
                        events: {
                            on: (event: string, callback: any) => this.on(`ext:${event}`, callback),
                            emit: (event: string, data: any) => this.emit(`ext:${event}`, data)
                        },
                        ui: {
                            registerTab: (tab: PluginUITab) => {
                                this.uiRegistry.push({ ...tab, pluginName: name });
                                this.emit('ui-updated');
                            }
                        },
                        providers: {
                            register: (provider: GingerMediaProvider) => {
                                this.providerRegistry.set(provider.id, provider);
                                console.log(`[PluginService] Provider registered: ${provider.id} by ${name}`);
                                this.emit('providers-updated');
                            }
                        },
                        settings: {
                            get: (key: string) => plugin.settings[key],
                            onChanged: (callback: (settings: Record<string, any>) => void) => {
                                this.on(`plugin-settings-updated:${name}`, callback);
                            }
                        }
                    };

                    // Load module - handling ESM/CJS differences
                    // In a production app, we might use a sandbox
                    const mod = await import(entryPoint);
                    
                    // Initialize plugin if it exports an 'init' or 'default' function
                    const initFn = mod.init || mod.default;
                    if (typeof initFn === 'function') {
                        await initFn(gingerAPI);
                    }

                    plugin.module = mod;
                    console.log(`[PluginService] Loaded plugin: ${name}`);
                    this.emit('plugin-loaded', name);
                } catch (e) {
                    console.error(`[PluginService] Failed to load plugin ${name}:`, e);
                }
            }
        }
    }

    public getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    public async updatePluginSetting(pluginName: string, key: string, value: any) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) return;

        plugin.settings[key] = value;
        const settingsPath = path.join(plugin.path, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(plugin.settings, null, 2));
        
        this.emit(`plugin-settings-updated:${pluginName}`, plugin.settings);
        this.emit('plugins-updated'); // UI refresh
    }

    /**
     * Proxy events from the main app to plugins
     */
    public broadcastEvent(event: string, data: any) {
        this.emit(`ext:${event}`, data);
    }

    public getRegisteredTabs(): PluginUITab[] {
        return this.uiRegistry;
    }

    public getProviders(): GingerMediaProvider[] {
        return Array.from(this.providerRegistry.values());
    }

    public async browseProvider(providerId: string, path?: string): Promise<MediaSource[]> {
        const provider = this.providerRegistry.get(providerId);
        if (!provider || !provider.browse) return [];
        return provider.browse(path);
    }

    public async searchProviders(query: string): Promise<MediaSource[]> {
        const results: MediaSource[] = [];
        for (const provider of this.providerRegistry.values()) {
            if (provider.search) {
                const provResults = await provider.search(query);
                results.push(...provResults);
            }
        }
        return results;
    }

    public async resolveSource(source: MediaSource): Promise<string> {
        if (source.type !== 'provider' || !source.providerId) return '';
        const provider = this.providerRegistry.get(source.providerId);
        if (!provider || !provider.resolve) return '';
        return provider.resolve(source);
    }
}
