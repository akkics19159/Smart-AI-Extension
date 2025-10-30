// SmartNotes AI Dashboard Script

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Get all flashcards
        const flashcards = await getAllFlashcards();
        const folders = await getFolders();

        // Update stats
        updateStats(flashcards);

        // Update folder counts
        updateFolderCounts(folders);

        // Load recent activity
        loadRecentActivity();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStats(flashcards) {
    document.getElementById('flashcardCount').textContent = flashcards.length;

    // Mock data for other stats (would be calculated from actual data)
    document.getElementById('quizCount').textContent = Math.floor(flashcards.length / 3);
    document.getElementById('summaryCount').textContent = Math.floor(flashcards.length / 2);
    document.getElementById('studyStreak').textContent = '7'; // Mock streak
}

function updateFolderCounts(folders) {
    Object.keys(folders).forEach(folderName => {
        const count = folders[folderName].length;
        const elementId = getFolderElementId(folderName);
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = `${count} flashcard${count !== 1 ? 's' : ''}`;
        }
    });
}

function getFolderElementId(folderName) {
    const mapping = {
        'General Knowledge': 'gk-count',
        'JEE Physics': 'physics-count',
        'UPSC History': 'history-count'
    };
    return mapping[folderName] || 'gk-count';
}

function loadRecentActivity() {
    // Mock recent activity
    const activities = [
        {
            text: 'Created flashcard: "What is Newton\'s First Law?"',
            time: '2 hours ago'
        },
        {
            text: 'Generated summary for selected text',
            time: '1 day ago'
        },
        {
            text: 'Completed quiz on Physics concepts',
            time: '2 days ago'
        }
    ];

    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';

        li.innerHTML = `
            <span class="activity-text">${activity.text}</span>
            <span class="activity-time">${activity.time}</span>
        `;

        activityList.appendChild(li);
    });
}

function openFolder(folderName) {
    // Navigate to folder view (would open a new tab or section)
    console.log('Opening folder:', folderName);
    // For now, just show an alert
    alert(`Opening folder: ${folderName}`);
}

// API functions to communicate with background script
function getAllFlashcards() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'get_flashcards' }, (response) => {
            resolve(response.success ? response.data : []);
        });
    });
}

function getFolders() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'get_folders' }, (response) => {
            resolve(response.success ? response.data : {});
        });
    });
}

// Make functions available globally
window.openFolder = openFolder;
