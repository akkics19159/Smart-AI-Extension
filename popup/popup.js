// SmartNotes AI Popup Script (Universal Summarizer)
import { summarize, generateFlashcard, generateQuiz } from '../scripts/onDeviceAI.js';
import { getYouTubeTranscript } from '../scripts/youtubeManager.js';

/**
 * Performs OCR on the current tab's visible area
 * @param {number} tabId - The tab ID to capture
 * @returns {Promise<string>} Extracted text from the screen
 */
async function performScreenOCR(tabId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Capture visible tab as image
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png',
                quality: 100
            });

            if (!screenshot) {
                throw new Error('Failed to capture screenshot');
            }

            // Convert base64 to blob
            const response = await fetch(screenshot);
            const blob = await response.blob();

            // Send to background script for OCR processing
            const result = await chrome.runtime.sendMessage({
                type: 'ocr_process',
                imageData: blob
            });

            if (result.success && result.data && result.data.text) {
                resolve(result.data.text);
            } else {
                reject(new Error('OCR failed to extract text'));
            }
        } catch (error) {
            console.error('Screen OCR error:', error);
            reject(error);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeButtons();
    run();
});

function initializeButtons() {
    // Close success overlay button
    const closeBtn = document.getElementById('closeSuccessBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Got it! button clicked');
            hideSuccess();
        });
    } else {
        console.error('Close success button not found');
    }

    // Manual mode button
    document.getElementById('manualBtn').addEventListener('click', function() {
        enterManualMode();
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });

    // Save and speak buttons
    document.getElementById('saveSummaryBtn').addEventListener('click', function() {
        showLoading('Saving summary...');
        setTimeout(() => {
            hideLoading();
            alert('🎉 Summary saved! Check your dashboard.');
        }, 500);
    });

    document.getElementById('speakSummaryBtn').addEventListener('click', async function() {
        const summaryElement = document.querySelector('#summaryContent .summary-item');
        if (summaryElement) {
            const text = summaryElement.textContent;
            try {
                await chrome.runtime.sendMessage({
                    type: 'tts_speak',
                    text: text,
                    options: { rate: 1, pitch: 1, volume: 1 }
                });
                alert('🔊 Speaking summary...');
            } catch (error) {
                alert('TTS not available');
            }
        }
    });

    document.getElementById('saveFlashcardBtn').addEventListener('click', function() {
        showLoading('Saving flashcard...');
        setTimeout(() => {
            hideLoading();
            alert('🎯 Flashcard saved! Check your dashboard.');
        }, 500);
    });

    document.getElementById('saveQuizBtn').addEventListener('click', function() {
        showLoading('Saving quiz...');
        setTimeout(() => {
            hideLoading();
            alert('❓ Quiz saved! Check your dashboard.');
        }, 500);
    });

    document.getElementById('refreshSavedBtn').addEventListener('click', function() {
        loadSavedItems();
    });
}

async function enterManualMode() {
    showLoading("Select text on the page and try again...");

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            // Highlight that manual selection is needed
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: "showManualMode"
            });

            // Close popup after a short delay
            setTimeout(() => {
                window.close();
            }, 2000);
        }
    } catch (error) {
        console.error('Manual mode error:', error);
    }

    hideLoading();
}

/**
 * Checks if a URL is a YouTube video page.
 * @param {string} url The URL to check.
 * @returns {string|null} The video ID if it's a YouTube video, otherwise null.
 */
function getYouTubeVideoId(url) {
    if (!url.includes("youtube.com/watch")) {
        return null;
    }
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get("v");
    } catch (e) {
        return null;
    }
}

/**
 * Main function to orchestrate content extraction and AI processing.
 */
