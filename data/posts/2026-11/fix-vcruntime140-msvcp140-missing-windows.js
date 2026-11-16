window.onPostDataLoaded({
    "title": "Fix VCRUNTIME140.dll and MSVCP140.dll Not Found in Windows",
    "slug": "fix-vcruntime140-msvcp140-missing-windows",
    "language": "Windows",
    "code": "STATUS_DLL_NOT_FOUND",
    "tags": [
        "Windows",
        "Gaming",
        "CMD",
        "Error Fix"
    ],
    "analysis": "<p>When launching applications, games, or developer tools such as Python or PHP on Windows, a system error dialog appears stating <code>The code execution cannot proceed because VCRUNTIME140.dll was not found</code> or <code>MSVCP140.dll was not found</code>.</p><p>This occurs when an executable compiled with Microsoft Visual C++ cannot locate the required dynamic-link libraries (DLLs) in the system path or local directory.</p>",
    "root_cause": "Missing, mismatched architecture (x86 vs x64), or corrupted installation of the Microsoft Visual C++ 2015-2022 Redistributable packages containing <code>VCRUNTIME140.dll</code> and <code>MSVCP140.dll</code>.",
    "bad_code": "System Error: The code execution cannot proceed because VCRUNTIME140.dll was not found. Reinstalling the program may fix this problem.",
    "solution_desc": "<p>Install both the x86 (32-bit) and x64 (64-bit) versions of the official Microsoft Visual C++ 2015-2022 Redistributable. Many 64-bit Windows installations run 32-bit applications that require the 32-bit DLLs.</p><p>Alternatively, install them directly via <code>winget</code> in an elevated terminal.</p>",
    "good_code": "winget install --id Microsoft.VCRedist.2015+.x64 -e\nwinget install --id Microsoft.VCRedist.2015+.x86 -e",
    "verification": "Check that <code>C:\\Windows\\System32\\vcruntime140.dll</code> and <code>C:\\Windows\\SysWOW64\\vcruntime140.dll</code> exist, then relaunch the application to confirm it starts without DLL alerts.",
    "date": "2026-11-16",
    "id": 1794817842,
    "type": "error"
});