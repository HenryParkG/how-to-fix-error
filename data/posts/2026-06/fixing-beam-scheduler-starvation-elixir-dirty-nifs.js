window.onPostDataLoaded({
    "title": "Fixing BEAM Scheduler Starvation in Elixir Dirty NIFs",
    "slug": "fixing-beam-scheduler-starvation-elixir-dirty-nifs",
    "language": "Elixir / Rust",
    "code": "Scheduler Starvation",
    "tags": [
        "Elixir",
        "Rust",
        "NIF",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang Virtual Machine (BEAM), high concurrency is achieved through cooperative scheduling. Schedulers run on native OS threads (usually one per CPU core) and execute Erlang/Elixir processes. Each process is allocated a reduction budget (typically 2000 reductions, roughly equivalent to function calls) before it must yield control back to the scheduler.</p><p>When developers invoke Native Implemented Functions (NIFs) written in C or Rust, the BEAM hands over execution to native machine code. If a NIF performs synchronous, heavy computations or blocking I/O that takes longer than 1 millisecond without yielding, it violates the cooperative model. This blocks the underlying scheduler thread. If multiple schedulers are blocked by long-running NIFs, BEAM experiences scheduler starvation. Symptoms include latency spikes in web requests, timeout cascades, and system heartbeat failures (causing nodes to be killed in clustered environments).</p>",
    "root_cause": "Invoking intensive CPU or blocking I/O operations inside a standard NIF context without yielding or designating the work to BEAM's dedicated dirty schedulers, resulting in the underlying OS thread being held hostage by native execution.",
    "bad_code": "// rustler NIF that performs heavy hashing synchronously on a regular scheduler\n#[rustler::nif]\nfn heavy_hash(input: String) -> String {\n    // This loop blocks the BEAM scheduler thread for 50ms+ \n    let mut hash = input;\n    for _ in 0..100_000 {\n        hash = sha256::digest(&hash);\n    }\n    hash\n}",
    "solution_desc": "To prevent scheduler starvation, NIFs must either yield control back to the BEAM or run on Dirty Schedulers. Dirty Schedulers are a pool of separate threads designed specifically for CPU-bound (:dirty_cpu) or I/O-bound (:dirty_io) operations that exceed the 1 millisecond execution threshold. In Rustler, you can mark a function as a dirty NIF using the schedule flag.",
    "good_code": "// rustler NIF offloaded to the dirty CPU scheduler pool\n#[rustler::nif(schedule = \"DirtyCpu\")]\nfn heavy_hash(input: String) -> String {\n    // Safe to run long computations here without starving normal schedulers\n    let mut hash = input;\n    for _ in 0..100_000 {\n        hash = sha256::digest(&hash);\n    }\n    hash\n}",
    "verification": "Monitor system scheduler utilization using Erlang's `:erlang.statistics(:scheduler_wall_time)`. Under load, standard schedulers should maintain low, balanced queues, while dirty CPU schedulers handle the heavy native tasks. You can also run Elixir's `:observer.start()` to visually confirm dirty scheduler thread utilization.",
    "date": "2026-06-17",
    "id": 1781664467,
    "type": "error"
});