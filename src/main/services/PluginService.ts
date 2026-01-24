import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { PluginUITab } from '../../shared/types/media';

export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    main: string;
    author?: string;
    permissions?: string[];
}

export interface Plugin {
    manifest: PluginManifest;
    path: string;
    module: any;
    enabled: boolean;
}

export class PluginService extends EventEmitter {
    private pluginsPath: string;
    private plugins: Map<string, Plugin> = new Map();
    private uiRegistry: PluginUITab[] = [];

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
                        this.plugins.set(manifest.name, {
                            manifest,
                            path: pluginPath,
                            module: null,
                            enabled: true
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

    /**
     * Proxy events from the main app to plugins
     */
    public broadcastEvent(event: string, data: any) {
        this.emit(`ext:${event}`, data);
    }

    public getRegisteredTabs(): PluginUITab[] {
        return this.uiRegistry;
    }
}
