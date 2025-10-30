// SmartNotes AI - Quiz Generator Module (FREE VERSION - On-Device Only)

import { generateQuiz } from './onDeviceAI.js';

class QuizGenerator {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('QuizGenerator initialized (Free Version)');
        this.initialized = true;
        return true;
    }

    async generateQuiz(text, questionCount = 3) {
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for quiz generation');
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Use on-device AI for completely free quiz generation
            const quiz = await generateQuiz(text, questionCount);

            return quiz.map(q => ({
                ...q,
                method: 'on-device'
            }));
        } catch (error) {
            console.error('Error generating quiz:', error);
            // Provide fallback quiz even on error
            return this.generateFallbackQuiz(text, questionCount);
        }
    }

    generateFallbackQuiz(text, questionCount) {
        // Ultra-fast fallback when AI fails
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

        if (sentences.length > 0) {
            const firstSentence = sentences[0].trim();
            return [{
                id: 1,
                question: `What does the text say about "${firstSentence.substring(0, 40)}${firstSentence.length > 40 ? '...' : ''}"?`,
                options: [
                    firstSentence,
                    "An unrelated concept",
                    "Something not mentioned in the text",
                    "A different topic entirely"
                ],
                correct: 0,
                originalText: text,
                timestamp: Date.now(),
                method: 'fallback',
                note: "Fast fallback quiz - completely free!"
            }];
        } else {
            return [{
                id: 1,
                question: "What is the primary subject of this text?",
                options: [
                    "The main topic discussed",
                    "An unrelated subject",
                    "A different concept",
                    "Something not mentioned"
                ],
                correct: 0,
                originalText: text,
                timestamp: Date.now(),
                method: 'fallback',
                note: "Fast fallback quiz - completely free!"
            }];
        }
    }
}

// Export for ES modules
export { QuizGenerator };
