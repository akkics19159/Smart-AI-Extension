// SmartNotes AI - Storage Manager Module

class StorageManager {
    constructor() {
        this.storage = chrome.storage.local;
    }

    async initialize() {
        console.log('StorageManager initialized');
        await this.ensureDefaultData();
        return true;
    }

    async ensureDefaultData() {
        const result = await this.get(['folders', 'settings']);

        if (!result.folders) {
            const defaultFolders = {
                'General Knowledge': [],
                'JEE Physics': [],
                'UPSC History': [],
                'Science': [],
                'Technology': []
            };
            await this.set({ folders: defaultFolders });
        }

        if (!result.settings) {
            const defaultSettings = {
                language: 'english',
                dailyReminder: true,
                reminderTime: '09:00',
                autoSave: true,
                maxFlashcards: 10,
                summaryLength: 'medium'
            };
            await this.set({ settings: defaultSettings });
        }
    }

    // Generic storage methods
    async get(keys) {
        return new Promise((resolve, reject) => {
            this.storage.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }

    async set(data) {
        return new Promise((resolve, reject) => {
            this.storage.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    // Flashcard methods
    async saveFlashcard(flashcard, folder = 'General Knowledge') {
        try {
            const result = await this.get(['folders']);
            const folders = result.folders || {};

            if (!folders[folder]) {
                folders[folder] = [];
            }

            const cardWithId = {
                ...flashcard,
                id: Date.now().toString(),
                folder: folder,
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            folders[folder].push(cardWithId);
            await this.set({ folders });

            return cardWithId.id;
        } catch (error) {
            console.error('Error saving flashcard:', error);
            throw error;
        }
    }

    async getAllFlashcards() {
        try {
            const result = await this.get(['folders']);
            const folders = result.folders || {};
            const allFlashcards = [];

            Object.values(folders).forEach(folderFlashcards => {
                allFlashcards.push(...folderFlashcards);
            });

            return allFlashcards;
        } catch (error) {
            console.error('Error getting flashcards:', error);
            throw error;
        }
    }

    async getFlashcardsByFolder(folder) {
        try {
            const result = await this.get(['folders']);
            const folders = result.folders || {};
            return folders[folder] || [];
        } catch (error) {
            console.error('Error getting flashcards by folder:', error);
            throw error;
        }
    }

    async updateFlashcard(cardId, updates) {
        try {
            const result = await this.get(['folders']);
            const folders = result.folders || {};

            for (const folderName in folders) {
                const folder = folders[folderName];
                const cardIndex = folder.findIndex(card => card.id === cardId);

                if (cardIndex !== -1) {
                    folder[cardIndex] = {
                        ...folder[cardIndex],
                        ...updates,
                        lastModified: new Date().toISOString()
                    };
                    await this.set({ folders });
                    return folder[cardIndex];
                }
            }

            throw new Error('Flashcard not found');
        } catch (error) {
            console.error('Error updating flashcard:', error);
            throw error;
        }
    }

    async deleteFlashcard(cardId) {
        try {
            const result = await this.get(['folders']);
            const folders = result.folders || {};

            for (const folderName in folders) {
                const folder = folders[folderName];
                const cardIndex = folder.findIndex(card => card.id === cardId);

                if (cardIndex !== -1) {
                    folder.splice(cardIndex, 1);
                    await this.set({ folders });
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            throw error;
        }
    }

    // Quiz methods
    async saveQuiz(quiz, title = 'Untitled Quiz') {
        try {
            const result = await this.get(['quizzes']);
            const quizzes = result.quizzes || [];

            const quizWithId = {
                id: Date.now().toString(),
                title: title,
                questions: quiz,
                created: new Date().toISOString(),
                questionCount: quiz.length
            };

            quizzes.push(quizWithId);
            await this.set({ quizzes });

            return quizWithId.id;
        } catch (error) {
            console.error('Error saving quiz:', error);
            throw error;
        }
    }

    async getQuizzes() {
        try {
            const result = await this.get(['quizzes']);
            return result.quizzes || [];
        } catch (error) {
            console.error('Error getting quizzes:', error);
            throw error;
        }
    }

    // Summary methods
    async saveSummary(summary) {
        try {
            const result = await this.get(['summaries']);
            const summaries = result.summaries || [];

            const summaryWithId = {
                id: Date.now().toString(),
                ...summary,
                created: new Date().toISOString()
            };

            summaries.push(summaryWithId);
            await this.set({ summaries });

            return summaryWithId.id;
        } catch (error) {
            console.error('Error saving summary:', error);
            throw error;
        }
    }

    // Settings methods
    async saveSettings(settings) {
        try {
            await this.set({ settings });
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const result = await this.get(['settings']);
            return result.settings || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    // Utility methods
    async clearAllData() {
        try {
            await this.set({
                folders: {},
                quizzes: [],
                summaries: [],
                settings: {}
            });
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    async exportData() {
        try {
            const data = await this.get(['folders', 'quizzes', 'summaries', 'settings']);
            return {
                ...data,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    async importData(data) {
        try {
            // Validate data structure
            if (!data.folders || !data.settings) {
                throw new Error('Invalid import data structure');
            }

            await this.set({
                folders: data.folders,
                quizzes: data.quizzes || [],
                summaries: data.summaries || [],
                settings: data.settings
            });
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }
}

// Export for ES modules
export { StorageManager };
