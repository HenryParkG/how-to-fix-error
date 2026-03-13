window.onPostDataLoaded({
    "title": "Eliminating Erlang VM Binary Leakage in Elixir GenStage",
    "slug": "elixir-genstage-binary-leakage-fix",
    "language": "Elixir",
    "code": "Memory Leak (Binary)",
    "tags": [
        "Go",
        "Backend",
        "Elixir",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Elixir GenStage pipelines, processes often handle large payloads. The Erlang VM (BEAM) uses two types of binary storage: small binaries (< 64 bytes) are stored on the process heap, while large binaries are stored on a global shared heap with reference counting. A critical leak occurs when a GenStage worker extracts a small 'slice' of a large binary (e.g., a message ID) and keeps it in its state. Because the slice holds a reference to the entire original binary, the large memory block cannot be garbage collected, even if the rest of the payload is discarded.</p>",
    "root_cause": "The BEAM binary sub-reference mechanism prevents the parent binary from being garbage collected as long as a sub-binary exists.",
    "bad_code": "def handle_events([event | _], _from, state) do\n  # This slice keeps the whole original 10MB event in memory\n  <<id::binary-size(16), _rest::binary>> = event.payload\n  {:noreply, [], %{state | last_id: id}}\nend",
    "solution_desc": "Use :binary.copy/1 to create a deep copy of the sub-binary. This creates a new, independent binary on the process heap (if small) or a new shared binary, allowing the original large binary to be garbage collected immediately.",
    "good_code": "def handle_events([event | _], _from, state) do\n  <<id::binary-size(16), _rest::binary>> = event.payload\n  # Copying orphans the sub-binary from the large original block\n  {:noreply, [], %{state | last_id: :binary.copy(id)}}\nend",
    "verification": "Run :erlang.memory(:binary) in observer while the pipeline is under load. Memory should stabilize rather than climb linearly.",
    "date": "2026-03-13",
    "id": 1773364465,
    "type": "error"
});