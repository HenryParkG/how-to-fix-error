window.onPostDataLoaded({
    "title": "Eliminating OCaml Multicore Memory Contention",
    "slug": "ocaml-multicore-gc-contention",
    "language": "OCaml",
    "code": "GC Bottleneck",
    "tags": [
        "Go",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore support introduces shared-memory parallelism, but it also introduces the risk of major heap contention during parallel garbage collection. When multiple domains (threads) allocate heavily, the minor heaps fill up rapidly, triggering frequent 'Stop-the-World' (STW) slices to promote objects to the major heap. If the workload is imbalanced, domains spend more time waiting for GC synchronization than executing logic.</p>",
    "root_cause": "Excessive allocation of short-lived objects in parallel loops leads to high promotion rates and frequent contention on the major heap's global lock during the mark-and-sweep phase.",
    "bad_code": "(* High contention due to massive allocation in parallel *)\nlet work () =\n  let rec loop i = \n    if i > 0 then (ignore (ref (Array.make 1000 0)); loop (i - 1))\n  in loop 100_000\n\nlet _ = \n  let domains = List.init 8 (fun _ -> Domain.spawn work) in\n  List.iter Domain.join domains",
    "solution_desc": "Reduce contention by minimizing allocations within parallel sections. Use mutable buffers or object pooling to reuse memory. Tune the `max_overhead` and `minor_heap_size` in OCaml's GC settings to reduce the frequency of major GC cycles in multicore environments.",
    "good_code": "(* Optimized: Reducing allocation inside the parallel domain *)\nlet work_optimized shared_buf =\n  let rec loop i = \n    if i > 0 then (\n      (* Perform in-place updates instead of new allocations *)\n      shared_buf.(i mod 100) <- i; \n      loop (i - 1)\n    )\n  in loop 100_000\n\nlet _ = \n  let buf = Array.make 100 0 in\n  let domains = List.init 8 (fun _ -> Domain.spawn (fun () -> work_optimized buf)) in\n  List.iter Domain.join domains",
    "verification": "Run with 'OCAMLRUNPARAM=v=0x400' to log GC stats. Use 'olrufs' or 'eventlog-tools' to visualize domain wait times and GC latency.",
    "date": "2026-03-07",
    "id": 1772857121,
    "type": "error"
});