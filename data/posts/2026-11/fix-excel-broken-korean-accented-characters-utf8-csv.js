window.onPostDataLoaded({
    "title": "Fix Broken Korean & Accented Characters in Excel UTF-8 CSV",
    "slug": "fix-excel-broken-korean-accented-characters-utf8-csv",
    "language": "Office",
    "code": "ENCODING_MOJIBAKE",
    "tags": [
        "Office",
        "Windows",
        "Error Fix"
    ],
    "analysis": "<p>Opening a standard UTF-8 encoded <code>.csv</code> file directly in Microsoft Excel causes non-ASCII characters\u2014such as Korean Hangul, Japanese, Chinese, or accented European glyphs\u2014to appear garbled (mojibake).</p><p>This happens because Excel defaults to the local system ANSI code page when double-clicking CSV files unless an explicit Byte Order Mark (BOM) is detected at the start of the file.</p>",
    "root_cause": "Excel does not default to UTF-8 parsing for double-clicked CSV files; it requires a 3-byte UTF-8 BOM (<code>EF BB BF</code>) or an explicit import using code page <code>65001 : Unicode (UTF-8)</code> via Power Query.",
    "bad_code": "\"ID\",\"Name\",\"Message\"\n1,\"\ubbfc\uc6b0\",\"\uc548\ub155\ud558\uc138\uc694\" -> renders as 1,\"\u00eb\u00af\u00bc\u00ec\u0161\u00b0\",\"\u00ec\u2022\u02c6\u00eb\u2026\u2022\u00ed\u2022\u02dc\u00ec\u201e\u00b8\u00ec\u0161\u201d\"",
    "solution_desc": "<p>You can solve this using either of two approaches: add a UTF-8 BOM to the CSV file programmatically so Excel automatically recognizes it on double-click, or import the file through Excel's Power Query interface specifying <code>65001: Unicode (UTF-8)</code> as the file origin.</p>",
    "good_code": "# Method 1: Add UTF-8 BOM via PowerShell\n$content = Get-Content -Path \"input.csv\" -Raw\n[System.IO.File]::WriteAllText(\"output_with_bom.csv\", $content, [System.Text.Encoding]::UTF8)\n\n# Method 2: Native Excel Power Query Import\n# 1. In Excel, go to the 'Data' tab > 'From Text/CSV'\n# 2. Select the UTF-8 .csv file\n# 3. Set 'File Origin' to: 65001: Unicode (UTF-8)\n# 4. Set 'Delimiter' to Comma\n# 5. Click 'Load'",
    "verification": "Open the converted CSV or imported spreadsheet in Excel. Characters such as Korean text or accented vowels should display legibly without question marks or mojibake symbols.",
    "date": "2026-11-17",
    "id": 1794894573,
    "type": "error"
});