window.onPostDataLoaded({
    "title": "OCaml: Fixing Parallel GC Domain Contention",
    "slug": "ocaml-multicore-gc-contention",
    "language": "OCaml",
    "code": "GCPriorityContention",
    "tags": [
        "Backend",
        "OCaml",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In OCaml 5 (Multicore), domains share a global major heap but have domain-local minor heaps. When any domain triggers a minor collection, it must synchronize with all other domains—a 'stop-the-world' event. If one domain is performing heavy allocation while others are performing compute-intensive tasks without hitting allocation points (safepoints), the allocator domain stalls waiting for others to synchronize, leading to severe performance degradation in parallel workloads.</p>",
    "root_cause": "High minor heap allocation rates combined with infrequent safepoint polling in compute-heavy loops, causing the parallel collector to wait on 'lazy' domains.",
    "bad_code": "let compute_heavy_task () = \n  for i = 1 to 1_000_000_000 do\n    (* Tight loop with no allocation - doesn't hit GC safepoints frequently *)\n    ignore(i * i)\n  done",
    "solution_desc": "Increase the minor heap size to reduce the frequency of collections and manually insert <code>Domain.cpu_relax()</code> or ensure the loop performs occasional allocations to trigger safepoint checks. Use Domain-Local Storage (DLS) to reduce shared state access and avoid unnecessary global heap promotions.",
    "good_code": "let compute_heavy_task () = \n  for i = 1 to 1_000_000_000 do\n    if i mod 1000 = 0 then Out_channel.flush stdout; (* Indirectly hits safepoint *)\n    ignore(i * i)\n  done\n(* Tune with: OCAMLRUNPARAM='s=128M' *)",
    "verification": "Profile using 'ocaml-eventlog-trace' to visualize GC pause times and identify domains causing synchronization delays.",
    "date": "2026-02-16",
    "id": 1771224886,
    "type": "error"
});