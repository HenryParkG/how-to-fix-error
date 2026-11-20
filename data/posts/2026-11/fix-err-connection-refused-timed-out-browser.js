window.onPostDataLoaded({
    "title": "Fix ERR_CONNECTION_REFUSED/TIMED_OUT in Chrome/Edge",
    "slug": "fix-err-connection-refused-timed-out-browser",
    "language": "Browser, Network",
    "code": "ERR_CONNECTION_REFUSED",
    "tags": [
        "Browser",
        "Network",
        "Windows",
        "macOS",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>The errors <code>ERR_CONNECTION_REFUSED</code> and <code>ERR_CONNECTION_TIMED_OUT</code> indicate that your browser (Chrome, Edge, etc.) was unable to establish a connection with the website's server. <code>REFUSED</code> often means the server actively denied the connection, while <code>TIMED_OUT</code> suggests the server didn't respond at all within a set timeframe. This can prevent you from accessing websites and is a common browser/network issue.</p>",
    "root_cause": "Common root causes include the target server being offline, incorrect URL, local firewall/antivirus blocking the connection, misconfigured proxy settings, DNS resolution issues, or browser cache corruption.",
    "bad_code": "<code>ERR_CONNECTION_REFUSED</code> or <code>ERR_CONNECTION_TIMED_OUT</code> displayed in your web browser when trying to access a website.",
    "solution_desc": "<p>Follow these steps to diagnose and resolve connection errors:</p><ol><li><strong>Check the URL:</strong> Ensure the web address is correct.</li><li><strong>Restart Router/Modem:</strong> Power cycle your network hardware.</li><li><strong>Clear Browser Cache & Cookies:</strong> Navigate to your browser's settings and clear browsing data for 'All time'.</li><li><strong>Temporarily Disable Firewall/Antivirus:</strong> Your security software might be blocking the connection. Test by temporarily disabling it.</li><li><strong>Check Proxy Settings:</strong><br/><ul><li><strong>Windows:</strong> Go to <code>Settings > Network & Internet > Proxy</code> and ensure 'Automatically detect settings' is on, or 'Use a proxy server' is off unless you explicitly need one.</li><li><strong>macOS:</strong> Go to <code>System Settings > Network > (Your Network Service) > Details... > Proxies</code>.</li></ul></li><li><strong>Flush DNS Cache:</strong> Open a command prompt or terminal and run the appropriate command:<br/><ul><li><strong>Windows (CMD):</strong> <code>ipconfig /flushdns</code></li><li><strong>macOS/Linux (Terminal):</strong> <code>sudo killall -HUP mDNSResponder</code> (macOS) or <code>sudo systemctl restart NetworkManager</code> (Linux)</li></ul></li><li><strong>Reset Network Settings (Windows):</strong> Open CMD as administrator and run:<br/><code>netsh winsock reset</code><br/><code>netsh int ip reset</code><br/>Then restart your computer.</li><li><strong>Change DNS Server:</strong> Consider temporarily using a public DNS like Google DNS (8.8.8.8 and 8.8.4.4) or Cloudflare DNS (1.1.1.1 and 1.0.0.1).</li></ol>",
    "good_code": "To flush DNS on Windows CMD:\n<code>ipconfig /flushdns</code>\n\nTo reset network on Windows CMD (admin):\n<code>netsh winsock reset</code>\n<code>netsh int ip reset</code>\n\nBrowser path to clear cache (e.g., Chrome):\n<code>Settings > Privacy and security > Clear browsing data</code>",
    "verification": "<p>After attempting the solutions, try reloading the webpage that previously displayed the error. If the page loads successfully, the connection issue is resolved. You can also try accessing other websites to confirm general internet connectivity.</p>",
    "date": "2026-11-20",
    "id": 1795187001,
    "type": "error"
});