window.onPostDataLoaded({
    "title": "Fixing OCaml 5.0 Multicore GC Stalls",
    "slug": "ocaml-5-multicore-gc-stalls",
    "language": "OCaml",
    "code": "GC_STALL",
    "tags": [
        "OCaml",
        "Multicore",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In OCaml 5.0, the introduction of parallelism via Domains changed the Garbage Collection (GC) model. While each domain has a private minor heap, a 'stop-the-world' mechanism is still required for major heap cycles and certain minor heap synchronizations. When one domain allocates rapidly while others are idle or blocked on I/O without yielding, the GC can trigger frequent synchronization stalls, leading to significant latency spikes in parallel workloads.</p>",
    "root_cause": "The specific cause is 'promotion imbalance' and lack of polling points. If one domain triggers a minor GC, all other domains must reach a safe point (polling point) to synchronize. Long-running C bindings or tight loops without allocation prevent domains from reaching these points, stalling the GC.",
    "bad_code": "let recruit_domains () =\n  let d2 = Domain.spawn (fun () -> \n    while true do\n      (* Tight loop with no allocation/polling points *)\n      ignore (Sys.opaque_identity 1)\n    done) in\n  (* Main domain triggers GC frequently *)\n  for i = 1 to 1_000_000 do\n    let _ = ref i in ()\n  done",
    "solution_desc": "Ensure all domains periodically reach a safe point. For CPU-bound loops, use `caml_process_pending_signals()` or ensure allocations occur. Additionally, tune the minor heap size via `OCAMLRUNPARAM` to reduce the frequency of world-stopping synchronizations.",
    "good_code": "let recruit_domains () =\n  let d2 = Domain.spawn (fun () -> \n    while true do\n      (* Explicitly yield or allocate to allow GC sync *)\n      Domain.cpu_relax ();\n      let _ = ref 0 in ()\n    done) in\n  let _ = Domain.join d2 in ()",
    "verification": "Use the 'runtime_events' library to trace GC latency and verify that 'stop-the-world' phases do not exceed the expected minor heap collection time.",
    "date": "2026-05-09",
    "id": 1778312610,
    "type": "error"
});