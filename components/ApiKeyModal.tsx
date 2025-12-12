import React, { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, Settings, Server, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  onSubmit: (key: string, baseUrl: string, model: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSubmit }) => {
  const [key, setKey] = useState(sessionStorage.getItem('dnd_api_key') || '');
  const [baseUrl, setBaseUrl] = useState(sessionStorage.getItem('dnd_base_url') || 'https://openrouter.ai/api/v1');
  const [model, setModel] = useState(sessionStorage.getItem('dnd_model') || 'mistralai/devstral-2512:free');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim().startsWith('sk-')) {
      setError('Ключ должен начинаться с "sk-"');
      return;
    }
    if (!baseUrl.trim().startsWith('http')) {
       setError('Base URL должен начинаться с http:// или https://');
       return;
    }
    onSubmit(key.trim(), baseUrl.trim(), model.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-dnd-panel border-2 border-dnd-gold rounded-lg max-w-md w-full p-6 shadow-2xl relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-dnd-dark px-4 border border-dnd-gold text-dnd-gold font-fantasy tracking-wider">
          Врата Миров
        </div>

        <div className="text-center mb-6 mt-4">
          <ShieldCheck className="w-12 h-12 text-dnd-gold mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white mb-2 font-fantasy">Требуется Магический Ключ</h2>
          <div className="text-dnd-muted text-sm space-y-2">
            <p>Для создания миров требуется доступ к нейросети.</p>
            <div className="bg-dnd-gold/10 p-3 rounded-lg border border-dnd-gold/30">
                <p className="mb-2 text-dnd-primary">Нет ключа?</p>
                <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-center gap-2 text-dnd-gold hover:text-white font-bold hover:underline transition-colors"
                >
                    Получить ключ на OpenRouter.ai <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[10px] mt-2 opacity-70">Это агрегатор нейросетей. Многие модели (включая Devstral, Gemini Free) там бесплатны.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dnd-gold text-xs uppercase tracking-widest mb-1">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dnd-muted w-4 h-4" />
              <input
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
                placeholder="sk-or-..."
                className="w-full bg-dnd-dark border border-dnd-muted/50 rounded p-2 pl-9 text-white focus:border-dnd-gold focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-dnd-red text-xs mt-2">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-dnd-muted hover:text-dnd-gold transition-colors mb-2"
            >
              <Settings className="w-3 h-3" />
              {showAdvanced ? 'Скрыть настройки' : 'Настройки подключения (Advanced)'}
            </button>
            
            {showAdvanced && (
              <div className="space-y-3 animate-fadeIn bg-dnd-dark/30 p-3 rounded border border-dnd-muted/20">
                <div>
                  <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Base URL</label>
                  <div className="relative">
                    <Server className="absolute left-2 top-1/2 transform -translate-y-1/2 text-dnd-muted w-3 h-3" />
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="w-full bg-dnd-dark border border-dnd-muted/50 rounded p-1.5 pl-7 text-dnd-muted text-xs focus:border-dnd-gold focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">OpenRouter: https://openrouter.ai/api/v1</p>
                </div>
                
                <div>
                  <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Model Name</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="mistralai/devstral-2512:free"
                    className="w-full bg-dnd-dark border border-dnd-muted/50 rounded p-1.5 text-dnd-muted text-xs focus:border-dnd-gold focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Пример: mistralai/devstral-2512:free</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-dnd-gold/10 border border-dnd-gold text-dnd-gold py-2 px-4 rounded hover:bg-dnd-gold hover:text-dnd-dark font-fantasy transition-all duration-300 uppercase tracking-widest"
          >
            {key ? 'Сохранить настройки' : 'Войти в Подземелье'}
          </button>
        </form>
      </div>
    </div>
  );
};