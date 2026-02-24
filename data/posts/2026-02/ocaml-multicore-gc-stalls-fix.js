window.onPostDataLoaded({
    "title": "Resolving OCaml Multicore Major GC Stalls",
    "slug": "ocaml-multicore-gc-stalls-fix",
    "language": "OCaml",
    "code": "GC_STALL",
    "tags": [
        "OCaml",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.x introduced a shared-memory parallel runtime, but migrating legacy sequential code often triggers significant latency spikes. In parallel workflows, domains frequently synchronize during the 'stop-the-world' phase of the Major GC. If one domain allocates significantly more than others, or if large data structures are promoted from the minor heap to the major heap concurrently, the GC mark-and-sweep cycle can cause unpredictable stalls across all active domains.</p>",
    "root_cause": "Unbalanced minor heap sizes across domains leading to frequent promotion and synchronization bottlenecks in the global major heap allocator.",
    "bad_code": "let run_parallel_tasks data =\n  let domains = Domain.recommended_domain_count () in\n  let tasks = List.split_n data (List.length data / domains) in\n  List.map (fun chunk -> Domain.spawn (fun () -> \n    (* Massive allocation within sub-domains triggers GC *)\n    List.map processed_heavy_object chunk)) tasks\n  |> List.iter Domain.join",
    "solution_desc": "Tune the OCAMLRUNPARAM to increase the minor heap size and use domain-local allocation buffers efficiently. Implementing a custom GC pacing or using the 'Gc.Control' module to manually trigger slices can prevent the 'stop-the-world' phase from lasting too long.",
    "good_code": "(* Adjusting GC parameters for multicore balance *)\nlet () = \n  let control = Gc.get () in\n  Gc.set { control with \n    minor_heap_size = 1024 * 1024 * 16; (* 16MB per domain *)\n    major_heap_increment = 1024 * 1024 * 128 (* 128MB chunks *)\n  }\n\nlet run_parallel_optimized data =\n  (* Use Domain-local state to minimize major heap promotion *)\n  Pool.parallel_map ~chunk_size:500 (fun x -> process_efficiently x) data",
    "verification": "Use 'eventlog-tools' or 'ocaml-eventlog-viz' to inspect the duration of 'major_gc_cycle_domains_sync' events and ensure they stay below the 10ms threshold.",
    "date": "2026-02-24",
    "id": 1771915849,
    "type": "error"
});