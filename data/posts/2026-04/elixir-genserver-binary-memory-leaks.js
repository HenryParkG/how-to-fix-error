window.onPostDataLoaded({
    "title": "Fixing Binary Memory Leaks in Elixir GenServers",
    "slug": "elixir-genserver-binary-memory-leaks",
    "language": "Elixir",
    "code": "Memory Leak",
    "tags": [
        "Backend",
        "Node.js",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang VM (BEAM), large binaries (>64 bytes) are stored on a global 'Binary Heap' and are reference-counted. A common leak occurs when a GenServer extracts a small slice of a large binary (e.g., a header from a 10MB file) and stores that slice in its state. The reference to the small slice prevents the entire 10MB parent binary from being garbage collected, leading to massive memory bloat despite the GenServer state appearing small.</p>",
    "root_cause": "Sub-binaries (slices) maintain a reference to the original large 'Refc' binary, preventing the collector from freeing the parent binary.",
    "bad_code": "def handle_info({:data, large_bin}, state) {\n  # large_bin is 10MB, header is 10 bytes\n  <<header::binary-size(10), _rest::binary>> = large_bin\n  # The 10MB remains in memory because 'header' is stored\n  {:noreply, %{state | header: header}}\n}",
    "solution_desc": "Use `:binary.copy/1` on the sliced binary. This creates a new, independent binary on the process heap (if small) or a fresh Refc binary, allowing the original large binary's reference count to hit zero and be reclaimed.",
    "good_code": "def handle_info({:data, large_bin}, state) {\n  <<header::binary-size(10), _rest::binary>> = large_bin\n  # Force a copy to break the reference to the parent\n  independent_header = :binary.copy(header)\n  {:noreply, %{state | header: independent_header}}\n}",
    "verification": "Use ':erlang.memory()' and inspect process info with 'Process.info(pid, :total_heap_size)'. Run ':erlang.garbage_collect(pid)' and check if memory drops.",
    "date": "2026-04-02",
    "id": 1775123590,
    "type": "error"
});