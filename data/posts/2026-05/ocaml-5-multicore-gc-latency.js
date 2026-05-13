window.onPostDataLoaded({
    "title": "OCaml 5.x GC Latency in Multicore Effects",
    "slug": "ocaml-5-multicore-gc-latency",
    "language": "OCaml",
    "code": "Latency Spike",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.x introduced shared-memory parallelism and algebraic effect handlers. While this enables high-performance concurrent systems, it introduces new garbage collection (GC) dynamics. Latency spikes often occur during 'Major GC' cycles because the parallel minor collector must synchronize all domains (cores). When using effect handlers, the frequent allocation and capture of continuations (fibers) can pressure the major heap faster than traditional code.</p><p>Because OCaml 5 uses a 'stop-the-world' mechanism for certain phases of the major cycle to maintain memory consistency across domains, a single domain with high allocation rates can cause latency for all other domains.</p>",
    "root_cause": "High promotion rates of short-lived effect continuations into the major heap, triggering frequent major GC slices that synchronize all domains.",
    "bad_code": "(* Creating new effects in a tight loop without reuse *)\nlet rec loop n =\n  if n > 0 then\n    let _ = perform MyEffect in\n    loop (n - 1)\n  else ()\n\n(* This causes massive allocation of continuation objects *)",
    "solution_desc": "Optimize the GC parameters by increasing the 'minor_heap_size' to keep continuations in the fast minor heap longer. Additionally, tune the 'major_heap_increment' and 'space_overhead' to reduce the frequency of major cycles. For effect-heavy code, use fiber pooling techniques where possible.",
    "good_code": "(* Adjusting GC settings for multicore performance *)\nlet () = \n  let stat = Gc.get () in\n  Gc.set { stat with \n    minor_heap_size = 1024 * 1024 * 16; (* 16MB minor heap *)\n    space_overhead = 120;             (* More aggressive growth *)\n    max_overhead = 1000000;           (* Reduce compaction frequency *)\n  }",
    "verification": "Use the 'ocaml-eventlog-trace' tool or 'runtime_events' to visualize GC pauses and domain synchronization times.",
    "date": "2026-05-13",
    "id": 1778653132,
    "type": "error"
});