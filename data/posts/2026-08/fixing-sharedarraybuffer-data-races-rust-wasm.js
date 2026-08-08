window.onPostDataLoaded({
    "title": "Fixing SharedArrayBuffer Data Races in Rust Wasm",
    "slug": "fixing-sharedarraybuffer-data-races-rust-wasm",
    "language": "Rust / WebAssembly",
    "code": "Data Race / Corruption",
    "tags": [
        "Rust",
        "WebAssembly",
        "Wasm",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>Multi-threaded WebAssembly runtimes using Web Workers rely on <code>SharedArrayBuffer</code> for shared linear memory. When rust code compiles to Wasm without explicit hardware memory barriers or atomic primitives, non-atomic memory writes across worker threads lead to severe data races. Browser JIT engines reorder or cache memory access operations across worker threads, resulting in dirty reads, corrupted state, or unhandled WASM traps under high concurrent execution.</p>",
    "root_cause": "Non-atomic raw pointers and raw unsynchronized memory writes in Rust compile to standard Wasm load/store instructions instead of atomic operations (`i32.atomic.rmw`). Standard loads and stores do not enforce cache coherence or memory fence synchronization across JS worker contexts.",
    "bad_code": "use wasm_bindgen::prelude::*;\n\nstatic mut SHARED_COUNTER: u32 = 0;\n\n#[wasm_bindgen]\npub fn increment_worker_counter() {\n    unsafe {\n        // Unsynchronized concurrent write across SharedArrayBuffer workers\n        SHARED_COUNTER += 1;\n    }\n}",
    "solution_desc": "Compile the Rust codebase with target flags `-C target-feature=+atomics,+bulk-memory,+mutable-globals` and replace unsynchronized global references with standard Rust atomic primitives (`AtomicU32`) configured with appropriate memory ordering.",
    "good_code": "use std::sync::atomic::{AtomicU32, Ordering};\nuse wasm_bindgen::prelude::*;\n\nstatic SHARED_COUNTER: AtomicU32 = AtomicU32::new(0);\n\n#[wasm_bindgen]\npub fn increment_worker_counter() {\n    // Thread-safe atomic read-modify-write across Wasm thread workers\n    SHARED_COUNTER.fetch_add(1, Ordering::SeqCst);\n}",
    "verification": "Verify cross-origin isolation headers (`COOP`/`COEP`) on the serving web server, execute tests via `wasm-pack test --headless --chrome`, and monitor atomic memory instructions using Chrome DevTools Memory Inspector.",
    "date": "2026-08-08",
    "id": 1786181467,
    "type": "error"
});