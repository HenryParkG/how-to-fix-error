window.onPostDataLoaded({
    "title": "Fix Rust Async Cancellation in Multiplexed Drivers",
    "slug": "fix-rust-async-cancellation-hazards-multiplexed-stream",
    "language": "Rust",
    "code": "AsyncCancelDrop",
    "tags": [
        "Rust",
        "Async",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In Rust asynchronous network drivers, multiplexed protocols allow multiple concurrent logical requests over a single shared I/O stream. A recurring hazard occurs when a client future driving a request-response cycle is cancelled\u2014typically via <code>tokio::select!</code> or a timeout branch. When an async future is dropped mid-execution, its execution stops immediately at the current <code>.await</code> point.</p><p>If the future is cancelled after writing a request frame to the socket but before registering an in-flight response handle or awaiting the response, the multiplexer state becomes desynchronized. The remote peer eventually processes the request and responds, but the multiplexer has no matching channel receiver for that sequence ID. Worse, if cancellation occurs in the middle of writing a framed byte payload, subsequent framed messages are written into the middle of the previous frame, corrupting the entire TCP byte stream.</p>",
    "root_cause": "Dropping a future while holding partial framing state or before associating a correlation ID in the shared pending table leads to socket stream corruption and unroutable orphan responses on multiplexed streams.",
    "bad_code": "use tokio::io::AsyncWriteExt;\n\npub async fn send_request(stream: &mut tokio::net::TcpStream, req_id: u32, payload: &[u8]) -> Result<Vec<u8>, std::io::Error> {\n    // Hazard: If dropped during write_all, stream is left with partial frame\n    stream.write_u32(req_id).await?;\n    stream.write_u32(payload.len() as u32).await?;\n    stream.write_all(payload).await?;\n\n    // Hazard: Cancellation here drops the receiver, leaking req_id on peer\n    let response = read_response(stream, req_id).await?;\n    Ok(response)\n}",
    "solution_desc": "Decouple stream I/O from caller futures by running an isolated background actor task. Callers submit requests through unbounded or bounded channels accompanied by an oneshot response channel. The background task owns the socket exclusively, ensuring atomic frame encoding that cannot be cancelled midway by caller timeouts.",
    "good_code": "use tokio::sync::{mpsc, oneshot};\n\nstruct RequestMsg {\n    payload: Vec<u8>,\n    respond_to: oneshot::Sender<Result<Vec<u8>, std::io::Error>>,\n}\n\n#[derive(Clone)]\npub struct MultiplexClient {\n    sender: mpsc::Sender<RequestMsg>,\n}\n\nimpl MultiplexClient {\n    pub async fn send(&self, payload: Vec<u8>) -> Result<Vec<u8>, std::io::Error> {\n        let (resp_tx, resp_rx) = oneshot::channel();\n        let msg = RequestMsg { payload, respond_to: resp_tx };\n\n        // Channel send is cancel-safe; if dropped here, nothing reached the wire\n        self.sender.send(msg).await\n            .map_err(|_| std::io::Error::new(std::io::ErrorKind::BrokenPipe, \"driver dead\"))?;\n\n        // If resp_rx is cancelled by caller timeout, driver completes frame safely\n        // and drops the oneshot without corrupting stream framing\n        resp_rx.await.map_err(|_| std::io::Error::new(std::io::ErrorKind::ConnectionAborted, \"request cancelled\"))?\n    }\n}",
    "verification": "Inject artificial timeouts using `tokio::time::timeout` during high-throughput concurrent payload transmission. Verify with protocol assertions that no frame interleaving occurs, framing decoders do not throw `InvalidFrameSize` errors, and the connection remains alive.",
    "date": "2026-10-25",
    "id": 1792894930,
    "type": "error"
});