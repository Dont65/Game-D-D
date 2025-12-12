import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { AiService } from '../services/aiService';
import { Wand2, Save, X, User, Shield, Scroll } from 'lucide-react';

interface CharacterSheetModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Player>) => void;
  aiService: AiService | null;
  readOnly?: boolean;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ 
  player, 
  isOpen, 
  onClose, 
  onUpdate,
  aiService,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    name: player.name,
    race: player.race || '',
    gender: player.gender || '',
    class: player.class || '',
    bio: player.bio || ''
  });
  const [loading, setLoading] = useState(false);

  // Sync state when modal opens or player changes
  useEffect(() => {
    if (isOpen) {
        setFormData({
            name: player.name,
            race: player.race || '',
            gender: player.gender || '',
            class: player.class || '',
            bio: player.bio || ''
        });
    }
  }, [isOpen, player]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  const handleGenerate = async () => {
      if (!aiService || readOnly) return;
      setLoading(true);
      try {
          const details = await aiService.generateCharacterDetails(player.stats);
          setFormData(prev => ({
              ...prev,
              race: details.race || prev.race,
              gender: details.gender || prev.gender,
              class: details.class || prev.class,
              bio: details.bio || prev.bio
          }));
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-dnd-panel border border-dnd-gold/50 rounded-lg max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-dnd-dark p-4 border-b border-dnd-gold/30 flex justify-between items-center">
            <h2 className="text-xl font-fantasy text-dnd-gold flex items-center gap-2">
                <User className="w-5 h-5" /> {readOnly ? 'Досье Героя' : 'Анкета Героя'}
            </h2>
            <button onClick={onClose} className="text-dnd-muted hover:text-dnd-gold">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
             {/* Read Only View */}
             {readOnly ? (
                 <div className="space-y-6 animate-fadeIn">
                     <div className="text-center border-b border-dnd-border pb-4">
                         <div className="text-2xl font-fantasy text-dnd-primary tracking-widest">{formData.name}</div>
                         <div className="text-dnd-gold text-xs uppercase tracking-[0.2em] mt-1">{formData.race} — {formData.class}</div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dnd-bg/50 p-3 rounded border border-dnd-border">
                            <div className="text-[10px] text-dnd-muted uppercase mb-1">Пол</div>
                            <div className="text-dnd-primary font-body">{formData.gender || 'Неизвестно'}</div>
                        </div>
                        <div className="bg-dnd-bg/50 p-3 rounded border border-dnd-border">
                            <div className="text-[10px] text-dnd-muted uppercase mb-1">Класс</div>
                            <div className="text-dnd-primary font-body">{formData.class || 'Бродяга'}</div>
                        </div>
                     </div>

                     <div className="bg-dnd-bg/30 p-4 rounded-xl border border-dnd-border/50">
                        <div className="flex items-center gap-2 text-dnd-gold text-xs uppercase tracking-widest mb-2">
                            <Scroll className="w-3 h-3" /> История
                        </div>
                        <div className="text-dnd-primary/80 font-body text-sm leading-relaxed italic">
                            {formData.bio || "История этого героя покрыта мраком..."}
                        </div>
                     </div>
                 </div>
             ) : (
                 /* Edit View */
                 <div className="space-y-4">
                     <div>
                        <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Имя</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-dnd-bg border border-dnd-border rounded p-2 text-dnd-primary focus:border-dnd-gold focus:outline-none"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Раса</label>
                            <input
                                name="race"
                                value={formData.race}
                                onChange={handleChange}
                                className="w-full bg-dnd-bg border border-dnd-border rounded p-2 text-dnd-primary focus:border-dnd-gold focus:outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Класс</label>
                            <input
                                name="class"
                                value={formData.class}
                                onChange={handleChange}
                                className="w-full bg-dnd-bg border border-dnd-border rounded p-2 text-dnd-primary focus:border-dnd-gold focus:outline-none"
                            />
                         </div>
                     </div>

                     <div>
                        <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Пол</label>
                        <input
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full bg-dnd-bg border border-dnd-border rounded p-2 text-dnd-primary focus:border-dnd-gold focus:outline-none"
                        />
                     </div>

                     <div>
                        <label className="block text-dnd-gold text-[10px] uppercase tracking-widest mb-1">Биография</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-dnd-bg border border-dnd-border rounded p-2 text-dnd-primary focus:border-dnd-gold focus:outline-none text-sm leading-relaxed"
                            placeholder="Опишите прошлое вашего героя..."
                        />
                     </div>

                     {aiService && (
                         <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-dnd-gold/10 border border-dnd-gold/30 rounded text-dnd-gold text-xs uppercase font-bold hover:bg-dnd-gold/20 transition-colors"
                         >
                             {loading ? <span className="animate-pulse">Придумываем...</span> : <><Wand2 className="w-4 h-4" /> Заполнить с помощью ИИ</>}
                         </button>
                     )}
                 </div>
             )}
        </div>

        {!readOnly && (
            <div className="p-4 border-t border-dnd-border bg-dnd-dark">
                <button 
                    onClick={handleSave}
                    className="w-full py-3 bg-dnd-gold text-dnd-dark font-fantasy font-bold uppercase rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" /> Сохранить изменения
                </button>
            </div>
        )}
      </div>
    </div>
  );
};