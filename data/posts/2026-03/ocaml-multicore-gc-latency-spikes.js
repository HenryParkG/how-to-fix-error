window.onPostDataLoaded({
    "title": "OCaml: Debugging Multicore GC Latency Spikes",
    "slug": "ocaml-multicore-gc-latency-spikes",
    "language": "OCaml",
    "code": "STW Latency",
    "tags": [
        "OCaml",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5's multicore runtime introduced a sophisticated concurrent garbage collector. However, parallel workloads often experience sudden latency spikes (100ms+). This usually happens when the 'minor heap' (where young objects live) is too small, forcing frequent 'Stop-The-World' (STW) synchronization across all cores to promote objects to the shared major heap.</p>",
    "root_cause": "High allocation rates in parallel domains trigger frequent minor collections. Since OCaml 5 requires all domains to reach a 'safe point' for minor GC, a single stalled domain can block the entire runtime.",
    "bad_code": "(* Default GC settings with 8 cores *)\nlet () = \n  let _ = Domain.spawn (fn () -> heavy_allocation_loop ()) in\n  (* Minor heap is likely too small for multicore throughput *)\n  Gc.set { (Gc.get()) with minor_heap_size = 256 * 1024 }",
    "solution_desc": "Increase the `minor_heap_size` significantly to accommodate the aggregate allocation rate of all domains. Additionally, use `OCAMLRUNPARAM=\"v=0x400\"` to profile GC slices and identify if 'major' cycles are being triggered prematurely by heap fragmentation.",
    "good_code": "(* Optimized for Multicore Parallelism *)\nlet () = \n  (* Increase minor heap to 128MB per core to reduce STW frequency *)\n  let new_size = 128 * 1024 * 1024 in\n  Gc.set { (Gc.get()) with \n    minor_heap_size = new_size;\n    space_overhead = 120; (* Less aggressive major GC *)\n    allocation_policy = 2 (* Best-fit to reduce fragmentation *)\n  }",
    "verification": "Run the application with `oltop` or `eventlog-tools`. Verify that 'minor-gc-latency' peaks are reduced and domain synchronization waits are minimized.",
    "date": "2026-03-23",
    "id": 1774249177,
    "type": "error"
});