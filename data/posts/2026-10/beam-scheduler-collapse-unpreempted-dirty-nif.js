window.onPostDataLoaded({
    "title": "Prevent BEAM Scheduler Collapse from Dirty NIFs",
    "slug": "beam-scheduler-collapse-unpreempted-dirty-nif",
    "language": "Rust",
    "code": "ERL_NIF_DIRTY_SCHEDULER_COLLAPSE",
    "tags": [
        "Rust",
        "Erlang",
        "Elixir",
        "Concurrency",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>The Erlang Virtual Machine (BEAM) relies on cooperative, reduction-based preemptive multitasking. Standard BEAM schedulers execute Erlang processes in tight time-slices allocated by reduction counters (typically 4,000 reductions, equivalent to roughly 1 millisecond of execution). When native code is introduced via Native Implemented Functions (NIFs), the VM surrenders preemption control to the native shared library.</p><p>If a NIF performs CPU-heavy operations\u2014such as cryptographic hashing, image compression, or matrix transformations\u2014without yielding execution back to the runtime or delegating the workload to dirty schedulers, the underlying BEAM scheduler thread becomes completely blocked. When concurrent client requests invoke these unyielding NIFs, all available normal schedulers become saturated. This triggers scheduler starvation: system-level housekeeping, distributed node heartbeats (tick times), garbage collection passes, and socket I/O events are prevented from running. As a result, the entire node collapses, experiencing false net-splits, cascading GenServer call timeouts, and fatal runtime watchdog crashes.</p>",
    "root_cause": "Synchronous, long-running (>1ms) native CPU loops executing directly on normal BEAM scheduler threads instead of leveraging enif_consume_timeslice cooperative yielding or enif_schedule_nif with ERL_NIF_DIRTY_JOB_CPU_BOUND (or Rustler's schedule = \"DirtyCpu\").",
    "bad_code": "use rustler::{Encoder, Env, NifResult, Term};\n\n// BUG: Running heavy computational work on the primary BEAM scheduler\n#[rustler::nif]\nfn heavy_crypto_transform(env: Env, input_data: Vec<u8>) -> NifResult<Term> {\n    let mut state = input_data;\n    // Unpreempted loop executing for > 50ms, blocking the normal scheduler\n    for _ in 0..1_000_000 {\n        for byte in state.iter_mut() {\n            *byte = byte.wrapping_mul(31).wrapping_add(17);\n        }\n    }\n    Ok(state.encode(env))\n}",
    "solution_desc": "Configure the NIF boundary to offload CPU-bound calculations to BEAM dirty CPU schedulers. In Rustler, declare the NIF attribute with `schedule = \"DirtyCpu\"`. For chunkable computations that must run on normal schedulers, cooperatively measure elapsed work and invoke `enif_consume_timeslice` to surrender control and re-queue execution when reductions are exhausted.",
    "good_code": "use rustler::{Encoder, Env, NifResult, Term};\n\n// FIXED: Offload long-running CPU workloads to Dirty CPU Schedulers,\n// isolating the primary schedulers from stalls and starvation.\n#[rustler::nif(schedule = \"DirtyCpu\")]\nfn heavy_crypto_transform(env: Env, input_data: Vec<u8>) -> NifResult<Term> {\n    let mut state = input_data;\n    for _ in 0..1_000_000 {\n        for byte in state.iter_mut() {\n            *byte = byte.wrapping_mul(31).wrapping_add(17);\n        }\n    }\n    Ok(state.encode(env))\n}",
    "verification": "Deploy the NIF and run synthetic load tests. Inspect system schedulers in the Elixir/Erlang console using `:scheduler.utilization(1)`. Verify that normal schedulers (`:erlang.system_info(:schedulers)`) maintain responsive sub-millisecond dispatch times and that heavy workloads are cleanly routed to dirty schedulers (`:erlang.system_info(:dirty_cpu_schedulers)`).",
    "date": "2026-10-26",
    "id": 1793002887,
    "type": "error"
});