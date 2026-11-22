window.onPostDataLoaded({
    "title": "Kill Process on Port (8080, 3000) in Windows CMD & PowerShell",
    "slug": "kill-process-port-windows-cmd-powershell",
    "language": "Windows",
    "code": "EADDRINUSE",
    "tags": [
        "Windows",
        "CMD",
        "PowerShell",
        "Network",
        "Error Fix"
    ],
    "analysis": "<p>When you try to start a web server or application, it might fail with an error like <code>Address already in use</code>, <code>Port 8080 is already in use</code>, or similar messages. This happens because another program is currently listening on the specific network port that your new application needs to use. Until that occupying process is terminated, your new application cannot bind to the port.</p>",
    "root_cause": "A process (program) on your system is actively bound to the desired network port (e.g., <code>8080</code> or <code>3000</code>), preventing other applications from using it. This often occurs due to a previous application instance not shutting down correctly, or another service running on the same port.",
    "bad_code": "<code>Error: listen EADDRINUSE: address already in use :::8080</code> or <code>Port 3000 is already in use.</code>",
    "solution_desc": "<p>To resolve this, you need to identify which process is using the port and then terminate it. This involves using Windows Command Prompt (CMD) or PowerShell to first find the Process ID (PID) associated with the port, and then using that PID to kill the process. You'll use <code>netstat -ano</code> to list active connections and PIDs, and <code>taskkill</code> or <code>Stop-Process</code> to terminate the process.</p>",
    "good_code": "# --- Using CMD (Command Prompt) ---\n\n# 1. Find the PID for the port (e.g., 8080 or 3000)\n# Replace :8080 with the specific port your application needs\nnetstat -ano | findstr :8080\n\n# Look for a line with 'LISTENING' state. The last number on that line is the PID.\n# Example output:  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       1234\n# In this example, 1234 is the PID.\n\n# 2. (Optional) Identify the process name using the PID\n# Replace 1234 with the PID you found\ntasklist /fi \"PID eq 1234\"\n\n# 3. Kill the process\n# Replace 1234 with the PID you found. The /F flag forces termination.\ntaskkill /PID 1234 /F\n\n# --- Using PowerShell ---\n\n# 1. Find and kill the process using a specific port (e.g., 3000) in one command\n# Replace -LocalPort 3000 with the specific port\nGet-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n\n# Alternatively, for more granular steps:\n\n# 2. a. Find the PID for a specific port (e.g., 8080)\n# Replace -LocalPort 8080 with the specific port\n(Get-NetTCPConnection -LocalPort 8080).OwningProcess\n# This command will output just the PID, e.g., 1234\n\n# 2. b. Kill the process using the PID\n# Replace 1234 with the PID you found. -Force ensures termination.\nStop-Process -Id 1234 -Force",
    "verification": "<p>After executing the <code>taskkill</code> or <code>Stop-Process</code> command, try starting your application again. It should now be able to bind to the port successfully. You can also re-run <code>netstat -ano | findstr :[PORT_NUMBER]</code> (e.g., <code>netstat -ano | findstr :8080</code>) to confirm that the port is no longer in a <code>LISTENING</code> state.</p>",
    "date": "2026-11-22",
    "id": 1795355852,
    "type": "error"
});