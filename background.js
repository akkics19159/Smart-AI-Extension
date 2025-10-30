// background.js - Optimized Service Worker for SmartNotes AI 2025
// Handles AI processing with lazy loading for better performance

// Core modules - loaded immediately
import { StorageManager } from './scripts/storageManager.js';
let storageManager = null;

// Lazy-loaded modules - loaded on demand
let aiSummarizer = null;
let flashcardGenerator = null;
let quizGenerator = null;
let videoManager = null;
let realtimeSync = null;
let socialFeatures = null;
let analyticsEngine = null;
let ocrProcessor = null;
let sentenceTransformer = null;
let ttsProcessor = null;

// Caching for processed content (LRU cache with max 10 entries)
const contentCache = new Map();
const MAX_CACHE_SIZE = 10;

function getCacheKey(text, type) {
  // Create a simple hash of the text for caching
  const hash = text.substring(0, 100) + text.length;
  return `${type}_${hash}`;
}

function getCachedResult(text, type) {
  const key = getCacheKey(text, type);
  return contentCache.get(key);
}

function setCachedResult(text, type, result) {
  const key = getCacheKey(text, type);

  // Implement LRU: remove oldest if cache is full
  if (contentCache.size >= MAX_CACHE_SIZE) {
    const firstKey = contentCache.keys().next().value;
    contentCache.delete(firstKey);
  }

  contentCache.set(key, {
    result: result,
    timestamp: Date.now()
  });
}

// Lazy loading functions
async function loadAIModules() {
  try {
    if (!aiSummarizer) {
      const { AISummarizer } = await import('./scripts/aiSummarizer.js');
      aiSummarizer = new AISummarizer();
      await aiSummarizer.initialize();
    }
    if (!flashcardGenerator) {
      const { FlashcardGenerator } = await import('./scripts/flashcardGenerator.js');
      flashcardGenerator = new FlashcardGenerator();
      await flashcardGenerator.initialize();
    }
    if (!quizGenerator) {
      const { QuizGenerator } = await import('./scripts/quizGenerator.js');
      quizGenerator = new QuizGenerator();
      await quizGenerator.initialize();
    }
  } catch (error) {
    console.error('Failed to load AI modules:', error);
    throw error;
  }
}

async function loadVideoModules() {
  try {
    if (!videoManager) {
      const { VideoManager } = await import('./scripts/videoManager.js');
      const { getYouTubeTranscript } = await import('./scripts/youtubeManager.js');
      videoManager = new VideoManager();
    }
  } catch (error) {
    console.error('Failed to load video modules:', error);
    throw error;
  }
}

async function loadAdvancedModules() {
  try {
    if (!realtimeSync) {
      const { RealtimeSync } = await import('./scripts/realtimeSync.js');
      realtimeSync = new RealtimeSync();
      await realtimeSync.initialize();
    }
    if (!socialFeatures) {
      const { SocialFeatures } = await import('./scripts/socialFeatures.js');
      socialFeatures = new SocialFeatures();
      await socialFeatures.initialize();
    }
    if (!analyticsEngine) {
      const { AnalyticsEngine } = await import('./scripts/analyticsEngine.js');
      analyticsEngine = new AnalyticsEngine();
      await analyticsEngine.initialize();
    }
  } catch (error) {
    console.error('Failed to load advanced modules:', error);
    throw error;
  }
}

async function loadOCRModule() {
  try {
    if (!ocrProcessor) {
      const { OCRProcessor } = await import('./wasm/ocr-processor.js');
      ocrProcessor = new OCRProcessor();
      await ocrProcessor.initialize();
    }
  } catch (error) {
    console.error('Failed to load OCR module:', error);
    throw error;
  }
}

async function loadEmbeddingModule() {
  try {
    if (!sentenceTransformer) {
      const { SentenceTransformer } = await import('./models/sentence-transformer.js');
      sentenceTransformer = new SentenceTransformer();
      await sentenceTransformer.initialize();
    }
  } catch (error) {
    console.error('Failed to load embedding module:', error);
    throw error;
  }
}

