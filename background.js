// Add a startup listener to initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Window Resizer extension installed/updated");
});

// Log when the service worker starts
console.log("Background service worker started");

// Add a message listener for resize requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === "resizeWindow") {
    console.log(
      "Processing resize request: width =",
      message.width,
      ", height =",
      message.height
    );

    // Get the current window
    chrome.windows.getCurrent((win) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting window:", chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      // Use system info to get the maximum available dimensions
      chrome.system.display.getInfo((displays) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error getting display info:",
            chrome.runtime.lastError
          );
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        // Find the primary display or the first one
        const primaryDisplay = displays.find((d) => d.isPrimary) || displays[0];

        if (!primaryDisplay) {
          console.error("No display information available");
          sendResponse({
            success: false,
            error: "Could not retrieve display information",
          });
          return;
        }

        // Get max dimensions from display
        const maxWidth = primaryDisplay.workArea.width;
        console.log("Display work area width:", maxWidth);

        // Prepare final dimensions
        let finalWidth;

        // Handle width (check if it's "full" or a number)
        if (message.width === "full") {
          finalWidth = maxWidth - 20; // Subtract a bit for borders
          console.log("Using full width:", finalWidth);
        } else {
          finalWidth = parseInt(message.width);
          console.log("Using specified width:", finalWidth);
        }

        // Use the provided height (from current window)
        const finalHeight = message.height;
        console.log("Using provided height:", finalHeight);

        // Actually resize the window
        const updateOptions = {
          width: finalWidth,
          height: finalHeight,
        };

        console.log("Updating window with options:", updateOptions);

        chrome.windows.update(win.id, updateOptions, (updatedWindow) => {
          if (chrome.runtime.lastError) {
            console.error("Window update error:", chrome.runtime.lastError);
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            console.log(
              "Window resized to:",
              updatedWindow.width,
              "x",
              updatedWindow.height
            );
            sendResponse({
              success: true,
              width: updatedWindow.width,
              height: updatedWindow.height,
            });
          }
        });
      });
    });

    // Keep the message channel open for the async response
    return true;
  }
});
