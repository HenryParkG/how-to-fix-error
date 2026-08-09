window.onPostDataLoaded({
    "title": "Fix Zig Arena Allocator Pointer Invalidation in Slices",
    "slug": "zig-arena-allocator-pointer-invalidation",
    "language": "Zig",
    "code": "SegmentationFault",
    "tags": [
        "Zig",
        "Rust",
        "Backend",
        "C",
        "Error Fix"
    ],
    "analysis": "<p>In Zig applications using <code>std.heap.ArenaAllocator</code> to manage temporary allocations, storing direct pointers or references to elements inside a dynamic slice (such as <code>std.ArrayList</code>) can lead to subtle memory corruption or segmentation faults. When the dynamic slice grows beyond its current capacity, it reallocates memory, leaving previously saved element pointers referencing invalidated memory regions.</p>",
    "root_cause": "Reallocating memory during `ArrayList.append` moves the underlying array buffer to a new memory address, invalidating raw pointers taken from slice elements prior to capacity expansion.",
    "bad_code": "const std = @import(\"std\");\n\npub fn main() !void {\n    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);\n    defer arena.deinit();\n    const allocator = arena.allocator();\n\n    var list = std.ArrayList(u32).init(allocator);\n    try list.append(42);\n    const item_ptr: *u32 = &list.items[0]; // Storing raw pointer\n\n    for (0..100) |i| try list.append(@intCast(i)); // Triggers reallocation!\n\n    std.debug.print(\"Value: {}\\n\", .{item_ptr.*}); // Dangling pointer access\n}",
    "solution_desc": "Pre-allocate capacity using `initCapacity` or store array indices instead of raw element pointers when interacting with dynamically growing slice structures in memory arenas.",
    "good_code": "const std = @import(\"std\");\n\npub fn main() !void {\n    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);\n    defer arena.deinit();\n    const allocator = arena.allocator();\n\n    var list = try std.ArrayList(u32).initCapacity(allocator, 128);\n    try list.append(42);\n    const item_idx: usize = 0; // Store index, not memory pointer\n\n    for (0..100) |i| try list.append(@intCast(i));\n\n    std.debug.print(\"Value: {}\\n\", .{list.items[item_idx]}); // Safe access\n}",
    "verification": "Compile and run the binary using `zig build-exe -fsanitize=address`. Verify that AddressSanitizer reports no heap-use-after-free or invalid read/write violations.",
    "date": "2026-08-09",
    "id": 1786237085,
    "type": "error"
});