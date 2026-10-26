window.onPostDataLoaded({
    "title": "Aerial TV: Clean tvOS Launcher for Android TVs",
    "slug": "aerial-tv-clean-apple-tvos-launcher-android-tv",
    "language": "Java",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Java"
    ],
    "analysis": "<p>Smart TVs sold in markets like China (Xiaomi, TCL, Hisense, Skyworth) feature heavily modified Android operating systems plagued by intrusive boot advertisements, system popups, noisy recommendation carousels, and sluggish launcher UIs. The trending open-source repository <code>pengchujin/aerial-tv</code> directly resolves this pain point by delivering a pure, ad-free Android TV launcher crafted to match Apple tvOS aesthetics.</p><p>The project provides instant boot takeover, fluid focus animations, dynamic top-shelf app previews, and Apple TV-style high-definition aerial video screensavers. Its lightweight footprint significantly revives sluggish TV hardware by bypassing resource-heavy OEM shells.</p>",
    "root_cause": "Minimalist Apple tvOS visual system, native Leanback Android framework optimization, complete absence of tracking or promotional SDKs, integrated 4K aerial video screensavers, and persistent boot-receiver automation.",
    "bad_code": "# Quick start via ADB on Xiaomi / TCL / Sony TVs:\n# 1. Enable ADB Debugging in Developer Options\nadb connect <TV_IP_ADDRESS>:5555\n\n# 2. Install Aerial TV APK\nadb install -r AerialTV-release.apk\n\n# 3. Grant system alert window and home intent permissions\nadb shell appops set com.pengchujin.aerialtv SYSTEM_ALERT_WINDOW allow",
    "solution_desc": "Best suited for users seeking to replace bloated, ad-ridden OEM smart TV interfaces with a clean, responsive layout. Ideal for family setups, older adults who need a simple app grid, or home theater enthusiasts using external set-top boxes.",
    "good_code": "# Set Aerial TV as the permanent default Home launcher via ADB shell\nadb shell cmd package set-home-activity \"com.pengchujin.aerialtv/.MainActivity\"\n\n# (Optional) Disable vendor default launchers to prevent background wakeups\n# Example for Xiaomi PatchWall:\nadb shell pm disable-user --user 0 com.mitv.tvhome\n\n# Example for TCL OEM Launcher:\nadb shell pm disable-user --user 0 com.tcl.waterfall",
    "verification": "Reboot the television and verify that Aerial TV starts up immediately with zero commercial ads, smooth remote D-pad navigation, and seamless 4K aerial video screensaver activation after idle periods.",
    "date": "2026-10-26",
    "id": 1792981595,
    "type": "trend"
});