// Context menu items
const CONTEXT_MENU_ITEMS = {
  summarize: {
    id: 'smartnotes-summarize',
    title: '📝 Summarize with AI',
    contexts: ['selection']
  },
  flashcard: {
    id: 'smartnotes-generate-flashcard',
    title: '🎯 Generate Flashcard',
    contexts: ['selection']
  },
  quiz: {
    id: 'smartnotes-create-quiz',
    title: '❓ Create Quiz',
    contexts: ['selection']
  },
  ocr: {
    id: 'extract-text-ocr',
    title: '📷 Extract Text (OCR)',
    contexts: ['image']
  }
};

// Initialize only essential modules
async function initializeModules() {
  try {
    console.log('Initializing SmartNotes AI core modules...');

    // Initialize only storage manager initially
    storageManager = new StorageManager();

    // Initialize TTS in offscreen document (essential for basic functionality)
    await initializeTTS();

    console.log('SmartNotes AI core modules initialized successfully');

  } catch (error) {
    console.error('Failed to initialize core modules:', error);
  }
}

// Initialize TTS processor in offscreen document
async function initializeTTS() {
  try {
    // Check if offscreen API is available
    if (!chrome.offscreen) {
      console.warn('Offscreen API not available, TTS will not work');
      return;
    }

    const offscreenUrl = chrome.runtime.getURL('offscreen/offscreen.html');
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'TTS audio playback for SmartNotes AI'
    });

    // Initialize TTS processor
    ttsProcessor = {
      speak: async (text, options) => {
        return chrome.runtime.sendMessage({
          type: 'tts_speak',
          text: text,
          options: options
        });
      },
      stop: async () => {
        return chrome.runtime.sendMessage({ type: 'tts_stop' });
      }
    };

    console.log('TTS processor initialized in offscreen document');
  } catch (error) {
  console.error('Failed to initialize TTS:', error);
  // TTS not available, processor remains null
  console.log('TTS initialization failed, TTS features will be disabled');
  }
}

// Set up context menus
function setupContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Create new context menus
    Object.values(CONTEXT_MENU_ITEMS).forEach(item => {
      chrome.contextMenus.create({
        id: item.id,
        title: item.title,
        contexts: item.contexts
      });
    });

    console.log('Context menus created');
  });
}

// Storage initialization
async function initializeStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['folders', 'settings'], function(result) {
            const promises = [];

            if (!result.folders) {
                // Create default folders
                const defaultFolders = {
                    'General Knowledge': [],
                    'JEE Physics': [],
                    'UPSC History': [],
                    'Science': []
                };
                promises.push(new Promise((resolve) => {
                    chrome.storage.local.set({ folders: defaultFolders }, resolve);
                }));
            }

            if (!result.settings) {
                // Default settings - no AI provider needed (on-device only)
                const defaultSettings = {
                    language: 'english',
                    dailyReminder: true,
                    reminderTime: '09:00',
                    autoSave: true
                };
                promises.push(new Promise((resolve) => {
                    chrome.storage.local.set({ settings: defaultSettings }, resolve);
                }));
            }

            // Wait for all storage operations to complete
            Promise.all(promises).then(resolve);
        });
    });
}

// Daily reminders setup
function setupDailyReminders() {
    chrome.alarms.create('daily-reminder', {
        delayInMinutes: 1,
        periodInMinutes: 1440 // 24 hours
    });
}



// Context menu click handler
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.selectionText) {
        const action = info.menuItemId.replace('smartnotes-', '');

        switch(action) {
            case 'summarize':
                processText('summarize', info.selectionText, tab);
                break;
            case 'flashcards':
                processText('generateFlashcards', info.selectionText, tab);
                break;
            case 'quiz':
                processText('generateQuiz', info.selectionText, tab);
                break;
        }
    }
});

