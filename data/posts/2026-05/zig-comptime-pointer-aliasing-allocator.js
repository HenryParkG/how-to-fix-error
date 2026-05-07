window.onPostDataLoaded({
    "title": "Zig Comptime Pointer Aliasing in Custom Allocators",
    "slug": "zig-comptime-pointer-aliasing-allocator",
    "language": "Zig",
    "code": "Memory/Safety",
    "tags": [
        "Rust",
        "Systems",
        "Memory",
        "Error Fix"
    ],
    "analysis": "<p>In Zig, the <code>comptime</code> keyword allows for powerful metaprogramming, but it introduces subtle risks when generating allocator state. When an allocator is defined within a comptime block, the compiler may treat unique instances of the allocator state as identical if their types and parameters match, leading to pointer aliasing. This results in multiple 'unique' allocator instances sharing the same internal memory pool or metadata, causing heap corruption when one instance frees memory owned by another.</p>",
    "root_cause": "Zig's memoization of comptime-generated types can cause distinct variable declarations to point to the same underlying static data if the generation function's arguments are identical, leading to unintended shared state.",
    "bad_code": "fn CreateAllocator(comptime size: usize) type {\n    return struct {\n        var buffer: [size]u8 = undefined;\n        var offset: usize = 0;\n        pub fn alloc(len: usize) ![]u8 {\n            // Static 'buffer' is shared across all instances of this type!\n        }\n    };\n}",
    "solution_desc": "Instead of relying on static variables within a generated struct, wrap the state in a runtime-initialized container or use a unique identifier (like a type-level 'nonce') to ensure the compiler generates distinct types for distinct allocator instances.",
    "good_code": "fn CreateAllocator(comptime size: usize, comptime nonce: anytype) type {\n    return struct {\n        buffer: [size]u8 = undefined,\n        offset: usize = 0,\n        pub fn init() @This() { return .{}; }\n        // State is now instance-bound, not type-bound\n    };\n}",
    "verification": "Compile with -Drelease-safe and run unit tests that instantiate two allocators with the same parameters; verify that their base pointer addresses differ.",
    "date": "2026-05-07",
    "id": 1778133177,
    "type": "error"
});