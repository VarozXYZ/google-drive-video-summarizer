# Drive Video Summarizer (Chrome Extension)

This extension captures Google Drive video captions (timedtext JSON) and sends a cleaned transcript to OpenAI to generate:
- A timeline of what happens in the video
- A "hard knowledge" summary of key concepts

## How to use (local dev)
1. Load the extension:
   - Open Chrome -> Extensions -> Enable Developer mode -> Load unpacked
   - Select the `extension` folder.
2. Open a Google Drive video file in a new tab.
3. Play the video and turn on captions (CC).
4. Click the extension icon. When captions are detected, click "Summarize".

## Notes
- Works on read-only Drive files.
- Requires auto-generated captions to be available.
- For distribution, do NOT ship an OpenAI API key in the extension. Use a server proxy.

## Files
- `manifest.json` - MV3 manifest
- `content.js` - Captures timedtext URLs from the page
- `background.js` - Fetches captions, cleans transcript, calls OpenAI
- `popup.html` / `popup.js` / `popup.css` - UI
