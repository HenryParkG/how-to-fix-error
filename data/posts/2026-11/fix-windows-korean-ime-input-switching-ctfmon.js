window.onPostDataLoaded({
    "title": "Fix Windows 10/11 Korean/English IME Switching Freeze",
    "slug": "fix-windows-korean-ime-input-switching-ctfmon",
    "language": "Windows",
    "code": "IME_FREEZE",
    "tags": [
        "Windows",
        "PowerShell",
        "CMD",
        "Error Fix"
    ],
    "analysis": "<p>Pressing the <code>Right Alt</code> (Hangul/Korean toggle) key fails to toggle between English and Korean input modes in Windows 10 or 11. The language bar displays only <code>A</code> or becomes unresponsive, preventing users from typing Korean characters in applications such as web browsers, Office, or terminal windows.</p>",
    "root_cause": "The Windows Alternative User Input Services process <code>ctfmon.exe</code> has crashed, hung, or failed to start with the user session, or the Microsoft Korean IME input layout configuration has corrupted in the registry.",
    "bad_code": "Pressing [Right Alt] (Hangul) stays locked in English mode 'A', unable to switch to Korean '\uac00'.",
    "solution_desc": "<p>First, terminate any frozen instances of <code>ctfmon.exe</code> and relaunch the process using PowerShell or Command Prompt. If the issue recurs after rebooting, re-register the Korean IME component package via PowerShell and ensure <code>ctfmon.exe</code> is configured to run at startup via the Windows Registry.</p>",
    "good_code": "# 1. Restart ctfmon immediately\nStop-Process -Name \"ctfmon\" -Force -ErrorAction SilentlyContinue\nStart-Process \"C:\\Windows\\System32\\ctfmon.exe\"\n\n# 2. Add ctfmon to user startup registry so it launches on boot\nNew-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"ctfmon\" -Value \"C:\\Windows\\System32\\ctfmon.exe\" -PropertyType String -Force\n\n# 3. Reset Korean Input Method Editor (IME) package\nGet-AppxPackage *InputApp* | Reset-AppxPackage",
    "verification": "<p>Open Notepad and press the <code>Right Alt</code> key (or <code>Win + Space</code> to verify the language cycle). Confirm the indicator switches from <code>A</code> to <code>\uac00</code> and typed text renders as Korean syllables.</p>",
    "date": "2026-11-16",
    "id": 1794803971,
    "type": "error"
});