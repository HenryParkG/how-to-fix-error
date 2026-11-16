window.onPostDataLoaded({
    "title": "Fix CMD 'not recognized as an internal or external command'",
    "slug": "fix-cmd-command-not-recognized-system-path",
    "language": "CMD",
    "code": "ERR_CMD_NOT_FOUND",
    "tags": [
        "CMD",
        "Windows",
        "PowerShell",
        "Error Fix"
    ],
    "analysis": "<p>When attempting to run an executable or CLI tool (such as <code>node</code>, <code>python</code>, <code>git</code>, or <code>mvn</code>) inside Windows Command Prompt, the console returns an error stating the command is not recognized. This occurs even when the program has been successfully installed on the machine.</p>",
    "root_cause": "The directory containing the target executable is absent from the system or user <code>PATH</code> environment variable, or the current CMD session was opened before the installer updated <code>%PATH%</code>.",
    "bad_code": "'git' is not recognized as an internal or external command, operable program or batch file.",
    "solution_desc": "<p>Locate the binary folder path for your tool, then permanently append it to the User or System <code>Path</code> variable using <code>setx</code> or PowerShell. Restart the terminal session to reload the updated environment block.</p>",
    "good_code": ":: Method A: Add directory to User PATH via CMD (example: Git)\nsetx PATH \"%PATH%;C:\\Program Files\\Git\\cmd\"\n\n:: Method B: Append to System PATH via elevated PowerShell\n[Environment]::SetEnvironmentVariable(\n    \"Path\",\n    [Environment]::GetEnvironmentVariable(\n        \"Path\",\n        [EnvironmentVariableTarget]::Machine\n    ) + \";C:\\Program Files\\Git\\cmd\",\n    [EnvironmentVariableTarget]::Machine\n)\n\n:: Method C: Temporary fix for current CMD session only\nset PATH=%PATH%;C:\\Program Files\\Git\\cmd",
    "verification": "<p>Open a new Command Prompt window and execute <code>where &lt;command_name&gt;</code> (for example, <code>where git</code>). Verify it outputs the full path to the executable and prints the correct version string when run with <code>--version</code>.</p>",
    "date": "2026-11-16",
    "id": 1794803972,
    "type": "error"
});