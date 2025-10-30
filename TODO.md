# TODO: Make SmartNotes AI Extension Completely Free and Optimized

## 1. Enhance On-Device AI Module
- [ ] Extend `onDeviceAI.js` to support flashcard generation using local models
- [ ] Add quiz generation functionality to `onDeviceAI.js`
- [ ] Improve summarization quality with better model parameters

## 2. Replace Paid AI Dependencies
- [ ] Modify `aiSummarizer.js` to use on-device AI instead of OpenAI API
- [ ] Update `flashcardGenerator.js` to use local flashcard generation
- [ ] Update `quizGenerator.js` to use local quiz generation
- [ ] Remove OpenAI API calls and error handling from all AI modules

## 3. Optimize Background Service Worker
- [ ] Streamline module initialization in `background.js`
- [ ] Remove OpenAI-related code and dependencies
- [ ] Optimize message handling for better performance
- [ ] Clean up unused imports and functions

## 4. Improve Popup Performance
- [ ] Optimize content extraction in `popup.js`
- [ ] Improve loading states and error handling
- [ ] Remove API key dependency checks

## 5. Update Settings and Configuration
- [ ] Remove API key fields from `settings.html` and `settings.js`
- [ ] Update default settings to remove AI provider options
- [ ] Simplify settings interface

## 6. Update Manifest and Documentation
- [ ] Update `manifest.json` description to reflect free nature
- [ ] Update README.md to remove API key requirements
- [ ] Ensure all references to paid services are removed

## 7. Testing and Bug Fixes
- [ ] Test extension loads without API keys
- [ ] Verify all AI operations work with on-device models
- [ ] Test content extraction on various websites
- [ ] Check for console errors and performance issues
- [ ] Ensure smooth operation across different scenarios
