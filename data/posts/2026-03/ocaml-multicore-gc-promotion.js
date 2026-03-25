window.onPostDataLoaded({
    "title": "Resolving OCaml Multicore Minor Heap Promotion Bottlenecks",
    "slug": "ocaml-multicore-gc-promotion",
    "language": "OCaml",
    "code": "GC_PROMO_STALL",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore runtime introduces domain-local minor heaps. A promotion bottleneck occurs when a workload on one domain allocates short-lived objects that just barely survive the minor GC cycle. These objects are promoted to the shared major heap, which requires global synchronization (a 'stop-the-world' slice). In parallel workloads, high promotion rates lead to domains spending more time waiting for the major GC than performing actual computation.</p>",
    "root_cause": "The minor heap size is too small for the allocation rate of the parallel domains, causing premature promotion of temporary objects to the shared major heap.",
    "bad_code": "(* Default minor heap size often insufficient for 16+ cores *)\nlet parallel_task () =\n  Domain.spawn (fun () -> \n    for i = 1 to 1_000_000 do\n      let _ = Array.make 1024 0.0 in () (* High allocation rate *)\n    done\n  )",
    "solution_desc": "Increase the minor heap size using the `OCAMLRUNPARAM` environment variable or the `Gc` module. By expanding the minor heap, you give short-lived objects more time to die within the local domain, avoiding the expensive promotion to the shared major heap.",
    "good_code": "let () =\n  let control = Gc.get () in\n  (* Double the minor heap size to reduce promotion frequency *)\n  Gc.set { control with minor_heap_size = control.minor_heap_size * 2 };\n  let domains = List.init 4 (fun _ -> Domain.spawn parallel_task) in\n  List.iter Domain.join domains",
    "verification": "Profile using `memtrace`. Check the ratio of 'promoted_words' to 'minor_words'. A lower ratio indicates that the minor heap expansion is successfully capturing short-lived objects.",
    "date": "2026-03-25",
    "id": 1774414170,
    "type": "error"
});