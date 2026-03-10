window.onPostDataLoaded({
    "title": "Resolving Zig Pointer Alignment Faults in Multi-Platform FFI",
    "slug": "zig-pointer-alignment-ffi-fix",
    "language": "Zig",
    "code": "AlignmentFault",
    "tags": [
        "Zig",
        "FFI",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Zig enforces strict pointer alignment at compile-time and runtime. When interfacing with C libraries via FFI, pointers often arrive with weaker alignment guarantees than Zig's type system expects for specific structs. This mismatch triggers runtime panics or 'Illegal Instruction' errors on strict-alignment architectures like ARM64.</p>",
    "root_cause": "The specific technical reason is passing a pointer from a C-allocated buffer (often 1 or 8-byte aligned) to a Zig function expecting a higher alignment (e.g., 16-byte for SIMD-enabled types) without using @alignCast.",
    "bad_code": "const MyStruct = struct { data: u128 };\nexport fn process_data(ptr: *MyStruct) void {\n    // If ptr was cast from a char* in C, this crashes\n    const value = ptr.*;\n    _ = value;\n}",
    "solution_desc": "Use @alignCast to explicitly handle the alignment conversion and verify the pointer's address at runtime, or define the Zig struct with a lower alignment to match the incoming C data.",
    "good_code": "const MyStruct = struct { data: u128 };\nexport fn process_data(raw_ptr: [*c]MyStruct) void {\n    // Safely cast with runtime alignment check\n    const aligned_ptr: *align(@alignOf(MyStruct)) MyStruct = @alignCast(@ptrCast(raw_ptr));\n    const value = aligned_ptr.*;\n    _ = value;\n}",
    "verification": "Run the code in 'Debug' or 'ReleaseSafe' mode; Zig's runtime safety will check if the pointer is correctly aligned during the @alignCast call.",
    "date": "2026-03-10",
    "id": 1773135351,
    "type": "error"
});