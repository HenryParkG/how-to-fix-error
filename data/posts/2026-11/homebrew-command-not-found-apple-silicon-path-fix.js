window.onPostDataLoaded({
    "title": "Homebrew 'command not found: brew' on Apple Silicon macOS",
    "slug": "homebrew-command-not-found-apple-silicon-path-fix",
    "language": "macOS",
    "code": "ERR_CMD_NOT_FOUND",
    "tags": [
        "macOS",
        "CLI",
        "Error Fix"
    ],
    "analysis": "<p>When using an Apple Silicon Mac, you might encounter the error <code>zsh: command not found: brew</code> even after you believe you've installed Homebrew. This issue specifically arises because Homebrew installs to <code>/opt/homebrew</code> on Apple Silicon architectures (ARM64), which is different from the traditional <code>/usr/local</code> path on Intel Macs. By default, your shell's <code>PATH</code> environment variable might not include this new directory, preventing your system from locating the <code>brew</code> command.</p>",
    "root_cause": "The <code>/opt/homebrew/bin</code> directory, where the <code>brew</code> executable resides on Apple Silicon, is not included in the shell's <code>PATH</code> environment variable, typically configured in <code>~/.zshrc</code>.",
    "bad_code": "<code>brew install git\nzsh: command not found: brew</code>",
    "solution_desc": "<p>To resolve this, you need to add the Homebrew installation path to your shell's <code>PATH</code> environment variable. Since <code>zsh</code> is the default shell on modern macOS, you'll modify your <code>.zshrc</code> file.</p><p>1. Open your <code>.zshrc</code> file in a text editor (e.g., Nano or VS Code):</p><p>2. Add the following line to the end of the file:</p><p>3. Save the file and exit the text editor.</p><p>4. Apply the changes by sourcing your <code>.zshrc</code> file or opening a new terminal window:</p>",
    "good_code": "<code>nano ~/.zshrc</code>\n<code>export PATH=\"/opt/homebrew/bin:$PATH\"</code>\n<code>source ~/.zshrc</code>",
    "verification": "<p>After applying the fix, verify Homebrew is accessible by running:</p><p>You should see Homebrew's help message. You can also check the path:</p><p>This should output <code>/opt/homebrew/bin/brew</code>.</p>",
    "date": "2026-11-23",
    "id": 1795409311,
    "type": "error"
});