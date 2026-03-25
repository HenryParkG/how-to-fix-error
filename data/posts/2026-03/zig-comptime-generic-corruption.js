window.onPostDataLoaded({
    "title": "Fixing Comptime Memory Corruption in Zig Generics",
    "slug": "zig-comptime-generic-corruption",
    "language": "Zig",
    "code": "COMPTIME_MEM_FAIL",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Zig's metaprogramming (comptime) allows for powerful generic data structures. However, memory corruption occurs when a generic function returns a struct containing a slice or pointer that references a comptime-local variable. Because comptime variables do not always have a stable runtime address, the resulting runtime pointer may point to garbage or a restricted memory segment, leading to illegal instruction errors or silent data corruption during execution.</p>",
    "root_cause": "Returning a struct that captures the address of a variable scoped only to the comptime execution phase.",
    "bad_code": "fn GenericStack(comptime T: type) type {\n    return struct {\n        items: []T = &[_]T{}, // ERROR: Points to comptime-only memory\n        \n        pub fn init() @This() {\n            return .{};\n        }\n    };\n}",
    "solution_desc": "Ensure that generic structures define their storage requirements such that they are allocated at runtime or use `extern` blocks if referring to static data. Use the `@alignCast` and `@ptrCast` built-ins carefully to ensure that comptime-generated constants are correctly embedded into the binary's data section.",
    "good_code": "fn GenericStack(comptime T: type) type {\n    return struct {\n        items: []T,\n        allocator: std.mem.Allocator,\n\n        pub fn init(allocator: std.mem.Allocator) !@This() {\n            return .{\n                .items = try allocator.alloc(T, 0),\n                .allocator = allocator,\n            };\n        }\n    };\n}",
    "verification": "Use `zig test` combined with AddressSanitizer (ASAN). If the comptime-generated struct is accessed at runtime without a 'use-after-comptime' error, the fix is verified.",
    "date": "2026-03-25",
    "id": 1774414169,
    "type": "error"
});