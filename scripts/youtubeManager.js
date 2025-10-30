
// youtubeManager.js - Handles fetching transcripts from YouTube videos.

/**
 * Fetches the transcript for a given YouTube video ID.
 * @param {string} videoId The ID of the YouTube video.
 * @returns {Promise<string>} A promise that resolves to the full transcript text.
 */
export async function getYouTubeTranscript(videoId) {
    try {
        // We use a free, open-source proxy to get the transcript data without needing an API key.
        // This is more reliable than trying to scrape YouTube directly.
        const response = await fetch(`https://youtube-transcript-api.vercel.app/?videoId=${videoId}`, {
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch transcript. Status: ${response.status}`);
        }

        const transcriptData = await response.json();

        // Combine all the individual text parts into a single string.
        const fullTranscript = transcriptData.reduce((acc, item) => acc + item.text + " ", "");

        if (!fullTranscript) {
            throw new Error("Transcript is available for this video, but it is empty.");
        }

        return fullTranscript;

    } catch (error) {
        console.error("Error fetching YouTube transcript:", error);
        // Check if the error indicates no transcript is available.
        if (error.message.includes("Could not find a transcript for this video")) {
            throw new Error("No English transcript available for this video.");
        }
        // Re-throw other errors to be handled by the caller.
        throw error;
    }
}