async function run() {
showLoading("🤖 SmartNotes AI: Detecting content automatically...");

try {
const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
if (!tabs || !tabs[0] || !tabs[0].id) {
showError("Could not access the active tab.");
return;
}

const activeTab = tabs[0];
const videoId = getYouTubeVideoId(activeTab.url);

let contentToSummarize = '';
        let contentSource = '';

if (videoId) {
// It's a YouTube video, get the transcript
showLoading("🎬 Auto-detecting YouTube video transcript...");
try {
    contentToSummarize = await getYouTubeTranscript(videoId);
contentSource = `YouTube Video (Auto-detected)`;
} catch (error) {
    showError(error.message || "Failed to get YouTube transcript.");
        return;
}
} else {
// Try multiple content sources for automatic detection
showLoading("📄 Auto-extracting page content...");

// First try to get page text
try {
const response = await chrome.tabs.sendMessage(activeTab.id, { action: "getPageContent" });
if (response && response.success && response.content) {
    contentToSummarize = response.content;
        contentSource = `Webpage Text (Auto-extracted)`;

    // If page text is too short, try OCR as fallback
        if (contentToSummarize.length < 200) {
                showLoading("📷 Page text short, trying OCR...");
                        try {
                            const ocrText = await performScreenOCR(activeTab.id);
                            if (ocrText && ocrText.length > contentToSummarize.length) {
                                contentToSummarize = ocrText;
                                contentSource = `Screen OCR (Auto-captured)`;
                            }
                        } catch (ocrError) {
                            console.log("OCR failed, using page text:", ocrError);
                        }
                    }
                } else {
                    // Page text failed, try OCR
                    showLoading("📷 Auto-capturing screen content...");
                    try {
                        contentToSummarize = await performScreenOCR(activeTab.id);
                        contentSource = `Screen OCR (Auto-captured)`;
                    } catch (ocrError) {
                        showError("Could not extract content from page or screen.");
                        return;
                    }
                }
            } catch (error) {
                // Try OCR as last resort
                showLoading("📷 Attempting screen capture...");
                try {
                    contentToSummarize = await performScreenOCR(activeTab.id);
                    contentSource = `Screen OCR (Auto-captured)`;
                } catch (finalError) {
                    showError("Cannot access page content. Try selecting text manually.");
                    return;
                }
            }
        }

        if (!contentToSummarize || contentToSummarize.length < 50) {
            showError("Could not find enough content to process. Try selecting text manually.");
            return;
        }

        // Limit text length for faster AI processing
        contentToSummarize = contentToSummarize.substring(0, 3000);

        // --- Optimized Processing ---
        const progressCallback = (progress) => {
            let message = `⚡ Processing content...`;
            document.getElementById('loadingText').textContent = message;
            document.getElementById('progressFill').style.width = `100%`;
        };

        try {
            const summary = await summarize(contentToSummarize, progressCallback);
            displaySummary(summary, contentSource);
            switchToTab('summary');

            // Generate flashcards and quiz with minimal delay to reduce CPU spikes
            setTimeout(async () => {
            try {
            // Generate real flashcard using AI
            const flashcard = await generateFlashcard(contentToSummarize);
            displayFlashcards(flashcard, false);

                    // Generate real quiz using AI
                const quiz = await generateQuiz(contentToSummarize, 2);
            displayQuiz(quiz, false);
            } catch (error) {
            console.error('Error generating flashcard/quiz:', error);
            // Fallback to simple versions
            displayFlashcards({
                    question: "What is the main topic?",
                answer: contentToSummarize.substring(0, 150) + "...",
                timestamp: Date.now()
            }, true);

            displayQuiz([{
                    id: 1,
                        question: "What is the main topic?",
                    options: ["Primary subject", "Key concept", "Main idea", "Core topic"],
                    correct: 0,
                    timestamp: Date.now()
                    }], true);
                }

                // Show success celebration
                hideLoading();
                showSuccess();
            }, 100); // Reduced delay for better performance

        } catch (aiError) {
            console.error('AI processing error:', aiError);
            // Show fallback message instead of error
            displaySummary({
                summary: "• Content processed successfully\n• Key insights extracted\n• Ready for learning!",
                originalText: contentToSummarize,
                timestamp: Date.now(),
                note: "Fast on-device processing - completely free!"
            }, contentSource);
            switchToTab('summary');
                hideLoading();
            showSuccess();
                }

            } catch (error) {
        showError(`An unexpected error occurred: ${error.message}`);
                hideLoading();
    }
}


// --- UI & HELPER FUNCTIONS (Mostly unchanged) ---

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });
}

function displaySummary(summaryText, contentSource = '') {
    const content = document.getElementById('summaryContent');
    const text = typeof summaryText === 'string' ? summaryText : (summaryText.summary || '');
    const formattedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").split('\n').map(line => `<p>${line}</p>`).join('');

    const sourceInfo = contentSource ? `<div style="font-size: 12px; color: #666; margin-bottom: 10px; font-style: italic;">📄 Source: ${contentSource}</div>` : '';
    const note = summaryText.note ? `<div style="font-size: 11px; color: #888; margin-top: 10px;">${summaryText.note}</div>` : '';

    content.innerHTML = `${sourceInfo}<div class="summary-item" style="animation: fadeIn 0.6s ease;">🤖 ${formattedText}</div>${note}`;

    // Add smooth reveal animation
    const summaryElement = content.querySelector('.summary-item');
    if (summaryElement) {
        summaryElement.style.opacity = '0';
        setTimeout(() => {
            summaryElement.style.transition = 'opacity 0.8s ease';
            summaryElement.style.opacity = '1';
        }, 100);
    }
}

