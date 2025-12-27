(() => {
    // Updates the extension icon (e.g. gray out if disabled)
    // Since you are using static files, we just reload the defaults.

    async function updateIcon(enabled) {
        // If you wanted to have a "gray" version for disabled state,
        // you would name it icon16_disabled.png, etc.
        // For now, we will just keep the main icon to avoid errors.
        const suffix = enabled ? "" : ""; // You can change this if you make gray icons later

        try {
            await chrome.action.setIcon({
                path: {
                    "16": `icons/icon16${suffix}.png`,
                    "48": `icons/icon48${suffix}.png`,
                    "128": `icons/icon128${suffix}.png`
                }
            });
        } catch (error) {
            console.log("Could not update icon (files might be missing).");
        }
    }

    async function initializeIcon() {
        try {
            const storage = await chrome.storage.sync.get({ enabled: true });
            await updateIcon(storage.enabled);
        } catch (error) {
            await updateIcon(true);
        }
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "sync" && changes.enabled) {
            updateIcon(changes.enabled.newValue !== false);
        }
    });

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (message.type === "EXTENSION_TOGGLE") {
            updateIcon(message.enabled);
        }
    });

    chrome.runtime.onInstalled.addListener(async () => {
        await initializeIcon();
    });
})();