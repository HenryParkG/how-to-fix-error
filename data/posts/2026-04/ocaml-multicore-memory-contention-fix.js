window.onPostDataLoaded({
    "title": "Resolving OCaml Multicore Memory Contention in Parallel GC",
    "slug": "ocaml-multicore-memory-contention-fix",
    "language": "OCaml",
    "code": "MemoryContention",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore support introduced a parallel major garbage collector. While it scales well for many workloads, memory contention arises when multiple 'Domains' (threads) allocate heavily in the minor heap simultaneously.</p><p>The issue typically manifests as 'stop-the-world' pauses that take longer than expected because of contention on the global heap lock during promotion (moving objects from minor to major heap), especially if objects are highly interconnected across domains.</p>",
    "root_cause": "High frequency of minor-to-major heap promotions causing synchronization overhead on the shared heap mutex.",
    "bad_code": "let work () = \n  for i = 1 to 1_000_000 do\n    let _ = Array.make 1000 i in () (* Aggressive allocation *)\n  done\n\nlet _ = \n  [| Domain.spawn work; Domain.spawn work |] \n  |> Array.iter Domain.join",
    "solution_desc": "Increase the minor heap size to reduce promotion frequency and use domain-local state to avoid cross-domain object references that trigger complex GC marking.",
    "good_code": "(* Increase minor heap via OCAMLRUNPARAM *)\n(* export OCAMLRUNPARAM='s=128M,i=64M' *)\nlet work_optimized () = \n  let local_buffer = Bytes.create 1000 in\n  for i = 1 to 1_000_000 do\n    do_task_with local_buffer i\n  done",
    "verification": "Run with 'memtrace' and analyze the 'promotion_rate' to ensure it stays below 5% of total allocations.",
    "date": "2026-04-17",
    "id": 1776410438,
    "type": "error"
});