import storage from "../utils/storage";

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.captureVisibleTab(async (dataUrl) => {
    const screenshotKey = `screenshot_${Date.now()}`;
    await storage.put(screenshotKey, dataUrl);

    // Open the image editor with the saved screenshot
    chrome.tabs.create({
      url:
        chrome.runtime.getURL("standalone/index.html") +
        "?key=" +
        screenshotKey,
    });
  });
});
