// SmartNotes AI - AI Summarizer Module (FREE VERSION - On-Device Only)

import { summarize } from './onDeviceAI.js';

class AISummarizer {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        console.log('AISummarizer initialized (Free Version)');
        this.initialized = true;
        return true;
    }

    async generateSummary(text, progressCallback = null) {
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided for summarization');
        }

        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Use on-device AI for completely free summarization
            const summary = await summarize(text, progressCallback);

            return {
                summary: summary,
                originalText: text,
                timestamp: Date.now(),
                method: 'on-device'
            };
        } catch (error) {
            console.error('Error generating summary:', error);
            // Provide fallback summary even on error
            return this.generateFallbackSummary(text);
        }
    }

    generateFallbackSummary(text) {
        // Ultra-fast fallback when AI fails
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const summaryPoints = [];

        if (sentences.length > 0) {
            summaryPoints.push("• " + sentences[0].trim().substring(0, 80) + "...");
        }

        if (sentences.length > 1) {
            summaryPoints.push("• " + sentences[1].trim().substring(0, 80) + "...");
        }

        summaryPoints.push("• Key insights extracted for learning");

        return {
            summary: summaryPoints.join('\n'),
            originalText: text,
            timestamp: Date.now(),
            method: 'fallback',
            note: "Fast fallback summary - completely free!"
        };
    }
}

// Export for ES modules
export { AISummarizer };
