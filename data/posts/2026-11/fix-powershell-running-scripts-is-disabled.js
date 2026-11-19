window.onPostDataLoaded({
    "title": "Fix PowerShell Running Scripts Is Disabled on This System",
    "slug": "fix-powershell-running-scripts-is-disabled",
    "language": "PowerShell",
    "code": "PSSecurityException",
    "tags": [
        "PowerShell",
        "Windows",
        "Error Fix"
    ],
    "analysis": "<p>When attempting to run an unverified script, trigger a script file like <code>activate.ps1</code> for Python virtual environments, or execute custom module loaders, PowerShell halts execution with a <code>PSSecurityException</code> stating that running scripts is disabled on the system.</p>",
    "root_cause": "The default Windows client execution policy for PowerShell is set to <code>Restricted</code>, which blocks all script files from executing to prevent malicious background execution.",
    "bad_code": "File C:\\project\\venv\\Scripts\\Activate.ps1 cannot be loaded because running scripts is disabled on this system.\n    + CategoryInfo          : SecurityError: (:) [], PSSecurityException\n    + FullyQualifiedErrorId : UnauthorizedAccess",
    "solution_desc": "Adjust the execution policy to <code>RemoteSigned</code> using the <code>Set-ExecutionPolicy</code> cmdlet. Setting the scope to <code>CurrentUser</code> allows you to run local scripts and virtual environment hooks without requiring administrative privileges.",
    "good_code": "# Apply to the current user (No Administrator privileges required)\nSet-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\n\n# Or apply system-wide (Run PowerShell as Administrator)\nSet-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force",
    "verification": "Execute <code>Get-ExecutionPolicy -List</code> to confirm that <code>CurrentUser</code> or <code>LocalMachine</code> is set to <code>RemoteSigned</code>, then re-run your <code>.ps1</code> script to ensure it executes without errors.",
    "date": "2026-11-19",
    "id": 1795100462,
    "type": "error"
});