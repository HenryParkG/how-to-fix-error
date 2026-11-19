window.onPostDataLoaded({
    "title": "Fix: Keyboard Arrows Swapped with WASD on Windows",
    "slug": "fix-keyboard-arrows-wasd-swap-windows",
    "language": "Windows",
    "code": "WASD_SWAP",
    "tags": [
        "Windows",
        "Hardware",
        "Gaming",
        "Error Fix"
    ],
    "analysis": "<p>Users, especially on gaming or multimedia-focused laptops, sometimes encounter a situation where their keyboard's arrow keys perform the functions of the <code>WASD</code> keys, and vice-versa. This can be very disorienting and disruptive, particularly during gaming or text editing.</p><p>This symptom is not an error in the traditional software sense but rather a toggled keyboard mode.</p>",
    "root_cause": "This issue is almost always caused by an accidental press of a specific function key combination, usually <code>Fn + W</code>, which toggles a hardware-level keyboard mode. This feature is often built into the keyboard firmware of many laptop brands (e.g., Lenovo, ASUS, HP, Dell) to cater to different user preferences, particularly gamers who might prefer arrow keys for movement in some titles or applications.",
    "bad_code": "When pressing the physical Arrow Up key, the input registered is 'W'. When pressing the physical 'W' key, the input registered is 'Arrow Up'. The same applies to Down/S, Left/A, and Right/D.",
    "solution_desc": "<p>The fix for this problem is typically straightforward: simply press the same key combination that likely activated the mode in the first place.</p><ol><li>Locate the <code>Fn</code> key on your keyboard (usually near the bottom-left, next to <code>Ctrl</code> or <code>Windows</code> key).</li><li>Locate the <code>W</code> key.</li><li>Press and hold the <code>Fn</code> key, then press the <code>W</code> key once.</li><li>Release both keys. This action should toggle the keyboard mode back to its default state.</li></ol>",
    "good_code": "Press <code>Fn + W</code> simultaneously.",
    "verification": "After performing the steps, open a text editor (like Notepad) or any application/game. Press the arrow keys and the <code>WASD</code> keys individually to confirm they are registering their correct, intended inputs.",
    "date": "2026-11-19",
    "id": 1795064670,
    "type": "error"
});