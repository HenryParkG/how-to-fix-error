window.onPostDataLoaded({
    "title": "Fixing Zig Memory Alignment Violations in Direct I/O",
    "slug": "fixing-zig-memory-alignment-direct-io",
    "language": "Zig",
    "code": "AlignmentFault",
    "tags": [
        "Rust",
        "Backend",
        "Zig",
        "Error Fix"
    ],
    "analysis": "<p>When performing Zero-Copy I/O using the <code>O_DIRECT</code> flag in Zig, the Linux kernel requires that the memory buffer be aligned to the logical block size of the underlying filesystem (typically 4096 bytes). Standard heap allocations via <code>std.mem.Allocator.alloc(u8, size)</code> only guarantee alignment to the size of the type, which for <code>u8</code> is a single byte. Passing an unaligned slice to <code>std.os.pwrite</code> results in an <code>EINVAL</code> error or a hardware-level alignment fault on non-x86 architectures.</p>",
    "root_cause": "The default allocator returns memory with 1-byte alignment for u8 slices, whereas Direct I/O requires block-level (e.g., 4096 bytes) alignment for DMA transfers.",
    "bad_code": "const buffer = try allocator.alloc(u8, 4096);\nconst file = try std.fs.cwd().openFile(\"data.bin\", .{ .mode = .read_write, .flags = .{ .direct = true } });\n_ = try file.pwrite(buffer, 0); // Fails with EINVAL",
    "solution_desc": "Use `alignedAlloc` to request memory with a specific alignment that matches the filesystem's block size requirements, ensuring the hardware can perform direct memory access.",
    "good_code": "const buffer = try allocator.alignedAlloc(u8, 4096, 4096);\ndefer allocator.free(buffer);\nconst file = try std.fs.cwd().openFile(\"data.bin\", .{ .mode = .read_write, .flags = .{ .direct = true } });\n_ = try file.pwrite(buffer, 0); // Succeeds",
    "verification": "Run the binary with `strace` to ensure `pwrite64` returns the number of bytes written instead of -1 (EINVAL).",
    "date": "2026-03-15",
    "id": 1773566740,
    "type": "error"
});