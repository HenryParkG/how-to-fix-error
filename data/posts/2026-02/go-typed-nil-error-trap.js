window.onPostDataLoaded({
    "title": "The Typed Nil Trap: Why if err != nil Returns True",
    "slug": "go-typed-nil-error-trap",
    "language": "Go",
    "code": "TypedNilInterface",
    "tags": [
        "go",
        "golang",
        "interfaces",
        "error-handling",
        "Error Fix"
    ],
    "analysis": "<p>In Go, an interface is implemented as a two-word structure containing a pointer to type information and a pointer to the actual data. This is often referred to as a (type, value) tuple. An interface value is strictly nil only if both its type and its value are nil.</p><p>The 'Typed Nil' trap occurs when a concrete pointer that is nil is assigned to an interface variable (like the built-in error type). Because the interface now holds type information (e.g., *MyCustomError), the interface itself is no longer nil, even if the underlying data pointer is. Consequently, a check like <code>if err != nil</code> evaluates to true, leading to bugs where the program attempts to handle an error that doesn't exist.</p>",
    "root_cause": "An interface value is non-nil if it contains type information, even if the value pointer it holds is nil.",
    "bad_code": "type MyError struct{}\nfunc (e *MyError) Error() string { return \"fail\" }\n\nfunc returnsError() *MyError {\n    return nil\n}\n\nfunc main() {\n    var err error = returnsError()\n    if err != nil {\n        // This executes because err is (*MyError, nil), not (nil, nil)\n        panic(\"Expected nil but got typed nil\")\n    }\n}",
    "solution_desc": "To avoid this, functions should explicitly return the 'error' interface type rather than a concrete pointer type. Additionally, always return the literal 'nil' instead of a variable that happens to be a nil pointer.",
    "good_code": "type MyError struct{}\nfunc (e *MyError) Error() string { return \"fail\" }\n\n// Return the 'error' interface directly\nfunc returnsError() error {\n    var err *MyError = nil\n    if err == nil {\n        return nil // Return literal nil to ensure (nil, nil)\n    }\n    return err\n}\n\nfunc main() {\n    err := returnsError()\n    if err != nil {\n        fmt.Println(\"Actual error occurred\")\n    } else {\n        fmt.Println(\"Success: err is truly nil\")\n    }\n}",
    "verification": "Use a linter like 'nilness' or 'staticcheck' to detect suspicious nil pointer to interface conversions, and ensure unit tests verify that successful paths return a literal nil.",
    "date": "2026-02-11",
    "id": 1770773652
});