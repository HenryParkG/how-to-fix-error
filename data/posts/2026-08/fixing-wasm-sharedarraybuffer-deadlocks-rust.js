window.onPostDataLoaded({
    "title": "Fixing WASM SharedArrayBuffer Deadlocks in Rust",
    "slug": "fixing-wasm-sharedarraybuffer-deadlocks-rust",
    "language": "Rust",
    "code": "WASM_THREAD_DEADLOCK",
    "tags": [
        "WebAssembly",
        "Multithreading",
        "Atomics",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Compiling multithreaded Rust code targeting `wasm32-unknown-unknown` relies on SharedArrayBuffer memory sharing and Web Workers acting as thread primitives. Sync primitives such as `std::sync::Mutex` or standard channel locks use `Atomics.wait` under the hood to park blocked threads until signaled via `Atomics.notify`.</p><p>However, the Web browser specification explicitly forbids blocking calls like `Atomics.wait` on the main UI thread. When Rust code running on the main browser thread attempts to acquire a contested `std::sync::Mutex` held by a Web Worker, the WebAssembly engine either throws a runtime `TypeError` or silently deadlocks the browser event loop, permanently freezing the web application.</p>",
    "root_cause": "Attempting to invoke blocking synchronization primitives (`std::sync::Mutex` calling `Atomics.wait`) directly on the main JavaScript UI thread when interacting with asynchronous worker threads.",
    "bad_code": "use std::sync::{Arc, Mutex};\nuse wasm_bindgen::prelude::*;\n\n#[wasm_bindgen]\npub fn process_data_on_main_thread(state: Arc<Mutex<Vec<u8>>>) {\n    // BUG: Standard blocking lock call on the main browser UI thread\n    let mut data = state.lock().unwrap();\n    data.push(42);\n}",
    "solution_desc": "Replace standard synchronous locking mechanisms with non-blocking async locks (e.g., `futures::lock::Mutex` or cross-thread message channels via `wasm_bindgen_futures`) when running logic accessible by the main UI thread.",
    "good_code": "use futures::lock::Mutex;\nuse std::sync::Arc;\nuse wasm_bindgen::prelude::*;\n\n#[wasm_bindgen]\npub async fn process_data_on_main_thread(state: Arc<Mutex<Vec<u8>>>) {\n    // FIX: Async non-blocking yield allows main browser event loop to stay responsive\n    let mut data = state.lock().await;\n    data.push(42);\n}",
    "verification": "Deploy the application to an environment with required Cross-Origin Isolation headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`). Execute high-contention worker operations while continuously verifying that the main UI thread frame rate remains steady.",
    "date": "2026-08-04",
    "id": 1785831698,
    "type": "error"
});