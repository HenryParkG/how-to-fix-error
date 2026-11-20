window.onPostDataLoaded({
    "title": "Fix macOS \"Developer Cannot Be Verified\" Gatekeeper Alert",
    "slug": "macos-developer-cannot-be-verified-gatekeeper-bypass",
    "language": "macOS",
    "code": "OSX_GATEKEEPER_BLOCKED",
    "tags": [
        "macOS",
        "Error Fix"
    ],
    "analysis": "<p>When launching newly downloaded third-party applications or command-line binaries on macOS, users are frequently blocked by a modal dialog stating that the app <code>\"cannot be opened because the developer cannot be verified\"</code> or <code>\"is damaged and can\u2019t be opened\"</code>. This occurs because macOS quarantine mechanisms flag files downloaded from web browsers or untrusted networks.</p>",
    "root_cause": "macOS attaches the <code>com.apple.quarantine</code> extended attribute to all files downloaded via network clients. Apple Gatekeeper evaluates this attribute alongside code signatures and notarization records; if the binary lacks notarization from an Apple-registered developer, execution is terminated.",
    "bad_code": "\"ExampleApp.app\" cannot be opened because the developer cannot be verified.\nmacOS cannot verify that this app is free from malware.",
    "solution_desc": "<p>To bypass Gatekeeper safely for a verified, trusted application without globally disabling macOS system security, remove the quarantine extended attribute directly from the application bundle using <code>xattr</code>, or grant an ad-hoc override via Finder / System Settings.</p><ol><li>Open <code>Terminal.app</code>.</li><li>Strip the quarantine flag using <code>xattr -d com.apple.quarantine /path/to/App.app</code>.</li><li>Alternatively, control-click (right-click) the application in Finder, select <code>Open</code>, and confirm the prompt to permanently whitelist the binary in the local Gatekeeper database.</li></ol>",
    "good_code": "# Method 1: Remove quarantine attribute directly\nxattr -d com.apple.quarantine /Applications/TargetApp.app\n\n# Method 2: Strip quarantine recursively from all binaries inside a bundle or directory\nxattr -rd com.apple.quarantine /Applications/TargetApp.app\n\n# Method 3: Finder override\n# Control-click the app icon -> Click 'Open' -> Click 'Open' in the confirmation prompt",
    "verification": "Run <code>xattr /Applications/TargetApp.app</code> to confirm that <code>com.apple.quarantine</code> is no longer listed. Launch the application; it will start immediately without triggering Gatekeeper blocking alerts.",
    "date": "2026-11-20",
    "id": 1795150490,
    "type": "error"
});