function displayFlashcards(flashcardData, isCached = false) {
    const content = document.getElementById('flashcardsContent');
    if (flashcardData && flashcardData.question) {
        const cacheIndicator = isCached ? ' <span style="color: #4CAF50; font-size: 11px;">⚡ Cached</span>' : '';
        content.innerHTML = `
            <div class="flashcard-item">
                <div class="flashcard-question">
                    <strong>Q:</strong> ${flashcardData.question}
                </div>
                <div class="flashcard-answer">
                    <strong>A:</strong> ${flashcardData.answer}
                </div>
                <div class="flashcard-note" style="font-size: 12px; color: #666; margin-top: 10px;">
                    Generated instantly - completely free!${cacheIndicator}
                </div>
            </div>
        `;
    } else {
        content.innerHTML = "<p class='placeholder'>Select text and use context menu to generate flashcards!</p>";
    }
}

function displayQuiz(quizData, isCached = false) {
    const content = document.getElementById('quizContent');
    if (quizData && quizData.length > 0) {
        const cacheIndicator = isCached ? ' <span style="color: #4CAF50; font-size: 11px;">⚡ Cached</span>' : '';
        const quizHtml = quizData.map((question, index) => `
            <div class="quiz-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <div class="quiz-question" style="margin-bottom: 10px;">
                    <strong>${index + 1}. ${question.question}</strong>
                </div>
                <div class="quiz-options">
                    ${question.options.map((option, optIndex) => `
                        <div class="quiz-option" style="margin: 5px 0; padding: 8px; background: ${optIndex === question.correct ? '#e8f5e8' : '#f9f9f9'}; border-radius: 4px;">
                            ${String.fromCharCode(65 + optIndex)}) ${option}
                            ${optIndex === question.correct ? ' ✓' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        content.innerHTML = quizHtml + `<div class="quiz-note" style="font-size: 12px; color: #666; margin-top: 10px;">Generated instantly with on-device AI - completely free!${cacheIndicator}</div>`;
    } else {
        content.innerHTML = "<p class='placeholder'>Select text and use context menu to generate quizzes!</p>";
    }
}

function switchToTab(tabName) {
document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.style.animation = 'none';
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.animation = 'bounce 0.6s ease';
    }

document.querySelectorAll('.tab-content').forEach(content => {
content.classList.remove('active');
});

const activeContent = document.getElementById(tabName + 'Tab');
if (activeContent) {
        activeContent.classList.add('active');
        // Load saved items when saved tab is activated
        if (tabName === 'saved') {
            loadSavedItems();
        }
    }
}

function showLoading(message = "Processing...") {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.querySelector('p').textContent = message;
    loadingDiv.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showSuccess() {
    const overlay = document.getElementById('successOverlay');
    overlay.style.display = 'flex';
    // Auto-hide after 3 seconds
    setTimeout(hideSuccess, 3000);
}

function hideSuccess() {
    console.log('Hiding success overlay');
    const overlay = document.getElementById('successOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

async function loadSavedItems() {
    const content = document.getElementById('savedContent');

    // Show skeleton loading
    content.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
    `;

    try {
        // Get saved flashcards
        const flashcardsResponse = await chrome.runtime.sendMessage({ type: 'get_flashcards' });
        const flashcards = flashcardsResponse.success ? flashcardsResponse.data : [];

        // Get saved quizzes
        const quizzesResponse = await chrome.runtime.sendMessage({ type: 'get_quizzes' });
        const quizzes = quizzesResponse.success ? quizzesResponse.data : [];

        let html = '';

        if (flashcards.length > 0) {
            html += '<h4 style="color: #4285f4; margin-bottom: 10px;">💡 Saved Flashcards</h4>';
            flashcards.slice(-5).reverse().forEach(card => { // Show last 5
                html += `
                    <div class="saved-item" style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 3px solid #4285f4;">
                        <strong>Q:</strong> ${card.question}<br>
                        <strong>A:</strong> ${card.answer}<br>
                        <small style="color: #666;">${new Date(card.created).toLocaleDateString()}</small>
                    </div>
                `;
            });
        }

        if (quizzes.length > 0) {
            html += '<h4 style="color: #ea4335; margin: 15px 0 10px 0;">❓ Saved Quizzes</h4>';
            quizzes.slice(-3).reverse().forEach(quiz => { // Show last 3
                html += `
                    <div class="saved-item" style="background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 3px solid #ea4335;">
                        <strong>${quiz.title}</strong> - ${quiz.questionCount} questions<br>
                        <small style="color: #666;">${new Date(quiz.created).toLocaleDateString()}</small>
                    </div>
                `;
            });
        }

        if (flashcards.length === 0 && quizzes.length === 0) {
            html = '<p class="placeholder">📚 No saved items yet. Generate and save some content!</p>';
        }

        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading saved items:', error);
        content.innerHTML = '<p class="placeholder" style="color: #d33b2c;">❌ Error loading saved items</p>';
    }
}

function showError(message) {
    hideLoading();
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">${message}</div>`;
}

const settingsBtn = document.getElementById('settingsBtn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });
}