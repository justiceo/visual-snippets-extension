// import FilerobotImageEditor from "filerobot-image-editor"; // Load library from NPM
// or load from CDN as following and use (window.FilerobotImageEditor):
// <script src="https://scaleflex.cloudimg.io/v7/plugins/filerobot-image-editor/latest/filerobot-image-editor.min.js"></script>

/*
why not import from NPM?
- That package on npm is outdated
- Need to switch to TS to take advantage of type system.
- Didn't work when I tried it - got some errors.
*/

function addCopyToClipboardButton() {
  const saveButton = document.querySelector("button.FIE_topbar-save-button");
  if (!saveButton) {
    console.error("Save button not found");
    return;
  }

  // clone saveButton.
  const copyButton = saveButton.cloneNode(true);
  const textLabel = copyButton.querySelector("span.SfxButton-Label");
  textLabel.textContent = "Copy";

  // set onClick handler for copy button.
  copyButton.addEventListener("click", (e) => {
    console.log("Clicked copy");
    console.log(
      "image data",
      filerobotImageEditor.getCurrentImgData({ extension: "png" })
    );
    const imgData = filerobotImageEditor.getCurrentImgData({
      extension: "png",
    });

    console.log("image length", imgData.imageData.imageBase64.length);

    // copy image to clipboard
    copyBase64ImageToClipboard(imgData.imageData.imageBase64).then((res) => {
      console.log("Copied to clipboard", res);
    });
  });

  // append to the parent of saveButton.
  saveButton.parentNode.appendChild(copyButton);
  saveButton.style.marginRight = "10px";
}

// Clipboard only supports PNG format.
async function copyBase64ImageToClipboard(base64Data, mimeType) {
  // Create a Blob from the base64 data
  const byteCharacters = atob(base64Data.split(",")[1]); // Remove the "data:image/png;base64," part
  const byteNumbers = new Array(byteCharacters.length).map((_, i) =>
    byteCharacters.charCodeAt(i)
  );
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" });

  // Convert the Blob into a ClipboardItem
  const clipboardItem = new ClipboardItem({ "image/png": blob });

  try {
    // Write the ClipboardItem to the clipboard
    await navigator.clipboard.write([clipboardItem]);
    console.log("Image copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy image to clipboard:", err);
  }
}

function saveImage(imageObj) {
  // chrome.downloads.download allows saving to sub-directory and search too.
  if (!chrome || !chrome.downloads) {
    console.error("chrome.downloads not available");
    return;
  }

  const downloadOptions = {
    url: imageObj.imageBase64,
    filename: "capture_share/" + imageObj.fullName,
    conflictAction: "uniquify", // If the file already exists, rename it
  };
  console.log("downloadOptions", downloadOptions, "for image", imageObj);
  chrome.downloads.download(downloadOptions, function (downloadId) {
    if (chrome.runtime.lastError) {
      console.error("Download failed: " + chrome.runtime.lastError.message);
    } else {
      console.log("Download started with ID:", downloadId);
    }
  });
}

function setupEditor(imgData) {
  const { TABS, TOOLS } = window.FilerobotImageEditor;
  const config = {
    source: imgData,
    resetOnImageSourceChange: true,
    showCanvasOnly: false,
    // Use translate API to update the default keys https://github.com/scaleflex/filerobot-image-editor/blob/master/packages/react-filerobot-image-editor/src/context/defaultTranslations.js#L1
    useBackendTranslations: false,
    onSave: (editedImageObject, designState) => {
      saveImage(editedImageObject);
    },
    defaultSavedImageName:
      "Screenshot-" + new Date().toISOString().split("T")[0],
    showBackButton: false,
    annotationsCommon: {
      fill: "#ff0000",
    },
    Text: { text: "Double-click here to type..." },
    Rotate: { angle: 90, componentType: "slider" },
    translations: {
      profile: "Profile",
      coverPhoto: "Cover photo",
      facebook: "Facebook",
      socialMedia: "Social Media",
      fbProfileSize: "180x180px",
      fbCoverPhotoSize: "820x312px",
    },
    Crop: {
      presetsItems: [
        {
          titleKey: "classicTv",
          descriptionKey: "4:3",
          ratio: 4 / 3,
          // icon: CropClassicTv, // optional, CropClassicTv is a React Function component. Possible (React Function component, string or HTML Element)
        },
        {
          titleKey: "cinemascope",
          descriptionKey: "21:9",
          ratio: 21 / 9,
          // icon: CropCinemaScope, // optional, CropCinemaScope is a React Function component.  Possible (React Function component, string or HTML Element)
        },
      ],
      presetsFolders: [
        {
          titleKey: "socialMedia", // will be translated into Social Media as backend contains this translation key
          // icon: Social, // optional, Social is a React Function component. Possible (React Function component, string or HTML Element)
          groups: [
            {
              titleKey: "facebook",
              items: [
                {
                  titleKey: "profile",
                  width: 180,
                  height: 180,
                  descriptionKey: "fbProfileSize",
                },
                {
                  titleKey: "coverPhoto",
                  width: 820,
                  height: 312,
                  descriptionKey: "fbCoverPhotoSize",
                },
              ],
            },
          ],
        },
      ],
    },
    tabsIds: [TABS.ADJUST, TABS.ANNOTATE], // or ['Adjust', 'Annotate', 'Watermark']
    defaultTabId: TABS.ANNOTATE, // or 'Annotate'
    defaultToolId: TOOLS.Text, // or 'Text'
  };

  // Assuming we have a div with id="editor_container"
  const filerobotImageEditor = new window.FilerobotImageEditor(
    document.querySelector("#editor_container"),
    config
  );

  filerobotImageEditor.render({
    onClose: (closingReason) => {
      console.log("Closing reason", closingReason);
      filerobotImageEditor.terminate();
    },
  });
}

const getFileKey = () => {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  return url.searchParams.get("key");
};

const fileKey = getFileKey();
console.debug("getFileKey", fileKey);
if (fileKey) {
  // Fetch image from chrome.storage.local using fileKey
  chrome.storage.local.get(fileKey, (result) => {
    console.log("Fetched image", result);
    if (result[fileKey]) {
      const imgData = result[fileKey];
      console.log("image data", imgData);
      setupEditor(imgData);
    } else {
      console.error("Image not found in storage");
      setupEditor("img/no-image.jpg");
    }
  });

  setTimeout(() => {
    addCopyToClipboardButton();
  }, 500);
} else {
  console.error("File key not found in URL");
  setupEditor("img/no-image.jpg");
}
