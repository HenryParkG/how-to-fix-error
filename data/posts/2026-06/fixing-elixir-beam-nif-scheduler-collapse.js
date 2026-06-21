window.onPostDataLoaded({
    "title": "Fixing Elixir BEAM NIF Scheduler Collapse",
    "slug": "fixing-elixir-beam-nif-scheduler-collapse",
    "language": "Elixir / Rust",
    "code": "BEAM Reduction Starvation",
    "tags": [
        "Rust",
        "Elixir",
        "Erlang",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>The Erlang BEAM virtual machine relies on preemptive scheduling, where each process is allocated a budget of 2,000 \"reductions\" (roughly equivalent to function calls). Once this budget is exhausted, the scheduler yields control to the next process, ensuring soft real-time guarantees. However, when a Native Implemented Function (NIF) written in C or Rust is executed, it runs on the scheduler's OS thread. Because the BEAM cannot preempt native code execution, a long-running NIF blocks the entire scheduler thread.</p><p>This causes scheduler collapse, leading to reduction starvation. Since GenServers waiting for replies run on the stalled scheduler or depend on processes assigned to it, cascade timeouts occur. The default 5000ms timeout triggers a domino effect, leading to VM-wide instability and heartbeat failures.</p>",
    "root_cause": "An intensive CPU or blocking I/O operation is executed inside a synchronous NIF on a dirty-unaware BEAM scheduler thread, violating the 1-millisecond execution rule for native code and starving other processes.",
    "bad_code": "// A Rustler NIF that blocks the scheduler thread during heavy cryptographic calculations\n#[rustler::nif]\nfn heavy_compute(data: String) -> String {\n    // Blocking CPU-intensive operation running directly on the standard scheduler\n    let result = perform_heavy_sha3_rounds(&data);\n    result\n}",
    "solution_desc": "Configure the Rustler NIF to run on a Dirty CPU scheduler instead of the normal scheduler pool. This offloads the intensive computation to a dedicated thread pool managed by the BEAM, preventing starvation on the main schedulers.",
    "good_code": "// Fixed NIF offloaded to the BEAM's Dirty CPU Scheduler pool\n#[rustler::nif(schedule = \"DirtyCpu\")]\nfn heavy_compute(data: String) -> String {\n    // Safe to block here as it runs on the dedicated dirty scheduler thread pool\n    let result = perform_heavy_sha3_rounds(&data);\n    result\n}",
    "verification": "Compile the NIF and run load tests. Execute `:observer.start()` to monitor scheduler utilization. Verify that standard scheduler threads remain responsive and GenServer timeouts drop to zero while the Dirty Schedulers CPU utilization rises.",
    "date": "2026-06-21",
    "id": 1782026858,
    "type": "error"
});