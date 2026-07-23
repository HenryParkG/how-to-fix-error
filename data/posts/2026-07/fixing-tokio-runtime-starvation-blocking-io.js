window.onPostDataLoaded({
    "title": "Fixing Tokio Runtime Starvation from Blocking I/O",
    "slug": "fixing-tokio-runtime-starvation-blocking-io",
    "language": "Rust",
    "code": "TaskStarvation",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput asynchronous Rust pipelines built on Tokio, executing synchronous blocking calls or CPU-bound operations directly within async tasks starves the runtime's cooperative multithreading engine.</p><p>Tokio relies on a fixed-size thread pool (typically matching the number of logical CPU cores). When an async worker thread executes blocking I/O (such as standard library file access or synchronous database calls) or long-running compute loops without yielding, that thread cannot poll other pending futures assigned to its local queue. Under load, this causes massive task latency spikes, reactor delays, and total queue starvation across the pipeline.</p>",
    "root_cause": "Synchronous, non-yielding operations executed directly on Tokio worker threads block the executor runtime, preventing other cooperative futures from being polled.",
    "bad_code": "use tokio::net::TcpStream;\nuse std::io::Read;\n\n#[tokio::main]\nasync fn main() {\n    let listener = tokio::net::TcpListener::bind(\"127.0.0.1:8080\").await.unwrap();\n    loop {\n        let (stream, _) = listener.accept().await.unwrap();\n        tokio::spawn(async move {\n            // BUG: std::fs synchronous blocking read inside async task\n            let mut file = std::fs::File::open(\"large_payload.dat\").unwrap();\n            let mut buffer = Vec::new();\n            file.read_to_end(&mut buffer).unwrap(); // Starves worker thread!\n            process_data(&buffer);\n        });\n    }\n}\n\nfn process_data(_buf: &[u8]) {}",
    "solution_desc": "Offload blocking filesystem or CPU-intensive tasks to Tokio's dedicated blocking thread pool using `tokio::task::spawn_blocking`, or replace standard blocking APIs with fully asynchronous non-blocking drivers like `tokio::fs`.",
    "good_code": "use tokio::fs::File;\nuse tokio::io::AsyncReadExt;\n\n#[tokio::main]\nasync fn main() {\n    let listener = tokio::net::TcpListener::bind(\"127.0.0.1:8080\").await.unwrap();\n    loop {\n        let (stream, _) = listener.accept().await.unwrap();\n        tokio::spawn(async move {\n            // FIX: Use async tokio::fs API or spawn_blocking\n            let mut file = File::open(\"large_payload.dat\").await.unwrap();\n            let mut buffer = Vec::new();\n            file.read_to_end(&mut buffer).await.unwrap(); // Non-blocking yield point\n            \n            // Alternatively for heavy CPU sync tasks:\n            // let buffer = tokio::task::spawn_blocking(move || {\n            //     read_sync_file()\n            // }).await.unwrap();\n            \n            process_data(&buffer);\n        });\n    }\n}\n\nfn process_data(_buf: &[u8]) {}",
    "verification": "Monitor worker thread latency and queue lengths using the `tokio-metrics` crate. Verify that mean task schedule duration remains below 1ms and no worker threads remain continuously occupied without yielding during load tests.",
    "date": "2026-07-23",
    "id": 1784785510,
    "type": "error"
});