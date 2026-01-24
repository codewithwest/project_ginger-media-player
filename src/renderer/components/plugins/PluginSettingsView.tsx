import { usePluginStore } from '../../state/plugins';
import { 
    Puzzle, 
    Settings2, 
    X, 
    Info, 
    CheckCircle2, 
    ExternalLink,
    ToggleRight,
    Type,
    Hash,
    ChevronDown
} from 'lucide-react';

interface PluginSettingsViewProps {
  onClose: () => void;
}

export function PluginSettingsView({ onClose }: PluginSettingsViewProps) {
  const { plugins, updateSetting } = usePluginStore();

  const handleToggle = (pluginName: string, settingId: string, currentValue: boolean) => {
      updateSetting(pluginName, settingId, !currentValue);
  };

  const handleInputChange = (pluginName: string, settingId: string, value: string | number) => {
      updateSetting(pluginName, settingId, value);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] glass-dark rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
                <Puzzle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Plugin Extensions</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{plugins.length} active modules found</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {plugins.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                    <Puzzle className="w-16 h-16 mb-4" />
                    <p className="text-sm font-medium">No plugins loaded</p>
                    <p className="text-xs">Add JS files to the plugins folder to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {plugins.map((plugin) => (
                        <div key={plugin.manifest.name} className="flex flex-col bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all">
                            {/* Plugin Summary */}
                            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5">
                                            <Settings2 className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-none mb-1">{plugin.manifest.name}</h3>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-500/10 px-2 py-0.5 rounded-full">v{plugin.manifest.version}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">{plugin.manifest.description || 'No description provided.'}</p>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Info className="w-3 h-3" /> By {plugin.manifest.author || 'Anonymous'}</span>
                                </div>
                            </div>

                            {/* Settings Schema */}
                            <div className="p-6 space-y-6 flex-1">
                                {plugin.manifest.settingsSchema?.length > 0 ? (
                                    plugin.manifest.settingsSchema.map((schema: any) => (
                                        <div key={schema.id} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    {schema.type === 'boolean' && <ToggleRight className="w-3 h-3" />}
                                                    {schema.type === 'string' && <Type className="w-3 h-3" />}
                                                    {schema.type === 'number' && <Hash className="w-3 h-3" />}
                                                    {schema.label}
                                                </label>
                                            </div>

                                            {schema.type === 'boolean' ? (
                                                <button 
                                                    onClick={() => handleToggle(plugin.manifest.name, schema.id, plugin.settings[schema.id])}
                                                    className={`relative w-12 h-6 rounded-full transition-all flex items-center px-1 ${plugin.settings[schema.id] ? 'bg-indigo-500' : 'bg-white/10'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${plugin.settings[schema.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            ) : schema.type === 'select' ? (
                                                <div className="relative group">
                                                    <select 
                                                        value={plugin.settings[schema.id]}
                                                        onChange={(e) => handleInputChange(plugin.manifest.name, schema.id, e.target.value)}
                                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white appearance-none outline-none focus:border-indigo-500/50 transition-all"
                                                    >
                                                        {schema.options?.map((opt: any) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-indigo-400" />
                                                </div>
                                            ) : (
                                                <input 
                                                    type={schema.type === 'number' ? 'number' : 'text'}
                                                    value={plugin.settings[schema.id]}
                                                    onChange={(e) => handleInputChange(plugin.manifest.name, schema.id, e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full opacity-20">
                                         <p className="text-[10px] font-bold uppercase tracking-widest">No configurable settings</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase flex items-center gap-1.5 transition-all">
                                    <ExternalLink className="w-3 h-3" /> View Permissions
                                </button>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                    <CheckCircle2 className="w-3 h-3" /> Ready
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 px-8 border-t border-white/5 bg-black/20 flex items-center justify-center text-[10px] text-gray-500 uppercase font-black tracking-widest">
            Ginger Plugin Sandbox v1.4.0 • Dynamic Core Enabled
        </div>
      </div>
    </div>
  );
}
