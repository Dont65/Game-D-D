import React, { useState, useEffect, useCallback } from 'react';
import { GameState, LogEntry, ActionOption, AIResponse, ApiConfig, GameSettings, Theme, Stats, BonusDice, InventoryItem } from './types';
import { INITIAL_GAME_STATE } from './constants';
import { AiService } from './services/aiService';
import { ttsService } from './services/ttsService';
import { SettingsModal } from './components/SettingsModal'; 
import { CharacterSheetModal } from './components/CharacterSheetModal';
import { GameLog } from './components/GameLog';
import { 
  Backpack, 
  MapPin, 
  Heart, 
  Zap, 
  Save, 
  Settings,
  User,
  ChevronRight,
  Sparkles,
  X,
  Coins,
  Hexagon,
  Wand2,
  Send,
  Eye,
  Hand,
  Trash2,
  Plus,
  Play,
  RefreshCw,
  Scroll
} from 'lucide-react';

const DEFAULT_THEME: Theme = {
  name: "Material Dark",
  colors: {
    dark: '#141218',
    panel: '#1D1B20',
    gold: '#D0BCFF', // Primary Tonal
    red: '#F2B8B5',
    blue: '#A8C7FA',
    text: '#E6E1E5',
    muted: '#CAC4D0',
    diceBg: '#2B2930',
    diceText: '#D0BCFF',
    diceBorder: 'transparent'
  }
};

