window.onPostDataLoaded({
    "title": "Zig Memory Alignment in Cross-Platform SIMD",
    "slug": "zig-simd-memory-alignment-faults",
    "language": "Zig",
    "code": "AlignmentFault",
    "tags": [
        "Rust",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When implementing SIMD (Single Instruction, Multiple Data) in Zig, developers often encounter runtime crashes or CPU exceptions when passing memory buffers to vector operations. This occurs because modern CPU instructions like AVX-512 or NEON require data to be aligned to specific byte boundaries (e.g., 32 or 64 bytes). If a pointer is cast to a vector type without explicitly ensuring the underlying memory satisfies these constraints, the hardware triggers an alignment fault.</p><p>Zig is particularly strict about alignment in its type system. While this prevents many errors at compile-time, dynamic slices or pointers received from FFI/C-interop often lose their alignment metadata, leading to dangerous assumptions during pointer casting.</p>",
    "root_cause": "The specific technical reason is the mismatch between the expected alignment of a vector type (e.g., 32 bytes for a 256-bit vector) and the actual memory address of the source buffer, typically caused by unaligned heap allocations or incorrect pointer arithmetic.",
    "bad_code": "const std = @import(\"std\");\n\nfn process_simd(data: []u8) void {\n    // DANGEROUS: data.ptr might not be 32-byte aligned\n    const vec_ptr = @ptrCast(*const @Vector(8, f32), data.ptr);\n    const val = vec_ptr.*;\n    _ = val;\n}",
    "solution_desc": "Use Zig's `@alignCast` to verify alignment at runtime/compile-time and leverage the `align(N)` property on allocators to ensure memory is allocated correctly from the start. For slices, use `std.mem.alignForward` if manual offset adjustment is required.",
    "good_code": "const std = @import(\"std\");\n\nfn process_simd(data: []u8) void {\n    // Ensure the slice is actually aligned before casting\n    const alignment = @alignOf(@Vector(8, f32));\n    if (@ptrToInt(data.ptr) % alignment != 0) return error.Unaligned;\n\n    const aligned_ptr = @alignCast(alignment, @ptrCast(*const [32]u8, data.ptr));\n    const vec_ptr = @ptrCast(*const @Vector(8, f32), aligned_ptr);\n    const val = vec_ptr.*;\n    _ = val;\n}",
    "verification": "Run the binary with `zig build-exe -fsanitize=undefined`. This will trigger an Undefined Behavior Sanitizer error if an unaligned pointer is used.",
    "date": "2026-04-10",
    "id": 1775805480,
    "type": "error"
});