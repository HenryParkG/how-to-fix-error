window.onPostDataLoaded({
    "title": "Docker Desktop: Engine Stopped/Stuck on Starting (WSL Fix)",
    "slug": "docker-desktop-engine-stopped-stuck-wsl-fix",
    "language": "Docker",
    "code": "Docker Engine Stopped",
    "tags": [
        "Docker",
        "Windows",
        "WSL",
        "PowerShell",
        "CMD",
        "Error Fix"
    ],
    "analysis": "<p>When Docker Desktop on Windows displays \"Docker Engine stopped\" or gets stuck on \"Starting the Docker Engine,\" it often indicates an issue with its underlying Windows Subsystem for Linux 2 (WSL2) integration. Docker Desktop relies heavily on WSL2 to run the Docker Engine. If WSL2 instances become corrupted, hung, or are not properly shut down, Docker Desktop cannot initialize its backend services, leading to this stalled state.</p>",
    "root_cause": "A corrupted or hung state of one or more <code>WSL2</code> instances, preventing <code>Docker Desktop</code> from properly starting its embedded <code>Linux VM</code> and <code>Docker Engine</code>.",
    "bad_code": "Docker Desktop displaying \"Docker Engine stopped\" or perpetually \"Starting the Docker Engine\" in its dashboard.",
    "solution_desc": "<p>The most common and effective fix involves shutting down all WSL instances to clear any potential hung states, followed by restarting Docker Desktop.</p><p><b>Step 1: Shut down all WSL instances</b></p><p>This command will terminate any running WSL distributions and reset the WSL state. It does not delete your distributions or data.</p><code>wsl --shutdown</code><p>Open either Command Prompt or PowerShell (standard user is usually fine, but administrator ensures full access) and execute the command above.</p><p><b>Step 2: Restart Docker Desktop</b></p><p>Close the Docker Desktop application completely (right-click the Docker icon in the system tray and select \"Quit Docker Desktop\"). Then, reopen Docker Desktop from your Start Menu or desktop shortcut. It should now attempt to start the Docker Engine cleanly.</p><p><b>Optional: Reset Docker to factory defaults (if issues persist)</b></p><p>If the above steps do not resolve the issue, a more drastic step is to reset Docker Desktop to its factory defaults. This will remove all your Docker containers, images, and volumes, so back up any critical data first.</p><p>1. Open Docker Desktop.</p><p>2. Go to Settings (gear icon).</p><p>3. Navigate to the \"Troubleshoot\" section.</p><p>4. Click \"Reset to factory defaults.\"</p>",
    "good_code": "1. Shut down WSL:\n<code>wsl --shutdown</code>\n\n2. Restart Docker Desktop: \n   - Quit Docker Desktop from system tray.\n   - Launch Docker Desktop from Start Menu.\n\n3. (Optional) Reset to factory defaults:\n   - Docker Desktop Settings -> Troubleshoot -> Reset to factory defaults.",
    "verification": "<p>After performing the steps, open Docker Desktop. The Docker icon in your system tray should turn green, and the dashboard should show \"Docker Desktop is running.\" You can also open a terminal and run <code>docker ps</code>; it should execute without errors, indicating the Docker Engine is operational.</p>",
    "date": "2026-11-18",
    "id": 1795013771,
    "type": "error"
});