window.onPostDataLoaded({
    "title": "Fix App Is Damaged and Can't Be Opened on macOS",
    "slug": "fix-macos-app-damaged-cant-be-opened-xattr",
    "language": "macOS",
    "code": "ERR_GATEKEEPER_QUARANTINE",
    "tags": [
        "macOS",
        "Browser",
        "Error Fix"
    ],
    "analysis": "<p>When opening an application downloaded outside the Mac App Store, macOS displays a dialog stating <code>\"App Name\" is damaged and can't be opened. You should move it to the Trash</code>.</p><p>The application binary is rarely damaged. Instead, macOS Gatekeeper blocks execution because the downloaded archive carries an extended quarantine attribute and lacks an Apple-notarized developer signature.</p>",
    "root_cause": "The <code>com.apple.quarantine</code> extended file attribute attached by browsers to downloaded files, triggering Gatekeeper rejection on unsigned or ad-hoc signed apps.",
    "bad_code": "\"AppName.app\" is damaged and can't be opened. You should move it to the Trash.",
    "solution_desc": "<p>Open Terminal and use the <code>xattr</code> command to recursively strip the quarantine flag from the target application bundle inside <code>/Applications</code>.</p>",
    "good_code": "sudo xattr -cr /Applications/TargetApp.app",
    "verification": "Run <code>xattr -l /Applications/TargetApp.app</code> to ensure <code>com.apple.quarantine</code> is absent, then launch the application normally.",
    "date": "2026-11-16",
    "id": 1794817844,
    "type": "error"
});