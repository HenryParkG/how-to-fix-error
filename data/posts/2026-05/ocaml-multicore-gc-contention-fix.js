window.onPostDataLoaded({
    "title": "Fixing OCaml Multicore Memory Contention in Parallel GC",
    "slug": "ocaml-multicore-gc-contention-fix",
    "language": "OCaml",
    "code": "GC Contention",
    "tags": [
        "Go",
        "Backend",
        "Multicore",
        "Error Fix"
    ],
    "analysis": "<p>In OCaml 5.x, the introduction of parallelism via Domains can lead to significant performance degradation due to memory contention in the Garbage Collector (GC). While the minor heap is thread-local, the major heap is shared. High allocation rates across multiple domains can lead to 'stop-the-world' synchronization latency and cache-line bouncing. This is particularly prevalent in compute-heavy tasks that frequently promote objects from the minor heap to the major heap, forcing the parallel collector to synchronize across cores more frequently than necessary.</p>",
    "root_cause": "Excessive allocation of shared mutable state and frequent minor-to-major heap promotions causing global synchronization bottlenecks.",
    "bad_code": "let solve_parallel data = \n  let domains = Array.init 4 (fun _ -> \n    Domain.spawn (fun () -> \n      (* High allocation loop causing GC pressure *)\n      List.map (fun x -> ref (x * 2)) data\n    )\n  ) in\n  Array.iter Domain.join domains",
    "solution_desc": "To mitigate contention, reduce the frequency of major heap promotions by increasing the minor heap size via OCAMLRUNPARAM. Additionally, utilize Domain-Local Storage (DLS) or pre-allocate reusable buffers to minimize the allocation of short-lived objects that survive into the major heap.",
    "good_code": "(* Use OCAMLRUNPARAM='s=512M' to increase minor heap *)\nlet solve_optimized data = \n  let domains = Array.init 4 (fun _ -> \n    Domain.spawn (fun () -> \n      let pool = Array.make (List.length data) 0 in\n      List.iteri (fun i x -> pool.(i) <- x * 2) data;\n      pool\n    )\n  ) in\n  Array.iter Domain.join domains",
    "verification": "Use 'memtrace' or 'ocaml-eventlog-trace' to visualize GC latency and ensure 'major_heap_allocs' frequency is reduced.",
    "date": "2026-05-04",
    "id": 1777882687,
    "type": "error"
});