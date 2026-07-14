window.onPostDataLoaded({
    "title": "Fixing Rust Async Cancellation and Drop Safety",
    "slug": "rust-async-cancellation-drop-safety",
    "language": "Rust",
    "code": "Drop Safety",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, asynchronous tasks are driven by futures, which can be dropped at any <code>await</code> point if the driver (such as <code>tokio::select!</code> or a timeout wrapper) decides to cancel the operation. This behavior, known as cancellation, poses a severe risk when implementing network protocols. If a future is cancelled mid-execution, state variables and socket buffers can be left in an inconsistent, half-written, or uncorrupted state.</p><p>This is especially dangerous when dealing with multi-frame protocol writes. If a task is interrupted while executing a write pipeline that spans across multiple internal <code>await</code> points, the socket remains open but the protocol stream is corrupted, leading to deserialization failures or state machines hanging permanently on subsequent reads.</p>",
    "root_cause": "The root cause is placing non-cancellation-safe operations across await boundaries. When tokio::select! drops a branch, execution ceases instantly at the last await point, dropping all local variables in that scope and leaving the underlying TCP stream containing only a partial frame header with no body.",
    "bad_code": "use tokio::io::{AsyncWriteExt, TcpStream};\n\nstruct ProtocolHandler {\n    stream: TcpStream,\n}\n\nimpl ProtocolHandler {\n    // DANGER: If cancelled during the body write, the header is sent\n    // but the payload is lost, corrupting the connection stream.\n    async fn send_frame(&mut self, payload: &[u8]) -> tokio::io::Result<()> {\n        let length = payload.len() as u32;\n        self.stream.write_all(&length.to_be_bytes()).await?;\n        // Interruption point: if cancelled here, downstream reader is stuck\n        self.stream.write_all(payload).await?;\n        Ok(())\n    }\n}",
    "solution_desc": "To ensure drop safety, write operations must be atomic and synchronous, or managed by a persistent buffer state machine that guarantees complete frame transmission. We can use `tokio_util::codec` with a custom Encoder, or buffer the entire payload into a contiguous memory structure before performing a single, non-interruptible asynchronous socket write operation, or spawn an independent task to guarantee completion.",
    "good_code": "use bytes::{BytesMut, BufMut};\nuse tokio::io::{AsyncWriteExt, TcpStream};\n\nstruct ProtocolHandler {\n    stream: TcpStream,\n    write_buffer: BytesMut,\n}\n\nimpl ProtocolHandler {\n    // SAFE: The entire frame is serialized into an in-memory buffer first.\n    // Even if cancelled, no partial frames are written to the TCP socket.\n    async fn send_frame(&mut self, payload: &[u8]) -> tokio::io::Result<()> {\n        self.write_buffer.clear();\n        self.write_buffer.put_u32(payload.len() as u32);\n        self.write_buffer.put_slice(payload);\n        \n        // A single write operation minimizes cancellation points. \n        // If cancelled here, either the whole buffer is sent or nothing is written.\n        self.stream.write_all(&self.write_buffer).await?;\n        Ok(())\n    }\n}",
    "verification": "Verify drop safety by writing an integration test where a connection handler executes writes under a highly aggressive `tokio::time::timeout`. Assert that upon timeout/cancellation, the stream is cleanly closed or successfully completes the packet without interleaving corrupted metadata.",
    "date": "2026-07-14",
    "id": 1783992616,
    "type": "error"
});