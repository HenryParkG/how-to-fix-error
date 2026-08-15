window.onPostDataLoaded({
    "title": "Fixing Rust Async Cancellation Safety in Tokio select!",
    "slug": "rust-async-cancellation-safety-tokio-select",
    "language": "Rust",
    "code": "CancellationHazard",
    "tags": [
        "Rust",
        "Tokio",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust's async ecosystem, <code>tokio::select!</code> operates by polling multiple branches simultaneously. As soon as one branch completes, the remaining losing branches are instantly dropped. If a branch is awaiting an operation that holds non-idempotent state (such as partial buffer reads, lock acquisitions, or multi-step network protocol handshakes), dropping that future midway destroys the state and leads to silent data corruption, lost messages, or broken transport streams.</p><p>A common cancellation hazard arises when invoking <code>AsyncReadExt::read</code> or channel operations directly inside the macro branch within a loop. When the other branch resolves (such as a timeout or cancellation token), the partially filled buffer is discarded, and the subsequent loop iteration creates a new future that starts reading anew, discarding bytes already pulled off the socket.</p>",
    "root_cause": "Dropping a non-cancellation-safe Future (like AsyncReadExt::read or transactional async writes) at an await point inside tokio::select!, which discards partially read bytes or incomplete state between loop iterations.",
    "bad_code": "use tokio::io::{self, AsyncReadExt};\nuse tokio::net::TcpStream;\nuse tokio::sync::mpsc;\n\nasync fn process_stream(mut stream: TcpStream, mut rx: mpsc::Receiver<Vec<u8>>) -> io::Result<()> {\n    let mut buf = [0u8; 1024];\n    loop {\n        tokio::select! {\n            // BUG: read(&mut buf) is NOT cancellation safe across select! loops.\n            // If rx.recv() completes while stream is partially read, bytes are lost.\n            n = stream.read(&mut buf) => {\n                let n = n?;\n                if n == 0 { break; }\n                println!(\"Received: {:?}\", &buf[..n]);\n            }\n            Some(msg) = rx.recv() => {\n                println!(\"Priority message: {:?}\", msg);\n            }\n        }\n    }\n    Ok(())\n}",
    "solution_desc": "To make stream consumption cancellation-safe, use `tokio_util::codec` with `FramedRead` or leverage `tokio::io::AsyncReadExt::read_buf` with a persistent `bytes::BytesMut` buffer defined outside the loop scope. Alternatively, pin the future outside the `select!` macro so it retains internal progress across iterations without restarting from byte zero.",
    "good_code": "use tokio::io::{self, AsyncReadExt};\nuse tokio::net::TcpStream;\nuse tokio::sync::mpsc;\nuse bytes::BytesMut;\n\nasync fn process_stream(mut stream: TcpStream, mut rx: mpsc::Receiver<Vec<u8>>) -> io::Result<()> {\n    let mut buf = BytesMut::with_capacity(4096);\n    loop {\n        tokio::select! {\n            // read_buf appends to BytesMut and is cancellation safe;\n            // bytes read before cancellation remain in 'buf'.\n            res = stream.read_buf(&mut buf) => {\n                let n = res?;\n                if n == 0 && buf.is_empty() { break; }\n                let data = buf.split().freeze();\n                println!(\"Received: {:?}\", data);\n            }\n            Some(msg) = rx.recv() => {\n                println!(\"Priority message: {:?}\", msg);\n            }\n        }\n    }\n    Ok(())\n}",
    "verification": "Run unit and integration tests with simulated network jitter and frequent cancellation triggers. Verify using `tokio::time::sleep` interleaved with stream reads that zero packet loss occurs and checksum validations match expected network payloads.",
    "date": "2026-08-15",
    "id": 1786754461,
    "type": "error"
});