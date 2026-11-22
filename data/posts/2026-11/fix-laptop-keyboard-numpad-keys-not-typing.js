window.onPostDataLoaded({
    "title": "Fix Laptop Keyboard Numpad or Keys Not Typing on Windows",
    "slug": "fix-laptop-keyboard-numpad-keys-not-typing",
    "language": "Windows",
    "code": "KEYBOARD_INPUT_HALT",
    "tags": [
        "Windows",
        "Hardware",
        "Error Fix"
    ],
    "analysis": "<p>On laptop keyboards, the integrated numeric keypad or specific keys suddenly stop entering numbers or characters. In many cases, the numpad acts as navigation arrows (Page Up, End, Down), or keystrokes are entirely ignored unless held down for several seconds.</p>",
    "root_cause": "The primary causes are an inactive <code>NumLock</code> mode (causing numeric keys to behave as directional navigation), the Windows accessibility feature <code>Filter Keys</code> actively ignoring rapid keystrokes, or a corrupted keyboard device driver.",
    "bad_code": "# Pressing keypad '8', '2', '4', '6' moves the cursor instead of typing digits\n# Or keypresses fail to produce any character in text inputs",
    "solution_desc": "<p>First, toggle <code>NumLock</code> using the hardware key or function combination. Second, ensure Windows <code>Filter Keys</code> is turned off. Finally, uninstall and reinstall the standard keyboard driver using Device Manager.</p>",
    "good_code": "# Step 1: Toggle NumLock\n# Press the 'NumLk' key, or 'Fn + NumLk' depending on laptop manufacturer.\n\n# Step 2: Disable Filter Keys via Settings or PowerShell\n# Settings > Accessibility > Keyboard > Toggle 'Filter Keys' to OFF\nSet-ItemProperty -Path \"HKCU:\\Control Panel\\Accessibility\\Keyboard Response\" -Name \"Flags\" -Value 122\n\n# Step 3: Reinstall Keyboard Driver\n# Run devmgmt.msc > Expand 'Keyboards' > Right-click device > 'Uninstall device' > Restart Windows",
    "verification": "<p>Open Notepad and type numbers <code>0</code> through <code>9</code> using the numeric keypad. Verify that digits appear immediately on screen rather than moving the text caret or pausing.</p>",
    "date": "2026-11-22",
    "id": 1795320677,
    "type": "error"
});