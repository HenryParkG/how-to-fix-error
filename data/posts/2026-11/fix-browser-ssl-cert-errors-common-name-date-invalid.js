window.onPostDataLoaded({
    "title": "Fix Browser ERR_CERT_COMMON_NAME_INVALID / DATE_INVALID SSL Errors",
    "slug": "fix-browser-ssl-cert-errors-common-name-date-invalid",
    "language": "Browser",
    "code": "ERR_CERT_COMMON_NAME_INVALID, NET::ERR_CERT_DATE_INVALID",
    "tags": [
        "Browser",
        "Network",
        "Windows",
        "macOS",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>When attempting to access a website, your browser displays a warning indicating that the connection is not private or secure. You might see specific error codes like <code>ERR_CERT_COMMON_NAME_INVALID</code> or <code>NET::ERR_CERT_DATE_INVALID</code>. This prevents you from loading the website content, often accompanied by a red 'Not Secure' warning in the address bar.</p><p>These errors typically occur because the browser cannot verify the website's SSL certificate. This could be due to a mismatch between the certificate's registered domain name (Common Name) and the actual website URL you are visiting, or because the certificate has expired or its validity period does not match your system's date and time.</p>",
    "root_cause": "The root cause is an invalid SSL/TLS certificate. <code>ERR_CERT_COMMON_NAME_INVALID</code> indicates a domain name mismatch (the certificate is issued for a different domain than the one accessed). <code>NET::ERR_CERT_DATE_INVALID</code> means the certificate's validity period (start and end dates) does not encompass the current system date, often caused by an incorrect local system clock or an expired server certificate.",
    "bad_code": "<code>NET::ERR_CERT_DATE_INVALID</code>\n<code>ERR_CERT_COMMON_NAME_INVALID</code>\n<code>Your connection is not private</code>",
    "solution_desc": "To fix these browser SSL certificate errors, follow these steps systematically:\n<ol>\n  <li><b>Check and Correct System Date & Time:</b> An incorrect system clock is a common cause for <code>NET::ERR_CERT_DATE_INVALID</code>. Ensure your operating system's date and time are set correctly and synchronized automatically.\n    <ul>\n      <li><b>Windows:</b> Go to <code>Settings > Time & Language > Date & Time</code>. Toggle 'Set time automatically' and 'Set time zone automatically' on.</li>\n      <li><b>macOS:</b> Go to <code>System Settings > General > Date & Time</code>. Toggle 'Set time and date automatically' on.</li>\n      <li><b>Linux:</b> Use your distribution's date/time settings or command line tools like <code>timedatectl set-ntp true</code>.</li>\n    </ul>\n  </li>\n  <li><b>Clear Browser Cache and Cookies:</b> Sometimes outdated cached data can interfere. Clear your browser's cache, cookies, and site data.\n    <ul>\n      <li><b>Chrome:</b> <code>Settings > Privacy and security > Clear browsing data</code>. Select 'Cached images and files' and 'Cookies and other site data'.</li>\n      <li><b>Firefox:</b> <code>Settings > Privacy & Security > Cookies and Site Data > Clear Data...</code></li>\n    </ul>\n  </li>\n  <li><b>Disable VPN/Proxy (Temporarily):</b> If you are using a VPN or proxy server, temporarily disable it and try accessing the website again. These services can sometimes interfere with SSL certificate validation.</li>\n  <li><b>Check Antivirus/Firewall SSL Inspection:</b> Some security software performs SSL inspection, which can cause certificate errors. Look for a setting related to 'HTTPS scanning' or 'SSL inspection' in your antivirus/firewall and temporarily disable it.</li>\n  <li><b>Update Browser:</b> Ensure your browser is up to date. Outdated browsers might have issues with newer SSL certificates or security protocols.</li>\n  <li><b>Contact Website Administrator (If all else fails):</b> If the issue persists across multiple browsers and devices, the problem might be with the website's server-side SSL certificate configuration. Consider contacting the website administrator.</li>\n</ol>",
    "good_code": "Windows: `Settings > Time & Language > Date & Time`\nmacOS: `System Settings > General > Date & Time`\nChrome: `Settings > Privacy and security > Clear browsing data`\n`timedatectl set-ntp true` (Linux)",
    "verification": "After applying the fixes, refresh the website. If the error is resolved, the website should load correctly, and you should see a padlock icon (indicating a secure connection) in the browser's address bar. You can click on the padlock icon to inspect the certificate details and confirm its validity and common name.",
    "bad_code_example": null,
    "good_code_example": null,
    "date": "2026-11-24",
    "id": 1795506517,
    "type": "error"
});