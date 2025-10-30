# SmartNotes AI - Free Learning Extension

⚡ **SmartNotes AI** is a 100% free Chrome extension that runs entirely on-device—no API keys, no subscriptions, no internet needed after setup. Instantly generate summaries, flashcards, quizzes, and track progress using advanced AI models that run locally in your browser.

![SmartNotes AI Logo](icons/icon128.png)

## ✨ Key Features

### 🤖 AI-Powered Learning Tools
- **Auto-Detection**: Automatically extracts content from web pages and YouTube videos
- **AI Summarization**: Generates concise, intelligent summaries of any text content
- **Smart Flashcards**: Creates question-answer pairs optimized for effective learning
- **Quiz Generation**: Builds multiple-choice questions to test your knowledge
- **OCR Support**: Extracts text from images and screen content using on-device processing

### 🔒 Privacy & Performance
- **100% Free**: No subscriptions, no API keys, no hidden costs
- **Privacy-First**: All processing happens on your device - no data sent to servers
- **Offline Processing**: Works without internet using on-device AI models
- **Instant Results**: Lightning-fast processing with modern browser-based ML

### 📊 Learning Management
- **Progress Tracking**: Monitors your learning progress and study streaks
- **Organized Storage**: Save and organize materials in custom folders
- **Social Features**: Join study groups and compete on leaderboards
- **Analytics Dashboard**: View detailed insights about your learning habits

### 🎯 Advanced Capabilities
- **YouTube Integration**: Automatically processes video transcripts
- **Context Menu**: Right-click any text for instant AI processing
- **Keyboard Shortcuts**: Quick access with Alt+S (summarize), Alt+F (flashcard), Alt+Q (quiz), Alt+D (dashboard)
- **Text-to-Speech**: Listen to your study materials with built-in TTS
- **Smart Reminders**: Daily study notifications to keep you on track

## 🚀 Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link coming soon)
2. Search for "SmartNotes AI"
3. Click "Add to Chrome"
4. The extension will install automatically

### Manual Installation (Developer Mode)
1. Download the extension files from [GitHub Releases](https://github.com/your-repo/releases)
2. Unzip the downloaded file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the unzipped folder
6. The extension is now installed!

## 📖 Usage Guide

### Getting Started
1. **Install the extension** following the steps above
2. **Navigate to any webpage** or YouTube video
3. **Click the SmartNotes AI icon** in your browser toolbar
4. The extension will automatically detect and analyze content
5. Choose from Summary, Flashcards, or Quiz tabs

### Manual Text Selection
- Click the "✏️ Manual" button to select specific text
- Or use keyboard shortcuts for quick processing

### Keyboard Shortcuts
- `Alt + S`: Summarize selected text
- `Alt + F`: Generate flashcard from selection
- `Alt + Q`: Create quiz from selected text
- `Alt + D`: Open learning dashboard

### Organizing Your Materials
- Create custom folders in the dashboard
- Save summaries, flashcards, and quizzes to folders
- Access your materials anytime from the dashboard

### Settings & Customization
- Click the ⚙️ Settings button to customize:
  - Language preferences
  - Daily reminder times
  - Auto-save options
  - Learning preferences

## 📸 Screenshots

### Main Interface
![Popup Interface](screenshots/popup-interface.png)
*The main popup showing auto-detected content and tabbed interface*

### AI Summary Results
![Summary View](screenshots/summary-view.png)
*AI-generated summary with save and speak options*

### Flashcard Generation
![Flashcard View](screenshots/flashcard-view.png)
*Interactive flashcard with question-answer format*

### Quiz Interface
![Quiz View](screenshots/quiz-view.png)
*Multiple choice quiz with progress tracking*

### Learning Dashboard
![Dashboard](screenshots/dashboard.png)
*Comprehensive dashboard showing progress and organized materials*

## 🛠️ Technical Details

### Requirements
- **Chrome Version**: 116 or higher
- **Manifest Version**: V3
- **Storage**: ~50MB for AI models (downloaded on first use)

### AI Models Used
- **Summarization**: DistilBART CNN 6-6 (Xenova)
- **Question Answering**: DistilBERT Base Uncased (Xenova)
- **Text Generation**: GPT-2 (Xenova)
- **OCR**: Tesseract.js (WebAssembly)

### Architecture
- **Service Worker**: Handles background processing and AI inference
- **Content Scripts**: Extract text from web pages
- **Offscreen Document**: Manages TTS audio processing
- **Local Storage**: Stores user data and learning materials

### Performance
- **First Load**: ~30-60 seconds for model download
- **Subsequent Uses**: Instant processing
- **Memory Usage**: ~100-200MB during active use
- **Storage**: Local Chrome storage (no cloud sync)

### Security & Privacy
- All AI processing happens locally
- No data transmission to external servers
- Content never leaves your device
- Open-source code for transparency

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/smartnotes-ai.git`
3. Install dependencies: `npm install` (if any)
4. Make your changes
5. Test thoroughly in Chrome
6. Submit a pull request

### Areas for Contribution
- **AI Model Improvements**: Enhance on-device AI capabilities
- **UI/UX Enhancements**: Improve the user interface
- **New Features**: Add learning tools or integrations
- **Performance Optimization**: Speed up processing or reduce memory usage
- **Documentation**: Improve guides and tutorials
- **Testing**: Add automated tests and bug fixes

### Code Style
- Use modern JavaScript (ES6+)
- Follow Chrome extension best practices
- Add comments for complex logic
- Test across different websites and content types

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/issues)
- **Discussions**: [Join community discussions](https://github.com/your-repo/discussions)
- **Email**: support@smartnotes-ai.com (placeholder)

## 🔗 Links

- [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
- [GitHub Repository](https://github.com/your-repo/smartnotes-ai)
- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)

---

**Made with ❤️ for learners worldwide. Study smarter, not harder!**

*SmartNotes AI - Your AI-powered learning companion, completely free and private.*
