window.onPostDataLoaded({
    "title": "Fix No Audio Output Device Is Installed on Windows 10/11",
    "slug": "fix-no-audio-output-device-installed-windows",
    "language": "Windows",
    "code": "AUDIO_NO_DEVICE",
    "tags": [
        "Windows",
        "Hardware",
        "PowerShell",
        "Error Fix"
    ],
    "analysis": "<p>A red 'X' badge appears over the speaker icon on the taskbar with the tooltip <code>No Audio Output Device Is Installed</code>. Audio stops completely across all system apps and web browsers.</p><p>This typically occurs after Windows Update overrides the OEM sound driver with a generic or incompatible driver, or when the Windows Audio service crashes and fails to recover.</p>",
    "root_cause": "Corrupted or disabled sound controller driver under <code>Device Manager > Sound, video and game controllers</code>, or stopped dependencies in <code>Audiosrv</code> and <code>AudioEndpointBuilder</code> services.",
    "bad_code": "No Audio Output Device Is Installed (Red X icon on Windows taskbar)",
    "solution_desc": "<p>First, restart the audio services via PowerShell. If sound is still not restored, open <code>Device Manager</code>, uninstall the generic high-definition audio device or Intel/Realtek audio device, and trigger a hardware scan to reinstall the correct driver.</p>",
    "good_code": "# Run in PowerShell as Administrator to restart audio services\nRestart-Service -Name \"Audiosrv\" -Force\nRestart-Service -Name \"AudioEndpointBuilder\" -Force\n\n# Open Device Manager to update or rollback audio drivers\ndevmgmt.msc",
    "verification": "Check that the taskbar speaker icon no longer displays a red cross and run <code>Get-Service Audiosrv</code> in PowerShell to confirm the status is <code>Running</code>.",
    "date": "2026-11-16",
    "id": 1794817843,
    "type": "error"
});