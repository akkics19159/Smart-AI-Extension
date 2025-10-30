// SmartNotes AI - Video Manager Module

class VideoManager {
    constructor() {
        this.apiKey = null;
        this.storage = chrome.storage.local;
    }

    async initialize() {
        console.log('VideoManager initialized');
        const settings = await this.getSettings();
        this.apiKey = settings.apiKey;
        return true;
    }

    async saveVideo(videoData, folder = 'Videos') {
        try {
            const result = await this.get(['videos']);
            const videos = result.videos || {};

            if (!videos[folder]) {
                videos[folder] = [];
            }

            const videoWithId = {
                ...videoData,
                id: Date.now().toString(),
                folder: folder,
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            videos[folder].push(videoWithId);
            await this.set({ videos });

            return videoWithId.id;
        } catch (error) {
            console.error('Error saving video:', error);
            throw error;
        }
    }

    async getVideo(videoId) {
        try {
            const result = await this.get(['videos']);
            const videos = result.videos || {};

            for (const folder in videos) {
                const video = videos[folder].find(v => v.id === videoId);
                if (video) return video;
            }

            return null;
        } catch (error) {
            console.error('Error getting video:', error);
            throw error;
        }
    }

    async getVideosByFolder(folder) {
        try {
            const result = await this.get(['videos']);
            const videos = result.videos || {};
            return videos[folder] || [];
        } catch (error) {
            console.error('Error getting videos by folder:', error);
            throw error;
        }
    }

    async getAllVideos() {
        try {
            const result = await this.get(['videos']);
            const videos = result.videos || {};
            const allVideos = [];

            Object.values(videos).forEach(folderVideos => {
                allVideos.push(...folderVideos);
            });

            return allVideos;
        } catch (error) {
            console.error('Error getting all videos:', error);
            throw error;
        }
    }

    async updateVideo(videoId, updates) {
        try {
            const result = await this.get(['videos']);
            const videos = result.videos || {};

            for (const folder in videos) {
                const videoIndex = videos[folder].findIndex(v => v.id === videoId);
                if (videoIndex !== -1) {
                    videos[folder][videoIndex] = {
                        ...videos[folder][videoIndex],
                        ...updates,
                        lastModified: new Date().toISOString()
                    };
                    await this.set({ videos });
                    return videos[folder][videoIndex];
                }
            }

            throw new Error('Video not found');
        } catch (error) {
            console.error('Error updating video:', error);
            throw error;
        }
    }

    async deleteVideo(videoId) {
        try {
            const result = await this.get(['videos']);
            const videos = result.videos || {};

            for (const folder in videos) {
                const videoIndex = videos[folder].findIndex(v => v.id === videoId);
                if (videoIndex !== -1) {
                    videos[folder].splice(videoIndex, 1);
                    await this.set({ videos });
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error deleting video:', error);
            throw error;
        }
    }

    async searchVideos(query, folder = null) {
        try {
            let videos = [];

            if (folder) {
                videos = await this.getVideosByFolder(folder);
            } else {
                videos = await this.getAllVideos();
            }

            const lowercaseQuery = query.toLowerCase();
            return videos.filter(video =>
                video.title?.toLowerCase().includes(lowercaseQuery) ||
                video.description?.toLowerCase().includes(lowercaseQuery) ||
                video.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
            );
        } catch (error) {
            console.error('Error searching videos:', error);
            throw error;
        }
    }

    async generateVideoSummary(videoUrl, transcript) {
        // Mock implementation
        return {
            summary: `Summary of video at ${videoUrl}`,
            keyPoints: [
                'Key point 1 from transcript',
                'Key point 2 from transcript',
                'Key point 3 from transcript'
            ],
            transcript: transcript,
            generated: new Date().toISOString()
        };
    }

    async generateVideoFlashcards(videoUrl, transcript) {
        // Mock implementation
        return [
            {
                question: 'What is the main topic of this video?',
                answer: 'The video discusses important concepts related to the transcript.',
                videoUrl: videoUrl,
                timestamp: 0
            },
            {
                question: 'What are the key takeaways?',
                answer: 'Key takeaways include understanding the main concepts presented.',
                videoUrl: videoUrl,
                timestamp: 30
            }
        ];
    }

    async importYouTubePlaylist(playlistUrl, folder) {
        // Mock implementation - would parse YouTube API
        return {
            imported: 5,
            videos: [
                { title: 'Video 1', url: 'https://youtube.com/watch?v=1' },
                { title: 'Video 2', url: 'https://youtube.com/watch?v=2' }
            ],
            folder: folder
        };
    }

    async getVideoStatistics() {
        try {
            const videos = await this.getAllVideos();
            return {
                totalVideos: videos.length,
                totalFolders: Object.keys(await this.get(['videos'])).length,
                recentVideos: videos.slice(-5),
                watchTime: videos.reduce((total, video) => total + (video.duration || 0), 0)
            };
        } catch (error) {
            console.error('Error getting video statistics:', error);
            throw error;
        }
    }

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

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings || {});
            });
        });
    }
}

// Export for ES modules
export { VideoManager };
