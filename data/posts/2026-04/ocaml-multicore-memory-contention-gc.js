window.onPostDataLoaded({
    "title": "Resolving OCaml Multicore Memory Contention in Parallel GC",
    "slug": "ocaml-multicore-memory-contention-gc",
    "language": "Go",
    "code": "RuntimePerformanceDegradation",
    "tags": [
        "OCaml",
        "Performance",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5 introduced native multicore support, but developers often experience performance degradation when multiple domains (threads) allocate heavily on the major heap. The parallel collector requires synchronization points, and excessive promotion of objects from the minor heap to the shared major heap creates significant contention, leading to 'stop-the-world' pauses that scale poorly with core count.</p>",
    "root_cause": "High frequency of major heap allocations causing contention on the global lock and frequent synchronization of the parallel garbage collector.",
    "bad_code": "(* Highly contentious parallel allocation *)\nlet work () = \n  let rec loop n = \n    if n > 0 then ( \n      let _ = Array.make 1000 0.0 in (* Major heap allocation *)\n      loop (n - 1)\n    ) in loop 1000000\n\nlet _ = List.init 8 (fun _ -> Domain.spawn work) |> List.iter Domain.join",
    "solution_desc": "Optimize for domain-local allocation. Use larger minor heaps to allow objects to die young and use 'Domain-local Storage' (DLS) to keep data local to a domain, minimizing major heap promotions and cross-domain synchronization.",
    "good_code": "(* Optimized for local allocation and reduced promotion *)\nlet work () = \n  (* Increase minor heap size for this domain to reduce promotion *)\n  Gc.set { (Gc.get()) with minor_heap_size = 1024 * 1024 * 8 };\n  let rec loop n local_arr = \n    if n > 0 then (\n      (* Re-use local buffer or allocate small objects that stay in minor heap *)\n      for i = 0 to 999 do local_arr.(i) <- float_of_int i done;\n      loop (n - 1) local_arr\n    ) in loop 1000000 (Array.make 1000 0.0)\n\nlet _ = List.init 4 (fun _ -> Domain.spawn work) |> List.iter Domain.join",
    "verification": "Profile using 'ocaml-eventlog-trace' to visualize GC pauses and promotion rates across domains.",
    "date": "2026-04-26",
    "id": 1777181537,
    "type": "error"
});