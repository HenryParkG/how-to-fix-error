window.onPostDataLoaded({
    "title": "Fixing Rust Async Cancellation Safety in Tokio Select",
    "slug": "rust-async-cancellation-safety-tokio",
    "language": "Rust",
    "code": "CancellationSafety",
    "tags": [
        "Rust",
        "Backend",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's async ecosystem, cancellation safety is a critical but often overlooked concept. When using <code>tokio::select!</code>, the branches that do not complete are immediately dropped. If a future is dropped while it holds intermediate state (like data read from a socket but not yet processed), that data is lost forever. This is particularly dangerous in network protocols where a partial read can desynchronize the stream.</p>",
    "root_cause": "The tokio::select! macro drops the futures of all branches that did not finish. If a future is not 'cancellation safe', dropping it mid-execution results in the loss of any state that wasn't persisted outside the future.",
    "bad_code": "loop {\n    tokio::select! {\n        res = socket.read(&mut buf) => {\n            process(res?);\n        }\n        _ = timeout(Duration::from_secs(1)) => {\n            println!(\"Timed out\");\n        }\n    }\n}",
    "solution_desc": "To ensure cancellation safety, move the stateful operation (like reading from a stream) outside the select loop or use a persistent buffer. For network streams, use a 'framed' approach or manually manage a buffer that survives across loop iterations by pinning the future.",
    "good_code": "let mut reader = BufReader::new(socket);\nloop {\n    let read_fut = reader.fill_buf();\n    pin_mut!(read_fut);\n    tokio::select! {\n        res = read_fut => {\n            let amt = res?.len();\n            process(&res?);\n            reader.consume(amt);\n        }\n        _ = timeout => { /* ... */ }\n    }\n}",
    "verification": "Use loom for concurrency testing or write a unit test that drops the future halfway through a multi-step process and verify that the internal state is preserved.",
    "date": "2026-02-22",
    "id": 1771742236,
    "type": "error"
});