function setupCropper(imgDataUrl, fileKey) {
  console.log("Setting up cropper with image data", imgDataUrl);

  const image = document.getElementById("image");
  image.src = imgDataUrl;

  image.onload = () => {
    const cropper = new Cropper(image, {
      //   aspectRatio: 16 / 9,
      autoCrop: true,
      movable: false,
      scalable: false,
      zoomable: false,
      ready() {
        this.cropper.setCropBoxData({
          width: 1,
          height: 1,
          top: 0,
          left: 0,
        });
      },
      crop(event) {
        console.log("crop event", event.detail);
      },
      cropend() {
        console.log("Crop end event");
        const croppedCanvas = cropper.getCroppedCanvas();
        if (croppedCanvas) {
          const croppedImageDataUrl = croppedCanvas.toDataURL("image/png");
          console.log("Cropped image data", croppedImageDataUrl);

          // Update only the dataUrl property in storage
          if (fileKey) {
            chrome.storage.local.get(fileKey, (result) => {
              if (result[fileKey]) {
                result[fileKey].dataUrl = croppedImageDataUrl;
                chrome.storage.local.set({ [fileKey]: result[fileKey] }, () => {
                  console.log("Updated cropped image in storage");
                  window.location.href = `index.html?key=${fileKey}`;
                });
              } else {
                console.error("Original image object not found in storage");
              }
            });
          } else {
            console.error("File key is missing, unable to save cropped image");
          }
        }
      },
    });
  };
}

const getFileKey = () => {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  return url.searchParams.get("key");
};

const getErrorKey = () => {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  return url.searchParams.get("error");
};

const fileKey = getFileKey();
const errorKey = getErrorKey();
console.debug("getFileKey", fileKey);
if (fileKey) {
  chrome.storage.local.get(fileKey, (result) => {
    console.log("Fetched image", result);
    if (result[fileKey]) {
      const imgData = result[fileKey].dataUrl;
      console.log("image data", imgData);
      setupCropper(imgData, fileKey);
    } else {
      console.error("Image not found in storage");
      setupCropper("img/no-image.jpg", fileKey);
    }
  });
} else if (errorKey) {
  const errorContainer = document.getElementById("error-container");
  const errorMessage = document.getElementById("error-message");
  const grantAccessBtn = document.getElementById("grant-access-btn");

  if (errorKey === "noFileAccess") {
    errorMessage.innerHTML =
      "You tried to snip a local file.<br/> Visual Snippets needs your permission to access local files.";
    grantAccessBtn.style.display = "inline-block";
    grantAccessBtn.addEventListener("click", () => {
      chrome.tabs.create({
        url: "chrome://extensions/?id=" + chrome.runtime.id,
      });
    });

    document.getElementById("grant-access-img").style.display = "block";
  } else if (errorKey === "storageQuotaExceeded") {
    errorMessage.textContent =
      "Storage limit exceeded. Please free up space and try again.";
  }

  errorContainer.style.display = "block";
} else {
  console.error("File key not found in URL");
  setupCropper("img/no-image.jpg", null);
}
