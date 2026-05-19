window.onPostDataLoaded({
    "title": "Fixing OCaml 5.x Parallel Minor GC Contention",
    "slug": "ocaml-multicore-gc-fix",
    "language": "OCaml",
    "code": "GCLatencySpike",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.x introduced a multicore runtime that uses a Stop-The-World (STW) mechanism for minor garbage collection. While domains run in parallel, a minor GC triggered by one domain forces all other domains to pause. If one domain allocates rapidly in a tight loop, it triggers frequent pauses across all cores, destroying throughput.</p><p>This contention is particularly visible in high-throughput network services where allocation rates are high and domain counts exceed physical core affinity.</p>",
    "root_cause": "Global synchronization overhead where all domains must reach a 'safe point' for a minor heap collection, exacerbated by small minor heap sizes.",
    "bad_code": "(* Default minor heap is often too small for multicore *)\nlet () = \n  let domains = List.init 16 (fun _ -> \n    Domain.spawn (fun () -> \n      while true do \n        let _ = BoxedValue (Random.int 100) in ()\n      done)) in\n  List.iter Domain.join domains",
    "solution_desc": "Increase the minor heap size via OCAMLRUNPARAM to reduce GC frequency and use 'Domain-local allocation buffers' effectively. Tuning the 'max_domains' to match physical cores prevents scheduling thrashing.",
    "good_code": "(* Set OCAMLRUNPARAM=\"s=256M,i=32M\" *)\n(* Increase minor heap size to reduce STW frequency *)\nlet main () = \n  let cpu_count = 8 in (* Match physical cores *)\n  let domains = List.init cpu_count (fun _ -> \n    Domain.spawn (fun () -> \n      (* Optimized loop with less frequent allocation *)\n      for i = 1 to 1_000_000 do\n        perform_computation ()\n      done)) in\n  List.iter Domain.join domains",
    "verification": "Use 'memtrace' or 'ocaml-eventlog-tools' to visualize GC pause durations. Latency should drop from >50ms to <5ms.",
    "date": "2026-05-19",
    "id": 1779157723,
    "type": "error"
});