window.onPostDataLoaded({
    "title": "Resolving OCaml Multicore Minor-Heap Contention",
    "slug": "ocaml-multicore-minor-heap-contention",
    "language": "OCaml",
    "code": "GCLatency",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.0+ introduced shared-memory parallelism, but parallel workloads often hit performance walls due to minor-heap contention. In OCaml Multicore, each domain has its own allocation buffer, but minor garbage collection (GC) is a 'stop-the-world' event for all domains. If one domain triggers a minor GC, all other domains must reach a 'safe point' (usually an allocation) to synchronize.</p><p>When running parallel compute-heavy tasks that don't allocate frequently, some domains may take too long to reach a safe point, causing others to stall. Conversely, high-allocation rates in all domains lead to frequent, expensive synchronizations that destroy linear scaling.</p>",
    "root_cause": "Synchronization latency during global stop-the-world minor GC cycles caused by uneven allocation rates across multiple domains.",
    "bad_code": "let rec compute_heavy n =\n  if n <= 0 then () \n  else (\n    (* Tight loop with no allocation prevents reaching GC safe points *)\n    ignore(n * n);\n    compute_heavy (n - 1)\n  )\n\nlet _ = \n  Array.init 4 (fun _ -> Domain.spawn (fun () -> compute_heavy 100_000_000))",
    "solution_desc": "Manually trigger safe points using 'caml_process_pending_signals' equivalents or increase the minor heap size to reduce GC frequency. Additionally, using Domain-Local Storage (DLS) for frequently mutated state can reduce cross-domain cache invalidation.",
    "good_code": "(* Increase minor heap size to 256MB to reduce GC frequency *)\nlet () = Gc.set { (Gc.get()) with minor_heap_size = 256 * 1024 * 1024 }\n\nlet rec compute_heavy_fixed n =\n  if n <= 0 then () \n  else (\n    ignore(n * n);\n    (* Manually yield or allocate to allow GC synchronization *)\n    if n mod 1000 = 0 then ignore(ref 0);\n    compute_heavy_fixed (n - 1)\n  )",
    "verification": "Run the workload with 'OCAMLRUNPARAM=v=0x400' to monitor GC stats. Check for 'Major GC' and 'Minor GC' pause times to ensure they scale linearly with core count.",
    "date": "2026-05-06",
    "id": 1778046566,
    "type": "error"
});