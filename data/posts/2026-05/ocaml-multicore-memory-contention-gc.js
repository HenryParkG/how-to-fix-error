window.onPostDataLoaded({
    "title": "Mitigating OCaml Multicore Memory Contention",
    "slug": "ocaml-multicore-memory-contention-gc",
    "language": "OCaml",
    "code": "GC_CONTENTION",
    "tags": [
        "Backend",
        "OCaml",
        "Multicore",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5 introduced shared-memory parallelism, but heavy allocation across multiple 'Domains' can lead to performance degradation. The Parallel Garbage Collector (GC) uses a stop-the-world mechanism for major heap cycles. If one domain triggers frequent minor collections while others are trying to access the major heap, synchronization overhead (promotion contention) spikes, causing parallel code to run slower than sequential equivalents.</p>",
    "root_cause": "Excessive allocation of short-lived objects in the minor heap across multiple domains, leading to frequent global synchronization barriers and contention on the shared major heap lock during object promotion.",
    "bad_code": "let run_parallel_work () =\n  List.init 8 (fun _ ->\n    Domain.spawn (fun () -> \n      (* Heavy allocation in a loop triggers constant GC *)\n      for i = 1 to 1_000_000 do\n        let _ = Array.make 100 i in ()\n      done))\n  |> List.iter Domain.join",
    "solution_desc": "Optimize by using Domain-Local Storage (DLS) to reduce shared state and increasing the minor heap size to reduce the frequency of collections. Architecturally, prefer reusing buffers to minimize the allocation rate within hot loops, thereby reducing the pressure on the major heap promotion logic.",
    "good_code": "(* Increase minor heap size to reduce synchronization frequency *)\nlet () = Gc.set { (Gc.get()) with minor_heap_size = 16 * 1024 * 1024 }\n\nlet run_optimized_work () =\n  List.init 8 (fun _ ->\n    Domain.spawn (fun () ->\n      (* Pre-allocate buffer to minimize GC pressure *)\n      let buffer = Array.make 100 0 in\n      for i = 1 to 1_000_000 do\n        buffer.(0) <- i; (* Mutate in place *)\n        (* perform work *)\n      done))\n  |> List.iter Domain.join",
    "verification": "Use 'ocaml-eventlog-viz' to inspect the duration of 'major_gc_pause' and 'minor_gc' events across domains.",
    "date": "2026-05-07",
    "id": 1778151681,
    "type": "error"
});