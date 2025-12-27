var MessageTypes = {
  SET_SPEED: "VSC_SET_SPEED",
  ADJUST_SPEED: "VSC_ADJUST_SPEED",
  RESET_SPEED: "VSC_RESET_SPEED",
  TOGGLE_DISPLAY: "VSC_TOGGLE_DISPLAY"
};

document.addEventListener("DOMContentLoaded", function() {
  loadSettingsAndInitialize();

  // --- DOWNLOAD LOGIC START ---
  document.querySelector("#download-btn").addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      // Clean url (just removing existing download params)
      let cleanUrl = tab.url.replace("&download=1", "").replace("?download=1", "");

      // Copy to clipboard
      navigator.clipboard.writeText(cleanUrl).then(() => {
        setStatusMessage("URL Copied! Redirecting...");

        // Redirect to download
        const separator = cleanUrl.includes("?") ? "&" : "?";
        const downloadUrl = cleanUrl + separator + "download=1";

        chrome.tabs.update(tab.id, { url: downloadUrl });
      }).catch(err => {
        console.error('Failed to copy: ', err);
        setStatusMessage("Failed to copy URL");
      });
    });
  });
  // --- DOWNLOAD LOGIC END ---

  document.querySelector("#config").addEventListener("click", function() {
    chrome.runtime.openOptionsPage();
  });

  document.querySelector("#disable").addEventListener("click", function() {
    const isCurrentlyEnabled = !this.classList.contains("disabled");
    toggleEnabled(!isCurrentlyEnabled, settingsSavedReloadMessage);
  });

  chrome.storage.sync.get({ enabled: true }, function(storage) {
    toggleEnabledUI(storage.enabled);
  });

  function toggleEnabled(enabled, callback) {
    chrome.storage.sync.set({ enabled }, function() {
      toggleEnabledUI(enabled);
      if (callback) callback(enabled);
    });
  }

  function toggleEnabledUI(enabled) {
    const disableBtn = document.querySelector("#disable");
    disableBtn.classList.toggle("disabled", !enabled);
    disableBtn.title = enabled ? "Disable Extension" : "Enable Extension";

    // Update icon via background script or direct call if possible
    chrome.runtime.sendMessage({ type: "EXTENSION_TOGGLE", enabled });
  }

  function settingsSavedReloadMessage(enabled) {
    setStatusMessage(`${enabled ? "Enabled" : "Disabled"}. Reload page.`);
  }

  function setStatusMessage(str) {
    const status_element = document.querySelector("#status");
    status_element.classList.toggle("hide", false);
    status_element.innerText = str;
    // Auto-hide after 3 seconds
    setTimeout(() => {
      status_element.classList.toggle("hide", true);
    }, 3000);
  }

  function loadSettingsAndInitialize() {
    chrome.storage.sync.get(null, function(storage) {
      let slowerStep = 0.1;
      let fasterStep = 0.1;
      let resetSpeed2 = 1;

      if (storage.keyBindings && Array.isArray(storage.keyBindings)) {
        const slowerBinding = storage.keyBindings.find((kb) => kb.action === "slower");
        const fasterBinding = storage.keyBindings.find((kb) => kb.action === "faster");
        const fastBinding = storage.keyBindings.find((kb) => kb.action === "fast");

        if (slowerBinding && typeof slowerBinding.value === "number") slowerStep = slowerBinding.value;
        if (fasterBinding && typeof fasterBinding.value === "number") fasterStep = fasterBinding.value;
        if (fastBinding && typeof fastBinding.value === "number") resetSpeed2 = fastBinding.value;
      }

      updateSpeedControlsUI(slowerStep, fasterStep, resetSpeed2);
      initializeSpeedControls();
    });
  }

  function updateSpeedControlsUI(slowerStep, fasterStep, resetSpeed2) {
    const decreaseBtn = document.querySelector("#speed-decrease");
    if (decreaseBtn) {
      decreaseBtn.dataset.delta = -slowerStep;
      decreaseBtn.querySelector("span").textContent = `-${slowerStep}`;
    }
    const increaseBtn = document.querySelector("#speed-increase");
    if (increaseBtn) {
      increaseBtn.dataset.delta = fasterStep;
      increaseBtn.querySelector("span").textContent = `+${fasterStep}`;
    }
    const resetBtn = document.querySelector("#speed-reset");
    if (resetBtn) {
      resetBtn.textContent = resetSpeed2.toString();
    }
  }

  function initializeSpeedControls() {
    document.querySelector("#speed-decrease").addEventListener("click", function() {
      adjustSpeed(parseFloat(this.dataset.delta));
    });
    document.querySelector("#speed-increase").addEventListener("click", function() {
      adjustSpeed(parseFloat(this.dataset.delta));
    });
    document.querySelector("#speed-reset").addEventListener("click", function() {
      setSpeed(parseFloat(this.textContent));
    });
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", function() {
        setSpeed(parseFloat(this.dataset.speed));
      });
    });
  }

  function setSpeed(speed) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: MessageTypes.SET_SPEED,
          payload: { speed }
        });
      }
    });
  }

  function adjustSpeed(delta) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: MessageTypes.ADJUST_SPEED,
          payload: { delta }
        });
      }
    });
  }
});