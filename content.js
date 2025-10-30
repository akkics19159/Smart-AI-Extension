// SmartNotes AI Content Script (Enhanced for Better Text Extraction)
// Listens for messages from popup for content extraction and manual mode.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Extract readable text from the page
    const pageText = extractReadableContent();

    if (pageText) {
      sendResponse({ success: true, content: pageText });
    } else {
      sendResponse({ success: false, error: "Could not extract content from the page." });
    }
  } else if (request.action === "showManualMode") {
    // Show visual indication for manual text selection
    showManualModeIndicator();
    sendResponse({ success: true });
  }
  // Return true to indicate that the response is sent asynchronously.
  return true;
});

function extractReadableContent() {
  // First try to get content from main article areas
  const articleSelectors = ['article', 'main', '[role="main"]', '.content', '.post', '.entry', '#content', '.main-content', '.article-content', '.page-content'];
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText && element.innerText.length > 200) {
      const text = element.innerText.trim();
      if (text.length > 1000) return text.substring(0, 4000); // Increased limit
    }
  }

  // Fallback to body text, clean it up and extract readable parts
  const bodyText = document.body ? document.body.innerText : '';
  if (bodyText) {
    // Remove scripts, styles, navigation, and excessive whitespace
    let cleaned = bodyText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Remove common UI elements
    const uiSelectors = ['nav', 'header', 'footer', '.nav', '.header', '.footer', '.menu', '.sidebar', '.ads', '.advertisement'];
    uiSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.innerText) cleaned = cleaned.replace(el.innerText, '');
      });
    });

    // Try to extract paragraphs and headings
    const paragraphs = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div[style*="text"], span[style*="text"]');
    let extracted = '';
    for (const p of paragraphs) {
      const text = p.innerText.trim();
      if (text.length > 30 && text.length < 800 && !text.includes('@') && !text.includes('http')) { // Filter out emails/links
        extracted += text + '\n';
        if (extracted.length > 3500) break; // Increased limit
      }
    }

    if (extracted.length > 500) return extracted.substring(0, 4000);

    // If not enough, use cleaned body text
    return cleaned.length > 200 ? cleaned.substring(0, 4000) : null;
  }

  return null;
}

function showManualModeIndicator() {
  // Create a temporary overlay to guide user for manual selection
  const overlay = document.createElement('div');
  overlay.id = 'smartnotes-manual-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4285f4;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 250px;
    ">
      <div style="font-weight: bold; margin-bottom: 4px;">✏️ Manual Mode</div>
      <div>Select text on this page, then right-click or use Alt+S for AI processing</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Remove overlay after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 5000);
}
