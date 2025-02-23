import storage from "../utils/storage";

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith("file://")) {
    // Check if the extension has file URL access
    const hasFileAccess = await chrome.extension.isAllowedFileSchemeAccess();
    if (!hasFileAccess) {
      chrome.tabs.create({
        url:
          chrome.runtime.getURL("standalone/snip.html") + "?error=noFileAccess",
        index: tab.index,
      });
      return;
    }
  }

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

    try {
      await storage.put(screenshotKey, screenshotData);
      chrome.tabs.create({
        url:
          chrome.runtime.getURL("standalone/snip.html") +
          "?key=" +
          screenshotKey,
        index: tab.index,
      });
    } catch (error) {
      if (error.message.includes("QUOTA_BYTES_PER_ITEM")) {
        chrome.tabs.create({
          url:
            chrome.runtime.getURL("standalone/snip.html") +
            "?error=storageQuotaExceeded",
          index: tab.index,
        });
      } else {
        console.error("Failed to save screenshot:", error);
      }
    }
  });
});
