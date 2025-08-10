// Initialize the popup with debug messages
console.log("Popup script loaded");

// Function to update the current size display
function updateCurrentSize() {
  const sizeDisplay = document.getElementById("current-size");
  if (!sizeDisplay) {
    console.error("Size display element not found!");
    return;
  }

  sizeDisplay.textContent = "Getting current size...";

  try {
    chrome.windows.getCurrent((window) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting window:", chrome.runtime.lastError);
        sizeDisplay.textContent = "Error: " + chrome.runtime.lastError.message;
        return;
      }

      console.log("Current window size:", window.width, "x", window.height);
      sizeDisplay.textContent = `Width: ${window.width}px, Height: ${window.height}px`;
    });
  } catch (e) {
    console.error("Exception in updateCurrentSize:", e);
    sizeDisplay.textContent = "Error: " + e.message;
  }
}

// Function to resize the window
function resizeWindow(width) {
  console.log("Resize requested, width:", width);

  // Update the display to show we're working
  const sizeDisplay = document.getElementById("current-size");
  if (sizeDisplay) {
    sizeDisplay.textContent = "Resizing...";
  }

  // Log the resizing attempt
  console.log("Sending resize message to background");

  // Get current window to preserve current height
  chrome.windows.getCurrent((window) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting window:", chrome.runtime.lastError);
      if (sizeDisplay) {
        sizeDisplay.textContent = "Error: " + chrome.runtime.lastError.message;
      }
      return;
    }

    // Keep the current height
    const currentHeight = window.height;

    // Send message to background script
    try {
      chrome.runtime.sendMessage(
        {
          type: "resizeWindow",
          width: width,
          height: currentHeight, // Keep current height
        },
        function (response) {
          // Check for any runtime errors
          if (chrome.runtime.lastError) {
            console.error("Message error:", chrome.runtime.lastError);
            if (sizeDisplay) {
              sizeDisplay.textContent =
                "Error: " + chrome.runtime.lastError.message;
            }
            return;
          }

          // Log and handle the response
          console.log("Received response:", response);

          if (response && response.success) {
            console.log("Resize was successful");
            updateCurrentSize();
          } else {
            console.error(
              "Resize failed:",
              response ? response.error : "No response"
            );
            if (sizeDisplay) {
              sizeDisplay.textContent =
                "Error: " +
                (response && response.error ? response.error : "Unknown error");
            }
          }
        }
      );
    } catch (e) {
      console.error("Exception sending message:", e);
      if (sizeDisplay) {
        sizeDisplay.textContent = "Error: " + e.message;
      }
    }
  });
}

// Set up all event handlers when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, setting up event handlers");

  // Cache input elements for repeated use
  const widthInput = document.getElementById("width");
  const fullWidthBtn = document.getElementById("fullWidthBtn");
  const fullScreenBtn = document.getElementById("fullScreenBtn");
  const resizeBtn = document.getElementById("resizeBtn");

  // Set up the full width button
  if (fullWidthBtn) {
    fullWidthBtn.addEventListener("click", function () {
      console.log("Full width button clicked");
      widthInput.value = "full";
      widthInput.focus();
    });
  } else {
    console.error("Full width button not found!");
  }

  // Set up the full screen button (now just sets full width)
  if (fullScreenBtn) {
    fullScreenBtn.addEventListener("click", function () {
      console.log("Full screen button clicked");
      // Set width to "full" and resize
      widthInput.value = "full";
      resizeWindow("full");
    });
  } else {
    console.error("Full screen button not found!");
  }

  // Set up the custom resize button
  if (resizeBtn) {
    console.log("Found resize button, adding click handler");

    resizeBtn.addEventListener("click", function () {
      console.log("Resize button clicked");

      if (!widthInput) {
        console.error("Width input not found!");
        return;
      }

      // Process width input - either a number or "full"
      let width;
      const widthValue = widthInput.value.trim().toLowerCase();

      if (widthValue === "full" || widthInput.hasAttribute("data-full")) {
        width = "full";
        console.log("Using full width");
      } else {
        // Try to parse as a number
        width = parseInt(widthValue);
        console.log("Using specified width:", width);

        // Validate width
        if (isNaN(width)) {
          console.error("Invalid width value");
          alert("Please enter a valid number or 'full' for width.");
          return;
        }

        if (width < 100) {
          console.error("Width too small");
          alert("Width should be at least 100px.");
          return;
        }
      }

      // Resize the window
      resizeWindow(width);
    });
  } else {
    console.error("Resize button not found in the document!");
  }

  // Set up the preset buttons
  const presetButtons = document.querySelectorAll(".preset");
  if (presetButtons.length > 0) {
    console.log("Found", presetButtons.length, "preset buttons");

    presetButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        // Get the preset width
        const width = this.getAttribute("data-width");

        console.log("Preset clicked, width:", width);

        // Resize the window
        resizeWindow(width);
      });
    });
  } else {
    console.error("No preset buttons found!");
  }

  // Show the current window size
  updateCurrentSize();

  console.log("All event handlers set up successfully");
});
