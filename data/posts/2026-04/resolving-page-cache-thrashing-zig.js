window.onPostDataLoaded({
    "title": "Resolving Page Cache Thrashing in Zig Applications",
    "slug": "resolving-page-cache-thrashing-zig",
    "language": "Zig",
    "code": "IO_CACHE_FLUSH",
    "tags": [
        "Rust",
        "Backend",
        "Systems",
        "Error Fix"
    ],
    "analysis": "<p>High-IOPS Zig applications often suffer from kernel-level page cache thrashing when processing massive datasets that exceed physical memory. When the OS tries to cache every write, it evicts hot memory used for the application's internal state, leading to latency spikes and degraded performance.</p>",
    "root_cause": "The Linux kernel's default writeback policy attempts to cache all file I/O. In high-throughput scenarios, transient data fills the dirty page quota, forcing the kernel to block user-space threads while it flushes pages to disk.",
    "bad_code": "const file = try std.fs.cwd().createFile(\"data.bin\", .{});\ndefer file.close();\nvar i: usize = 0;\nwhile (i < 1000000) : (i += 1) {\n    try file.writeAll(large_buffer);\n}",
    "solution_desc": "Use `posix_fadvise` with the `POSIX_FADV_DONTNEED` flag to inform the kernel that the written data will not be accessed again soon. This allows the kernel to immediately reclaim the page cache instead of keeping it in memory.",
    "good_code": "const std = @import(\"std\");\nconst os = std.os;\n\n// After writing a chunk of data\ntry file.writeAll(large_buffer);\nconst offset = @intCast(i * buffer_size);\nconst len = @intCast(large_buffer.len);\n_ = os.linux.fadvise(file.handle, offset, len, os.linux.POSIX.FADV.DONTNEED);",
    "verification": "Monitor /proc/meminfo 'Cached' and 'Dirty' fields. The 'Cached' value should remain stable despite high write throughput.",
    "date": "2026-04-02",
    "id": 1775113316,
    "type": "error"
});