// Message handler for popup and content script communication
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Handle both old action-based and new type-based messages
    if (request.action) {
        // Legacy action-based messages from popup.js
        switch(request.action) {
            case 'summarize':
                processText('summarize', request.text, sender.tab)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;

            case 'generateFlashcards':
                processText('generateFlashcards', request.text, sender.tab)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;

            case 'generateQuiz':
                processText('generateQuiz', request.text, sender.tab)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;

            case 'textSelected':
                handleTextSelection(request);
                sendResponse({ success: true });
                break;

            case 'saveFlashcard':
                saveFlashcard(request.flashcard, request.folder)
                    .then(() => sendResponse({ success: true }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;

            case 'getFolders':
                getFolders()
                    .then(folders => sendResponse({ success: true, data: folders }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;

            case 'getFlashcards':
                getFlashcards(request.folder)
                    .then(flashcards => sendResponse({ success: true, data: flashcards }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
        }
    } else if (request.type) {
        // New type-based messages - handled by handleMessage function
        handleMessage(request, sender, sendResponse);
        return true;
    }
});

// Text processing with AI - now uses on-device modules
async function processText(action, text, tab) {
    try {
        let result;
        switch(action) {
            case 'summarize':
                result = await aiSummarizer.generateSummary(text);
                break;
            case 'generateFlashcards':
                result = await flashcardGenerator.generateFlashcard(text);
                break;
            case 'generateQuiz':
                result = await quizGenerator.generateQuiz(text);
                break;
            default:
                throw new Error('Unknown action');
        }

        return result;
    } catch (error) {
        console.error('Error processing text:', error);
        throw error;
    }
}

// AI processing is now handled by on-device modules (AISummarizer, FlashcardGenerator, QuizGenerator)

// Storage functions
async function saveFlashcard(flashcard, folder) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['folders'], function(result) {
            const folders = result.folders || {};
            if (!folders[folder]) {
                folders[folder] = [];
            }

            folders[folder].push({
                ...flashcard,
                id: Date.now(),
                created: new Date().toISOString()
            });

            chrome.storage.local.set({ folders }, function() {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    });
}

async function getFolders() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['folders'], function(result) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result.folders || {});
            }
        });
    });
}

async function getFlashcards(folder) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['folders'], function(result) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                const folders = result.folders || {};
                resolve(folders[folder] || []);
            }
        });
    });
}

async function getSettings() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['settings'], function(result) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result.settings || {});
            }
        });
    });
}

// Handle text selection
function handleTextSelection(request) {
    // Could show notification or update badge
    console.log('Text selected:', request.text.substring(0, 50) + '...');
}

