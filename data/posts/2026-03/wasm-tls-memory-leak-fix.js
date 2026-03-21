window.onPostDataLoaded({
    "title": "Fixing Thread-Local Storage Memory Leaks in WASM",
    "slug": "wasm-tls-memory-leak-fix",
    "language": "TypeScript",
    "code": "TLS_Leak",
    "tags": [
        "TypeScript",
        "Rust",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In multi-threaded WebAssembly (using Web Workers and SharedArrayBuffer), Thread-Local Storage (TLS) is allocated when a thread starts. However, unlike native OS threads, Wasm runtimes often don't have a standard 'pthread_join' hook that automatically triggers the deconstruction of TLS memory.</p><p>If you spawn and terminate Web Workers frequently, each worker leaves behind a block of memory in the shared heap designated for its `__tls_base`. Over time, this results in an OOM (Out of Memory) crash even if the main application logic is leak-free.</p>",
    "root_cause": "The Wasm linker reserves space for TLS variables, but the logic to free this space on worker termination is not implicitly called by the browser's Web Worker API.",
    "bad_code": "/* Rust side */\nthread_local! { static CACHE: RefCell<Vec<u8>> = RefCell::new(vec![0; 1024 * 1024]); }\n\n// In JS/TS\nconst worker = new Worker('wasm_worker.js');\n// ... work ...\nworker.terminate(); // CACHE memory is leaked forever",
    "solution_desc": "Manually manage the lifecycle of the worker. Instead of calling `worker.terminate()`, send a 'shutdown' message to the Wasm module to allow it to run its own destructors and clean up TLS before the worker context is destroyed. Alternatively, use a thread pool to reuse workers and their allocated TLS blocks.",
    "good_code": "// JS/TS: Signal shutdown instead of immediate termination\nworker.postMessage({ type: 'SHUTDOWN' });\n\n/* Rust: Handle shutdown */\n#[no_mangle]\npub extern \"C\" fn cleanup_threads() {\n    // Use a crate like 'wasm-mt' or manual drop to clear TLS\n    CACHE.with(|c| c.borrow_mut().clear());\n}",
    "verification": "Use Chrome DevTools Memory tab to take a heap snapshot. Search for `__tls_base` allocations and ensure the count doesn't increase with every worker cycle.",
    "date": "2026-03-21",
    "id": 1774074754,
    "type": "error"
});