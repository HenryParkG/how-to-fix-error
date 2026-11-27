window.onPostDataLoaded({
    "title": "Fix macOS xcrun: error: invalid active developer path",
    "slug": "fix-macos-xcrun-error-invalid-active-developer-path",
    "language": "macOS",
    "code": "XCRUN_INVALID_PATH",
    "tags": [
        "macOS",
        "Git",
        "Error Fix"
    ],
    "analysis": "<p>After updating macOS (such as moving to a new point release or major version), running command-line developer tools like <code>git</code>, <code>clang</code>, <code>brew</code>, or <code>python3</code> fails with <code>xcrun: error: invalid active developer path</code>. This happens because OS updates frequently invalidate or remove the symlinked directory pointing to the Xcode Command Line Tools.</p>",
    "root_cause": "The directory <code>/Library/Developer/CommandLineTools</code> is either missing, pointing to a deprecated SDK version, or detached from <code>xcode-select</code> active path pointers following an OS migration.",
    "bad_code": "xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun",
    "solution_desc": "<p>Reinstall the standalone Xcode Command Line Tools and reset the active developer directory path:</p><ol><li>Open Terminal.</li><li>Execute <code>xcode-select --install</code> to trigger the native macOS installer dialog.</li><li>Click <code>Install</code> and complete the download process.</li><li>If already installed or still reporting invalid path, explicitly reset the pointer with <code>sudo xcode-select --reset</code>.</li></ol>",
    "good_code": "xcode-select --install\n\n# If path issues persist after installation:\nsudo xcode-select --reset",
    "verification": "<p>Run <code>xcode-select -p</code> to confirm the active path returns <code>/Library/Developer/CommandLineTools</code> or <code>/Applications/Xcode.app/Contents/Developer</code>, and verify <code>git --version</code> executes cleanly.</p>",
    "date": "2026-11-27",
    "id": 1795758921,
    "type": "error"
});