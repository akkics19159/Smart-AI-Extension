// SmartNotes AI - Offscreen Document Script
// Handles TTS functionality in a separate document

let ttsUtterance = null;
let isSpeaking = false;

// Check if TTS is available
if (!('speechSynthesis' in window)) {
    console.error('SpeechSynthesis API not available in offscreen document');
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.type) {
            case 'tts_speak':
                handleSpeak(request.text, request.options);
                sendResponse({ success: true });
                break;

            case 'tts_stop':
                handleStop();
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Error handling message in offscreen:', error);
        sendResponse({ success: false, error: error.message });
    }

    return true; // Keep message channel open
});

function handleSpeak(text, options = {}) {
    try {
        // Stop any current speech
        if (isSpeaking) {
            speechSynthesis.cancel();
        }

        // Create new utterance
        ttsUtterance = new SpeechSynthesisUtterance(text);

        // Apply options
        if (options.rate) ttsUtterance.rate = options.rate;
        if (options.pitch) ttsUtterance.pitch = options.pitch;
        if (options.volume) ttsUtterance.volume = options.volume;
        if (options.voice) {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === options.voice);
            if (selectedVoice) {
                ttsUtterance.voice = selectedVoice;
            }
        }

        // Set up event handlers
        ttsUtterance.onstart = () => {
            isSpeaking = true;
            console.log('TTS started');
        };

        ttsUtterance.onend = () => {
            isSpeaking = false;
            console.log('TTS ended');
        };

        ttsUtterance.onerror = (error) => {
            isSpeaking = false;
            console.error('TTS error:', error);
        };

        // Start speaking
        speechSynthesis.speak(ttsUtterance);

    } catch (error) {
        console.error('Error in TTS speak:', error);
    }
}

function handleStop() {
    try {
        if (isSpeaking) {
            speechSynthesis.cancel();
            isSpeaking = false;
        }
    } catch (error) {
        console.error('Error stopping TTS:', error);
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Offscreen document loaded for TTS functionality');
});
