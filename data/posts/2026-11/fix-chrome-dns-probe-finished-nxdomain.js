window.onPostDataLoaded({
    "title": "Fix Chrome DNS_PROBE_FINISHED_NXDOMAIN Site Error",
    "slug": "fix-chrome-dns-probe-finished-nxdomain",
    "language": "Network",
    "code": "DNS_PROBE_FINISHED_NXDOMAIN",
    "tags": [
        "Network",
        "Windows",
        "CMD",
        "Error Fix"
    ],
    "analysis": "<p>Google Chrome displays <code>This site can't be reached</code> accompanied by the error code <code>DNS_PROBE_FINISHED_NXDOMAIN</code>. This indicates the browser attempted to resolve the domain name to an IP address, but the DNS resolver returned a Non-Existent Domain (NXDOMAIN) answer, blocking access.</p>",
    "root_cause": "The local DNS client cache contains stale or corrupted records, the local network interface is assigned unresponsive DNS servers, or VPN/proxy virtual adapters are misrouting DNS queries.",
    "bad_code": "This site can't be reached. Check if there is a typo in example.com. DNS_PROBE_FINISHED_NXDOMAIN",
    "solution_desc": "<p>Flush the Windows DNS resolver cache, release and renew IP leases via Command Prompt, and configure reliable public DNS servers such as Cloudflare (<code>1.1.1.1</code>) or Google (<code>8.8.8.8</code>). Also clear Chrome's internal host cache via <code>chrome://net-internals/#dns</code>.</p>",
    "good_code": ":: Run Command Prompt as Administrator\nipconfig /flushdns\nipconfig /registerdns\nipconfig /release\nipconfig /renew\nnetsh winsock reset\n\n:: Set network adapter to use Cloudflare / Google Public DNS (Ethernet example)\nnetsh interface ip set dns name=\"Ethernet\" static 1.1.1.1\nnetsh interface ip add dns name=\"Ethernet\" 8.8.8.8 index=2",
    "verification": "<p>In CMD, run <code>nslookup example.com</code> to verify a valid IP response from your designated resolver. Refresh the webpage in Google Chrome to confirm the site loads properly.</p>",
    "date": "2026-11-16",
    "id": 1794803973,
    "type": "error"
});