window.onPostDataLoaded({
    "title": "Fixing Use-After-Free in Custom Zig Allocators",
    "slug": "zig-use-after-free-manual-allocators",
    "language": "Zig",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Systems",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Zig, manual memory management provides ultimate control but introduces the risk of Use-After-Free (UAF) vulnerabilities, especially when implementing custom Allocator interfaces. Unlike Rust, Zig does not have a borrow checker to track lifetimes at compile-time. When a developer creates a custom allocator (e.g., an Arena or FixedBufferAllocator wrapper), failure to properly track pointer validity after a <code>deinit()</code> or <code>free()</code> call leads to memory corruption or crashes. This is particularly prevalent in long-running processes where memory segments are recycled frequently.</p>",
    "root_cause": "The specific cause is a dangling pointer where a reference to a memory block remains active in the application logic after the underlying memory has been returned to the heap or the custom allocator's internal pool.",
    "bad_code": "const std = @import(\"std\");\n\nfn testUAF() !void {\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    const allocator = gpa.allocator();\n\n    var ptr = try allocator.create(i32);\n    ptr.* = 42;\n    allocator.destroy(ptr);\n\n    // Error: Accessing memory after it was destroyed\n    std.debug.print(\"Value: {d}\\n\", .{ptr.*}); \n}",
    "solution_desc": "Architecturally, the fix involves using Zig's GeneralPurposeAllocator (GPA) in safety mode during development to catch UAF errors immediately. In production custom allocators, implement 'pointer zeroing' or use the 'Ghost Pointers' pattern where handles are used instead of raw pointers, allowing the allocator to invalidate all handles upon deallocation.",
    "good_code": "const std = @import(\"std\");\n\nfn testSafeAlloc() !void {\n    // GPA tracks leaks and use-after-free in Debug/ReleaseSafe modes\n    var gpa = std.heap.GeneralPurposeAllocator(.{ .safety = true }){};\n    defer _ = gpa.deinit();\n    const allocator = gpa.allocator();\n\n    var ptr = try allocator.create(i32);\n    ptr.* = 42;\n    \n    // Explicitly nullify the pointer after destruction to prevent UAF\n    allocator.destroy(ptr);\n    ptr = undefined; \n\n    // Any subsequent access to 'ptr' will now trigger a clear compile-time \n    // or runtime error depending on context, rather than silent corruption.\n}",
    "verification": "Run the code in Debug or ReleaseSafe mode. The GeneralPurposeAllocator will output a log message and trigger a panic if memory is accessed after being freed.",
    "date": "2026-04-23",
    "id": 1776908983,
    "type": "error"
});