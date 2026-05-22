window.onPostDataLoaded({
    "title": "Fixing BEAM Memory Bloat in Elixir Pipelines",
    "slug": "fixing-beam-memory-bloat-elixir-pipelines",
    "language": "Elixir",
    "code": "BEAM Memory Leak",
    "tags": [
        "Elixir",
        "Erlang",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Elixir pipelines, applications often experience progressive memory exhaustion (bloat) that is not reclaimed by standard garbage collection. This behavior is typically caused by the way the Erlang Virtual Machine (BEAM) handles binaries. Binaries larger than 64 bytes (known as reference-counted or 'refc' binaries) are allocated on a shared global heap. Processes accessing slices of these binaries do not duplicate the data; instead, they store a small 'ProcBin' object containing a pointer to the original memory block. This optimization prevents copy overhead but introduces a severe memory leak risk if references are held indefinitely.</p>",
    "root_cause": "When a process slices a small chunk out of a large refc binary (e.g., parsing a tiny token from a 10MB payload) and keeps that small chunk in memory or sends it to a long-lived process, the entire 10MB parent binary is pinned in the global heap. The BEAM cannot garbage-collect the parent binary as long as a single process holds a reference to any of its sub-slices.",
    "bad_code": "defmodule PayloadParser do\n  def parse_token(large_binary_payload) do\n    # Extracts a small 16-byte token from a massive payload\n    <<_header::bytes-size(100), token::bytes-size(16), _rest::binary>> = large_binary_payload\n    # BAD: Passing this slice to a long-lived process keeps the whole payload alive\n    send(SessionTracker, {:register, token})\n  end\nend",
    "solution_desc": "To break the reference dependency and allow the global garbage collector to release the parent binary immediately, you must force a physical memory copy of the extracted binary slice using :binary.copy/1. This allocates the small slice directly on the process's private heap, eliminating the pointer to the large shared payload.",
    "good_code": "defmodule PayloadParser do\n  def parse_token(large_binary_payload) do\n    <<_header::bytes-size(100), token::bytes-size(16), _rest::binary>> = large_binary_payload\n    # GOOD: Copying the slice breaks the reference pointer chain\n    isolated_token = :binary.copy(token)\n    send(SessionTracker, {:register, isolated_token})\n  end\nend",
    "verification": "Deploy the fix and monitor the application's memory using `:erlang.memory(:binary)`. Under load, binary memory usage should plateau at a low, stable baseline instead of scaling linearly with throughput. You can also run `:recon_alloc.memory(:usage)` to verify allocator efficiency.",
    "date": "2026-05-22",
    "id": 1779432059,
    "type": "error"
});