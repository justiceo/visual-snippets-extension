import storage from "../utils/storage";

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.captureVisibleTab(async (dataUrl) => {
    const screenshotKey = `screenshot_${Date.now()}`;
    const date = new Date();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    };
    const formattedDate = date.toLocaleString("en-US", options);
    const screenshotData = {
      key: screenshotKey,
      dataUrl,
      createdAt: Date.now(),
      hr_date: formattedDate,
      url: tab.url,
      title: tab.title,
    };
    await storage.put(screenshotKey, screenshotData);

    // Open the image editor with the saved screenshot
    chrome.tabs.create({
      url:
        chrome.runtime.getURL("standalone/index.html") +
        "?key=" +
        screenshotKey,
    });
  });
});