// Daily reminder function
function sendDailyReminder() {
    chrome.storage.local.get(['settings'], function(result) {
        if (result.settings && result.settings.dailyReminder) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'SmartNotes AI Reminder',
                message: 'Time for your daily flashcard review! 📚'
            });
        }
    });
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(function(notificationId) {
    // Open dashboard or popup
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// Handle alarms (daily reminders, etc.)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'daily-reminder':
      const settings = await getSettings();
      if (settings.dailyReminder) {
        showNotification('Time for your daily study session! 📚', 'reminder');
      }
      break;

    case 'sync-reminder':
      if (realtimeSync && !realtimeSync.isOnline) {
        // Attempt to sync queued data
        await realtimeSync.processSyncQueue();
      }
      break;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    let selectedText = info.selectionText || '';
    let result = null;

    // Track context menu usage
    if (analyticsEngine) {
      analyticsEngine.trackEvent({
        type: 'context_menu_used',
        menuId: info.menuItemId,
        hasSelection: !!selectedText,
        timestamp: Date.now()
      });
    }

    switch (info.menuItemId) {
      case 'summarize-selection':
        if (!selectedText) {
          showNotification('Please select some text to summarize');
          return;
        }

        showNotification('Generating AI summary...', 'progress');

        result = await aiSummarizer.generateSummary(selectedText);
        await storageManager.saveSummary(result);

        showNotification('Summary generated successfully!', 'success');
        break;

      case 'generate-flashcard':
        if (!selectedText) {
          showNotification('Please select some text to create a flashcard');
          return;
        }

        showNotification('Generating flashcard...', 'progress');

        result = await flashcardGenerator.generateFlashcard(selectedText);
        const cardId = await storageManager.saveFlashcard(result);

        showNotification(`Flashcard created! (${cardId})`, 'success');
        break;

      case 'create-quiz':
        if (!selectedText) {
          showNotification('Please select some text to create a quiz');
          return;
        }

        showNotification('Generating quiz...', 'progress');

        result = await quizGenerator.generateQuiz(selectedText);
        const quizId = await storageManager.saveQuiz(result);

        showNotification(`Quiz created with ${result.length} questions!`, 'success');
        break;

      case 'extract-text-ocr':
        if (!info.srcUrl) {
          showNotification('Please right-click on an image');
          return;
        }

        showNotification('Extracting text from image...', 'progress');

        // Get image data
        const imageResponse = await fetch(info.srcUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBlob = await imageResponse.blob();

        result = await ocrProcessor.processImage(imageBlob);
        showNotification('Text extracted successfully!', 'success');
        break;
    }

    // Update user progress
    if (socialFeatures) {
      await socialFeatures.updateUserProgress({
        type: info.menuItemId.replace('-', '_'),
        timestamp: Date.now()
      });
    }

  } catch (error) {
    console.error('Context menu action failed:', error);
    showNotification('Action failed. Please check your API settings.', 'error');
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) return;

    // Get selected text
    const injection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });

    const selectedText = injection[0].result;

    if (!selectedText) {
      showNotification('Please select some text first');
      return;
    }

    // Track keyboard shortcut usage
    if (analyticsEngine) {
      analyticsEngine.trackEvent({
        type: 'keyboard_shortcut_used',
        command: command,
        hasSelection: true,
        timestamp: Date.now()
      });
    }

    switch (command) {
      case 'summarize-selection':
        await handleSummarizeSelection(selectedText);
        break;
      case 'generate-flashcard':
        await handleGenerateFlashcard(selectedText);
        break;
      case 'create-quiz':
        await handleCreateQuiz(selectedText);
        break;
      case 'open-dashboard':
        await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
        break;
    }

  } catch (error) {
    console.error('Keyboard shortcut failed:', error);
    showNotification('Shortcut action failed', 'error');
  }
});

