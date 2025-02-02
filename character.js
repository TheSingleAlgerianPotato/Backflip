import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export class Character {
  constructor({ name, personality, initialMessage, avatar }) {
    this.name = name;
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
      const reply = await this.generateAIResponse(slot);
      
      slot.messages.push({ sender: 'character', content: reply });
      slot.memory.messages.push({ role: "assistant", content: reply });
      
      this.saveToStorage();
      return reply;

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the failed message from both arrays
      slot.messages.pop(); // Remove user message
      slot.memory.messages.pop(); // Remove user message from memory
      this.saveToStorage();
      throw error; // Re-throw to let the chat interface handle the error
    }
  }

  async regenerateMessage(messageIndex, slotId = 'default') {
    const slot = this.chatSlots.get(slotId);
    if (!slot || messageIndex < 0 || messageIndex >= slot.messages.length) return null;

    try {
      // Remove the old AI response from both arrays
      slot.messages.splice(messageIndex, 1);
      slot.memory.messages.pop(); // Remove last assistant message
      
      const reply = await this.generateAIResponse(slot);
      
      // Add new response to both arrays
      slot.messages.push({ sender: 'character', content: reply });
      slot.memory.messages.push({ role: "assistant", content: reply });
      
      this.saveToStorage();
      return reply;
    } catch (error) {
      console.error('Error regenerating message:', error);
      throw error;
    }
  }

  async generateAIResponse(slot) {
    const model = localStorage.getItem('aiModel') || 'sophosympatheia/rogue-rose-103b-v0.2:free';
    const userApiKey = localStorage.getItem('apiKey');
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${userApiKey || this.API_KEY}`,
        "HTTP-Referer": "https://backflip.ai", 
        "X-Title": "Backflip",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model,
        "messages": slot.memory.messages,
        "seed": slot.memory.seed,
      })
    });

    if (!response.ok) {
      throw new Error('API response was not ok');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}