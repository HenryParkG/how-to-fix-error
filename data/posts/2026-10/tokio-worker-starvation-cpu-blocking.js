window.onPostDataLoaded({
    "title": "Fixing Tokio Worker Starvation from CPU Tasks",
    "slug": "tokio-worker-starvation-cpu-blocking",
    "language": "Rust",
    "code": "WorkerStarvation",
    "tags": [
        "Tokio",
        "Concurrency",
        "Performance",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Tokio relies on a cooperative work-stealing scheduler where worker threads multiplex many async tasks. Unlike preemptive operating system threads, an async task in Tokio must explicitly surrender control by hitting an <code>.await</code> point that yields back to the runtime.</p><p>When computationally expensive operations (such as cryptographic hashing, large JSON deserialization, or intensive matrix math) run inside an <code>async fn</code> without yielding, that single task holds the worker thread hostage. This triggers worker starvation: incoming I/O events wait in the local or injection queue, timers misfire, and heartbeat deadlines expire, leading to cascading service timeouts.</p>",
    "root_cause": "Synchronous, long-running compute loops executed directly on async event loops prevent cooperative task switching and starve concurrent tasks sharing the Tokio worker thread.",
    "bad_code": "use tokio::net::TcpListener;\nuse serde::Deserialize;\n\n#[derive(Deserialize)]\nstruct LargePayload { data: Vec<u8> }\n\nasync fn process_connection(raw_bytes: &[u8]) -> Result<String, String> {\n    // BUG: Expensive CPU-bound deserialization and hash calculation directly\n    // blocks the Tokio worker thread for tens of milliseconds.\n    let payload: LargePayload = bincode::deserialize(raw_bytes)\n        .map_err(|e| e.to_string())?;\n    \n    let hash = argon2::hash_encoded(&payload.data, b\"staticsalt\", &argon2::Config::default())\n        .map_err(|e| e.to_string())?;\n    \n    Ok(hash)\n}",
    "solution_desc": "Delegate CPU-bound or blocking operations to Tokio's dedicated blocking pool using `tokio::task::spawn_blocking`. This offloads heavy computation to a dynamic thread pool distinct from the core event-loop worker threads. For loops that cannot be easily moved off-thread, insert `tokio::task::yield_now().await` intermittently to permit cooperative scheduling.",
    "good_code": "use tokio::task;\nuse serde::Deserialize;\n\n#[derive(Deserialize, Send + 'static)]\nstruct LargePayload { data: Vec<u8> }\n\nasync fn process_connection(raw_bytes: Vec<u8>) -> Result<String, String> {\n    // Offload CPU-heavy computation to the blocking thread pool\n    task::spawn_blocking(move || {\n        let payload: LargePayload = bincode::deserialize(&raw_bytes)\n            .map_err(|e| e.to_string())?;\n        \n        let hash = argon2::hash_encoded(&payload.data, b\"staticsalt\", &argon2::Config::default())\n            .map_err(|e| e.to_string())?;\n        \n        Ok(hash)\n    })\n    .await\n    .map_err(|join_err| join_err.to_string())?\n}",
    "verification": "Enable `tokio-console` instrumentation and track `poll_duration_histogram`. Starvation is resolved when average task poll times drop beneath sub-millisecond thresholds and worker thread park/unpark distributions remain balanced under high concurrent load.",
    "date": "2026-10-15",
    "id": 1792072094,
    "type": "error"
});