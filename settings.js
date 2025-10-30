// SmartNotes AI Settings Script - FREE VERSION (No API Keys Needed)

document.addEventListener('DOMContentLoaded', function() {
loadSettings();
});

async function loadSettings() {
try {
const response = await chrome.runtime.sendMessage({ type: 'get_settings' });
if (response.success && response.data) {
const settings = response.data;

// Populate form fields
document.getElementById('language').value = settings.language || 'english';
document.getElementById('dailyReminder').value = String(settings.dailyReminder !== false);
document.getElementById('reminderTime').value = settings.reminderTime || '09:00';
document.getElementById('autoSave').value = String(settings.autoSave !== false);
document.getElementById('maxFlashcards').value = settings.maxFlashcards || '10';
document.getElementById('summaryLength').value = settings.summaryLength || 'medium';
}
} catch (error) {
console.error('Error loading settings:', error);
showStatusMessage('Error loading settings', 'error');
     }
 }

async function saveSettings() {
try {
const settings = {
    language: document.getElementById('language').value,
    dailyReminder: document.getElementById('dailyReminder').value === 'true',
reminderTime: document.getElementById('reminderTime').value,
autoSave: document.getElementById('autoSave').value === 'true',
maxFlashcards: document.getElementById('maxFlashcards').value,
        summaryLength: document.getElementById('summaryLength').value
     };

const response = await chrome.runtime.sendMessage({
type: 'save_settings',
settings: settings
});

if (response.success) {
showStatusMessage('Settings saved successfully!', 'success');
// Close the settings tab after successful save
setTimeout(() => {
    window.close();
}, 1500);
} else {
    showStatusMessage('Error saving settings: ' + response.error, 'error');
        }
} catch (error) {
console.error('Error saving settings:', error);
showStatusMessage('Error saving settings', 'error');
}
}

function showStatusMessage(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message status-${type}`;
    statusElement.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 5000);
}

// Auto-save on input changes (debounced)
let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveSettings();
    }, 1000);
}

// Add event listeners for auto-save
document.querySelectorAll('.setting-input').forEach(input => {
    input.addEventListener('input', debouncedSave);
});
