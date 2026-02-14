window.onPostDataLoaded({
    "title": "Zig Alignment: Fixing UB in Custom Allocators",
    "slug": "zig-memory-alignment-ub-fix",
    "language": "Zig",
    "code": "AlignmentError",
    "tags": [
        "Rust",
        "Backend",
        "Zig",
        "Error Fix"
    ],
    "analysis": "<p>In Zig, memory alignment is a first-class citizen. Unlike C where misaligned access might just be a performance penalty on some architectures, Zig treats alignment mismatches as Undefined Behavior (UB) during safety-checked builds. When implementing custom allocators, developers often manage a raw <code>[]u8</code> buffer. The error occurs when casting a pointer from this buffer to a structured type without ensuring the address satisfies the type's <code>@alignOf</code> requirement.</p>",
    "root_cause": "The allocator returns a pointer at an arbitrary offset that is not a multiple of the requested type's alignment, causing a CPU trap or invalid data read.",
    "bad_code": "fn alloc(self: *Self, len: usize, ptr_align: u8) ![]u8 {\n    const start = self.offset;\n    self.offset += len;\n    // BUG: This does not ensure 'start' is a multiple of 'ptr_align'\n    return self.buffer[start..self.offset];\n}",
    "solution_desc": "Use the `std.mem.alignForward` utility to move the current offset to the next valid memory address that satisfies the alignment requirement before slicing the buffer.",
    "good_code": "fn alloc(self: *Self, len: usize, ptr_align: u8) ![]u8 {\n    const aligned_start = std.mem.alignForward(self.offset, ptr_align);\n    const end = aligned_start + len;\n    if (end > self.buffer.len) return error.OutOfMemory;\n    self.offset = end;\n    return self.buffer[aligned_start..end];\n}",
    "verification": "Compile with `zig build-exe -O Debug` and run. Zig's Safety-Check will trigger a panic if `@ptrCast` is used on an incorrectly aligned address.",
    "date": "2026-02-14",
    "id": 1771050875,
    "type": "error"
});