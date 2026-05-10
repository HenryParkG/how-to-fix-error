window.onPostDataLoaded({
    "title": "Fixing CGo Pointer Aliasing Violations in Go's GC",
    "slug": "fixing-cgo-pointer-aliasing-violations",
    "language": "Go",
    "code": "RuntimeError",
    "tags": [
        "Go",
        "Backend",
        "CGo",
        "Error Fix"
    ],
    "analysis": "<p>When using CGo, developers must adhere to strict pointer passing rules. A common violation occurs when a Go pointer\u2014pointing to Go-managed heap memory\u2014is passed to C and then stored in C memory beyond the duration of the function call. Because the Go Garbage Collector (GC) is moving and concurrent, it cannot track pointers stored in the C heap. When the GC triggers, it may move the Go object or reclaim it, leaving the C code with a dangling pointer or causing the GC to panic when it detects an unexpected pointer aliasing during a stack scan.</p>",
    "root_cause": "Storing a Go-managed pointer in C memory or passing a Go pointer that contains another Go pointer to C code, violating the CGo 'no-sharing' contract.",
    "bad_code": "/*\n#include <stdlib.h>\nvoid* global_ptr;\nvoid store(void* p) { global_ptr = p; }\n*/\nimport \"C\"\nimport \"unsafe\"\n\nfunc leakPointer() {\n    obj := &MyStruct{ID: 1}\n    C.store(unsafe.Pointer(obj)) // GC-managed pointer stored in C global\n}",
    "solution_desc": "Use `runtime/cgo.Handle` to create a safe, opaque reference to the Go object. This prevents the GC from reclaiming the object while the handle is active and provides an integer-based key that can be safely passed to and stored by C code.",
    "good_code": "import \"runtime/cgo\"\nimport \"unsafe\"\n\nfunc safePointer() {\n    obj := &MyStruct{ID: 1}\n    handle := cgo.NewHandle(obj)\n    // Pass the handle (as an uintptr/void*) to C\n    C.store(unsafe.Pointer(uintptr(handle)))\n}\n\n// When C is done:\n// h := cgo.Handle(ptr)\n// h.Delete()",
    "verification": "Run the application with `GODEBUG=cgocheck=2` to enable expensive runtime checks for pointer rule violations.",
    "date": "2026-05-10",
    "id": 1778407560,
    "type": "error"
});