window.onPostDataLoaded({
    "title": "Fixing OCaml Multicore Memory Contention",
    "slug": "ocaml-multicore-memory-contention",
    "language": "Rust",
    "code": "GC Contention",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.0 introduced shared-memory parallelism, but it brought new challenges regarding Parallel Garbage Collection (GC). When multiple domains (threads) allocate heavily, the Major GC's marking phase can suffer from extreme lock contention and cache line bouncing. This is frequently seen in parallel tree traversals or data-intensive processing.</p><p>The issue arises when domains frequently synchronize to agree on the state of the major heap. If one domain triggers a major GC slice, others may stall while waiting to synchronize, leading to poor scaling where adding more cores actually decreases performance.</p>",
    "root_cause": "High allocation rates in the minor heap trigger frequent promotions to the major heap, forcing expensive global synchronization cycles across all active domains.",
    "bad_code": "let rec parallel_task n =\n  if n = 0 then []\n  else (Array.make 1000 0.0) :: parallel_task (n - 1)\n\nlet _ = Domain.spawn (fun () -> parallel_task 1000000)",
    "solution_desc": "Optimize the GC parameters to favor larger minor heaps and less frequent major GC slices. Additionally, using pool-based allocation or pre-allocating large buffers (using Bigarrays or persistent data structures) reduces the pressure on the OCaml runtime's global heap lock.",
    "good_code": "(* Adjust GC settings for multicore throughput *)\nlet () = \n  let control = Gc.get () in\n  Gc.set { control with \n    minor_heap_size = 256 * 1024 * 1024; (* 256MB Minor Heap *)\n    major_heap_increment = 512 * 1024 * 1024; \n    space_overhead = 100 \n  }\n\n(* Use Bigarray for large, off-heap data *)\nlet shared_data = Bigarray.Array1.create Bigarray.float64 Bigarray.c_layout 1000000",
    "verification": "Run the program with `OCAMLRUNPARAM=v=0x400` to monitor GC stats. Verify that 'Major GC cycles' decrease and that domain idle time (as seen in `eventlog`) is minimized.",
    "date": "2026-03-04",
    "id": 1772598390,
    "type": "error"
});