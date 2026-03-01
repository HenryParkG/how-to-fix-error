window.onPostDataLoaded({
    "title": "Fixing OCaml Multicore GC Latency Spikes",
    "slug": "ocaml-multicore-gc-latency-spikes",
    "language": "OCaml / Backend",
    "code": "GCLatency",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.x introduced Multicore support, moving from a single-threaded runtime to a parallel one with 'Domains'. However, parallel data processing often triggers major GC latency spikes. This occurs when minor heaps across domains fill up at different rates, forcing frequent synchronization for major heap promotion.</p><p>The Stop-the-World (STW) phase for global root scanning becomes a bottleneck when processing large-scale immutable data structures in parallel.</p>",
    "root_cause": "The default 'max_shared_minor_ratio' is too low for data-heavy parallel tasks, causing domains to trigger global major GC cycles too frequently when promoting short-lived parallel objects.",
    "bad_code": "(* Standard parallel map triggering high GC overhead *)\nlet results = Domainslib.Task.parallel_map pool ~f:heavy_compute large_list",
    "solution_desc": "Tune the GC parameters via OCAMLRUNPARAM to increase the minor heap size per domain and adjust the major heap increment. Using a 'pooling' strategy for large buffers instead of constant allocation in the parallel loop significantly reduces promotion pressure.",
    "good_code": "(* Optimized GC settings and buffer reuse *)\n(* Set OCAMLRUNPARAM=\"s=512M,i=128M,o=100\" *)\nlet process_batch pool data =\n  let local_buf = Bytes.create 1024 in (* Reuse local buffers *)\n  Domainslib.Task.parallel_for pool ~start:0 ~finish:(Array.length data - 1)\n    ~body:(fun i -> data.(i) <- compute_with_buf local_buf data.(i))",
    "verification": "Use 'ocaml-memtrace' to visualize allocation rates and 'eventlog' to measure the duration of GC STW phases. Ensure major_gc_cycles are minimized.",
    "date": "2026-03-01",
    "id": 1772356902,
    "type": "error"
});