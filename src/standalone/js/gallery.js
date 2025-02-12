import Fuse from "fuse.js";

function renderGallery(screenshotKeys) {
  const container = document.querySelector(".container");
  const searchInput = document.getElementById("search");
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-input");
  const loadMoreBtn = document.getElementById("load-more");

  let screenshots = {};
  let currentPage = 1;
  const itemsPerPage = 6;

  // Initialize Fuse.js options
  const fuseOptions = {
    keys: ["title", "hr_date", "url"],
    threshold: 0.3, // Adjust the threshold for fuzziness
  };

  // Sort screenshotKeys in reverse chronological order
  screenshotKeys.sort((a, b) => {
    const aTimestamp = parseInt(a.split("_")[1]);
    const bTimestamp = parseInt(b.split("_")[1]);
    return bTimestamp - aTimestamp;
  });

  // Load initial content
  addScreenshots();

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm === "") {
      // Reset UI when search query is empty
      container.innerHTML = "";
      currentPage = 1;
      screenshotKeys = Object.keys(screenshots);
      addScreenshots();
      loadMoreBtn.style.display = "block";
      return;
    }

    const fuse = new Fuse(Object.values(screenshots), fuseOptions);
    const results = fuse.search(searchTerm);

    // Clear current images
    container.innerHTML = "";

    // Render images based on search results
    results.forEach(({ item }) => {
      const imageElement = createImageElement(item, item.key);
      container.appendChild(imageElement);
    });

    // Hide load more button if search results are displayed
    loadMoreBtn.style.display = results.length ? "none" : "block";
  });

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const month = date.toLocaleString("default", { month: "short" });
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return ` ${month} ${day}`;
  }

  function createImageElement(imageData, key) {
    function getHostname(url) {
      try {
        return new URL(url).hostname;
      } catch {
        return "";
      }
    }

    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    wrapper.dataset.key = key;

    const image = document.createElement("img");
    image.src = imageData.dataUrl;
    image.alt = imageData.title;

    const link = document.createElement("a");
    link.href = `index.html?key=${key}`;
    link.appendChild(image);

    const overlay = document.createElement("div");
    overlay.className = "image-overlay";

    const info = document.createElement("div");
    info.className = "image-info";
    info.textContent = `${getHostname(imageData.url)} • ${formatDate(
      imageData.createdAt
    )}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete screenshot";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      delete screenshots[key];
      deleteImage(key);
      wrapper.remove();
    };

    overlay.appendChild(info);
    overlay.appendChild(deleteBtn);
    wrapper.appendChild(link);
    wrapper.appendChild(overlay);

    return wrapper;
  }

  // File upload handling
  function handleFileUpload(file) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const screenshotKey = `screenshot_${Date.now()}`;
        const dataUrl = e.target.result;

        screenshots[screenshotKey] = {
          dataUrl,
          createdAt: Date.now(),
          url: "https://example.com", // TODO: Replace with actual URL
          title: file.name,
        };

        const imageElement = createImageElement(
          screenshots[screenshotKey],
          screenshotKey
        );
        container.insertBefore(imageElement, container.firstChild);
      };
      reader.readAsDataURL(file);
    }
  }

  // File input change handler
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
    fileInput.value = ""; // Reset input
  });

  // Drag and drop handlers
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  });

  // Clipboard paste handler
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        handleFileUpload(file);
        break;
      }
    }
  });

  // Load more functionality
  loadMoreBtn.addEventListener("click", () => {
    currentPage++;
    addScreenshots();
  });

  // For now, randomly add images
  function addScreenshots() {
    for (let i = 0; i < itemsPerPage && screenshotKeys.length > 0; i++) {
      const screenshotKey = screenshotKeys.shift();
      getScreenshotData(screenshotKey).then((data) => {
        // Store screenshot data for search
        screenshots[screenshotKey] = {
          ...data,
          key: screenshotKey,
          hr_date: formatDate(data.createdAt), // Add human-readable date for searching
        };

        const imageElement = createImageElement(data, screenshotKey);
        container.appendChild(imageElement);
      });
    }

    if (screenshotKeys.length === 0) {
      loadMoreBtn.style.display = "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getScreenshotKeys().then((keys) => {
    imageKeys = keys;
    console.log("Image keys", imageKeys);
    renderGallery(imageKeys);
  });
});

function getScreenshotKeys() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (result) => {
      const screenshotKeys = Object.keys(result).filter((key) =>
        key.startsWith("screenshot_")
      );
      console.log("All keys", result);
      resolve(screenshotKeys);
    });
  });
}
function getScreenshotData(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}
function deleteImage(key) {
  chrome.storage.local.remove(key, () => {
    console.log("Deleted image with key", key);
  });
}
