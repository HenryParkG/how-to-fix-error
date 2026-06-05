window.onPostDataLoaded({
    "title": "Debugging Zig Memory Corruption from errdefer Violations",
    "slug": "debugging-zig-errdefer-corruption",
    "language": "Zig",
    "code": "MemoryCorruption",
    "tags": [
        "Zig",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In multithreaded Zig applications, <code>errdefer</code> is a powerful construct designed to release resources on error. However, when ownership of an allocated block is transferred to another thread, <code>errdefer</code> can introduce silent memory corruption or double-free vulnerabilities. If a thread allocates memory, registers an <code>errdefer</code> to free it, transfers ownership to a child thread, and subsequently encounters an error prior to returning from the spawning function, the <code>errdefer</code> block will execute and free the memory while the active thread is still writing to or reading from it.</p>",
    "root_cause": "An errdefer block executes on local function failure and frees memory that has already had its ownership transferred to a concurrent thread.",
    "bad_code": "const std = @import(\"std\");\n\nfn spawnWorker(allocator: std.mem.Allocator) !void {\n    var data = try allocator.alloc(u8, 1024);\n    errdefer allocator.free(data); // Bug: If thread spawn fails, or subsequent steps fail, this runs.\n\n    const thread = try std.Thread.spawn(.{}, workerRun, .{data});\n    thread.detach();\n\n    // If this initialization step fails, errdefer triggers,\n    // freeing 'data' while the detached thread is using it!\n    try verifySystemState(); \n}",
    "solution_desc": "Implement manual ownership transfer. Use a boolean flag or a structured handoff pattern to disable the 'errdefer' deallocation mechanism once the receiving thread has successfully assumed control of the reference.",
    "good_code": "const std = @import(\"std\");\n\nfn spawnWorker(allocator: std.mem.Allocator) !void {\n    var data = try allocator.alloc(u8, 1024);\n    var ownership_transferred = false;\n    errdefer {\n        if (!ownership_transferred) {\n            allocator.free(data);\n        }\n    }\n\n    const thread = try std.Thread.spawn(.{}, workerRun, .{data});\n    thread.detach();\n\n    // Ownership safely handed off to the spawned thread\n    ownership_transferred = true; \n\n    try verifySystemState();\n}",
    "verification": "Compile the code using 'zig build-exe -fsanitize=safe' and execute under a heavy multithreaded runtime. Verify that no 'use-after-free' or double-free assertions are triggered by Zig's GeneralPurposeAllocator.",
    "date": "2026-06-05",
    "id": 1780660599,
    "type": "error"
});