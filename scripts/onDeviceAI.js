// onDeviceAI.js - Handles on-device inference using Transformers.js (Completely Free)

// Transformers.js loaded globally from popup.html
// Optimized for web extensions - skip local model checks
if (window.env) {
  window.env.allowLocalModels = false;
}

// Singleton classes for different AI tasks
class SummarizationPipeline {
    static task = 'summarization';
    static model = 'Xenova/distilbart-cnn-6-6';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = window.pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

class QuestionAnsweringPipeline {
    static task = 'question-answering';
    static model = 'Xenova/distilbert-base-uncased-distilled-squad';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = window.pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

class TextGenerationPipeline {
    static task = 'text-generation';
    static model = 'Xenova/gpt2';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = window.pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

/**
 * Summarizes text using on-device AI
 */
export async function summarize(text, progressCallback) {
    try {
        if (typeof window === 'undefined' || !window.pipeline) {
            // Fallback to extractive summary
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
            if (sentences.length === 0) return text.substring(0, 200) + '...';
            const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
            const summary = summarySentences.map(s => s.trim()).join('. ') + '.';
            return summary.length > 50 ? summary : text.substring(0, 300) + '...';
        }

        // Use AI summarization
        const summarizer = await SummarizationPipeline.getInstance(progressCallback);
        const result = await summarizer(text, { max_length: 150, min_length: 30 });
        return result[0].summary_text;
    } catch (error) {
        console.error('Summarization error:', error);
        // Fallback
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
        if (sentences.length === 0) return text.substring(0, 200) + '...';
        const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
        const summary = summarySentences.map(s => s.trim()).join('. ') + '.';
        return summary.length > 50 ? summary : text.substring(0, 300) + '...';
    }
}

/**
* Generates flashcards using on-device AI
*/
export async function generateFlashcard(text, progressCallback) {
    try {
        if (typeof window === 'undefined' || !window.pipeline) {
            // Fallback: simple flashcard
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
        const firstSentence = sentences[0]?.trim() || text.substring(0, 100);
        const question = firstSentence.length > 60
            ? `What does the text say about "${firstSentence.substring(0, 60)}..."?`
        : `What does the text say about "${firstSentence}"?`;
    const answer = sentences.slice(1, 3).join('. ').trim() || "The text discusses this topic in detail.";
        return {
            question: question,
        answer: answer + (answer.endsWith('.') ? '' : '.'),
        originalText: text,
        timestamp: Date.now()
    };
    }

        // Use AI for better flashcard generation
        const generator = await TextGenerationPipeline.getInstance(progressCallback);

        // Create prompt for question generation
        const prompt = `Generate a study question and answer from this text:

${text}

Question:`;
    const questionResult = await generator(prompt, { max_length: 100, temperature: 0.7 });
    const generatedQuestion = questionResult[0].generated_text.replace(prompt, '').trim();

        // Create prompt for answer generation
        const answerPrompt = `Answer this question based on the text:

Question: ${generatedQuestion}

Text: ${text}

Answer:`;
        const answerResult = await generator(answerPrompt, { max_length: 200, temperature: 0.5 });
        const generatedAnswer = answerResult[0].generated_text.replace(answerPrompt, '').trim();

        return {
            question: generatedQuestion || "What is the main point?",
            answer: generatedAnswer || "The text discusses this topic in detail.",
            originalText: text,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error("Flashcard generation error:", error);
// Fallback to simple method
const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
const firstSentence = sentences[0]?.trim() || text.substring(0, 100);
const question = firstSentence.length > 60
    ? `What does the text say about "${firstSentence.substring(0, 60)}..."?`
: `What does the text say about "${firstSentence}"?`;
const answer = sentences.slice(1, 3).join('. ').trim() || "The text discusses this topic in detail.";

        return {
    question: question,
answer: answer + (answer.endsWith('.') ? '' : '.'),
originalText: text,
timestamp: Date.now()
};
}
}

/**
 * Generates quiz questions using on-device AI
 */
export async function generateQuiz(text, questionCount = 3) {
    try {
        // Get user settings for max questions
        try {
            const settings = await chrome.storage.local.get(['maxFlashcards']);
            const maxCards = parseInt(settings.maxFlashcards) || 10;
            questionCount = Math.min(questionCount, maxCards);
        } catch (e) {
            // Use default
        }

        if (typeof window === 'undefined' || !window.pipeline) {
            // Fallback to template-based quiz
            const questions = [];
            const optionSets = [
                ["The primary subject discussed", "An unrelated topic", "Something different", "Content not mentioned"],
                ["Important details covered", "Irrelevant information", "Key concepts", "Background info"],
                ["Main conclusions drawn", "Supporting evidence", "Methodology used", "Future implications"]
            ];

            const questionTemplates = [
                "What is the main topic discussed?",
                "What are the key points covered?",
                "What conclusions can be drawn?"
            ];

            for (let i = 0; i < Math.min(questionCount, 3); i++) {
                questions.push({
                    id: i + 1,
                    question: questionTemplates[i] || `Question ${i + 1}: What is discussed?`,
                    options: optionSets[i] || optionSets[0],
                    correct: 0,
                    originalText: text,
                    timestamp: Date.now()
                });
            }
            return questions;
        }

        // Use AI for generating questions
        const generator = await TextGenerationPipeline.getInstance();
        const questions = [];

        for (let i = 0; i < questionCount; i++) {
            try {
                // Generate question
                const questionPrompt = `Generate a multiple-choice question about this text:\n\n${text}\n\nQuestion:`;
                const questionResult = await generator(questionPrompt, { max_length: 80, temperature: 0.8 });
                const generatedQuestion = questionResult[0].generated_text.replace(questionPrompt, '').trim();

                // Generate options
                const optionsPrompt = `For this question: "${generatedQuestion}"\n\nProvide 4 options (A, B, C, D) where one is correct based on the text:\n\n${text}\n\nOptions:`;
                const optionsResult = await generator(optionsPrompt, { max_length: 150, temperature: 0.6 });
                const optionsText = optionsResult[0].generated_text.replace(optionsPrompt, '').trim();

                // Parse options (simple parsing)
                const lines = optionsText.split('\n').filter(line => line.trim());
                const options = [];
                let correctIndex = 0;

                for (let j = 0; j < Math.min(lines.length, 4); j++) {
                    const line = lines[j].trim();
                    if (line.toLowerCase().includes('(correct)') || line.toLowerCase().includes('*')) {
                        correctIndex = j;
                        options.push(line.replace(/\s*\(correct\)|\*/i, '').trim());
                    } else {
                        options.push(line.replace(/^[A-D]\.\s*/, '').trim());
                    }
                }

                // Ensure 4 options
                while (options.length < 4) {
                    options.push("Not mentioned in the text");
                }

                questions.push({
                    id: i + 1,
                    question: generatedQuestion || `Question ${i + 1}: What is discussed?`,
                    options: options.slice(0, 4),
                    correct: Math.min(correctIndex, 3),
                    originalText: text,
                    timestamp: Date.now()
                });
            } catch (innerError) {
                // Fallback for individual question
                questions.push({
                    id: i + 1,
                    question: `Question ${i + 1}: What is discussed?`,
                    options: ["Primary subject", "Key concept", "Main idea", "Core topic"],
                    correct: 0,
                    originalText: text,
                    timestamp: Date.now()
                });
            }
        }

        return questions;
    } catch (error) {
        console.error("Quiz generation error:", error);
        // Fallback: return basic quiz
        return [{
            id: 1,
            question: "What is the main topic?",
            options: ["Primary subject", "Key concept", "Main idea", "Core topic"],
            correct: 0,
            originalText: text,
            timestamp: Date.now()
        }];
    }
}
