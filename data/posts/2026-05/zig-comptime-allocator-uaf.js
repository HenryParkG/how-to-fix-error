window.onPostDataLoaded({
    "title": "Mitigating Zig Allocator Use-After-Free in Comptime Types",
    "slug": "zig-comptime-allocator-uaf",
    "language": "Zig",
    "code": "Use-After-Free",
    "tags": [
        "Zig",
        "Rust",
        "Systems",
        "Error Fix"
    ],
    "analysis": "<p>In Zig, <code>comptime</code> allows for powerful metaprogramming, but it creates a boundary where memory management becomes ambiguous. When generating complex types at compile-time that wrap runtime buffers, developers often inadvertently create use-after-free (UAF) vulnerabilities. This occurs because the allocator used to initialize a generic struct may have a shorter lifetime than the struct's eventual usage in the runtime execution flow, especially when using <code>FixedBufferAllocator</code> or stack-allocated arenas.</p>",
    "root_cause": "The generic type stores a slice or pointer referencing memory allocated during an initialization phase that is deallocated before the comptime-generated object is accessed at runtime.",
    "bad_code": "fn CreateManagedType(comptime T: type) type {\n    return struct {\n        data: []T,\n        pub fn init(allocator: std.mem.Allocator) !@This() {\n            // Error: If 'allocator' is a local stack allocator,\n            // 'data' becomes invalid after the calling function returns.\n            const buf = try allocator.alloc(T, 10);\n            return .{ .data = buf };\n        }\n    };\n}",
    "solution_desc": "Implement explicit ownership transfer and use 'ArenaAllocator' scoped to the lifetime of the type's consumer. Use Zig's 'errdefer' to ensure memory is cleaned up during initialization failures, and ensure the allocator is passed by reference and stored if the struct manages its own lifecycle.",
    "good_code": "fn ManagedType(comptime T: type) type {\n    return struct {\n        data: []T,\n        allocator: std.mem.Allocator,\n        pub fn init(allocator: std.mem.Allocator) !@This() {\n            const buf = try allocator.alloc(T, 10);\n            return .{ .data = buf, .allocator = allocator };\n        },\n        pub fn deinit(self: *@This()) void {\n            self.allocator.free(self.data);\n        }\n    };\n}",
    "verification": "Run 'zig test' with the Address Sanitizer enabled via '-fsanitize=address' to detect invalid pointer dereferences during runtime execution.",
    "date": "2026-05-13",
    "id": 1778638330,
    "type": "error"
});