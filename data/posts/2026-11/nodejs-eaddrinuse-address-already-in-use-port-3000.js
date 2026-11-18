window.onPostDataLoaded({
    "title": "Node.js EADDRINUSE: Address Already in Use (Port 3000)",
    "slug": "nodejs-eaddrinuse-address-already-in-use-port-3000",
    "language": "Node.js",
    "code": "EADDRINUSE",
    "tags": [
        "Node.js",
        "Windows",
        "macOS",
        "Linux",
        "CMD",
        "PowerShell",
        "Network",
        "Error Fix"
    ],
    "analysis": "<p>This error, <code>Error: listen EADDRINUSE: address already in use :::3000</code>, indicates that the port your Node.js application is trying to listen on (in this case, port 3000) is already occupied by another process. This commonly happens if your Node.js application crashed previously, or if another instance of it (or another service entirely) is still running in the background, holding onto that port.</p>",
    "root_cause": "Another process is actively listening on the target port (<code>3000</code>), preventing your Node.js application from binding to it.",
    "bad_code": "Error: listen EADDRINUSE: address already in use :::3000",
    "solution_desc": "<p>To fix this, you need to identify the process currently using port 3000 and terminate it. Alternatively, you can configure your Node.js application to use a different port.</p><p><b>Step 1: Identify the process using port 3000</b></p><p><b>On Windows:</b></p><p>1. Open Command Prompt or PowerShell as an administrator.</p><p>2. Run the following command to find the process ID (PID) using port 3000:</p><code>netstat -ano | findstr :3000</code><p>Look for a line showing <code>LISTENING</code> status for port 3000. The last column will be the PID.</p><p><b>On Mac/Linux:</b></p><p>1. Open your terminal.</p><p>2. Run the following command:</p><code>lsof -i :3000</code><p>This will list processes using port 3000. The second column is the PID.</p><p><b>Step 2: Terminate the identified process</b></p><p><b>On Windows:</b></p><p>Once you have the PID, use the <code>taskkill</code> command (replace <code>[PID]</code> with the actual PID):</p><code>taskkill /PID [PID] /F</code><p>The <code>/F</code> flag forcefully terminates the process.</p><p><b>On Mac/Linux:</b></p><p>Once you have the PID, use the <code>kill</code> command (replace <code>[PID]</code> with the actual PID):</p><code>kill -9 [PID]</code><p>The <code>-9</code> flag ensures a forceful termination.</p><p><b>Alternative: Change your Node.js application's port</b></p><p>If terminating the process is not an option or you prefer to use a different port, modify your Node.js application's code to listen on an available port (e.g., 3001, 8080).</p>",
    "good_code": "Windows (Find PID):\n<code>netstat -ano | findstr :3000</code>\n\nWindows (Kill Process):\n<code>taskkill /PID [PID] /F</code>\n\nMac/Linux (Find PID):\n<code>lsof -i :3000</code>\n\nMac/Linux (Kill Process):\n<code>kill -9 [PID]</code>\n\nExample Node.js port change:\n<pre><code>const express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 3001; // Change to 3001 or another available port\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});</code></pre>",
    "verification": "<p>After terminating the problematic process or changing your application's port, restart your Node.js application. It should now start without the <code>EADDRINUSE</code> error. You can verify by checking the console output for a successful server start message.</p>",
    "date": "2026-11-18",
    "id": 1795013770,
    "type": "error"
});