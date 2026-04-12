window.onPostDataLoaded({
    "title": "Fixing Zig SIMD Alignment Faults in Cross-Compilation",
    "slug": "zig-simd-alignment-faults",
    "language": "Zig",
    "code": "SIGBUS/Alignment",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>When cross-compiling Zig applications for architectures like x86_64 or AArch64, SIMD (Single Instruction, Multiple Data) operations often trigger alignment faults. These occur because specific vector instructions, such as AVX's VMOVAPS, require memory addresses to be aligned to the vector size (e.g., 32 bytes for a 256-bit vector). If a pointer is cast from a generic byte buffer without explicit alignment, the CPU triggers a hardware exception.</p>",
    "root_cause": "The compiler generates alignment-sensitive load/store instructions for @Vector types, but the underlying memory allocated via standard allocators or slices may only guarantee 8 or 16-byte alignment, leading to crashes on cross-compiled targets with stricter ISA requirements.",
    "bad_code": "const std = @import(\"std\");\n\npub fn process_simd(data: []u8) void {\n    // DANGEROUS: data pointer might not be 32-byte aligned\n    const vec: @Vector(8, f32) = @ptrCast(*const [8]f32, data.ptr).*;\n    _ = vec;\n}",
    "solution_desc": "Use the 'align' keyword in Zig to enforce memory boundaries at the allocation site and utilize '@alignCast' to safely inform the compiler that a pointer meets the required alignment for SIMD operations.",
    "good_code": "const std = @import(\"std\");\n\npub fn process_simd(data: []u8) void {\n    // Ensure the slice is aligned to 32 bytes\n    const aligned_ptr: [*]align(32) f32 = @alignCast(32, @ptrCast([*]f32, data.ptr));\n    const vec: @Vector(8, f32) = aligned_ptr[0..8].*;\n    _ = vec;\n}\n\n// Or allocate with alignment\n// var buf = try allocator.alignedAlloc(u8, 32, 1024);",
    "verification": "Run the binary through 'qemu-x86_64 -cpu architecture' or 'valgrind --tool=memcheck' to detect unaligned memory accesses during SIMD execution.",
    "date": "2026-04-12",
    "id": 1775958362,
    "type": "error"
});