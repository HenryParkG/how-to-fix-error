window.onPostDataLoaded({
    "title": "Fixing Zig Alignment Crashes in Comptime Packed Structs",
    "slug": "zig-alignment-crashes-packed-structs",
    "language": "Zig",
    "code": "SIGBUS",
    "tags": [
        "Rust",
        "Backend",
        "Systems",
        "Error Fix"
    ],
    "analysis": "<p>In Zig, <code>packed struct</code> types are essential for memory-mapped I/O and binary protocol parsing. However, when generating these structs using <code>comptime</code> logic, developers often encounter alignment-induced crashes (SIGBUS or unaligned access traps). This occurs because packed structs have a default alignment of 1, but CPU instructions for multi-byte types (like u32 or u64) often require 4 or 8-byte alignment. When the Zig compiler generates code to access a field within a packed struct via a pointer, it may use instructions that assume standard alignment, leading to hardware-level faults on architectures like ARM or RISC-V.</p>",
    "root_cause": "Packed structs override the natural alignment of their members to ensure zero padding. If a pointer to a member is cast or passed to a function expecting natural alignment, the CPU executes an aligned-load instruction on an unaligned address.",
    "bad_code": "const Header = packed struct {\n    magic: u8,\n    version: u32, // Offset 1, unaligned\n};\n\nfn process(val: *const u32) void {\n    _ = val.*;\n}\n\n// Crash occurs here on some CPUs\nprocess(&header.version);",
    "solution_desc": "Use the `@alignCast` builtin or ensure the pointer is marked as `*align(1) const u32`. Alternatively, use `@bitCast` to copy the packed data into a naturally aligned stack variable before processing.",
    "good_code": "const Header = packed struct {\n    magic: u8,\n    version: u32,\n};\n\nfn process(val: *align(1) const u32) void {\n    const safe_val = val.*; // Compiler uses unaligned load\n    _ = safe_val;\n}\n\n// Or bitCast the whole struct to a non-packed version\nconst AlignedHeader = struct { magic: u8, version: u32 };\nconst aligned = @bitCast(AlignedHeader, header);",
    "verification": "Run the binary through 'zig test' on an ARM64 target or use QEMU with alignment check enabled to verify no SIGBUS is raised.",
    "date": "2026-02-16",
    "id": 1771204674,
    "type": "error"
});