window.onPostDataLoaded({
    "title": "Rust: Fixing Async Cancellation Safety in select! Blocks",
    "slug": "rust-async-cancellation-safety-select",
    "language": "Rust",
    "code": "AsyncCancellationError",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's asynchronous ecosystem, particularly with the <code>tokio::select!</code> macro, cancellation safety is a critical concern. When <code>select!</code> is used, all branches are polled. As soon as one branch completes, all other branches are immediately dropped. If a future is dropped at an <code>await</code> point where it was holding state or midway through an I/O operation, that data is permanently lost. This is particularly dangerous when performing operations like <code>TcpStream::read</code> into a temporary buffer within the <code>select!</code> block.</p>",
    "root_cause": "The future in a non-completing select! branch is dropped. If that future was responsible for an atomic operation or held partially read data in its internal state, that state is discarded without a chance to recover.",
    "bad_code": "loop {\n    let mut buf = [0u8; 1024];\n    tokio::select! {\n        res = socket.read(&mut buf) => {\n            process(res?);\n        }\n        _ = timeout => {\n            return Err(Error::Timeout);\n        }\n    }\n}",
    "solution_desc": "To ensure cancellation safety, state must be preserved across iterations. Instead of using a local buffer inside the loop, move the future itself outside the loop or use a persistent buffer/wrapper that handles partial reads (like `tokio_util::codec`). Using `Box::pin` on the future allows it to be resumed even if the `select!` block restarts.",
    "good_code": "let mut reader = tokio_util::codec::FramedRead::new(socket, BytesCodec::new());\nloop {\n    tokio::select! {\n        frame = reader.next() => {\n            if let Some(res) = frame { process(res?); }\n        }\n        _ = timeout => {\n            return Err(Error::Timeout);\n        }\n    }\n}",
    "verification": "Use 'tokio-test' to simulate partial reads and ensure that dropping the future between reads doesn't result in data loss.",
    "date": "2026-02-16",
    "id": 1771224884,
    "type": "error"
});