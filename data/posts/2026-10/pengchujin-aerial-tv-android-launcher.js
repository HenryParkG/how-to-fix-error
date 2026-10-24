window.onPostDataLoaded({
    "title": "Clean TV Experience: pengchujin/aerial-tv Launcher",
    "slug": "pengchujin-aerial-tv-android-launcher",
    "language": "Kotlin",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Java"
    ],
    "analysis": "<p><code>pengchujin/aerial-tv</code> is an open-source Android TV launcher inspired by Apple tvOS design principles, built specifically to reclaim domestic smart TVs (such as Xiaomi, TCL, and Hisense) from intrusive stock firmware. China-market TVs are notorious for unskippable boot advertisements, sponsored banner bloat, background telemetry, and sluggish proprietary launchers loaded with marketing push services.</p><p>The repository has surged in popularity because it provides a lightweight, minimalist, zero-advertisement interface with native D-pad navigation, automatic boot-up takeover capabilities, and 4K HDR dynamic aerial screensavers reminiscent of tvOS. It circumvents OEM lock-in without requiring root permissions, giving users back a responsive home theater experience.</p>",
    "root_cause": "Key Features: (1) Ad-free Apple tvOS aesthetic with smooth focal scaling; (2) Automatic boot receiver (`BOOT_COMPLETED`) to hijack OEM launchers without root; (3) Integrated Aerial 4K video screensavers; (4) High-DPI app grid customization for sideloaded standard Android apps.",
    "bad_code": "# Download the latest APK release and install via Android Debug Bridge (ADB)\nadb connect 192.168.1.105:5555\nadb install -r aerial-tv-release.apk",
    "solution_desc": "Ideal for users looking to replace ad-laden OEM launchers on Android TV boxes and smart TVs. Can be paired with ADB commands to disable the stock launcher (e.g., com.mitv.tvhome on Xiaomi devices) so Aerial-TV becomes the default system desktop.",
    "good_code": "# Optional: Disable the OEM default launcher via ADB to ensure seamless Home button routing\n# Example for Xiaomi Mi TV:\nadb shell pm disable-user --user 0 com.mitv.tvhome\n\n# Set Aerial TV as the preferred launcher\nadb shell cmd package set-home-activity \"com.pengchu.aerialtv/.MainActivity\"",
    "verification": "Reboot the target television or press the remote control 'Home' button; the TV should boot directly into the Aerial-TV UI within seconds, with no OEM startup commercials or promotional app banners appearing.",
    "date": "2026-10-24",
    "id": 1792847061,
    "type": "trend"
});