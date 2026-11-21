window.onPostDataLoaded({
    "title": "Python UnicodeDecodeError on Windows File Read",
    "slug": "python-unicodedecodeerror-cp949-windows-file-read",
    "language": "Python",
    "code": "UnicodeDecodeError",
    "tags": [
        "Python",
        "Windows",
        "Error Fix"
    ],
    "analysis": "<p>This error occurs when Python attempts to read a text file on Windows, but the default encoding used by Python (often <code>cp949</code> or another regional ANSI encoding on non-UTF-8 configured systems) does not match the actual encoding of the file, which is frequently <code>UTF-8</code>.</p><p>The Python interpreter tries to interpret bytes from the file using the specified (or default) codec, and when it encounters a byte sequence that isn't valid in that codec, it raises a <code>UnicodeDecodeError</code>.</p>",
    "root_cause": "The root cause is a mismatch between the default system/Python file encoding (e.g., <code>cp949</code>) and the actual encoding of the file being read (most commonly <code>UTF-8</code> for modern text files).",
    "bad_code": "Consider a simple Python script attempting to read a file <code>example.txt</code> that contains non-ASCII characters, without specifying an encoding:<pre><code># example.py\nwith open('example.txt', 'r') as f:\n    content = f.read()\nprint(content)</code></pre>When executed, if <code>example.txt</code> has characters like '\u00e9' or '\u4f60\u597d' and is saved as UTF-8, it might produce:<pre><code>UnicodeDecodeError: 'cp949' codec can't decode byte 0xed in position 20: illegal multibyte sequence</code></pre>",
    "solution_desc": "To resolve this, explicitly specify the correct encoding when opening the file. For most modern text files, <code>UTF-8</code> is the standard and recommended encoding. You can also consider setting your system's default encoding to <code>UTF-8</code> (Windows 10/11: 'Beta: Use Unicode UTF-8 for worldwide language support').",
    "good_code": "Modify your Python <code>open()</code> call to include the <code>encoding</code> parameter, typically set to <code>'utf-8'</code>:<pre><code># example.py - Fixed\nwith open('example.txt', 'r', encoding='utf-8') as f:\n    content = f.read()\nprint(content)</code></pre>If you're unsure of the file's encoding, you might need to use a library like <code>chardet</code> to detect it, but <code>utf-8</code> is usually the first thing to try.",
    "verification": "After applying the fix, run your Python script again. The file should now be read successfully, and its content, including any special characters, should be printed or processed correctly without any <code>UnicodeDecodeError</code>.",
    "date": "2026-11-21",
    "id": 1795269878,
    "type": "error"
});