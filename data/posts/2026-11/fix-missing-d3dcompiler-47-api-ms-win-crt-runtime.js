window.onPostDataLoaded({
    "title": "Fix Missing d3dcompiler_47.dll or api-ms-win-crt-runtime",
    "slug": "fix-missing-d3dcompiler-47-api-ms-win-crt-runtime",
    "language": "Windows",
    "code": "ERR_MOD_NOT_FOUND_DLL",
    "tags": [
        "Windows",
        "Gaming",
        "Error Fix"
    ],
    "analysis": "<p>Launching modern applications, games, Python distributions, or Adobe products on Windows produces a critical startup failure indicating that <code>api-ms-win-crt-runtime-l1-1-0.dll</code> or <code>d3dcompiler_47.dll</code> was not found on the system.</p>",
    "root_cause": "These dynamic link libraries belong to the Universal C Runtime (CRT) and DirectX HLSL Compiler. The system either lacks the Microsoft Visual C++ Redistributable packages or has an outdated Windows installation missing update KB2999226.",
    "bad_code": "The code execution cannot proceed because api-ms-win-crt-runtime-l1-1-0.dll was not found.\nThe program can't start because d3dcompiler_47.dll is missing from your computer.",
    "solution_desc": "<p>Install both the x86 and x64 architectures of the Visual C++ 2015-2022 Redistributable runtimes, apply pending Windows updates, and run the System File Checker to repair damaged OS libraries.</p>",
    "good_code": "# Install Visual C++ Redistributable (both architectures) via winget\nwinget install Microsoft.VCRedist.2015+.x64 --silent\nwinget install Microsoft.VCRedist.2015+.x86 --silent\n\n# Run System File Checker in an elevated Command Prompt or PowerShell\nsfc /scannow\n\n# Optional: Run DISM cleanup to restore component store integrity\nDISM /Online /Cleanup-Image /RestoreHealth",
    "verification": "<p>Run <code>where d3dcompiler_47.dll</code> in Command Prompt to confirm the library exists under <code>C:\\Windows\\System32</code>, then relaunch the application to verify it initializes cleanly without DLL alerts.</p>",
    "date": "2026-11-22",
    "id": 1795320678,
    "type": "error"
});