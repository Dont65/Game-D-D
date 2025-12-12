import { ApiConfig, AIResponse, GameState, Theme, Stats, ItemFoundData } from '../types';
import { SYSTEM_PROMPT } from '../constants';

export class AiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async callApi(messages: any[], maxTokens: number = 1000, jsonMode: boolean = true): Promise<string> {
    const cleanBaseUrl = this.config.baseUrl.trim().replace(/\/+$/, '');
    const url = `${cleanBaseUrl}/chat/completions`;

    const body: any = {
      model: this.config.model || 'mistralai/devstral-2512:free',
      messages: messages,
      temperature: 0.9,
      max_tokens: maxTokens,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey.trim()}`,
        'HTTP-Referer': window.location.origin, 
        'X-Title': 'DnD Dungeon Crawler',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
            throw new Error('Модель перегружена (429). Попробуйте позже.');
        }
        throw new Error(`API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private extractJson(text: string): any {
      let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(clean);
      } catch (e) {
         const firstOpenBrace = clean.indexOf('{');
         const firstOpenBracket = clean.indexOf('[');
         let firstOpen = -1;
         let lastClose = -1;
         
         if (firstOpenBracket !== -1 && (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)) {
             firstOpen = firstOpenBracket;
             lastClose = clean.lastIndexOf(']');
         } else if (firstOpenBrace !== -1) {
             firstOpen = firstOpenBrace;
             lastClose = clean.lastIndexOf('}');
         }

         if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            try {
                return JSON.parse(clean.substring(firstOpen, lastClose + 1));
            } catch (innerE) {
                throw new Error("JSON Parse failed");
            }
         }
         throw new Error("No JSON found");
      }
  }

  async generateCharacterDetails(stats: Stats): Promise<any> {
      const prompt = `
        Создай анкету героя фэнтези.
        Статы: Сила ${stats.str}, Ловкость ${stats.dex}, Интеллект ${stats.int}.

        Верни JSON:
        {
           "name": "Имя (звучное, фэнтезийное)",
           "race": "Раса",
           "gender": "Пол",
           "class": "Класс",
           "bio": "Предыстория (1-2 предл.)"
        }
      `;
      
      try {
          const content = await this.callApi([
              { role: 'system', content: 'Ты генератор персонажей. Верни только JSON.' },
              { role: 'user', content: prompt }
          ], 500, false);
          return this.extractJson(content);
      } catch (e) {
          return { name: "Безымянный", race: "Человек", bio: "..." };
      }
  }

  async generateThemes(allowLight: boolean = false): Promise<Theme[]> {
    const styleInstruction = allowLight 
        ? "Можно создавать и ТЕМНЫЕ, и СВЕТЛЫЕ темы." 
        : "Строго ТЕМНЫЕ темы (Dark Mode).";

    const prompt = `
      Ты UI/UX дизайнер. Сгенерируй 5 цветовых схем для RPG.
      ${styleInstruction}
      
      ВАЖНО ПРО ЦВЕТА:
      1. Цвет "gold" - это ГЛАВНЫЙ АКЦЕНТНЫЙ ЦВЕТ (Primary Key Color).
      2. ОН НЕ ОБЯЗАН БЫТЬ ЖЕЛТЫМ! 
      3. Если тема "Некромант" - сделай "gold" ядовито-зеленым или фиолетовым.
      4. Если тема "Киберпанк" - сделай "gold" неоново-розовым или голубым.
      5. Если тема "Вампир" - сделай "gold" кроваво-красным.
      
      Структура цветов JSON (все поля обязательны, HEX формат):
      - dark: Фон страницы (обычно очень темный).
      - panel: Фон карточек/панелей (чуть светлее фона).
      - gold: ГЛАВНЫЙ АКЦЕНТ (кнопки, заголовки, важные элементы). ЛЮБОЙ ЯРКИЙ ЦВЕТ.
      - red: Цвет опасности/HP.
      - blue: Цвет магии/MP.
      - text: Основной текст.
      - muted: Вторичный текст.
      - diceBg: Фон кубиков.
      - diceText: Цифры на кубиках (обычно совпадает с gold).
      - diceBorder: Обводка кубиков.

      Верни JSON массив объектов: [{"name": "Название Темы", "colors": {...}}, ...]
    `;

    try {
        const content = await this.callApi([
            { role: 'system', content: 'Ты дизайнер. Верни JSON массив.' },
            { role: 'user', content: prompt }
        ], 2000, false);

        const result = this.extractJson(content);
        const themes = Array.isArray(result) ? result : result.themes || [result];
        
        // Ensure dice colors exist for legacy compatibility
        return themes.map((t: any) => ({
            ...t,
            colors: {
                ...t.colors,
                diceBg: t.colors.diceBg || t.colors.panel,
                diceText: t.colors.diceText || t.colors.gold,
                diceBorder: t.colors.diceBorder || t.colors.muted
            }
        }));

    } catch (e) {
        return [{
            name: "Классическая Тьма",
            colors: { dark: "#1a1b1e", panel: "#25262b", gold: "#c2b36e", red: "#e03131", blue: "#1971c2", text: "#c1c2c5", muted: "#909296", diceBg: "#111111", diceText: "#c2b36e", diceBorder: "#c2b36e" }
        }];
    }
  }

  async generateTurn(action: string, currentState: GameState, d20Roll?: number, bonusRoll?: { type: string, value: number }): Promise<AIResponse> {
    const inventorySimple = currentState.player.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ');

    const context = {
      player: {
        ...currentState.player.stats,
        race: currentState.player.race,
        class: currentState.player.class,
        inventory: inventorySimple
      },
      location: currentState.location,
      lastAction: action,
    };

    let rollText = d20Roll ? `Бросок d20: ${d20Roll}` : '';
    if (bonusRoll) rollText += ` + Бонус ${bonusRoll.type}: ${bonusRoll.value}`;

    const userPrompt = `
      Состояние: ${JSON.stringify(context)}
      Действие: "${action}"
      ${rollText}
      
      ВАЖНО:
      1. Если игрок использует предмет, опиши эффект и удали его через 'itemLost'.
      2. Если игрок находит лут, добавь в 'itemsFound'.
      3. Не предлагай использовать предметы в 'options'.
    `;

    try {
      const content = await this.callApi([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
      ], 1500, false);

      if (!content) throw new Error("Empty response");
      const parsed = this.extractJson(content);
      
      // Normalize itemsFound to array if AI sends single object or string (fallback)
      if (parsed.itemFound && !parsed.itemsFound) {
          // Legacy/Fallback handling
          if (typeof parsed.itemFound === 'string') {
               parsed.itemsFound = parsed.itemFound.split(',').map((s: string) => ({ name: s.trim(), quantity: 1 }));
          }
      }
      if (!parsed.options) parsed.options = [];
      return parsed;

    } catch (error: any) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }
}