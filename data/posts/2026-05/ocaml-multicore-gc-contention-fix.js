window.onPostDataLoaded({
    "title": "Fixing OCaml Multicore Parallel GC Contention",
    "slug": "ocaml-multicore-gc-contention-fix",
    "language": "Go",
    "code": "ParallelContention",
    "tags": [
        "Go",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.x introduces multicore support using a system of 'Domains'. A significant performance bottleneck occurs when multiple domains perform heavy allocations simultaneously, leading to contention in the parallel major garbage collector. During the 'Stop-the-World' phase, if domains have unbalanced workloads, the parallel marking phase suffers from significant synchronization overhead, causing CPU cycles to be wasted on lock acquisition rather than useful computation.</p>",
    "root_cause": "Excessive promotion of short-lived objects from the domain-local minor heap to the shared major heap, triggering frequent global synchronization and lock contention on the major heap's free list.",
    "bad_code": "(* High contention code: frequent small allocations in parallel domains *)\nlet run_task () =\n  for i = 1 to 1_000_000 do\n    let _ = ref (Array.make 10 i) in ()\n  done\n\nlet _ = \n  let domains = List.init 4 (fun _ -> Domain.spawn run_task) in\n  List.iter Domain.join domains",
    "solution_desc": "Increase the minor heap size to reduce the frequency of promotions and adjust the GC 'max_overhead' parameter to favor throughput over memory footprint. Ensure that data is kept domain-local as much as possible.",
    "good_code": "(* Optimized GC settings for multicore throughput *)\nlet () =\n  let control = Gc.get () in\n  Gc.set { control with \n    minor_heap_size = 1024 * 1024 * 32; (* 32MB minor heap *)\n    max_overhead = 100 (* Less aggressive major GC *) \n  };\n  let run_task () =\n    (* Reuse buffers to avoid promotion *)\n    let buf = Array.make 10 0 in\n    for i = 1 to 1_000_000 do\n      buf.(0) <- i\n    done in\n  let domains = List.init 4 (fun _ -> Domain.spawn run_task) in\n  List.iter Domain.join domains",
    "verification": "Run the application with `OCAMLRUNPARAM=v=0x400` to profile GC stats and verify reduced 'major_gc' cycles and 'force_minor' triggers.",
    "date": "2026-05-16",
    "id": 1778910389,
    "type": "error"
});