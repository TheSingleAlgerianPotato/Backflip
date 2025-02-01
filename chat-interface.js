import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export class ChatInterface {
  constructor() {
    this.chatInterface = document.getElementById('chatInterface');
    this.chatMessages = document.getElementById('chatMessages');
    this.messageInput = document.getElementById('messageInput');
    this.sendMessageBtn = document.getElementById('sendMessageBtn');
    this.closeChatBtn = document.getElementById('closeChatBtn');
    this.chatCharacterName = document.getElementById('chatCharacterName');
    
    this.currentCharacter = null;
    this.currentSlotId = 'default';
    this.userPersonality = '';
    this.userName = '';
    
    // Add typing indicator elements
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'typing-indicator hidden';
    this.typingIndicator.innerHTML = `
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    `;
    this.chatMessages.parentNode.insertBefore(this.typingIndicator, this.chatMessages.nextSibling);

    // Add evil mode warning
    this.evilModeWarning = document.createElement('div');
    this.evilModeWarning.className = 'evil-mode-warning hidden';
    this.evilModeWarning.innerHTML = `
      <div class="warning-bar">
        Remember: You are in evil mode
        <i class="ph ph-info"></i>
      </div>
    `;
    this.chatInterface.insertBefore(this.evilModeWarning, this.chatMessages);

    // Evil mode warning click handler
    this.evilModeWarning.querySelector('.warning-bar').addEventListener('click', () => {
      this.showEvilModeDisclaimer();
    });

    // Configure marked for message rendering
    marked.setOptions({
      breaks: true, // Enable line breaks
      gfm: true, // Enable GitHub Flavored Markdown
      sanitize: true // Sanitize HTML input
    });

    // Replace the previous toggle slots button creation with a reference to the existing button
    this.toggleSlotsBtn = document.getElementById('toggleSlotsBtn');
    
    // Modify the setup to use the existing button
    this.toggleSlotsBtn.addEventListener('click', () => {
      this.chatSlotsContainer.classList.toggle('hidden');
      this.toggleSlotsBtn.querySelector('i').classList.toggle('ph-caret-down');
      this.toggleSlotsBtn.querySelector('i').classList.toggle('ph-caret-up');
    });

    this.setupChatSlots();
    this.setupEventListeners();
  }

  setupChatSlots() {
    const chatSlotsContainer = document.createElement('div');
    chatSlotsContainer.className = 'chat-slots hidden'; // Start hidden
    chatSlotsContainer.innerHTML = `
      <button class="new-slot-btn" title="New Chat">
        <i class="ph ph-plus"></i>
      </button>
    `;

    // Insert after the chat messages container
    this.chatMessages.parentNode.insertBefore(chatSlotsContainer, this.chatMessages.nextSibling);

    const newSlotBtn = chatSlotsContainer.querySelector('.new-slot-btn');
    newSlotBtn.addEventListener('click', () => this.createNewSlot());

    this.chatSlotsContainer = chatSlotsContainer;
  }

  createNewSlot() {
    const slotId = Date.now().toString();
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'slot-name-input';
    nameInput.placeholder = 'Chat name...';
    
    let isHandled = false;
    
    const handleCreate = (e) => {
      // Prevent duplicate handling
      if (isHandled) return;
      isHandled = true;
      
      if (e.key === 'Enter' || e.type === 'blur') {
        const name = nameInput.value.trim() || 'New Chat';
        const slot = this.currentCharacter.createChatSlot(slotId, name);
        
        // Remove input first to prevent race condition
        if (nameInput.parentNode) {
          nameInput.remove();
        }
        
        // Then create the new slot
        this.renderChatSlot(slotId, slot);
        this.switchSlot(slotId);
      }
    };

    nameInput.addEventListener('keypress', handleCreate);
    nameInput.addEventListener('blur', handleCreate);
    
    this.chatSlotsContainer.insertBefore(nameInput, this.chatSlotsContainer.firstChild);
    nameInput.focus();
  }

  renderChatSlot(slotId, slot) {
    const chatSlot = document.createElement('div');
    chatSlot.className = `chat-slot ${this.currentSlotId === slotId ? 'active' : ''}`;
    chatSlot.dataset.slotId = slotId;
    
    chatSlot.innerHTML = `
      ${slot.name}
      ${slotId !== 'default' ? `
        <button class="icon-button close-btn" title="Delete chat">
          <i class="ph ph-x"></i>
        </button>
      ` : ''}
    `;

    chatSlot.addEventListener('click', (e) => {
      if (!e.target.closest('.close-btn')) {
        this.switchSlot(slotId);
      }
    });

    const closeBtn = chatSlot.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSlot(slotId);
      });
    }

    const existingSlot = this.chatSlotsContainer.querySelector(`[data-slot-id="${slotId}"]`);
    if (existingSlot) {
      existingSlot.replaceWith(chatSlot);
    } else {
      this.chatSlotsContainer.insertBefore(chatSlot, this.chatSlotsContainer.lastChild);
    }
  }

  switchSlot(slotId) {
    if (!this.currentCharacter || !this.currentCharacter.chatSlots.has(slotId)) return;
    
    this.currentSlotId = slotId;
    
    // Update active states
    this.chatSlotsContainer.querySelectorAll('.chat-slot').forEach(slot => {
      slot.classList.toggle('active', slot.dataset.slotId === slotId);
    });
    
    this.updateMessages();
  }

  deleteSlot(slotId) {
    if (this.currentCharacter.deleteChatSlot(slotId)) {
      const slot = this.chatSlotsContainer.querySelector(`[data-slot-id="${slotId}"]`);
      if (slot) slot.remove();
      
      if (this.currentSlotId === slotId) {
        this.switchSlot('default');
      }
    }
  }

  openChat(character, userPersonality = '', userName = '') {
    this.currentCharacter = character;
    this.userPersonality = userPersonality;
    this.userName = userName;
    this.currentSlotId = 'default';
    this.chatInterface.classList.add('open');
    this.chatCharacterName.textContent = character.name;
    
    // Clear and rebuild chat slots
    const slots = this.chatSlotsContainer.querySelectorAll('.chat-slot');
    slots.forEach(slot => slot.remove());
    
    character.chatSlots.forEach((slot, slotId) => {
      this.renderChatSlot(slotId, slot);
    });
    
    this.updateMessages();
    
    if (character.isEvil) {
      this.evilModeWarning.classList.remove('hidden');
    } else {
      this.evilModeWarning.classList.add('hidden');
    }
  }

  setupEventListeners() {
    this.closeChatBtn.addEventListener('click', () => this.closeChat());
    
    this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
    
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  closeChat() {
    this.chatInterface.classList.remove('open');
    this.currentCharacter = null;
    this.chatMessages.innerHTML = '';
    this.evilModeWarning.classList.add('hidden');
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || !this.currentCharacter) return;

    // Replace placeholders in the message
    const processedMessage = message
      .replace(/{{user}}/g, this.userName || 'User')
      .replace(/{{char}}/g, this.currentCharacter.name);

    this.messageInput.value = '';
    this.messageInput.disabled = true;
    this.sendMessageBtn.disabled = true;
    
    try {
      this.typingIndicator.classList.remove('hidden');
      
      await this.currentCharacter.sendMessage(
        processedMessage, 
        this.currentSlotId, 
        this.userPersonality
          .replace(/{{user}}/g, this.userName || 'User')
          .replace(/{{char}}/g, this.currentCharacter.name)
      );
      this.updateMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'message system-error';
      errorMessage.textContent = 'Failed to send message. Please try again.';
      this.chatMessages.appendChild(errorMessage);
    } finally {
      this.typingIndicator.classList.add('hidden');
      this.messageInput.disabled = false;
      this.sendMessageBtn.disabled = false;
      this.messageInput.focus();
    }
  }

  updateMessages() {
    this.chatMessages.innerHTML = '';
    
    if (!this.currentCharacter || !this.currentCharacter.chatSlots.has(this.currentSlotId)) {
      return;
    }
    
    const slot = this.currentCharacter.chatSlots.get(this.currentSlotId);
    let lastSender = null;
    
    slot.messages.forEach(message => {
      if (lastSender === message.sender && message.sender === 'user') {
        return;
      }
      
      const messageEl = document.createElement('div');
      messageEl.className = `message ${message.sender}`;
      
      try {
        const sanitizedContent = message.content.replace(/<[^>]*>/g, '');
        messageEl.innerHTML = marked.parse(sanitizedContent);
      } catch (error) {
        console.error('Error parsing message:', error);
        messageEl.textContent = message.content;
      }
      
      this.chatMessages.appendChild(messageEl);
      lastSender = message.sender;
    });

    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  showEvilModeDisclaimer() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const modal = document.createElement('div');
    modal.className = 'dialog-modal';
    modal.innerHTML = `
      <div class="dialog-content">
        <h3>Evil Mode Disclaimer</h3>
        <p>Evil mode does not bow to any form of censorship. Use it at your own risk! We can't be responsible for any harm caused by evil mode.</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" id="closeDisclaimerBtn">Close</button>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector('#closeDisclaimerBtn');
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const clickHandler = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        document.removeEventListener('click', clickHandler);
      }
    };

    document.addEventListener('click', clickHandler);
  }
}