export default function App() {
  // Config State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'mistralai/devstral-2512:free'
  });
  
  // Settings State
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    ttsEnabled: false,
    ttsVolume: 0.8,
    ttsRate: 1.0,
    uiScale: 0.95, // Slightly smaller by default for compactness
    theme: DEFAULT_THEME
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCharSheetOpen, setIsCharSheetOpen] = useState(false);

  // Game State
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [currentOptions, setCurrentOptions] = useState<ActionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiService, setAiService] = useState<AiService | null>(null);
  
  // Logic Flow State
  const [pendingAction, setPendingAction] = useState<ActionOption | null>(null); 
  const [customAction, setCustomAction] = useState('');
  
  // Inventory Interaction
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Character Creation State
  const [isCharacterCreated, setIsCharacterCreated] = useState(false);
  const [creationName, setCreationName] = useState('');
  const [creationRace, setCreationRace] = useState('');
  const [creationClass, setCreationClass] = useState('');
  const [creationGender, setCreationGender] = useState('');
  const [creationBio, setCreationBio] = useState('');
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);

  const [creationStats, setCreationStats] = useState<Stats>(INITIAL_GAME_STATE.player.stats);
  const [creationGold, setCreationGold] = useState(0);
  const [creationBonusDice, setCreationBonusDice] = useState<BonusDice>({ d6: 0, d10: 0, d20: 0, d50: 0 });
  const [rerollsLeft, setRerollsLeft] = useState(3);

  // Apply Theme and Scale to Root
  useEffect(() => {
    const root = document.documentElement;
    const theme = gameSettings.theme || DEFAULT_THEME;
    const colors = theme.colors;
    
    root.style.setProperty('--dnd-bg', colors.dark);
    root.style.setProperty('--dnd-panel', colors.panel);
    root.style.setProperty('--dnd-gold', colors.gold);
    root.style.setProperty('--dnd-red', colors.red);
    root.style.setProperty('--dnd-blue', colors.blue);
    root.style.setProperty('--dnd-primary', colors.text);
    root.style.setProperty('--dnd-muted', colors.muted);
    
    // Fallbacks for Dice if not in theme
    root.style.setProperty('--dnd-dice-bg', colors.diceBg || colors.panel);
    root.style.setProperty('--dnd-dice-text', colors.diceText || colors.gold);
    root.style.setProperty('--dnd-dice-border', colors.diceBorder || 'transparent');

    const scalePercent = (gameSettings.uiScale || 0.95) * 100;
    root.style.fontSize = `${scalePercent}%`;

  }, [gameSettings.theme, gameSettings.uiScale]);

  // Load Config & Settings from Storage on Mount
  useEffect(() => {
    const storedKey = sessionStorage.getItem('dnd_api_key');
    const storedBaseUrl = sessionStorage.getItem('dnd_base_url');
    const storedModel = sessionStorage.getItem('dnd_model');
    
    const initialConfig = {
      apiKey: storedKey || '',
      baseUrl: storedBaseUrl || 'https://openrouter.ai/api/v1',
      model: storedModel || 'mistralai/devstral-2512:free'
    };
    setApiConfig(initialConfig);

    if (storedKey) {
      setApiKey(storedKey);
      setAiService(new AiService(initialConfig));
    } else {
      setIsSettingsOpen(true);
    }

    const storedSettings = localStorage.getItem('dnd_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (!parsed.theme) parsed.theme = DEFAULT_THEME;
        setGameSettings(parsed);
      } catch (e) { console.error("Settings parse error", e); }
    }
  }, []);

  // Initialize Game Logic & Migrate Inventory
  useEffect(() => {
    const savedGame = localStorage.getItem('dnd_game_save');
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        
        // MIGRATION: Convert string[] inventory to InventoryItem[]
        if (parsed.player.inventory.length > 0 && typeof parsed.player.inventory[0] === 'string') {
            const newInv: InventoryItem[] = parsed.player.inventory.map((name: string) => ({
                id: Math.random().toString(),
                name: name,
                quantity: 1,
                description: 'Предмет из прошлого...'
            }));
            parsed.player.inventory = newInv;
        }

        if (!parsed.player.bonusDice) {
            parsed.player.bonusDice = { d6: 0, d10: 0, d20: 0, d50: 0 };
        }
        setGameState(parsed);
        setIsCharacterCreated(true);
        
        if (parsed.history.length === 0) {
           // empty
        } else if (currentOptions.length === 0) {
             executeTurn('Осмотреться');
        }
      } catch (e) {
        console.error("Save file corrupted", e);
        setGameState(INITIAL_GAME_STATE);
        setIsCharacterCreated(false);
      }
    } else {
        setIsCharacterCreated(false);
        rollStats();
    }
  }, []);

  const handleSaveApi = (key: string, baseUrl: string, model: string) => {
    sessionStorage.setItem('dnd_api_key', key);
    sessionStorage.setItem('dnd_base_url', baseUrl);
    sessionStorage.setItem('dnd_model', model);
    
    setApiKey(key);
    const config = { apiKey: key, baseUrl, model };
    setApiConfig(config);
    setAiService(new AiService(config));
  };

  const handleSaveSettings = (settings: GameSettings) => {
    setGameSettings(settings);
    localStorage.setItem('dnd_settings', JSON.stringify(settings));
    if (!settings.ttsEnabled) {
      ttsService.cancel();
    } else {
      ttsService.setVolume(settings.ttsVolume);
      ttsService.setRate(settings.ttsRate);
    }
  };

  const saveGame = () => {
    localStorage.setItem('dnd_game_save', JSON.stringify(gameState));
    addLog('system', 'Прогресс сохранен.');
  };

  const resetGame = () => {
    if (window.confirm('Начать новую историю?')) {
      ttsService.cancel();
      localStorage.removeItem('dnd_game_save');
      
      // Reset everything to initial states
      setGameState(INITIAL_GAME_STATE);
      setCurrentOptions([]);
      setPendingAction(null);
      setIsCharacterCreated(false);
      
      // Reset creation form
      setRerollsLeft(3);
      setCreationName('');
      setCreationRace('');
      setCreationClass('');
      setCreationBio('');
      setCreationGender('');
      rollStats();
    }
  };

  const addLog = (type: LogEntry['type'], text: string) => {
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, {
        id: Date.now().toString() + Math.random(),
        type,
        text,
        timestamp: Date.now()
      }]
    }));
  };

  // --- Character Creation Logic ---
  const rollStats = () => {
    const rollOne = () => 10 + (Math.floor(Math.random() * 13) - 6);
    
    const newStats: Stats = {
      str: rollOne(),
      dex: rollOne(),
      int: rollOne(),
      hp: 30,
      maxHp: 30,
      mp: 10,
      maxMp: 10
    };
    newStats.maxHp += Math.floor((newStats.str - 10) * 1.5);
    newStats.hp = newStats.maxHp;
    newStats.maxMp += Math.floor((newStats.int - 10));
    newStats.mp = newStats.maxMp;

    const gold = Math.floor(Math.random() * 11); 
    
    const dice: BonusDice = {
        d10: Math.floor(Math.random() * 31),
        d6: Math.floor(Math.random() * 51), 
        d20: Math.floor(Math.random() * 11),
        d50: Math.floor(Math.random() * 2) 
    };

    setCreationStats(newStats);
    setCreationGold(gold);
    setCreationBonusDice(dice);
  };

  const handleReroll = () => {
    if (rerollsLeft > 0) {
      rollStats();
      setRerollsLeft(prev => prev - 1);
    }
  };

  const handleAiFillCreation = async () => {
      if (!aiService) return;
      setIsGeneratingDetails(true);
      try {
          const details = await aiService.generateCharacterDetails(creationStats);
          if (details.name) setCreationName(details.name);
          if (details.race) setCreationRace(details.race);
          if (details.class) setCreationClass(details.class);
          if (details.gender) setCreationGender(details.gender);
          if (details.bio) setCreationBio(details.bio);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingDetails(false);
      }
  };

  const finishCreation = () => {
    if (!creationName.trim()) {
      alert("Введите имя героя!");
      return;
    }
    
    const newGameState = {
      ...INITIAL_GAME_STATE,
      player: {
        ...INITIAL_GAME_STATE.player,
        name: creationName,
        race: creationRace || 'Человек',
        class: creationClass || 'Искатель',
        gender: creationGender || 'Неизвестно',
        bio: creationBio || 'История героя пока пуста...',
        stats: creationStats,
        gold: creationGold,
        inventory: [],
        bonusDice: creationBonusDice
      }
    };
    
    setGameState(newGameState);
    setIsCharacterCreated(true);
    
    setTimeout(() => {
       if (aiService) {
           executeTurn(
               `Начало приключения. 
               Контекст: Игрок очнулся в неизвестном месте.
               У игрока УЖЕ ЕСТЬ ${creationGold} золотых монет (не добавляй их механически через goldChange).
               Сгенерируй атмосферное стартовое место.
               Выдай 3 случайных предмета (в itemsFound).
               Опиши пробуждение, локацию и обнаружение этих монет и предметов.`,
               newGameState
           );
       }
    }, 100);
  };

  const handleUpdatePlayer = (updates: any) => {
      setGameState(prev => ({
          ...prev,
          player: { ...prev.player, ...updates }
      }));
  };

  // --- Turn Execution ---

  const handleOptionClick = (option: ActionOption) => {
    setPendingAction(option);
  };

  const handleCustomActionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!customAction.trim()) return;
      
      const option: ActionOption = {
          id: 'custom',
          title: 'Свое действие',
          description: customAction
      };
      setPendingAction(option);
      setCustomAction('');
  };

  const handleBonusSelection = (dieType: 'none' | 'd6' | 'd10' | 'd20' | 'd50') => {
      if (!pendingAction) return;
      
      let bonusRollResult: { type: string, value: number } | undefined;
      
      if (dieType !== 'none') {
          const dieMax = parseInt(dieType.substring(1));
          const roll = Math.floor(Math.random() * dieMax) + 1;
          bonusRollResult = { type: dieType, value: roll };

          setGameState(prev => ({
              ...prev,
              player: {
                  ...prev.player,
                  bonusDice: {
                      ...prev.player.bonusDice,
                      [dieType]: Math.max(0, prev.player.bonusDice[dieType as keyof BonusDice] - 1)
                  }
              }
          }));
          
          addLog('roll', `Бонус ${dieType}: ${roll}`);
      }

      const actionText = pendingAction.id === 'custom' 
        ? pendingAction.description 
        : `${pendingAction.title}: ${pendingAction.description}`;
        
      executeTurn(actionText, undefined, bonusRollResult);
      setPendingAction(null);
  };

  const executeTurn = useCallback(async (action: string, overrideState?: GameState, bonusRoll?: { type: string, value: number }) => {
    if (!aiService) return;
    
    ttsService.cancel();
    const stateToUse = overrideState || gameState;

    setLoading(true);
    setError(null);
    
    const isSpecialAction = action.startsWith('Начало') || action === 'Осмотреться' || action.startsWith('Использую предмет:');
    let d20Roll: number | undefined;
    
    if (!isSpecialAction) {
        d20Roll = Math.floor(Math.random() * 20) + 1;
        addLog('roll', `Проверка навыка (d20): ${d20Roll}`);
    }

    if (!isSpecialAction) {
        addLog('action', action);
    }

    try {
      const response: AIResponse = await aiService.generateTurn(action, stateToUse, d20Roll, bonusRoll);

      setGameState(prev => {
        const newStats = { ...prev.player.stats };
        newStats.hp = Math.min(newStats.maxHp, Math.max(0, newStats.hp + (response.hpChange || 0)));
        newStats.mp = Math.min(newStats.maxMp, Math.max(0, newStats.mp + (response.mpChange || 0)));
        
        const newGold = Math.max(0, prev.player.gold + (response.goldChange || 0));

        // Inventory Logic
        let newInventory = [...prev.player.inventory];
        
        // Add Items (Check stackability)
        if (response.itemsFound && response.itemsFound.length > 0) {
            response.itemsFound.forEach(newItem => {
                const existingItem = newInventory.find(i => i.name === newItem.name);
                if (existingItem) {
                    existingItem.quantity += newItem.quantity;
                } else {
                    newInventory.push({
                        id: Math.random().toString(),
                        name: newItem.name,
                        quantity: newItem.quantity,
                        description: newItem.description
                    });
                }
            });
        }
        
        // Remove Item logic
        if (response.itemLost) {
            const idx = newInventory.findIndex(i => i.name.toLowerCase().includes(response.itemLost!.toLowerCase()));
            if (idx !== -1) {
                if (newInventory[idx].quantity > 1) {
                    newInventory[idx].quantity -= 1;
                } else {
                    newInventory.splice(idx, 1);
                }
            }
        }

        const isDead = newStats.hp <= 0;

        return {
          ...prev,
          player: {
            ...prev.player,
            stats: newStats,
            inventory: newInventory,
            gold: newGold,
            bonusDice: prev.player.bonusDice
          },
          location: response.locationUpdate || prev.location,
          turnCount: prev.turnCount + 1,
          isGameOver: isDead,
          history: [...prev.history, {
              id: Date.now().toString(),
              type: 'narrative',
              text: response.narrative,
              timestamp: Date.now()
          }]
        };
      });

      setCurrentOptions(response.options || []);

      if (gameSettings.ttsEnabled) {
        ttsService.speak(response.narrative, gameSettings.ttsVolume, gameSettings.ttsRate);
      }

    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при обращении к Мастеру.');
      addLog('system', 'Связь с реальностью нарушена (API Error).');
    } finally {
      setLoading(false);
    }
  }, [aiService, gameState, gameSettings]);

  // --- Inventory Interactions ---
  const handleItemClick = (item: InventoryItem) => {
      setSelectedItem(item);
  };

  const handleUseItem = () => {
      if (!selectedItem) return;
      setSelectedItem(null);
      executeTurn(`Использую предмет: ${selectedItem.name}`);
  };

  const handleInspectItem = () => {
    if (!selectedItem) return;
    setSelectedItem(null);
    executeTurn(`Осматриваю предмет: ${selectedItem.name}`);
  };

  const handleDropItem = () => {
      if (!selectedItem) return;
      setSelectedItem(null);
      executeTurn(`Выбрасываю предмет: ${selectedItem.name}`);
  };

  return (
    <div className="min-h-screen font-ui bg-dnd-bg text-dnd-primary flex items-center justify-center p-2 md:p-4 transition-colors duration-500">
      
      <SettingsModal 
        isOpen={isSettingsOpen || !apiKey} 
        onClose={() => setIsSettingsOpen(false)}
        initialApiKey={apiConfig.apiKey}
        initialBaseUrl={apiConfig.baseUrl}
        initialModel={apiConfig.model}
        initialSettings={gameSettings}
        onSaveApi={handleSaveApi}
        onSaveSettings={handleSaveSettings}
        forceOpen={!apiKey}
      />

      <CharacterSheetModal 
          isOpen={isCharSheetOpen}
          onClose={() => setIsCharSheetOpen(false)}
          player={gameState.player}
          onUpdate={handleUpdatePlayer}
          aiService={aiService}
          readOnly={true} // In-game mode is Read Only
      />

      {/* ITEM ACTION MODAL (MD3 Dialog) */}
      {selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-dnd-panel rounded-[28px] p-6 w-full max-w-sm shadow-xl relative flex flex-col items-center">
                  <div className="w-12 h-1 bg-dnd-muted/20 rounded-full mb-4"></div>
                  <h3 className="text-xl font-bold text-dnd-primary mb-1 text-center">{selectedItem.name}</h3>
                  <div className="px-3 py-1 bg-dnd-bg rounded-full text-xs font-medium text-dnd-gold mb-4">x{selectedItem.quantity}</div>
                  
                  {selectedItem.description && (
                      <p className="text-sm text-dnd-muted text-center mb-6 leading-relaxed">
                          {selectedItem.description}
                      </p>
                  )}
                  
                  <div className="flex flex-col w-full gap-2">
                      <button onClick={handleUseItem} className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-dnd-gold text-dnd-panel font-medium text-sm hover:brightness-110 transition-all">
                          <Hand className="w-4 h-4" /> Использовать
                      </button>
                      <button onClick={handleInspectItem} className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-dnd-bg text-dnd-primary font-medium text-sm hover:bg-dnd-muted/10 transition-all">
                          <Eye className="w-4 h-4" /> Осмотреть
                      </button>
                      <button onClick={handleDropItem} className="w-full flex items-center justify-center gap-2 h-10 rounded-full text-dnd-red font-medium text-sm hover:bg-dnd-red/10 transition-all">
                          <Trash2 className="w-4 h-4" /> Выбросить
                      </button>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="mt-4 text-dnd-muted text-xs underline">Закрыть</button>
              </div>
          </div>
      )}

      {/* CHARACTER CREATION SCREEN */}
      {apiKey && !isCharacterCreated && (
        <div className="max-w-6xl w-full glass-panel p-6 md:p-10 animate-fadeIn flex flex-col gap-8 min-h-[70vh]">
             <div className="text-center md:text-left border-b border-dnd-border pb-4">
                <h2 className="text-3xl font-fantasy text-dnd-gold mb-2">Создание Легенды</h2>
                <p className="text-dnd-muted text-sm">Бросьте кости, определите судьбу, напишите историю.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                 
                 {/* LEFT COLUMN: REROLL & STATS */}
                 <div className="space-y-6">
                     <div className="relative">
                        <label className="text-xs uppercase text-dnd-muted tracking-widest ml-1 mb-1 block">Имя Героя</label>
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dnd-muted mt-3" />
                        <input 
                            type="text" 
                            value={creationName}
                            onChange={(e) => setCreationName(e.target.value)}
                            placeholder="Введите имя..."
                            className="w-full bg-dnd-bg rounded-[20px] py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-dnd-gold transition-all text-dnd-primary text-lg"
                        />
                    </div>

                    <div className="bg-dnd-panel rounded-[24px] p-5 border border-dnd-border/50 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                             <div className="flex items-center gap-2 text-dnd-gold font-bold uppercase tracking-widest text-xs">
                                 <Sparkles className="w-4 h-4" /> Характеристики
                             </div>
                             <button 
                                onClick={handleReroll} 
                                disabled={rerollsLeft <= 0} 
                                className="flex items-center gap-2 px-4 py-2 bg-dnd-bg rounded-full text-xs font-bold hover:bg-dnd-gold hover:text-dnd-panel transition-colors disabled:opacity-50"
                             >
                                 <RefreshCw className={`w-3 h-3 ${rerollsLeft > 0 ? '' : ''}`} /> 
                                 Перебросить ({rerollsLeft})
                             </button>
                        </div>
                        
                        {/* Primary Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-dnd-bg/50 p-4 rounded-2xl text-center">
                                <div className="text-3xl font-fantasy text-dnd-primary mb-1">{creationStats.str}</div>
                                <div className="text-[10px] text-dnd-muted uppercase tracking-widest">Сила</div>
                            </div>
                            <div className="bg-dnd-bg/50 p-4 rounded-2xl text-center">
                                <div className="text-3xl font-fantasy text-dnd-primary mb-1">{creationStats.dex}</div>
                                <div className="text-[10px] text-dnd-muted uppercase tracking-widest">Ловкость</div>
                            </div>
                            <div className="bg-dnd-bg/50 p-4 rounded-2xl text-center">
                                <div className="text-3xl font-fantasy text-dnd-primary mb-1">{creationStats.int}</div>
                                <div className="text-[10px] text-dnd-muted uppercase tracking-widest">Интеллект</div>
                            </div>
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="flex flex-col items-center p-2">
                                <span className="text-dnd-red font-bold flex items-center gap-1 text-sm"><Heart className="w-4 h-4"/> {creationStats.hp}</span>
                                <span className="text-[9px] uppercase text-dnd-muted mt-1">Здоровье</span>
                            </div>
                            <div className="flex flex-col items-center p-2">
                                <span className="text-dnd-blue font-bold flex items-center gap-1 text-sm"><Zap className="w-4 h-4"/> {creationStats.mp}</span>
                                <span className="text-[9px] uppercase text-dnd-muted mt-1">Мана</span>
                            </div>
                            <div className="flex flex-col items-center p-2">
                                <span className="text-dnd-gold font-bold flex items-center gap-1 text-sm"><Coins className="w-4 h-4"/> {creationGold}</span>
                                <span className="text-[9px] uppercase text-dnd-muted mt-1">Золото</span>
                            </div>
                        </div>

                        {/* Dice */}
                        <div className="bg-dnd-bg/30 rounded-xl p-3 flex justify-between items-center">
                             <span className="text-[10px] uppercase text-dnd-muted tracking-widest pl-2">Бонусы Судьбы</span>
                             <div className="flex gap-3">
                                {Object.entries(creationBonusDice).map(([die, count]) => (
                                    <div key={die} className="flex items-center gap-1">
                                        <Hexagon className="w-3 h-3 text-dnd-muted" />
                                        <span className="text-xs font-bold">{count}</span>
                                        <span className="text-[8px] uppercase text-dnd-muted">{die}</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                 </div>

                 {/* RIGHT COLUMN: DETAILS FORM */}
                 <div className="space-y-4 flex flex-col h-full">
                     <div className="flex justify-between items-center">
                         <label className="text-xs uppercase text-dnd-muted tracking-widest flex items-center gap-2"><Scroll className="w-4 h-4"/> Анкета</label>
                         <button 
                            onClick={handleAiFillCreation}
                            disabled={isGeneratingDetails}
                            className="text-[10px] uppercase font-bold text-dnd-gold hover:text-white transition-colors flex items-center gap-1"
                         >
                            {isGeneratingDetails ? <span className="animate-pulse">Думаю...</span> : <><Wand2 className="w-3 h-3" /> Заполнить (AI)</>}
                         </button>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <input 
                            value={creationRace}
                            onChange={(e) => setCreationRace(e.target.value)}
                            placeholder="Раса (напр. Эльф)"
                            className="bg-dnd-bg rounded-[16px] p-4 text-sm focus:outline-none focus:ring-1 focus:ring-dnd-gold transition-all"
                         />
                         <input 
                            value={creationClass}
                            onChange={(e) => setCreationClass(e.target.value)}
                            placeholder="Класс (напр. Маг)"
                            className="bg-dnd-bg rounded-[16px] p-4 text-sm focus:outline-none focus:ring-1 focus:ring-dnd-gold transition-all"
                         />
                     </div>
                     
                     <input 
                        value={creationGender}
                        onChange={(e) => setCreationGender(e.target.value)}
                        placeholder="Пол"
                        className="bg-dnd-bg rounded-[16px] p-4 text-sm focus:outline-none focus:ring-1 focus:ring-dnd-gold transition-all"
                     />

                     <textarea 
                        value={creationBio}
                        onChange={(e) => setCreationBio(e.target.value)}
                        placeholder="Краткая биография вашего героя..."
                        className="bg-dnd-bg rounded-[20px] p-4 text-sm focus:outline-none focus:ring-1 focus:ring-dnd-gold transition-all flex-1 resize-none min-h-[120px]"
                     />

                     <button 
                        onClick={finishCreation}
                        className="w-full h-16 bg-dnd-gold text-dnd-panel font-bold rounded-full text-lg hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest mt-auto"
                      >
                      Начать Путешествие <ChevronRight className="w-6 h-6" />
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* MAIN GAME SCREEN */}
      {apiKey && isCharacterCreated && (
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-4 h-[95vh] md:h-[90vh]">
          
          {/* --- LEFT COLUMN: COMPACT SIDEBAR --- */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3 order-2 md:order-1 h-full overflow-hidden">
            
            {/* 1. Player Compact Card (Surface Container) */}
            <div className="bg-dnd-panel rounded-[24px] p-4 flex flex-col gap-3 shrink-0">
               <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-dnd-gold text-dnd-panel flex items-center justify-center font-bold text-xl font-fantasy">
                       {gameState.player.name.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0">
                       <h2 className="text-base font-bold truncate text-dnd-primary">{gameState.player.name}</h2>
                       <p className="text-xs text-dnd-muted truncate">{gameState.player.race} {gameState.player.class}</p>
                   </div>
                   <button onClick={() => setIsCharSheetOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dnd-bg transition-colors">
                        <User className="w-4 h-4 text-dnd-muted" />
                   </button>
               </div>
               
               {/* Stats Row */}
               <div className="flex gap-2 text-xs font-medium text-dnd-primary/80 bg-dnd-bg/50 p-2 rounded-xl justify-around">
                   <span>STR {gameState.player.stats.str}</span>
                   <span>DEX {gameState.player.stats.dex}</span>
                   <span>INT {gameState.player.stats.int}</span>
               </div>

               {/* Bars */}
               <div className="space-y-1">
                   <div className="h-2 bg-dnd-bg rounded-full overflow-hidden flex">
                        <div className="h-full bg-dnd-red" style={{ width: `${(gameState.player.stats.hp / gameState.player.stats.maxHp) * 100}%` }}></div>
                   </div>
                   <div className="flex justify-between text-[10px] text-dnd-muted px-1">
                       <span>HP</span>
                       <span>{gameState.player.stats.hp}/{gameState.player.stats.maxHp}</span>
                   </div>
                   
                   <div className="h-2 bg-dnd-bg rounded-full overflow-hidden flex mt-2">
                        <div className="h-full bg-dnd-blue" style={{ width: `${(gameState.player.stats.mp / gameState.player.stats.maxMp) * 100}%` }}></div>
                   </div>
                    <div className="flex justify-between text-[10px] text-dnd-muted px-1">
                       <span>MP</span>
                       <span>{gameState.player.stats.mp}/{gameState.player.stats.maxMp}</span>
                   </div>
               </div>
            </div>

            {/* 2. Location & Bonus Strip */}
            <div className="bg-dnd-panel rounded-[24px] p-4 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-dnd-primary">
                    <MapPin className="w-4 h-4 text-dnd-gold" />
                    <span className="text-sm font-medium truncate">{gameState.location}</span>
                </div>
                <div className="h-px bg-dnd-bg w-full"></div>
                {/* Dice Row - Compact */}
                <div className="flex justify-between px-1">
                    {['d6', 'd10', 'd20', 'd50'].map(die => {
                         const count = gameState.player.bonusDice ? gameState.player.bonusDice[die as keyof BonusDice] : 0;
                         return (
                            <div key={die} className={`flex flex-col items-center ${count === 0 ? 'opacity-30' : ''}`}>
                                <Hexagon className="w-4 h-4 text-dnd-muted mb-1" />
                                <span className="text-[10px] font-bold">{count}</span>
                            </div>
                         )
                    })}
                </div>
            </div>

            {/* 3. Inventory List (Scrollable area) */}
            <div className="bg-dnd-panel rounded-[24px] flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="p-4 pb-2 flex justify-between items-center border-b border-dnd-bg">
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <Backpack className="w-4 h-4 text-dnd-gold" /> Инвентарь
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-dnd-bg px-2 py-1 rounded-full text-dnd-gold">
                        <Coins className="w-3 h-3" /> {gameState.player.gold}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {gameState.player.inventory.length > 0 ? (
                        gameState.player.inventory.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-dnd-bg/80 transition-colors flex justify-between items-center group"
                            >
                                <span className="text-xs text-dnd-primary truncate">{item.name}</span>
                                {item.quantity > 1 && <span className="text-[10px] bg-dnd-gold/20 text-dnd-gold px-1.5 rounded-md font-bold">x{item.quantity}</span>}
                            </button>
                        ))
                    ) : (
                        <div className="h-full flex items-center justify-center text-dnd-muted text-xs italic opacity-50">Пусто</div>
                    )}
                </div>
            </div>

            {/* 4. Controls Row (Bottom Left) */}
            <div className="flex gap-2 shrink-0">
                <button onClick={() => setIsSettingsOpen(true)} className="h-12 w-12 rounded-full bg-dnd-panel flex items-center justify-center text-dnd-muted hover:bg-dnd-primary hover:text-dnd-bg transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
                <button onClick={saveGame} className="h-12 w-12 rounded-full bg-dnd-panel flex items-center justify-center text-dnd-muted hover:bg-dnd-gold hover:text-dnd-bg transition-colors">
                    <Save className="w-5 h-5" />
                </button>
                <button 
                    onClick={resetGame}
                    className="h-12 flex-1 rounded-full bg-dnd-gold text-dnd-panel font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Новая игра
                </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: MAIN CONTENT --- */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col h-full order-1 md:order-2 gap-4 overflow-hidden">
            
            {/* Game Log Container */}
            <div className="flex-1 bg-dnd-panel rounded-[28px] overflow-hidden relative shadow-sm border border-dnd-bg">
               <GameLog history={gameState.history} loading={loading} />
            </div>

            {/* Actions Area */}
            <div className="shrink-0 space-y-3">
               
               {gameState.isGameOver ? (
                   <div className="bg-dnd-red/10 border border-dnd-red/20 rounded-[24px] p-6 text-center">
                       <h2 className="text-2xl font-fantasy text-dnd-red mb-2">Конец Игры</h2>
                       <button onClick={resetGame} className="px-6 py-2 bg-dnd-red text-white rounded-full font-bold text-sm hover:bg-red-600 transition-colors">
                           Начать Заново
                       </button>
                   </div>
               ) : pendingAction ? (
                   /* Bonus Dice Selection (Modal-like inline) */
                   <div className="bg-dnd-panel p-4 rounded-[24px] animate-fadeIn border border-dnd-gold/30">
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-sm text-dnd-gold font-bold">Усилить действие "{pendingAction.title}"?</span>
                           <button onClick={() => setPendingAction(null)} className="text-xs text-dnd-muted underline">Отмена</button>
                       </div>
                       <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                           <button onClick={() => handleBonusSelection('none')} className="px-4 py-2 bg-dnd-bg rounded-full text-xs text-dnd-muted whitespace-nowrap border border-transparent hover:border-dnd-muted">Без бонуса</button>
                           {['d6', 'd10', 'd20', 'd50'].map(die => (
                               <button 
                                key={die} 
                                onClick={() => handleBonusSelection(die as any)}
                                disabled={gameState.player.bonusDice[die as keyof BonusDice] <= 0}
                                className="px-4 py-2 bg-dnd-gold/10 text-dnd-gold rounded-full text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap hover:bg-dnd-gold/20"
                               >
                                   +{die.toUpperCase()} ({gameState.player.bonusDice[die as keyof BonusDice]})
                               </button>
                           ))}
                       </div>
                   </div>
               ) : (
                   /* Standard Inputs */
                   <div className="flex flex-col gap-3">
                       {/* Options Chips */}
                       {currentOptions.length > 0 && (
                           <div className="flex flex-wrap gap-2 justify-end">
                               {currentOptions.map(option => (
                                   <button 
                                    key={option.id}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={loading}
                                    className="bg-dnd-panel border border-dnd-border hover:border-dnd-gold hover:bg-dnd-gold/5 px-4 py-3 rounded-[16px] text-left transition-all min-w-[45%] md:min-w-fit flex-1 max-w-full md:max-w-[48%] group"
                                   >
                                       <div className="text-sm font-bold text-dnd-gold group-hover:text-dnd-primary transition-colors">{option.title}</div>
                                       <div className="text-xs text-dnd-muted truncate opacity-80">{option.description}</div>
                                   </button>
                               ))}
                           </div>
                       )}
                       
                       {/* Text Input (Pill) */}
                       <form onSubmit={handleCustomActionSubmit} className="relative w-full">
                           <input 
                                type="text"
                                value={customAction}
                                onChange={e => setCustomAction(e.target.value)}
                                disabled={loading}
                                placeholder="Ваше действие..."
                                className="w-full h-14 bg-dnd-panel rounded-full pl-6 pr-14 text-sm text-dnd-primary focus:outline-none focus:ring-2 focus:ring-dnd-gold/50 transition-all placeholder:text-dnd-muted/50"
                           />
                           <button 
                                type="submit"
                                disabled={!customAction.trim() || loading}
                                className="absolute right-2 top-2 h-10 w-10 bg-dnd-gold text-dnd-panel rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-0"
                           >
                               <Send className="w-5 h-5" />
                           </button>
                       </form>
                   </div>
               )}
            
                {error && <div className="text-xs text-dnd-red text-center bg-dnd-red/5 p-2 rounded-lg">{error}</div>}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}