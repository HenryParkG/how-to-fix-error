window.onPostDataLoaded({
    "title": "Fixing OCaml 5 Multicore GC Stalls in Parallel Runtimes",
    "slug": "ocaml-5-multicore-gc-stalls",
    "language": "OCaml",
    "code": "GC_STALL",
    "tags": [
        "Backend",
        "Python",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore support introduced a new garbage collector capable of running domains in parallel. However, many developers experience 'GC stalls' where all threads stop for long periods. This typically occurs because OCaml 5 uses a stop-the-world mechanism for major GC cycles. If one domain allocates heavily into the shared major heap while others are idle, it triggers global synchronization that kills parallel performance.</p>",
    "root_cause": "Excessive promotion of short-lived objects from the domain-local minor heap to the shared major heap, frequently triggering global major GC cycles and synchronization barriers.",
    "bad_code": "let run_parallel_task () =\n  Domain.spawn (fun () -> \n    let rec loop () =\n      (* Creating many large, short-lived objects in parallel *)\n      let _ = Array.make 1000 0 in \n      loop ()\n    in loop ())",
    "solution_desc": "Increase the minor heap size per domain using OCAMLRUNPARAM to delay major heap promotion. Additionally, use Domain-Local Storage (DLS) to keep data within the domain's minor heap longer, reducing the pressure on the global major collector.",
    "good_code": "(* Execute with: OCAMLRUNPARAM='s=64M,i=128M' *)\nlet run_optimized_task () =\n  let dls_key = Domain.DLS.new_key (fun () -> Array.make 1000 0) in\n  Domain.spawn (fun () ->\n    let rec loop () =\n      let local_arr = Domain.DLS.get dls_key in\n      (* Reuse or operate on local state to avoid promotions *)\n      local_arr.(0) <- local_arr.(0) + 1;\n      loop ()\n    in loop ())",
    "verification": "Use 'ocaml-eventlog-trace' to visualize GC pause times and verify that major GC cycles are occurring less frequently.",
    "date": "2026-03-31",
    "id": 1774951018,
    "type": "error"
});