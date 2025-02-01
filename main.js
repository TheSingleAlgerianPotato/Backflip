import { Character } from './character.js';
import { ChatInterface } from './chat-interface.js';

document.addEventListener('DOMContentLoaded', () => {
  // Settings state
  const settings = {
    showAvatars: localStorage.getItem('showAvatars') !== 'false', // default true
    historyStorage: localStorage.getItem('historyStorage') || '7',
    userPersonality: localStorage.getItem('userPersonality') || '',
    userName: localStorage.getItem('userName') || '',
    aiModel: localStorage.getItem('aiModel') || 'sophosympatheia/rogue-rose-103b-v0.2:free',
    apiKey: localStorage.getItem('apiKey') || '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'
  };

  // Settings elements
  const settingsModal = document.getElementById('settingsModal');
  const showAvatars = document.getElementById('showAvatars');
  const historyStorage = document.getElementById('historyStorage');
  const userPersonalityInput = document.getElementById('userPersonality');
  const userNameInput = document.getElementById('userName');
  const aiModelInput = document.getElementById('aiModel');
  const apiKeyInput = document.getElementById('apiKey');

  // Initialize settings UI
  showAvatars.classList.toggle('active', settings.showAvatars);
  historyStorage.value = settings.historyStorage;
  userPersonalityInput.value = settings.userPersonality;
  userNameInput.value = settings.userName;
  aiModelInput.value = settings.aiModel;

  // Settings event handlers
  showAvatars.addEventListener('click', () => {
    settings.showAvatars = !settings.showAvatars;
    showAvatars.classList.toggle('active', settings.showAvatars);
    localStorage.setItem('showAvatars', settings.showAvatars);
    updateCharactersList();
  });

  historyStorage.addEventListener('change', (e) => {
    settings.historyStorage = e.target.value;
    localStorage.setItem('historyStorage', e.target.value);
  });

  userPersonalityInput.addEventListener('change', (e) => {
    settings.userPersonality = e.target.value;
    localStorage.setItem('userPersonality', e.target.value);
  });

  userNameInput.addEventListener('change', (e) => {
    settings.userName = e.target.value;
    localStorage.setItem('userName', e.target.value);
  });

  aiModelInput.addEventListener('change', (e) => {
    settings.aiModel = e.target.value;
    localStorage.setItem('aiModel', e.target.value);
  });

  apiKeyInput.addEventListener('change', (e) => {
    settings.apiKey = e.target.value;
    localStorage.setItem('apiKey', e.target.value);
  });

  const characters = [];
  const chatInterface = new ChatInterface();
  
  const createBtn = document.getElementById('createBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const createModal = document.getElementById('createModal');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn, #closeModalBtn');
  let createCharacterBtn = document.getElementById('createCharacterBtn');
  const characterNameInput = document.getElementById('characterName');
  const personalityTextarea = document.getElementById('personality');
  const initialMessageInput = document.getElementById('initialMessage');
  const charactersContainer = document.getElementById('charactersContainer');
  const emptyState = document.getElementById('emptyState');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.style.backgroundImage = `url(${e.target.result})`;
        avatarPreview.textContent = '';
      };
      reader.readAsDataURL(file);
    }
  });

  function loadCharacters() {
    const storedCharacters = localStorage.getItem('characters');
    if (storedCharacters) {
      const parsed = JSON.parse(storedCharacters);
      parsed.forEach(charData => {
        if (characters.some(c => c.name === charData.name)) return;
        if (charData.name === 'Assistant') return;
        
        // Create character with stored data including avatar
        const character = new Character({
          name: charData.name,
          personality: charData.personality,
          initialMessage: charData.initialMessage,
          avatar: charData.avatar // Ensure avatar is included
        });
        
        characters.push(character);
      });
    }
  }

  const existingAssistant = characters.find(c => c.name === 'Assistant');
  if (!existingAssistant) {
    const assistant = new Character({
      name: 'Assistant',
      personality: 'You are a helpful AI assistant. Provide clear and concise answers to user questions.',
      initialMessage: 'Hello! How can I assist you today?',
      avatar: null
    });
    characters.push(assistant);
  }

  loadCharacters();
  if (characters.length > 0) {
    emptyState.classList.add('hidden');
  }

  function updateCharactersList() {
    // Filter characters based on settings
    const filtered = characters.filter(c => true);
    
    // Update avatar visibility
    charactersContainer.querySelectorAll('.character-avatar').forEach(avatar => {
      avatar.style.display = settings.showAvatars ? 'flex' : 'none';
    });
    
    const existingList = document.querySelector('.characters-list');
    if (existingList) {
      existingList.remove();
    }

    const list = document.createElement('div');
    list.className = 'characters-list';

    filtered.slice().reverse().forEach(character => {
      const item = document.createElement('div');
      item.className = 'character-item';
      item.innerHTML = `
        <div class="character-avatar">
          ${character.avatar ? 
            `<img src="${character.avatar}" alt="${character.name}">` :
            `<div class="avatar-fallback">${character.name.charAt(0)}</div>`
          }
        </div>
        <div class="character-info">
          <h3 class="character-name">${character.name}</h3>
        </div>
        <button class="icon-button more-options-btn">
          <i class="ph ph-dots-three"></i>
        </button>
      `;

      const moreOptionsBtn = item.querySelector('.more-options-btn');
      moreOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        showCharacterOptions(character, e);
      });
      
      item.addEventListener('click', () => {
        openChat(character);
      });
      
      list.appendChild(item);
    });

    charactersContainer.appendChild(list);
  }

  updateCharactersList();

  createBtn.addEventListener('click', () => {
    createModal.classList.add('open');
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      createModal.classList.remove('open');
    });
  });

  createCharacterBtn.addEventListener('click', async () => {
    if (!characterNameInput.value || !personalityTextarea.value || !initialMessageInput.value) {
      showErrorDialog('Please fill out all required fields');
      return;
    }

    const avatarFile = avatarInput.files[0];
    let avatarUrl = '';
    
    if (avatarFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarUrl = e.target.result;
        createCharacter(avatarUrl);
      };
      reader.readAsDataURL(avatarFile);
    } else {
      createCharacter(avatarUrl);
    }
  });

  function createCharacter(avatarUrl) {
    if (!characterNameInput.value || !personalityTextarea.value || !initialMessageInput.value) {
      showErrorDialog('Please fill out all required fields');
      return;
    }

    const characterData = {
      name: characterNameInput.value,
      personality: personalityTextarea.value,
      initialMessage: initialMessageInput.value,
      avatar: avatarUrl
    };

    const character = new Character(characterData);
    characters.unshift(character);
  
    const dataToStore = characters.map(char => ({
      name: char.name,
      personality: char.personality.split("\n\nonly take")[0],
      initialMessage: char.initialMessage,
      avatar: char.avatar
    }));
  
    localStorage.setItem('characters', JSON.stringify(dataToStore));
  
    emptyState.classList.add('hidden');
    updateCharactersList();
  
    resetModal();
  }

  function showErrorDialog(message) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const modal = document.createElement('div');
    modal.className = 'dialog-modal';
    modal.innerHTML = `
      <div class="dialog-content">
        <h3>Error</h3>
        <p>${message}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" id="closeErrorBtn">Close</button>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector('#closeErrorBtn');
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

  function showCharacterOptions(character, event) {
    const overlay = document.createElement('div');
    overlay.className = 'options-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'options-modal';
    modal.innerHTML = `
      <div class="option-item" data-action="edit">Edit Character</div>
      <div class="option-item" data-action="delete">Delete Character</div>
      <button class="btn btn-secondary close-options-modal" style="margin-top: 1rem; width: 100%;">Close</button>
    `;

    const options = modal.querySelectorAll('.option-item');
    options.forEach(option => {
      option.addEventListener('click', () => {
        const action = option.getAttribute('data-action');
        handleCharacterAction(character, action);
        overlay.remove();
      });
    });

    const closeBtn = modal.querySelector('.close-options-modal');
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
    event.stopPropagation();
  }

  function handleCharacterAction(character, action) {
    switch(action) {
      case 'edit':
        openEditModal(character);
        break;
      case 'delete':
        showDeleteConfirmation(character);
        break;
    }
  }

  function showDeleteConfirmation(character) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const modal = document.createElement('div');
    modal.className = 'dialog-modal';
    modal.innerHTML = `
      <div class="dialog-content">
        <h3>Delete Character</h3>
        <p>Are you sure you want to delete ${character.name}? This action cannot be undone.</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
          <button class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
        </div>
      </div>
    `;

    const cancelBtn = modal.querySelector('#cancelDeleteBtn');
    const confirmBtn = modal.querySelector('#confirmDeleteBtn');

    cancelBtn.addEventListener('click', () => {
      overlay.remove();
    });

    confirmBtn.addEventListener('click', () => {
      deleteCharacter(character);
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

  function openEditModal(character) {
    let currentCharacter = character; // Fix constant assignment
    
    characterNameInput.value = currentCharacter.name;
    personalityTextarea.value = currentCharacter.personality.split("\n\nonly take")[0];
    initialMessageInput.value = currentCharacter.initialMessage;
    
    if (currentCharacter.avatar) {
      avatarPreview.style.backgroundImage = `url(${currentCharacter.avatar})`;
      avatarPreview.textContent = '';
    } else {
      avatarPreview.style.backgroundImage = '';
      avatarPreview.textContent = '+';
    }

    const oldBtn = document.getElementById('createCharacterBtn');
    const newBtn = oldBtn.cloneNode(true);
    newBtn.textContent = 'Save Changes';
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    
    const updatedSaveBtn = document.getElementById('createCharacterBtn');
    
    // Clear existing event listeners
    updatedSaveBtn.replaceWith(updatedSaveBtn.cloneNode(true));
    const freshSaveBtn = document.getElementById('createCharacterBtn');
    
    freshSaveBtn.addEventListener('click', async () => {
      const avatarFile = avatarInput.files[0];
      let newAvatar = currentCharacter.avatar;

      if (avatarFile) {
        newAvatar = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(avatarFile);
        });
      }

      if (characterNameInput.value && personalityTextarea.value && initialMessageInput.value) {
        currentCharacter.name = characterNameInput.value;
        currentCharacter.personality = personalityTextarea.value;
        currentCharacter.initialMessage = initialMessageInput.value;
        currentCharacter.avatar = newAvatar;

        localStorage.setItem('characters', JSON.stringify(characters.map(char => ({
          name: char.name,
          personality: char.personality.split("\n\nonly take")[0],
          initialMessage: char.initialMessage,
          avatar: char.avatar
        }))));

        updateCharactersList();
        resetModal();
      } else {
        showErrorDialog('Please fill out all required fields');
      }
    });

    createModal.classList.add('open');
  }

  function resetModal() {
    characterNameInput.value = '';
    personalityTextarea.value = '';
    initialMessageInput.value = '';
    avatarInput.value = '';
    avatarPreview.style.backgroundImage = '';
    avatarPreview.textContent = '+';
    createModal.classList.remove('open');
    
    const oldBtn = document.getElementById('createCharacterBtn');
    const newBtn = oldBtn.cloneNode(true);
    newBtn.textContent = 'Create';
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    
    createCharacterBtn = document.getElementById('createCharacterBtn');
    
    createCharacterBtn.addEventListener('click', async () => {
      if (!characterNameInput.value || !personalityTextarea.value || !initialMessageInput.value) {
        showErrorDialog('Please fill out all required fields');
        return;
      }

      const avatarFile = avatarInput.files[0];
      let avatarUrl = '';
      
      if (avatarFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          avatarUrl = e.target.result;
          createCharacter(avatarUrl);
        };
        reader.readAsDataURL(avatarFile);
      } else {
        createCharacter(avatarUrl);
      }
    });
  }

  function deleteCharacter(character) {
    const index = characters.indexOf(character);
    if (index !== -1) {
      characters.splice(index, 1);
      
      localStorage.setItem('characters', JSON.stringify(characters.map(char => ({
        name: char.name,
        personality: char.personality.split("\n\nonly take")[0],
        initialMessage: char.initialMessage,
        avatar: char.avatar
      }))));
      
      updateCharactersList();
      
      if (characters.length === 0) {
        emptyState.classList.remove('hidden');
      }
    }
  }

  function openChat(character) {
    chatInterface.openChat(character, settings.userPersonality, settings.userName);
  }

  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('open');
  });

  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  // Initialize modal state
  resetModal();
});