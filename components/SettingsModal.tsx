import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, AlertCircle, Volume2, VolumeX, Server, Save, X, Monitor, Palette, Wand2, Check, Sun, Moon, Gauge } from 'lucide-react';
import { GameSettings, Theme } from '../types';
import { AiService } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApiKey: string;
  initialBaseUrl: string;
  initialModel: string;
  initialSettings: GameSettings;
  onSaveApi: (key: string, baseUrl: string, model: string) => void;
  onSaveSettings: (settings: GameSettings) => void;
  forceOpen?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  initialApiKey,
  initialBaseUrl,
  initialModel,
  initialSettings,
  onSaveApi,
  onSaveSettings,
  forceOpen = false
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'audio' | 'ui'>(forceOpen ? 'api' : 'ui');
  
  // API State
  const [key, setKey] = useState(initialApiKey);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [model, setModel] = useState(initialModel);
  const [apiError, setApiError] = useState('');

  // Audio State
  const [ttsEnabled, setTtsEnabled] = useState(initialSettings.ttsEnabled);
  const [ttsVolume, setTtsVolume] = useState(initialSettings.ttsVolume);
  const [ttsRate, setTtsRate] = useState(initialSettings.ttsRate || 1.0);

  // UI State
  const [uiScale, setUiScale] = useState(initialSettings.uiScale || 1.0);
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialSettings.theme || {
      name: 'Default',
      colors: { 
          dark: '#1a1b1e', 
          panel: '#25262b', 
          gold: '#c2b36e', 
          red: '#e03131', 
          blue: '#1971c2', 
          text: '#c1c2c5', 
          muted: '#909296',
          diceBg: '#111111',
          diceText: '#c2b36e',
          diceBorder: '#c2b36e'
      }
  });
  
  // Theme Generation State
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [generatedThemes, setGeneratedThemes] = useState<Theme[]>([]);
  const [allowLightThemes, setAllowLightThemes] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setKey(initialApiKey);
        setBaseUrl(initialBaseUrl);
        setModel(initialModel);
        setTtsEnabled(initialSettings.ttsEnabled);
        setTtsVolume(initialSettings.ttsVolume);
        setTtsRate(initialSettings.ttsRate || 1.0);
        setUiScale(initialSettings.uiScale || 1.0);
        if (initialSettings.theme) setCurrentTheme(initialSettings.theme);
        if (forceOpen) setActiveTab('api');
        setGeneratedThemes([]); // Clear generated list on open
    }
  }, [isOpen, initialApiKey, initialBaseUrl, initialModel, initialSettings, forceOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!key.trim().startsWith('sk-')) {
      setApiError('Ключ должен начинаться с "sk-"');
      setActiveTab('api');
      return;
    }
    if (!baseUrl.trim().startsWith('http')) {
       setApiError('Base URL должен начинаться с http:// или https://');
       setActiveTab('api');
       return;
    }

    onSaveApi(key.trim(), baseUrl.trim(), model.trim());
    onSaveSettings({ 
        ttsEnabled, 
        ttsVolume, 
        ttsRate,
        uiScale,
        theme: currentTheme 
    });
    onClose();
  };

  const handleGenerateThemes = async () => {
    if (!key) {
        setApiError('Сначала введите API ключ!');
        setActiveTab('api');
        return;
    }
    setGeneratingTheme(true);
    setGeneratedThemes([]);
    try {
        // Create temp service just for this call
        const service = new AiService({ apiKey: key, baseUrl, model });
        const newThemes = await service.generateThemes(allowLightThemes);
        setGeneratedThemes(newThemes);
    } catch (e) {
        setApiError('Ошибка генерации тем');
        console.error(e);
    } finally {
        setGeneratingTheme(false);
    }
  };

  const resetTheme = () => {
    setCurrentTheme({
      name: 'Классика Подземелий',
      colors: { 
          dark: '#1a1b1e', 
          panel: '#25262b', 
          gold: '#c2b36e', 
          red: '#e03131', 
          blue: '#1971c2', 
          text: '#c1c2c5', 
          muted: '#909296',
          diceBg: '#111111',
          diceText: '#c2b36e',
          diceBorder: '#c2b36e'
      }
    });
    setGeneratedThemes([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-dnd-panel border-2 border-dnd-gold rounded-3xl max-w-lg w-full p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-dnd-dark p-6 border-b border-dnd-gold flex justify-between items-center shrink-0">
          <div className="font-fantasy text-dnd-gold text-2xl tracking-wider">Настройки</div>
          {!forceOpen && (
            <button onClick={onClose} className="text-dnd-muted hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dnd-muted/20 shrink-0">
          <button 
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'api' ? 'bg-dnd-gold/10 text-dnd-gold border-b-2 border-dnd-gold' : 'text-dnd-muted hover:bg-dnd-dark/50'}`}
          >
            Магия
          </button>
          <button 
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'audio' ? 'bg-dnd-gold/10 text-dnd-gold border-b-2 border-dnd-gold' : 'text-dnd-muted hover:bg-dnd-dark/50'}`}
          >
            Звук
          </button>
           <button 
            onClick={() => setActiveTab('ui')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'ui' ? 'bg-dnd-gold/10 text-dnd-gold border-b-2 border-dnd-gold' : 'text-dnd-muted hover:bg-dnd-dark/50'}`}
          >
            Интерфейс
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-8 overflow-y-auto custom-scrollbar flex-1">
          
          {/* API TAB */}
          {activeTab === 'api' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <ShieldCheck className="w-12 h-12 text-dnd-gold mx-auto mb-3 opacity-80" />
                <p className="text-dnd-muted text-sm leading-relaxed">
                    Настройте связь с эфиром. Мы рекомендуем использовать модели с длинным контекстом (DeepSeek, Claude, GPT-4).
                </p>
              </div>

              <div>
                <label className="block text-dnd-gold text-xs uppercase tracking-widest mb-2">API Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dnd-muted w-4 h-4" />
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => {
                      setKey(e.target.value);
                      setApiError('');
                    }}
                    placeholder="sk-or-..."
                    className="w-full bg-dnd-dark border border-dnd-muted/50 rounded-xl p-3 pl-10 text-white focus:border-dnd-gold focus:outline-none transition-colors font-mono text-sm"
                  />
                </div>
                {apiError && (
                  <div className="flex items-center gap-2 text-dnd-red text-xs mt-2">
                    <AlertCircle className="w-3 h-3" />
                    {apiError}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-dnd-gold text-xs uppercase tracking-widest mb-2">Base URL</label>
                <div className="relative">
                  <Server className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dnd-muted w-4 h-4" />
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full bg-dnd-dark border border-dnd-muted/50 rounded-xl p-3 pl-10 text-dnd-muted text-sm focus:border-dnd-gold focus:outline-none font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-dnd-gold text-xs uppercase tracking-widest mb-2">Model Name</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="mistralai/devstral-2512:free"
                  className="w-full bg-dnd-dark border border-dnd-muted/50 rounded-xl p-3 text-dnd-muted text-sm focus:border-dnd-gold focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <div className="space-y-8 animate-fadeIn py-2">
              <div className="flex items-center justify-between p-5 bg-dnd-dark/30 rounded-2xl border border-dnd-muted/20">
                <div className="flex items-center gap-4">
                  {ttsEnabled ? <Volume2 className="text-dnd-gold w-8 h-8" /> : <VolumeX className="text-dnd-muted w-8 h-8" />}
                  <div>
                    <div className="text-dnd-text font-bold text-base mb-1">Озвучка (Google)</div>
                    <div className="text-dnd-muted text-xs">Автоматическое чтение текста истории</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={ttsEnabled} 
                    onChange={(e) => setTtsEnabled(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-dnd-dark border border-dnd-muted rounded-full peer peer-focus:ring-1 peer-focus:ring-dnd-gold peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dnd-muted after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-dnd-gold/20 peer-checked:after:bg-dnd-gold peer-checked:border-dnd-gold"></div>
                </label>
              </div>

              <div className={`space-y-6 transition-opacity duration-300 ${!ttsEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                
                {/* Volume Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-dnd-gold text-xs uppercase tracking-widest">Громкость голоса</label>
                    <span className="text-xs text-dnd-muted font-mono">{Math.round(ttsVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ttsVolume}
                    onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-dnd-dark rounded-lg appearance-none cursor-pointer accent-dnd-gold"
                  />
                </div>

                {/* Speed Slider */}
                <div>
                   <div className="flex justify-between mb-2">
                    <label className="flex items-center gap-2 text-dnd-gold text-xs uppercase tracking-widest">
                       <Gauge className="w-3 h-3" /> Скорость речи
                    </label>
                    <span className="text-xs text-dnd-muted font-mono">{ttsRate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-dnd-dark rounded-lg appearance-none cursor-pointer accent-dnd-gold"
                  />
                  <div className="flex justify-between text-[10px] text-dnd-muted mt-2">
                    <span>Медленно</span>
                    <span>Норма</span>
                    <span>Быстро</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UI TAB */}
          {activeTab === 'ui' && (
            <div className="space-y-8 animate-fadeIn py-2">
                
                {/* Scale */}
                <div>
                   <div className="flex justify-between mb-2">
                       <label className="flex items-center gap-2 text-dnd-gold text-xs uppercase tracking-widest">
                            <Monitor className="w-4 h-4"/> Размер Интерфейса
                       </label>
                       <span className="text-xs text-dnd-muted font-mono">{Math.round(uiScale * 100)}%</span>
                   </div>
                   <input
                        type="range"
                        min="0.8"
                        max="1.5"
                        step="0.01"
                        value={uiScale}
                        onChange={(e) => setUiScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-dnd-dark rounded-lg appearance-none cursor-pointer accent-dnd-gold"
                    />
                     <div className="flex justify-between text-[10px] text-dnd-muted mt-2">
                        <span>Мелкий</span>
                        <span>Норма</span>
                        <span>Крупный</span>
                    </div>
                </div>

                {/* Theme Generator */}
                <div className="bg-dnd-dark/30 p-6 rounded-2xl border border-dnd-muted/20">
                     <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-2 text-dnd-gold font-bold text-sm">
                             <Palette className="w-4 h-4" /> Тема оформления
                         </div>
                         <button onClick={resetTheme} className="text-xs text-dnd-muted underline hover:text-white transition-colors">Сброс</button>
                     </div>

                     <div className="mb-6">
                         <div className="text-xs text-dnd-text mb-2 flex items-center justify-between">
                            <span>Текущая: <span className="font-fantasy text-dnd-gold tracking-wide">{currentTheme.name}</span></span>
                         </div>
                         
                         {/* Current Theme Mini Preview */}
                         <div className="rounded-xl overflow-hidden shadow-lg border relative" style={{ 
                             backgroundColor: currentTheme.colors.dark,
                             borderColor: currentTheme.colors.muted + '40'
                         }}>
                             <div className="p-4">
                                <div className="rounded-lg p-3 mb-3 border" style={{ 
                                    backgroundColor: currentTheme.colors.panel,
                                    borderColor: currentTheme.colors.muted + '30'
                                }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="h-2 w-16 rounded opacity-50" style={{ backgroundColor: currentTheme.colors.text }}></div>
                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: currentTheme.colors.gold }}></div>
                                    </div>
                                    <div className="h-1.5 w-full rounded mb-1 opacity-30" style={{ backgroundColor: currentTheme.colors.text }}></div>
                                    <div className="h-1.5 w-2/3 rounded opacity-30" style={{ backgroundColor: currentTheme.colors.text }}></div>
                                </div>
                                <div className="h-8 rounded-lg w-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest shadow-sm" style={{ 
                                    backgroundColor: currentTheme.colors.gold,
                                    color: currentTheme.colors.dark
                                }}>
                                    Применить
                                </div>
                             </div>
                         </div>
                     </div>

                    {/* Light Mode Toggle */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2 text-xs text-dnd-muted cursor-pointer" onClick={() => setAllowLightThemes(!allowLightThemes)}>
                             {allowLightThemes ? <Sun className="w-4 h-4 text-dnd-gold"/> : <Moon className="w-4 h-4"/>}
                             <span>{allowLightThemes ? 'Светлые темы разрешены' : 'Только темные темы'}</span>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${allowLightThemes ? 'bg-dnd-gold' : 'bg-dnd-muted/50'}`}
                          onClick={() => setAllowLightThemes(!allowLightThemes)}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${allowLightThemes ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                     <button
                        type="button"
                        onClick={handleGenerateThemes}
                        disabled={generatingTheme}
                        className="w-full flex items-center justify-center gap-2 bg-dnd-panel border border-dnd-gold/50 hover:bg-dnd-gold/10 text-dnd-gold py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest hover:shadow-lg"
                     >
                        {generatingTheme ? (
                            <span className="animate-pulse">Творческий процесс...</span>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4" /> Сгенерировать варианты
                            </>
                        )}
                     </button>
                </div>

                {/* Theme Selection Grid with Previews */}
                {generatedThemes.length > 0 && (
                    <div className="space-y-3 animate-fadeIn">
                        <label className="block text-dnd-gold text-xs uppercase tracking-widest">Выберите вариант</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedThemes.map((theme, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setCurrentTheme(theme)}
                                    className={`relative rounded-xl border-2 transition-all overflow-hidden text-left group ${
                                        currentTheme.name === theme.name 
                                        ? 'border-dnd-gold ring-2 ring-dnd-gold/30 scale-[1.02]' 
                                        : 'border-dnd-muted/20 hover:border-dnd-gold/50'
                                    }`}
                                >
                                    {/* Mini UI Preview */}
                                    <div className="p-3" style={{ backgroundColor: theme.colors.dark }}>
                                        {/* Header/Name */}
                                        <div className="mb-3 flex justify-between items-start">
                                            <div className="text-xs font-bold truncate pr-2" style={{ color: theme.colors.text }}>{theme.name}</div>
                                            {currentTheme.name === theme.name && <Check className="w-4 h-4 text-dnd-gold" />}
                                        </div>

                                        {/* Card Mockup */}
                                        <div className="rounded p-2 mb-2 border" style={{ 
                                            backgroundColor: theme.colors.panel, 
                                            borderColor: theme.colors.muted + '40'
                                        }}>
                                            <div className="flex gap-2 mb-2">
                                                <div className="w-6 h-6 rounded bg-opacity-20 flex items-center justify-center" style={{ backgroundColor: theme.colors.dark }}>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.gold }}></div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                     <div className="h-1.5 w-3/4 rounded opacity-60" style={{ backgroundColor: theme.colors.text }}></div>
                                                     <div className="h-1.5 w-1/2 rounded opacity-40" style={{ backgroundColor: theme.colors.text }}></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-[8px] opacity-70" style={{ color: theme.colors.muted }}>
                                                <span>HP</span>
                                                <span style={{ color: theme.colors.red }}>♥ 10</span>
                                            </div>
                                        </div>

                                        {/* Button Mockup */}
                                        <div className="h-6 rounded w-full flex items-center justify-center text-[8px] font-bold uppercase" style={{ 
                                            backgroundColor: theme.colors.gold,
                                            color: theme.colors.dark // Contrast usually works best dark on gold/accent
                                        }}>
                                            Action
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-dnd-muted/20 sticky bottom-0 bg-dnd-panel pb-2 shrink-0">
             <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-dnd-gold text-dnd-dark font-bold py-4 px-6 rounded-xl hover:bg-white transition-all duration-300 uppercase tracking-widest font-fantasy shadow-lg hover:shadow-dnd-gold/50"
            >
              <Save className="w-5 h-5" />
              Применить настройки
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};