window.onPostDataLoaded({
    "title": "Resolving Elixir BEAM Scheduler NIF Blocking",
    "slug": "resolving-elixir-beam-scheduler-nif-blocking",
    "language": "Rust",
    "code": "SchedulerCollapse",
    "tags": [
        "Rust",
        "Backend",
        "Elixir",
        "Error Fix"
    ],
    "analysis": "<p>The Erlang VM (BEAM) relies on cooperative, preemptive scheduling where each scheduler thread runs on a single CPU core. When a Native Implemented Function (NIF) written in C or Rust (via Rustler) executes, it runs directly on the scheduler thread. If the NIF performs synchronous, long-running CPU calculations, disk I/O, or network calls, it blocks the scheduler thread completely.</p><p>If multiple schedulers are blocked by such NIFs, the BEAM cannot run other Erlang processes, leading to starvation, high latency, missed heartbeats, and complete system collapse. In BEAM environments, any NIF execution exceeding 1 millisecond must be offloaded from normal schedulers.</p>",
    "root_cause": "Executing a blocking or computationally expensive NIF directly on a standard BEAM scheduler thread for longer than 1ms without utilizing Dirty Schedulers.",
    "bad_code": "#[rustler::nif]\nfn heavy_computation(data: String) -> String {\n    // BUG: This blocking computation runs on a standard BEAM scheduler,\n    // blocking it completely for seconds.\n    let result = perform_expensive_crypto_hash(&data);\n    result\n}\n\nfn perform_expensive_crypto_hash(data: &str) -> String {\n    std::thread::sleep(std::time::Duration::from_millis(1500));\n    format!(\"{}-hashed\", data)\n}",
    "solution_desc": "Offload long-running computations to BEAM Dirty Schedulers. Erlang/Elixir supports Dirty Schedulers (either DirtyCpu for CPU-bound tasks or DirtyIo for I/O-bound tasks). Rustler makes this straightforward by specifying the scheduler flag in the NIF attribute.",
    "good_code": "#[rustler::nif(schedule = \"DirtyCpu\")]\nfn heavy_computation(data: String) -> String {\n    // Safe: Runs on a dirty scheduler pool, leaving normal schedulers free\n    let result = perform_expensive_crypto_hash(&data);\n    result\n}\n\nfn perform_expensive_crypto_hash(data: &str) -> String {\n    std::thread::sleep(std::time::Duration::from_millis(1500));\n    format!(\"{}-hashed\", data)\n}",
    "verification": "Run the application with ':observer.start()' under high concurrency. Verify that normal schedulers remain responsive with low utilization while dirty schedulers handle the heavy NIF operations.",
    "date": "2026-07-12",
    "id": 1783835286,
    "type": "error"
});