window.onPostDataLoaded({
    "title": "Fix Bluetooth Headphones Stuck in Muffled Hands-Free Mode",
    "slug": "fix-windows-bluetooth-muffled-hands-free-audio",
    "language": "Windows",
    "code": "BTH_HANDSFREE_STUCK",
    "tags": [
        "Windows",
        "Hardware",
        "Error Fix"
    ],
    "analysis": "<p>Bluetooth headphones connected to Windows often produce low-bitrate, muffled, hollow audio or cut out completely when opening communication apps like Discord, Microsoft Teams, or games using voice chat.</p>",
    "root_cause": "Windows automatically switches the Bluetooth profile from high-fidelity <code>A2DP Stereo</code> to the low-bandwidth bidirectional <code>Hands-Free Telephony (HFP/HSP)</code> profile as soon as an active application requests access to the headset microphone.",
    "bad_code": "Audio cuts out or quality degrades to 8kHz/16kHz mono \"Hands-Free AG Audio\" when joining a voice call or launching games with integrated voice chat.",
    "solution_desc": "Disable the <code>Handsfree Telephony</code> Bluetooth service on the headset device, forcing Windows to keep the device strictly on the high-quality <code>A2DP</code> stereo profile.",
    "good_code": "1. Press Win + R, type: control printers, and press Enter.\n2. Locate your Bluetooth headphones in the \"Devices\" section.\n3. Right-click the headphones and select \"Properties\".\n4. Navigate to the \"Services\" tab.\n5. Uncheck \"Handsfree Telephony\" and click \"Apply\", then \"OK\".\n6. (Alternative) In Settings > System > Sound, set Input to a dedicated external or laptop mic instead of the headset mic.",
    "verification": "Play a test track while joining a voice channel or accessing Windows Sound settings; ensure audio output remains clean stereo without switching to low-quality mono.",
    "date": "2026-11-19",
    "id": 1795100463,
    "type": "error"
});