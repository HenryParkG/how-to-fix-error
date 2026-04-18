window.onPostDataLoaded({
    "title": "Debugging Elixir Binary Leakage in Long-Lived Processes",
    "slug": "elixir-binary-leakage-otp-processes",
    "language": "Elixir",
    "code": "REFC_BINARY_MEMORY_LEAK",
    "tags": [
        "Elixir",
        "Erlang",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In the Erlang/Elixir BEAM VM, binaries larger than 64 bytes (refc binaries) are stored on a shared global heap. Each process that references the binary has a small 'binary placeholder' on its local heap. This architecture is efficient for passing data but leads to a 'leak' when a long-lived process keeps a tiny slice of a massive binary.</p><p>Because the sub-binary maintains a reference to the original large binary, the entire large binary cannot be garbage collected as long as the small slice exists. In high-throughput systems processing large JSON or logs, this can consume gigabytes of memory despite the process state appearing small.</p>",
    "root_cause": "Sub-binaries (slices) created via pattern matching or 'binary_part/3' hold a reference to the original parent binary's memory block, preventing its deallocation.",
    "bad_code": "defmodule Parser do\n  def process_payload(large_binary) do\n    # This 'id' still references the 100MB 'large_binary'\n    <<id::binary-size(10), _rest::binary>> = large_binary\n    save_to_state(id)\n  end\nend",
    "solution_desc": "Use ':binary.copy/1' to create a deep copy of the sub-binary. This creates a new, independent binary on the process heap (if small) or a new entry in the refc heap, allowing the original large binary to be garbage collected once the initial reference goes out of scope.",
    "good_code": "defmodule Parser do\n  def process_payload(large_binary) do\n    <<id::binary-size(10), _rest::binary>> = large_binary\n    # Deep copy the slice to break the reference to the parent\n    independent_id = :binary.copy(id)\n    save_to_state(independent_id)\n  end\nend",
    "verification": "Use ':erlang.process_info(pid, :binary)' in the IEx console to inspect binary references. Check if total memory usage drops after 'copy' and subsequent GC.",
    "date": "2026-04-18",
    "id": 1776505179,
    "type": "error"
});