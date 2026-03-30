window.onPostDataLoaded({
    "title": "Resolving Go CGO Pointer-Passing Violations",
    "slug": "go-cgo-pointer-passing-violations",
    "language": "Go",
    "code": "runtime.panic",
    "tags": [
        "Go",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>When bridging Go and C via CGO, developers often encounter 'panic: runtime error: cgo argument has Go pointer to Go pointer'. This occurs because Go's garbage collector (GC) is moving-collector capable; it manages memory by shifting addresses during stack growth or evacuation. C, however, expects static memory addresses. If Go passes a pointer to C that contains another Go pointer, the GC cannot safely track or update that nested reference if it moves the underlying data, leading to memory corruption or crashes.</p>",
    "root_cause": "The CGO pointer-passing rules strictly forbid passing Go-allocated memory to C if that memory itself contains pointers to other Go-allocated objects.",
    "bad_code": "// Passing a slice of strings (which are Go pointers) to C\nfunc BadExample(data []string) {\n    C.process_strings(**C.char(unsafe.Pointer(&data[0])), C.int(len(data)))\n}",
    "solution_desc": "Use C-managed memory for the intermediate structure. Allocate the pointer array using C.malloc, copy the data there, and ensure you free the memory manually to prevent leaks while keeping the Go GC out of the loop.",
    "good_code": "func FixedExample(data []string) {\n    ptrSize := unsafe.Sizeof((*C.char)(nil))\n    cArray := C.malloc(C.size_t(len(data)) * C.size_t(ptrSize))\n    defer C.free(cArray)\n\n    slice := (*[1 << 30]*C.char)(cArray)[:len(data):len(data)]\n    for i, s := range data {\n        slice[i] = C.CString(s)\n        defer C.free(unsafe.Pointer(slice[i]))\n    }\n    C.process_strings(&slice[0], C.int(len(data)))\n}",
    "verification": "Run the application with 'GODEBUG=cgocheck=2' environment variable to enable strict runtime checking of pointer passing.",
    "date": "2026-03-30",
    "id": 1774855037,
    "type": "error"
});