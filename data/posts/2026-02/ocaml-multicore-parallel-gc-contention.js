window.onPostDataLoaded({
    "title": "Mitigating OCaml Multicore Memory Contention in Parallel GC",
    "slug": "ocaml-multicore-parallel-gc-contention",
    "language": "OCaml",
    "code": "PerformanceDegradation",
    "tags": [
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore runtime utilizes a 'Stop-the-world' (STW) mechanism for major heap collection. In high-concurrency environments, if multiple domains (threads) perform heavy allocations in the minor heap simultaneously, they contend for the global lock required to promote objects to the major heap. This results in significant latency spikes where all domains wait for a single domain to finish its promotion phase, negating the benefits of parallelism.</p>",
    "root_cause": "High promotion rate from minor to major heap causing frequent global synchronization barriers and major GC cycle triggers.",
    "bad_code": "(* High contention pattern *)\nlet parallel_work () =\n  Domain.spawn (fun () -> \n    for i = 1 to 1_000_000 do \n      ignore (ref i) (* Rapid minor heap allocation *)\n    done)",
    "solution_desc": "Increase the minor heap size per domain to delay promotions and reduce GC frequency. Use 'Gc.Control' to tune the 'minor_heap_size' and 'space_overhead' parameters to favor throughput in multicore settings.",
    "good_code": "(* Optimized GC settings *)\nlet () = \n  let control = Gc.get () in\n  Gc.set { control with \n    minor_heap_size = 1024 * 1024 * 16; (* 16MB per domain *)\n    space_overhead = 100 \n  }",
    "verification": "Profile the application using 'ocaml-eventlog-viewer' to check for 'stw_leader' and 'stw_handler' events to ensure synchronization time is < 5% of total runtime.",
    "date": "2026-02-26",
    "id": 1772088581,
    "type": "error"
});