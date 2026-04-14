window.onPostDataLoaded({
    "title": "Fixing OCaml Multicore Contention in Parallel GC",
    "slug": "ocaml-multicore-memory-contention-gc",
    "language": "OCaml",
    "code": "RuntimeError",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.0 introduced shared-memory parallelism, but heavy allocation workloads often encounter significant performance degradation due to memory contention. This occurs when multiple domains (parallel threads) attempt to promote objects from their private minor heaps to the shared major heap simultaneously.</p><p>The major heap's lock-free allocator is efficient, but under high pressure, the synchronization cost of the 'Stop-the-World' (STW) phases required for global marking can skyrocket, leading to cache-line bouncing and increased latency in parallel garbage collection.</p>",
    "root_cause": "Excessive minor-to-major heap promotion rates causing high contention on the global allocator and frequent STW synchronization barriers.",
    "bad_code": "(* Default small minor heap leads to frequent promotions *)\nlet run_parallel_task () =\n  let domains = List.init 4 (fun _ -> \n    Domain.spawn (fun () -> \n      (* High allocation loop *)\n      for i = 1 to 1_000_000 do\n        let _ = ref (Array.make 100 i) in ()\n      done)) in\n  List.iter Domain.join domains",
    "solution_desc": "Increase the minor heap size to reduce promotion frequency and use Domain-Local Allocation Buffers (DLABs) effectively. Adjusting the GC parameters to be more 'lazy' during major cycles can also reduce synchronization overhead.",
    "good_code": "(* Increase minor heap and tune GC pacing *)\nlet () =\n  let control = Gc.get () in\n  Gc.set { control with \n    minor_heap_size = 1024 * 1024 * 16; (* 16MB per domain *)\n    major_heap_increment = 1024 * 1024 * 128 (* 128MB *) };\n  \n  let run_task () =\n    Domain.spawn (fun () -> \n      (* Task with reduced promotion pressure *)\n      for i = 1 to 1_000_000 do\n        let _ = Array.make 100 i in ()\n      done) in\n  List.init 4 (fun _ -> run_task ()) |> List.iter Domain.join",
    "verification": "Use 'memtrace' to analyze allocation rates and 'ocaml-eventlog-trace' to visualize GC pause times and domain contention.",
    "date": "2026-04-14",
    "id": 1776161284,
    "type": "error"
});