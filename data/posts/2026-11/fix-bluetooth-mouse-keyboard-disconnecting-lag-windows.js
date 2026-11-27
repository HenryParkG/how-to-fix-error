window.onPostDataLoaded({
    "title": "Fix Bluetooth Mouse or Keyboard Disconnecting on Windows",
    "slug": "fix-bluetooth-mouse-keyboard-disconnecting-lag-windows",
    "language": "Windows",
    "code": "BT_POWER_MGMT_LAG",
    "tags": [
        "Windows",
        "Hardware",
        "Error Fix"
    ],
    "analysis": "<p>Bluetooth input peripherals such as wireless mice and keyboards frequently drop connections, stutter after a few seconds of idle time, or exhibit heavy input latency. This occurs when Windows places the Bluetooth radio transceiver or USB Bluetooth adapter into an aggressive low-power sleep state to conserve energy.</p>",
    "root_cause": "Windows Power Management enables <code>Allow the computer to turn off this device to save power</code> by default on the host Bluetooth adapter and USB Root Hubs, cutting radio polling during brief idle intervals.",
    "bad_code": "Device Manager -> Bluetooth Adapter -> Power Management -> [X] Allow the computer to turn off this device to save power",
    "solution_desc": "<p>Disable energy-saving power suspension for both the Bluetooth radio and USB root hubs in Device Manager:</p><ol><li>Press <code>Win + X</code> and select <code>Device Manager</code>.</li><li>Expand <code>Bluetooth</code>, right-click your main Bluetooth adapter (e.g., <code>Intel Wireless Bluetooth</code> or <code>Realtek Bluetooth Adapter</code>), and open <code>Properties</code>.</li><li>Navigate to the <code>Power Management</code> tab and uncheck <code>Allow the computer to turn off this device to save power</code>, then click <code>OK</code>.</li><li>Expand <code>Human Interface Devices</code>, locate <code>Bluetooth Low Energy GATT compliant HID device</code>, and uncheck power savings if available.</li><li>Expand <code>Universal Serial Bus controllers</code>, open each <code>USB Root Hub</code>, and disable power saving on the <code>Power Management</code> tab.</li></ol>",
    "good_code": "devmgmt.msc\n-> Bluetooth -> [Your Bluetooth Adapter] -> Properties -> Power Management -> Uncheck 'Allow the computer to turn off this device to save power'\n-> Universal Serial Bus controllers -> USB Root Hub -> Power Management -> Uncheck 'Allow the computer to turn off this device to save power'",
    "verification": "<p>Leave the mouse or keyboard idle for 30 to 60 seconds, then immediately move or type. Verify that there is zero wake-up delay, dropped keystroke, or reconnect chime.</p>",
    "date": "2026-11-27",
    "id": 1795758920,
    "type": "error"
});