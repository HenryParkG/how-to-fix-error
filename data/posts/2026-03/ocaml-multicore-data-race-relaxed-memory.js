window.onPostDataLoaded({
    "title": "Fixing OCaml Multicore Races under Relaxed Memory",
    "slug": "ocaml-multicore-data-race-relaxed-memory",
    "language": "Go",
    "code": "DataRace",
    "tags": [
        "Go",
        "Multithreading",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>OCaml 5.0 introduced a relaxed memory model that allows for efficient multicore execution but introduces complexities similar to C++ or Java. A common issue occurs when developers assume Sequential Consistency (SC) for standard mutable references. Under the relaxed model, writes to shared memory without explicit synchronization can be reordered by the CPU or compiler, leading to 'impossible' states where a flag appears set before the data it protects is visible.</p>",
    "root_cause": "Using standard 'ref' types for shared state across domains without using the Atomic module, causing non-atomic memory visibility.",
    "bad_code": "let shared_data = ref None\nlet flag = ref false\n\n(* Domain 1 *)\nshared_data := some_val;\nflag := true\n\n(* Domain 2 *)\nif !flag then process (!shared_data) (* Error: shared_data might be None *)",
    "solution_desc": "Replace mutable references with 'Atomic' types. The Atomic module provides the necessary memory barriers to ensure that all writes preceding an atomic write are visible to other domains performing an atomic read of the same location.",
    "good_code": "let shared_data = Atomic.make None\nlet flag = Atomic.make false\n\n(* Domain 1 *)\nAtomic.set shared_data (Some some_val);\nAtomic.set flag true\n\n(* Domain 2 *)\nif Atomic.get flag then process (Atomic.get shared_data)",
    "verification": "Run the program with OCaml's ThreadSanitizer (TSAN) instrumentation to confirm no data race warnings are emitted during execution.",
    "date": "2026-03-10",
    "id": 1773116856,
    "type": "error"
});