// Message handling with lazy loading
async function handleMessage(request, sender, sendResponse) {
  try {
    // Load required modules based on request type
    switch (request.type) {
      case 'summarize':
      case 'generate_flashcard':
      case 'generate_quiz':
        await loadAIModules();
        break;
      case 'save_video':
      case 'get_video':
      case 'generate_video_summary':
        await loadVideoModules();
        break;
      case 'ocr_process':
        await loadOCRModule();
        break;
      case 'semantic_search':
        await loadEmbeddingModule();
        break;
      case 'sync_data':
      case 'get_analytics':
      case 'social_join_group':
      case 'social_create_group':
      case 'get_leaderboard':
        await loadAdvancedModules();
        break;
    }

    // Handle the actual request with caching
    switch (request.type) {
      case 'summarize':
        // Check cache first
        let cachedSummary = getCachedResult(request.text, 'summary');
        if (cachedSummary && (Date.now() - cachedSummary.timestamp) < 3600000) { // 1 hour cache
          sendResponse({ success: true, data: cachedSummary.result, cached: true });
        } else {
          const summary = await aiSummarizer.generateSummary(request.text);
          setCachedResult(request.text, 'summary', summary);
          sendResponse({ success: true, data: summary });
        }
        break;

      case 'generate_flashcard':
        const flashcard = await flashcardGenerator.generateFlashcard(request.text);
        const cardId = await storageManager.saveFlashcard(flashcard, request.folder);
        sendResponse({ success: true, data: { ...flashcard, id: cardId } });
        break;

      case 'generate_quiz':
        // Check cache for quiz
        let cachedQuiz = getCachedResult(request.text, 'quiz');
        if (cachedQuiz && (Date.now() - cachedQuiz.timestamp) < 3600000) {
          const quizId = await storageManager.saveQuiz(cachedQuiz.result, request.title || 'Auto Quiz');
          sendResponse({ success: true, data: { quiz: cachedQuiz.result, quizId }, cached: true });
        } else {
          const quiz = await quizGenerator.generateQuiz(request.text, request.questionCount);
          setCachedResult(request.text, 'quiz', quiz);
          const quizId = await storageManager.saveQuiz(quiz, request.title || 'Auto Quiz');
          sendResponse({ success: true, data: { quiz, quizId } });
        }
        break;

      case 'get_flashcards':
        const flashcards = await storageManager.getAllFlashcards();
        sendResponse({ success: true, data: flashcards });
        break;

      case 'get_folders':
        const folders = await storageManager.getFolders();
        sendResponse({ success: true, data: folders });
        break;

      case 'get_quizzes':
        const quizzes = await storageManager.getQuizzes();
        sendResponse({ success: true, data: quizzes });
        break;

      case 'save_settings':
        await storageManager.saveSettings(request.settings);
        sendResponse({ success: true });
        break;

      case 'get_settings':
        const settings = await storageManager.getSettings();
        sendResponse({ success: true, data: settings });
        break;

      case 'sync_data':
        const syncResult = await realtimeSync.syncData(request.dataType, request.data);
        sendResponse({ success: true, data: syncResult });
        break;

      case 'get_analytics':
        const analytics = await analyticsEngine.generateInsights();
        sendResponse({ success: true, data: analytics });
        break;

      case 'ocr_process':
        let ocrResult;
        if (request.imageData) {
          ocrResult = await ocrProcessor.processImage(request.imageData);
        } else if (request.tabId) {
          ocrResult = await ocrProcessor.processScreenshot(request.tabId);
        }
        sendResponse({ success: true, data: ocrResult });
        break;

      case 'semantic_search':
        const searchResults = await sentenceTransformer.semanticSearch(
          request.flashcards,
          request.query,
          request.topK
        );
        sendResponse({ success: true, data: searchResults });
        break;

      case 'tts_speak':
        if (ttsProcessor) {
          await ttsProcessor.speak(request.text, request.options);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'TTS not available' });
        }
        break;

      case 'tts_stop':
        if (ttsProcessor) {
          await ttsProcessor.stop();
          sendResponse({ success: true });
        }
        break;

      case 'social_join_group':
        const joinResult = await socialFeatures.joinStudyGroup(request.groupId, request.code);
        sendResponse({ success: true, data: joinResult });
        break;

      case 'social_create_group':
        const group = await socialFeatures.createStudyGroup(request.groupData);
        sendResponse({ success: true, data: group });
        break;

      case 'get_leaderboard':
        const leaderboard = await socialFeatures.getLeaderboard(request.timeframe);
        sendResponse({ success: true, data: leaderboard });
        break;

      case 'save_video':
        const videoId = await videoManager.saveVideo(request.videoData, request.folder);
        sendResponse({ success: true, data: { videoId } });
        break;

      case 'get_video':
        const video = await videoManager.getVideo(request.videoId);
        sendResponse({ success: true, data: video });
        break;

      case 'get_videos_by_folder':
        const videos = await videoManager.getVideosByFolder(request.folder);
        sendResponse({ success: true, data: videos });
        break;

      case 'get_all_videos':
        const allVideos = await videoManager.getAllVideos();
        sendResponse({ success: true, data: allVideos });
        break;

      case 'update_video':
        const updatedVideo = await videoManager.updateVideo(request.videoId, request.updates);
        sendResponse({ success: true, data: updatedVideo });
        break;

      case 'delete_video':
        const deleted = await videoManager.deleteVideo(request.videoId);
        sendResponse({ success: true, data: { deleted } });
        break;

      case 'search_videos':
        const videoSearchResults = await videoManager.searchVideos(request.query, request.folder);
        sendResponse({ success: true, data: videoSearchResults });
        break;

      case 'generate_video_summary':
        const videoSummary = await videoManager.generateVideoSummary(request.videoUrl, request.transcript);
        sendResponse({ success: true, data: videoSummary });
        break;

      case 'generate_video_flashcards':
        const videoFlashcards = await videoManager.generateVideoFlashcards(request.videoUrl, request.transcript);
        sendResponse({ success: true, data: videoFlashcards });
        break;

      case 'import_playlist':
        const importResult = await videoManager.importYouTubePlaylist(request.playlistUrl, request.folder);
        sendResponse({ success: true, data: importResult });
        break;

      case 'get_video_statistics':
        const stats = await videoManager.getVideoStatistics();
        sendResponse({ success: true, data: stats });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    // Track message handling
    if (analyticsEngine) {
      analyticsEngine.trackEvent({
        type: 'message_handled',
        messageType: request.type,
        success: true,
        timestamp: Date.now()
      });
    }

  } catch (error) {
    console.error('Message handling failed:', error);
    sendResponse({ success: false, error: error.message });

    // Track error
    if (analyticsEngine) {
      analyticsEngine.trackEvent({
        type: 'message_error',
        messageType: request.type,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
}

// Helper functions
async function handleSummarizeSelection(text) {
  const summary = await aiSummarizer.generateSummary(text);
  await storageManager.saveSummary(summary);
  showNotification('Summary generated successfully!', 'success');
}

async function handleGenerateFlashcard(text) {
  const flashcard = await flashcardGenerator.generateFlashcard(text);
  const cardId = await storageManager.saveFlashcard(flashcard);
  showNotification(`Flashcard created!`, 'success');
}

async function handleCreateQuiz(text) {
  const quiz = await quizGenerator.generateQuiz(text);
  const quizId = await storageManager.saveQuiz(quiz);
  showNotification(`Quiz created with ${quiz.length} questions!`, 'success');
}

function showNotification(message, type = 'info') {
  const notificationId = Date.now().toString();

  const notificationOptions = {
    type: 'basic',
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jzyr5AAAAABJRU5ErkJggg==', // 1x1 transparent PNG
    title: 'SmartNotes AI',
    message: message
  };

  // Add progress indicator for certain types
  if (type === 'progress') {
    notificationOptions.type = 'progress';
    notificationOptions.progress = 0;
  }

  chrome.notifications.create(notificationId, notificationOptions);

  // Auto-clear notification after 3 seconds (except for progress)
  if (type !== 'progress') {
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 3000);
  }
}

function getNextReminderTime(timeString) {
  // Handle undefined or invalid timeString
  if (!timeString || typeof timeString !== 'string') {
    console.warn('Invalid timeString provided to getNextReminderTime:', timeString);
    // Default to 9:00 AM if invalid
    timeString = '09:00';
  }

  const [hours, minutes] = timeString.split(':').map(Number);

  // Validate hours and minutes
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn('Invalid time format, defaulting to 09:00');
    return getNextReminderTime('09:00');
  }

  const now = new Date();
  const reminderTime = new Date(now);

  reminderTime.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  return reminderTime.getTime();
}

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('SmartNotes AI extension installed/updated:', details.reason);

  // Initialize modules
  await initializeModules();

  // Set up context menus
  setupContextMenus();

  // Initialize storage (now async)
  await initializeStorage();

  // Set up daily reminder alarm
  const settings = await getSettings();
  if (settings && settings.dailyReminder && settings.reminderTime) {
    chrome.alarms.create('daily-reminder', {
      when: getNextReminderTime(settings.reminderTime),
      periodInMinutes: 24 * 60 // Daily
    });
  }

  // Set up sync reminder (every 30 minutes)
  chrome.alarms.create('sync-reminder', {
    delayInMinutes: 30,
    periodInMinutes: 30
  });

  // Show welcome notification
  if (details.reason === 'install') {
    showNotification('Welcome to SmartNotes AI! Extension is ready to use.', 'success');
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('SmartNotes AI extension started');
  await initializeModules();
  setupContextMenus();
});

// Export for testing (in development)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeModules,
    handleMessage,
    setupContextMenus
  };
}
