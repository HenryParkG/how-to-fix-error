window.onPostDataLoaded({
    "title": "Fixing Rust Async Cancellation Safety & Inconsistent Drop",
    "slug": "rust-async-cancellation-safety-drop-inconsistencies",
    "language": "Rust",
    "code": "AsyncCancellationLeak",
    "tags": [
        "Rust",
        "Concurrency",
        "Tokio",
        "Error Fix"
    ],
    "analysis": "<p>In Rust asynchronous runtimes like Tokio, cancellation occurs when a future is dropped before completing execution. This commonly happens inside macros like <code>tokio::select!</code> or when a timeout future resolves first. When a future is dropped at an arbitrary <code>.await</code> point, any partially completed operations, non-atomic multi-step state mutations, or intermediate resource locks risk being dropped without clean recovery.</p><p>This leads to cancellation safety bugs: state stored in shared references (e.g., behind a <code>Mutex</code> or across framing buffers) becomes corrupt or de-synchronized. Subsequent tasks that acquire the shared lock observe half-written frames, partially consumed streams, or leaked transaction invariants, causing deadlocks or protocol violations.</p>",
    "root_cause": "Dropping a future across yield points while holding intermediate state in a persistent buffer or struct, causing resources to be dropped mid-operation without rollback or transaction completion.",
    "bad_code": "use tokio::io::{AsyncReadExt, AsyncWriteExt};\nuse tokio::net::TcpStream;\nuse tokio::sync::Mutex;\nuse std::sync::Arc;\n\nstruct Session {\n    stream: TcpStream,\n    buffer: Vec<u8>,\n}\n\nasync fn process_command(session: Arc<Mutex<Session>>) -> Result<(), std::io::Error> {\n    let mut lock = session.lock().await;\n    let mut header = [0u8; 4];\n    // Cancellation point 1: If dropped here, header is lost\n    lock.stream.read_exact(&mut header).await?;\n    let len = u32::from_be_bytes(header) as usize;\n    \n    lock.buffer.resize(len, 0);\n    // Cancellation point 2: If dropped here, buffer has invalid size\n    // and the stream position is desynchronized with the buffer payload\n    lock.stream.read_exact(&mut lock.buffer).await?;\n    \n    Ok(())\n}",
    "solution_desc": "Maintain invariant consistency by ensuring operations across await points are cancellation-safe. Read into local stack buffers first before mutating shared state, or use a dedicated transaction guard/actor pattern where cancel-safe message passing decouples stream I/O from shared state mutation.",
    "good_code": "use tokio::io::AsyncReadExt;\nuse tokio::net::TcpStream;\nuse tokio::sync::Mutex;\nuse std::sync::Arc;\n\nstruct Session {\n    stream: TcpStream,\n    buffer: Vec<u8>,\n}\n\nasync fn process_command(session: Arc<Mutex<Session>>) -> Result<(), std::io::Error> {\n    let mut lock = session.lock().await;\n    // Read everything into a detached local buffer first\n    let mut header = [0u8; 4];\n    lock.stream.read_exact(&mut header).await?;\n    let len = u32::from_be_bytes(header) as usize;\n\n    let mut payload = vec![0u8; len];\n    // If cancelled here, lock.buffer remains intact and clean\n    lock.stream.read_exact(&mut payload).await?;\n\n    // Commit atomic state update without await points\n    lock.buffer = payload;\n    Ok(())\n}",
    "verification": "Test with `tokio_test::task` and simulate cancellation by driving the future with `poll()` and dropping it after reading headers, verifying shared state remains intact.",
    "date": "2026-10-18",
    "id": 1792289495,
    "type": "error"
});