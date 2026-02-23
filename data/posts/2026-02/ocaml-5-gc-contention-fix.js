window.onPostDataLoaded({
    "title": "Solving OCaml 5 Multicore GC Contention",
    "slug": "ocaml-5-gc-contention-fix",
    "language": "Rust",
    "code": "RuntimeLatencySpike",
    "tags": [
        "Rust",
        "Backend",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore support introduces a parallel minor collector. However, high-concurrency runtimes often experience contention at the 'Domain' level. When multiple domains allocate rapidly in the minor heap, the synchronization cost of the stop-the-world minor GC phase scales poorly, leading to tail latency spikes in parallel workloads.</p>",
    "root_cause": "Frequent synchronization barriers caused by small minor heap sizes and excessive promotion of short-lived objects to the shared major heap.",
    "bad_code": "let run_parallel () = \n  Domainslib.Task.parallel_for pool ~start:0 ~finish:1000 ~body:(fun _ -> \n    let _ = List.init 100000 (fun i -> i) in () (* High allocation rate *)\n  )",
    "solution_desc": "Increase the minor heap size to reduce GC frequency and use 'pooling' for long-lived objects to avoid major heap promotion. Adjust the 'max_percentage_free' to be more aggressive in reclaiming memory.",
    "good_code": "let setup_runtime () = \n  let ctrl = Gc.get () in\n  Gc.set { ctrl with minor_heap_size = 1024 * 1024 * 16; (* 16MB per domain *)\n                     space_overhead = 100 };\n  let pool = Domainslib.Task.setup_pool ~num_domains:8 () in\n  pool",
    "verification": "Monitor 'major_words' and 'minor_collections' using the OCaml Runtime Events library. A decrease in sync_wait time indicates success.",
    "date": "2026-02-23",
    "id": 1771811398,
    "type": "error"
});