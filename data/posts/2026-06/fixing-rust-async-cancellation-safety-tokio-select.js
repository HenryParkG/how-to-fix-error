window.onPostDataLoaded({
    "title": "Fixing Rust Async Cancellation Safety in Tokio Select",
    "slug": "fixing-rust-async-cancellation-safety-tokio-select",
    "language": "Rust",
    "code": "Cancellation Safety Violation",
    "tags": [
        "Rust",
        "Async",
        "Tokio",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's async ecosystem, cancellation safety is a critical contract. When using <code>tokio::select!</code>, all branches run concurrently. Once one branch completes, the remaining branches are dropped. If a dropped branch was holding intermediate state (such as partial data read from an asynchronous stream or a network socket into a local stack variable), that state is permanently lost.</p><p>This behavior leads to quiet, hard-to-debug data corruption or protocol violations, especially under heavy network load where socket reads are frequently cancelled midway. Safe futures must either complete atomically or preserve their state across selection loops.</p>",
    "root_cause": "When a future in a tokio::select! branch is dropped, its execution stops immediately at its last yield point. If that future was mid-way through an operation like reading from an AsyncRead wrapper using a temporary buffer, the partially read bytes are discarded from memory, corrupting the stream framing for subsequent reads.",
    "bad_code": "use tokio::io::{AsyncReadExt, AsyncWriteExt};\nuse tokio::net::TcpStream;\n\nasync fn handle_connection(mut stream: TcpStream) -> Result<(), Box<dyn std::error::Error>> {\n    let mut buffer = [0u8; 1024];\n    loop {\n        tokio::select! {\n            // BAD: If the timeout branch fires, the read future is dropped.\n            // Any bytes partially read into the internal socket buffer but not yet returned are lost.\n            res = stream.read(&mut buffer) => {\n                let n = res?;\n                if n == 0 { break; }\n                println!(\"Received: {:?}\", &buffer[..n]);\n            }\n            _ = tokio::time::sleep(tokio::time::Duration::from_secs(5)) => {\n                println!(\"No data received for 5 seconds, keeping alive...\");\n            }\n        }\n    }\n    Ok(())\n}",
    "solution_desc": "To ensure cancellation safety, preserve the reader's state across select iterations. Instead of calling `read()` directly in the select loop, use framed readers from `tokio_util::codec` or keep the asynchronous read future pinned outside the loop using `tokio::pin!`. Alternatively, use methods like `readable()` and non-blocking reads, ensuring that no state is owned by a transient future dropped on cancellation.",
    "good_code": "use tokio::net::TcpStream;\nuse tokio_util::codec::{Decoder, BytesCodec};\nuse futures::StreamExt;\n\nasync fn handle_connection_safe(stream: TcpStream) -> Result<(), Box<dyn std::error::Error>> {\n    // GOOD: Using a codec/stream ensures that partial frames are buffered \n    // inside the decoder and not lost when branches are cancelled.\n    let mut framed_reader = BytesCodec::new().framed(stream);\n    \n    loop {\n        tokio::select! {\n            res = framed_reader.next() => {\n                match res {\n                    Some(Ok(bytes)) => {\n                        println!(\"Received: {:?}\", bytes);\n                    }\n                    Some(Err(e)) => return Err(e.into()),\n                    None => break,\n                }\n            }\n            _ = tokio::time::sleep(tokio::time::Duration::from_secs(5)) => {\n                println!(\"No data received for 5 seconds, keeping alive...\");\n            }\n        }\n    }\n    Ok(())\n}",
    "verification": "Compile the code and write a unit test using `tokio-test` where a stream is partially written to, a cancellation trigger is pulled (simulated by a mock timer), and verify that subsequent reads correctly consume the full, continuous payload without bytes dropping out of order.",
    "date": "2026-06-08",
    "id": 1780886565,
    "type": "error"
});