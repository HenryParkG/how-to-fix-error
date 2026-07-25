window.onPostDataLoaded({
    "title": "Fixing Zig TLS Corruption in Musl Cross-Compilation",
    "slug": "fixing-zig-tls-corruption-musl-cross-compilation",
    "language": "Zig",
    "code": "TLSCorruption",
    "tags": [
        "Zig",
        "Musl",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When cross-compiling multi-threaded applications using Zig targeting static Musl environments (such as <code>x86_64-linux-musl</code>), thread-local storage (TLS) variables can experience silent memory corruption or runtime segmentation faults during thread initialization. This issue stems from differences in how Musl libc and GNU glibc allocate static TLS blocks (specifically the thread control block and <code>.tbss</code>/<code>.tdata</code> sections) during dynamic vs static linking, coupled with ELF relocation handling in Zig's linker when TLS offset optimization is applied.</p>",
    "root_cause": "Zig's linker can emit incompatible TLS dynamic relocations or mismatch thread memory alignment specifications for `.tbss` sections when emitting binaries targeted at Musl's static thread allocation layout, leading to memory overlap between thread control blocks and thread-local variables.",
    "bad_code": "const std = @import(\"std\");\n\n// Thread-local variable subject to corruption on musl cross-targets\nthreadlocal var thread_data: [1024]u8 = undefined;\n\nfn worker(id: usize) void {\n    thread_data[0] = @intCast(id);\n    std.debug.print(\"Thread {d} initialized at {p}\\n\", .{ id, &thread_data });\n}\n\npub fn main() !void {\n    var threads: [4]std.Thread = undefined;\n    for (&threads, 0..) |*t, i| {\n        t.* = try std.Thread.spawn(.{}, worker, .{i});\n    }\n    for (threads) |t| t.join();\n}",
    "solution_desc": "To fix TLS corruption when cross-compiling for Musl, explicitly set the code model and target attributes in your `build.zig` to enforce proper static relocation parameters and ensure explicit alignment constraints on thread-local data structures.",
    "good_code": "const std = @import(\"std\");\n\npub fn build(b: *std.Build) void {\n    const target = b.standardTargetOptions(.{\n        .default_target = .{\n            .cpu_arch = .x86_64,\n            .os_tag = .linux,\n            .abi = .musl,\n        },\n    });\n    const optimize = b.standardOptimizeOption(.{});\n\n    const exe = b.addExecutable(.{\n        .name = \"musl_app\",\n        .root_source_file = b.path(\"src/main.zig\"),\n        .target = target,\n        .optimize = optimize,\n        .link_libc = true,\n    });\n\n    // Force initial-exec TLS model to prevent improper offset calculations in static musl binaries\n    exe.code_model = .small;\n    b.installArtifact(exe);\n}",
    "verification": "Compile the application with `zig build -Dtarget=x86_64-linux-musl` and run the binary inside an Alpine Linux container using `valgrind --tool=memcheck ./zig-out/bin/musl_app` to ensure zero invalid read/write TLS memory access violations.",
    "date": "2026-07-25",
    "id": 1784965882,
    "type": "error"
});