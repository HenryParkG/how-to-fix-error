window.onPostDataLoaded({
    "title": "Resolving OCaml 5.0 Multicore Memory Contention",
    "slug": "ocaml-5-multicore-gc-contention",
    "language": "OCaml",
    "code": "RuntimeError (GC Contention)",
    "tags": [
        "OCaml",
        "Multicore",
        "Rust",
        "Systems",
        "Error Fix"
    ],
    "analysis": "<p>In OCaml 5.0, the introduction of shared-memory parallelism via Domains changed the garbage collection landscape. Unlike previous versions with a global lock, OCaml 5 uses a stop-the-world minor collector. When multiple domains allocate heavily in the minor heap, they frequently trigger synchronization cycles. If one domain is stalled (e.g., waiting on I/O or a lock), other domains are blocked from completing their minor GC, leading to significant latency spikes and CPU underutilization despite having multiple cores.</p>",
    "root_cause": "Excessive allocation rates in the minor heap combined with mismatched Domain counts to physical cores, leading to 'GC stop-the-world' synchronization overhead.",
    "bad_code": "let run_worker () =\n  let rec loop () =\n    (* Rapid allocation of short-lived objects triggers constant minor GC *)\n    let _ = List.init 1000 (fun i -> i) in\n    loop ()\n  in loop ()\n\nlet _ = \n  (* Spawning more domains than physical cores exacerbates synchronization latency *)\n  Array.init 16 (fun _ -> Domain.spawn run_worker)",
    "solution_desc": "Increase the minor heap size via OCAMLRUNPARAM to reduce GC frequency and use Domain-Local Allocation Buffers (DLABs) effectively. Ensure Domain counts match physical cores to avoid context switching during GC synchronization.",
    "good_code": "(* Set OCAMLRUNPARAM=\"s=512M,i=128M\" *)\nlet run_worker () =\n  (* Use larger buffers or reuse structures to lower allocation pressure *)\n  let buf = Array.make 1000 0 in \n  let rec loop () =\n    Array.iteri (fun i _ -> buf.(i) <- i) buf;\n    loop ()\n  in loop ()\n\nlet _ = \n  let cores = 8 (* Match physical cores *)\n  Array.init cores (fun _ -> Domain.spawn run_worker)",
    "verification": "Run the application with 'perf' or OCaml 'eventlog-tools' to monitor 'gc/stop_world_latency' metrics.",
    "date": "2026-04-20",
    "id": 1776649857,
    "type": "error"
});