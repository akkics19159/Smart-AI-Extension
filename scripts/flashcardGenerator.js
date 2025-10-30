// SmartNotes AI - Flashcard Generator Module (FREE VERSION - On-Device Only)

import { generateFlashcard } from './onDeviceAI.js';

class FlashcardGenerator {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('FlashcardGenerator initialized (Free Version)');
        this.initialized = true;
        return true;
    }

    async generateFlashcard(text, progressCallback = null) {
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for flashcard generation');
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Use on-device AI for completely free flashcard generation
            const flashcard = await generateFlashcard(text, progressCallback);

            return {
                ...flashcard,
                method: 'on-device'
            };
        } catch (error) {
            console.error('Error generating flashcard:', error);
            // Provide fallback flashcard even on error
            return this.generateFallbackFlashcard(text);
        }
    }

    generateFallbackFlashcard(text) {
        // Ultra-fast fallback when AI fails
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

        if (sentences.length > 0) {
            const firstSentence = sentences[0].trim();
            return {
                question: `What does the text say about "${firstSentence.substring(0, 50)}${firstSentence.length > 50 ? '...' : ''}"?`,
                answer: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
                originalText: text,
                timestamp: Date.now(),
                method: 'fallback',
                note: "Fast fallback flashcard - completely free!"
            };
        } else {
            return {
                question: "What is the main point of this text?",
                answer: text.substring(0, 150) + "...",
                originalText: text,
                timestamp: Date.now(),
                method: 'fallback',
                note: "Fast fallback flashcard - completely free!"
            };
        }
    }
}

// Export for ES modules
export { FlashcardGenerator };
