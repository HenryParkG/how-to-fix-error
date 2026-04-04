window.onPostDataLoaded({
    "title": "Fixing Zig Use-After-Free in Manual Memory Management",
    "slug": "zig-use-after-free-manual-memory",
    "language": "Zig",
    "code": "UseAfterFree",
    "tags": [
        "Rust",
        "Backend",
        "Zig",
        "Error Fix"
    ],
    "analysis": "<p>In Zig, manual memory management provides ultimate control but places the burden of safety entirely on the developer. Use-After-Free (UAF) occurs when a pointer is accessed after the memory it points to has been returned to the allocator. This often happens in complex data structures where ownership is ambiguous or when a 'defer' statement fires earlier than anticipated in a multi-branch logic flow.</p>",
    "root_cause": "The specific cause is typically a pointer remaining in scope after the 'allocator.free()' call, combined with a lack of nullification or reference counting in the manual memory layer.",
    "bad_code": "const std = @import(\"std\");\n\nfn example() !void {\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    const allocator = gpa.allocator();\n    \n    var data = try allocator.alloc(u8, 10);\n    defer allocator.free(data);\n    \n    // ... complex logic ...\n    allocator.free(data); // Explicit free\n    \n    data[0] = 100; // USE-AFTER-FREE: defer will also try to free this again!\n}",
    "solution_desc": "Implement the 'ArenaAllocator' pattern for request-scoped lifecycles to ensure memory is cleared all at once, or use 'undefined' to poison pointers after freeing to catch UAF during development in Debug mode.",
    "good_code": "const std = @import(\"std\");\n\nfn example() !void {\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    const allocator = gpa.allocator();\n    \n    var data = try allocator.alloc(u8, 10);\n    \n    // Use a boolean or clear state to ensure single-owner cleanup\n    errdefer allocator.free(data);\n    \n    // If manual free is required:\n    allocator.free(data);\n    data = undefined; // Poison the pointer to trigger a crash on access\n}",
    "verification": "Run the code using 'zig test' with the GeneralPurposeAllocator; it contains built-in leak and double-free detection that will trigger a panic on invalid access.",
    "date": "2026-04-04",
    "id": 1775265606,
    "type": "error"
});