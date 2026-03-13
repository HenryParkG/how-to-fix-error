window.onPostDataLoaded({
    "title": "Mitigating OCaml 5 Multicore Domain Contention",
    "slug": "ocaml-multicore-domain-contention",
    "language": "OCaml",
    "code": "Performance Bottleneck",
    "tags": [
        "Rust",
        "Backend",
        "OCaml",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.x introduced true parallelism with Domains. However, parallel stream processing often suffers from severe performance degradation due to Domain contention. This usually happens when multiple domains frequently access the shared major heap or contend for the global interpreter lock mechanisms during garbage collection (GC) synchronization.</p><p>In parallel stream processing, if threads allocate many short-lived objects that get promoted to the major heap, the 'Stop-the-world' phases of the GC become a bottleneck. Furthermore, using unoptimized synchronization primitives like shared Mutexes across Domains can lead to cache-line bouncing and significant latency spikes.</p>",
    "root_cause": "Excessive allocation in the shared heap during parallel processing, triggering frequent global GC synchronization and lock contention on shared mutable structures.",
    "bad_code": "let process_stream s =\n  Domainslib.Task.parallel_for pool ~start:0 ~finish:(Array.length s - 1)\n    ~body:(fun i -> \n      (* Expensive allocation in shared heap *)\n      s.(i) <- compute_and_allocate_new_object s.(i))",
    "solution_desc": "Refactor to use Domain-local storage where possible and minimize allocations within the parallel loop. Use the 'Domainslib' library with work-stealing queues and ensure that shared state is handled via atomic operations or immutable data structures to reduce synchronization overhead.",
    "good_code": "let process_stream pool s =\n  let task () = \n    Domainslib.Task.parallel_for pool ~start:0 ~finish:(Array.length s - 1)\n      ~body:(fun i -> \n        let result = compute_optimized_in_place s.(i) in\n        s.(i) <- result) in\n  Domainslib.Task.run pool task",
    "verification": "Use the 'olr' (OCaml Latency Profiler) or 'eventlog-tools' to visualize GC pauses and domain idle time to ensure linear scaling with core count.",
    "date": "2026-03-13",
    "id": 1773376170,
    "type": "error"
});