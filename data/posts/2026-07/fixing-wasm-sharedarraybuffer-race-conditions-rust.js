window.onPostDataLoaded({
    "title": "Fixing WebAssembly SharedArrayBuffer Race Conditions in Rust",
    "slug": "fixing-wasm-sharedarraybuffer-race-conditions-rust",
    "language": "Rust",
    "code": "DataRace",
    "tags": [
        "WebAssembly",
        "Concurrency",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Building high-performance multi-threaded WebAssembly (Wasm) applications in Rust using Web Workers relies heavily on `SharedArrayBuffer` (SAB) to share memory without serialization overhead. However, when multiple Web Workers concurrently read and write to raw memory offsets inside the `SharedArrayBuffer`, data races and memory corruption occur if synchronized atomics are omitted.</p><p>JavaScript engines enforce strict memory ordering guarantees on shared memory. Direct slice mutations or unsynchronized raw pointer operations compiled from Rust bypass these browser execution boundaries. Without explicit atomic instructions (`AtomicU32`, atomic futex wait/notify), worker threads experience non-deterministic state corruption, tearing reads, and phantom crashes inside WebAssembly execution contexts.</p>",
    "root_cause": "Unsynchronized non-atomic slice writes across multiple Web Worker threads sharing a single SharedArrayBuffer memory region.",
    "bad_code": "use wasm_bindgen::prelude::*;\n\n#[wasm_bindgen]\npub struct SharedBuffer {\n    ptr: *mut u32,\n    len: usize,\n}\n\n#[wasm_bindgen]\nimpl SharedBuffer {\n    // Bug: Direct non-atomic mutation over multi-threaded Wasm memory\n    pub unsafe fn write_data(&mut self, index: usize, value: u32) {\n        let slice = std::slice::from_raw_parts_mut(self.ptr, self.len);\n        slice[index] = value; // Non-atomic write causing race conditions!\n    }\n}",
    "solution_desc": "Replace unsynchronized raw buffer access with Rust atomic primitives (`std::sync::atomic`). Use explicit memory orderings (`Ordering::SeqCst` or `Ordering::AcqRel`) or atomic futex notifications to safely pass messages and synchronize state across Web Workers accessing SharedArrayBuffers.",
    "good_code": "use wasm_bindgen::prelude::*;\nuse std::sync::atomic::{AtomicU32, Ordering};\n\n#[wasm_bindgen]\npub struct AtomicSharedBuffer {\n    ptr: *const AtomicU32,\n    len: usize,\n}\n\n#[wasm_bindgen]\nimpl AtomicSharedBuffer {\n    #[wasm_bindgen(constructor)]\n    pub fn new(ptr: *mut u32, len: usize) -> Self {\n        Self { ptr: ptr as *const AtomicU32, len }\n    }\n\n    pub fn write_atomic(&self, index: usize, value: u32) {\n        assert!(index < self.len);\n        unsafe {\n            let atomic_slice = std::slice::from_raw_parts(self.ptr, self.len);\n            // Safe atomic write mapped directly to SAB atomic ops in Wasm\n            atomic_slice[index].store(value, Ordering::SeqCst);\n        }\n    }\n}",
    "verification": "Compile with `RUSTFLAGS=\"-C target-feature=+atomics,+bulk-memory,+mutable-globals\"` and execute multi-worker Wasm integration tests in a Cross-Origin Isolated browser environment (`COOP/COEP` enabled). Confirm thread sanitization checks pass without corrupted buffer states.",
    "date": "2026-07-29",
    "id": 1785289490,
    "type": "error"
});