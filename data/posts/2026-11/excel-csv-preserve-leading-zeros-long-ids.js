window.onPostDataLoaded({
    "title": "Excel CSV: Preserve Leading Zeros & Long IDs",
    "slug": "excel-csv-preserve-leading-zeros-long-ids",
    "language": "Office",
    "code": "Data Corruption, Scientific Notation",
    "tags": [
        "Office",
        "Windows",
        "macOS",
        "Error Fix"
    ],
    "analysis": "<p>When opening a CSV file directly in Excel, it often misinterprets data, leading to two common problems: <code>leading zeros are removed</code> from numbers (e.g., <code>00123</code> becomes <code>123</code>) and <code>long numerical IDs are converted to scientific notation</code> (e.g., <code>12345678901234567890</code> becomes <code>1.23E+19</code>). This automatic conversion treats what should be text-based identifiers as standard numbers, causing significant data loss and corruption.</p>",
    "root_cause": "Excel's default behavior is to automatically detect data types when opening a CSV file. It assumes numeric values should be stored as numbers, which strips leading zeros and converts very long numbers into scientific notation, even when they represent identifiers or codes that require their exact string representation.",
    "bad_code": "CSV file content:\n<pre><code>\"ProductID\",\"OrderRef\"\n\"00123\",\"12345678901234567890\"\n\"04567\",\"98765432109876543210\"</code></pre>\n\nOpened in Excel directly becomes:\n<pre><code>123,1.23457E+19\n4567,9.87654E+19</code></pre>",
    "solution_desc": "<p>To prevent Excel from removing leading zeros or converting long numbers, you must import the CSV data and specify the column data types as 'Text' during the import process, rather than simply opening the file.</p><ol><li><strong>Open a new, blank Excel workbook.</strong></li><li><strong>Go to the 'Data' tab</strong> in the Excel ribbon.</li><li><strong>For Excel 2016 and newer (recommended):</strong> Click <code>Get Data > From File > From Text/CSV</code>.</li><li><strong>Browse and select your CSV file.</strong> A preview window will appear.</li><li><strong>Click 'Transform Data'</strong> (or 'Edit' in older versions of Power Query). This opens the Power Query Editor.</li><li><strong>Select the columns</strong> that contain leading zeros or long IDs.</li><li><strong>In the 'Home' tab of Power Query, click 'Data Type:'</strong> (e.g., 'Decimal Number') and change it to <code>Text</code>. Confirm the change.</li><li><strong>Click <code>Close & Load</code></strong> (or <code>Close & Load To...</code> if you want to specify a worksheet).</li><li><strong>For older Excel versions (or alternative method):</strong> Click <code>From Text (Legacy)</code> in the 'Data' tab (you might need to enable it in <code>File > Options > Data</code>).</li><li><strong>Follow the 'Text Import Wizard':</strong><br/><ul><li>Step 1: Choose 'Delimited'.</li><li>Step 2: Choose 'Comma' as the delimiter.</li><li>Step 3: <strong>Crucially, select the columns</strong> that contain leading zeros or long IDs and choose <code>Text</code> as the 'Column data format'. Repeat for all relevant columns.</li></ul></li><li><strong>Click 'Finish'.</strong></li></ol>",
    "good_code": "Using 'Get Data' (Excel 2016+):\n<code>Data > Get Data > From File > From Text/CSV</code>\n\nIn Power Query Editor:\n<code>Select Column(s) > Data Type dropdown > Text</code>\n\nUsing Text Import Wizard (Legacy):\n<code>Data > From Text (Legacy)</code>\n\nIn Step 3 of Wizard:\n<code>Select Column > Column data format: Text</code>",
    "verification": "<p>Once the CSV data is imported into Excel using the specified method, examine the columns that previously had issues. Verify that leading zeros are preserved (e.g., <code>00123</code> is displayed as <code>00123</code>) and long IDs are shown in their full numeric string format, not in scientific notation (e.g., <code>12345678901234567890</code>).</p>",
    "date": "2026-11-20",
    "id": 1795187002,
    "type": "error"
});