// SmartNotes AI - Social Features Module

class SocialFeatures {
    constructor() {
        this.userId = null;
        this.currentGroup = null;
    }

    async initialize() {
        console.log('SocialFeatures initialized');
        const settings = await this.getSettings();
        this.userId = settings.userId || this.generateUserId();
        return true;
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async joinStudyGroup(groupId, code) {
        try {
            // Mock implementation
            console.log(`Joining group ${groupId} with code ${code}`);

            // In real implementation, would validate with backend
            const groupData = {
                id: groupId,
                name: 'Study Group ' + groupId,
                members: [this.userId],
                code: code,
                joinedAt: new Date().toISOString()
            };

            this.currentGroup = groupData;
            await this.saveGroupData(groupData);

            return groupData;
        } catch (error) {
            console.error('Error joining group:', error);
            throw error;
        }
    }

    async createStudyGroup(groupData) {
        try {
            const newGroup = {
                id: Date.now().toString(),
                name: groupData.name,
                description: groupData.description,
                code: this.generateGroupCode(),
                creator: this.userId,
                members: [this.userId],
                createdAt: new Date().toISOString()
            };

            await this.saveGroupData(newGroup);
            this.currentGroup = newGroup;

            return newGroup;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    generateGroupCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    async getLeaderboard(timeframe = 'weekly') {
        try {
            // Mock leaderboard data
            const leaderboard = [
                { userId: 'user1', name: 'Alice', points: 1250, rank: 1 },
                { userId: 'user2', name: 'Bob', points: 1100, rank: 2 },
                { userId: this.userId, name: 'You', points: 950, rank: 3 },
                { userId: 'user3', name: 'Charlie', points: 800, rank: 4 }
            ];

            return {
                timeframe: timeframe,
                data: leaderboard,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async updateUserProgress(data) {
        try {
            // Track user activity for social features
            const progress = {
                userId: this.userId,
                type: data.type,
                timestamp: data.timestamp,
                points: this.calculatePoints(data.type)
            };

            await this.saveProgress(progress);
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    }

    calculatePoints(type) {
        const pointMap = {
            'summarize': 10,
            'generate_flashcard': 15,
            'create_quiz': 20,
            'watch_video': 5,
            'complete_quiz': 25
        };

        return pointMap[type] || 5;
    }

    async saveGroupData(groupData) {
        const result = await this.get(['studyGroups']);
        const groups = result.studyGroups || [];
        groups.push(groupData);
        await this.set({ studyGroups: groups });
    }

    async saveProgress(progressData) {
        const result = await this.get(['userProgress']);
        const progress = result.userProgress || [];
        progress.push(progressData);
        await this.set({ userProgress: progress });
    }

    async get(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
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
            chrome.storage.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings || {});
            });
        });
    }
}

// Export for ES modules
export { SocialFeatures };
