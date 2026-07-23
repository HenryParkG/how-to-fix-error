window.onPostDataLoaded({
    "title": "Fix WebAssembly SharedArrayBuffer Atomic Deadlocks",
    "slug": "wasm-sharedarraybuffer-atomic-deadlock-fix",
    "language": "Rust / WASM",
    "code": "Deadlock",
    "tags": [
        "WebAssembly",
        "JavaScript",
        "Rust",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>Multi-threaded WebAssembly modules use `SharedArrayBuffer` and atomic synchronization primitives (like Rust's `Mutex` or direct `Atomics.wait` calls). Calling blocking atomic wait operations inside Web Worker threads that share dependencies or message-passing loops with the main JavaScript thread causes deadlocks. Because browsers disallow `Atomics.wait` on the main thread and event loop execution stops during worker locks, worker pools stall permanently.</p>",
    "root_cause": "Synchronous lock acquisition using blocking atomic instructions (`Atomics.wait`) inside worker threads holding references needed by event-driven async promises.",
    "bad_code": "use std::sync::{Arc, Mutex};\nuse wasm_bindgen::prelude::*;\n\n#[wasm_bindgen]\npub fn process_task(data: Arc<Mutex<Vec<u8>>>) {\n    // Blocks worker thread indefinitely if lock is held by yielding worker\n    let mut lock = data.lock().unwrap();\n    lock.push(42);\n}",
    "solution_desc": "Replace blocking mutex acquisition with non-blocking spin/try-lock attempts or utilize asynchronous atomic waiting mechanisms via JavaScript's `Atomics.waitAsync` interface.",
    "good_code": "use std::sync::{Arc, Mutex};\nuse wasm_bindgen::prelude::*;\n\n#[wasm_bindgen]\npub fn process_task_safe(data: &MutexDataWrapper) -> bool {\n    if let Ok(mut lock) = data.inner.try_lock() {\n        lock.push(42);\n        true\n    } else {\n        // Return false and re-schedule execution on JS event loop\n        false\n    }\n}",
    "verification": "Run multi-threaded worker test suites in browser runners and assert context thread profiles display zero stalled worker threads under concurrent contention.",
    "date": "2026-07-23",
    "id": 1784794360,
    "type": "error"
});