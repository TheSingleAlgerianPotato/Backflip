import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export class Character {
  constructor({ name, personality, initialMessage, avatar }) {
    this.name = name;
    // Replace placeholders in personality and initial message during creation
    this.personality = (personality + "\n\nonly take the role of the personality that's given to you it is not user or describe his actions you only have to describe your reactions")
      .replace(/{{char}}/g, name);
    this.initialMessage = initialMessage.replace(/{{char}}/g, name);
    this.avatar = avatar;
    this.chatSlots = new Map(); 
    this.API_KEY = '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';
    
    this.loadFromStorage();
  }

  loadFromStorage() {
    const storedData = localStorage.getItem(`character-${this.name}`);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      
      this.chatSlots = new Map(Object.entries(parsed.chatSlots || {}));
      this.avatar = parsed.avatar || this.avatar;
      this.personality = parsed.personality || this.personality;
      this.initialMessage = parsed.initialMessage || this.initialMessage;
    }
    
    if (!this.chatSlots.has('default')) {
      this.chatSlots.set('default', {
        name: 'General',
        messages: [{ sender: 'character', content: this.initialMessage }],
        memory: {
          messages: [
            { role: "system", content: this.personality },
            { role: "assistant", content: this.initialMessage }
          ],
          model: "sophosympatheia/rogue-rose-103b-v0.2:free",
          seed: Math.floor(Math.random() * 1000),
          jsonMode: false
        }
      });
    }
  }

  saveToStorage() {
    const chatSlotsObj = {};
    this.chatSlots.forEach((value, key) => {
      chatSlotsObj[key] = value;
    });

    const dataToStore = {
      name: this.name,
      personality: this.personality,
      initialMessage: this.initialMessage,
      avatar: this.avatar,
      chatSlots: chatSlotsObj
    };
    
    localStorage.setItem(`character-${this.name}`, JSON.stringify(dataToStore));
  }

  createChatSlot(slotId, name) {
    const newSlot = {
      name,
      messages: [{ sender: 'character', content: this.initialMessage }],
      memory: {
        messages: [
          { role: "system", content: this.personality },
          { role: "assistant", content: this.initialMessage }
        ],
        model: "sophosympatheia/rogue-rose-103b-v0.2:free",
        seed: Math.floor(Math.random() * 1000),
        jsonMode: false
      }
    };
    
    this.chatSlots.set(slotId, newSlot);
    this.saveToStorage();
    return newSlot;
  }

  deleteChatSlot(slotId) {
    if (slotId === 'default') return false;
    const success = this.chatSlots.delete(slotId);
    if (success) this.saveToStorage();
    return success;
  }

  async sendMessage(message, slotId = 'default', userPersonality = '') {
    const slot = this.chatSlots.get(slotId);
    if (!slot) return null;

    // Add user message to messages and memory
    slot.messages.push({ sender: 'user', content: message });
    const messageWithPersonality = userPersonality 
      ? `${userPersonality}\n\n${message}` 
      : message;

    slot.memory.messages.push({ 
      role: "user", 
      content: messageWithPersonality 
    });

    this.saveToStorage();

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.API_KEY}`,
          "HTTP-Referer": "https://backflip.ai", 
          "X-Title": "Backflip",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": slot.memory.model,
          "messages": slot.memory.messages,
          "seed": slot.memory.seed,
        })
      });

      if (!response.ok) {
        throw new Error('API response was not ok');
      }

      const data = await response.json();
      const reply = data.choices[0].message.content.trim();
      
      slot.messages.push({ sender: 'character', content: reply });
      slot.memory.messages.push({ role: "assistant", content: reply });
      
      this.saveToStorage();
      return reply;

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = "I apologize, but I'm having trouble responding right now. Please try again.";
      slot.messages.push({ sender: 'character', content: errorMessage });
      slot.memory.messages.push({ role: "assistant", content: errorMessage });
      this.saveToStorage();
      return errorMessage;
    }
  }
}