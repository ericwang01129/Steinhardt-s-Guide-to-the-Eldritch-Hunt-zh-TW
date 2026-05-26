/**
 * Babele registration for the integrated Steinhardt's Guide (zh-TW) module.
 *
 * Tells Babele where to find this module's translation tables. Babele then
 * locates files at `compendium/<module-id>.<pack-name>.json` and applies them
 * to the matching compendium pack at load time when the client locale is zh-tw.
 *
 * Note: this is loaded as a regular esmodule (no imports needed) — Babele
 * itself exposes the global `Babele` class at init time.
 */
Hooks.once("init", () => {
    if (typeof Babele === "undefined") {
        console.warn(
            "[steinhardt-guide-to-the-eldritch-hunt-zh-tw] Babele not detected; " +
            "translations will not be applied. Enable the 'babele' module to use zh-TW content."
        );
        return;
    }

    Babele.get().register({
        module: "steinhardt-guide-to-the-eldritch-hunt-zh-tw",
        lang: "zh-tw",
        dir: "compendium"
    });
});
