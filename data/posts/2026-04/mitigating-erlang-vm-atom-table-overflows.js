window.onPostDataLoaded({
    "title": "Mitigating Erlang VM Atom Table Overflows",
    "slug": "mitigating-erlang-vm-atom-table-overflows",
    "language": "Erlang/Elixir",
    "code": "system_limit (atom_table)",
    "tags": [
        "Backend",
        "Node.js",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>In multi-tenant architectures, developers often dynamically convert incoming tenant IDs or metadata keys into atoms for easy pattern matching or internal routing. However, the Erlang VM (BEAM) uses a global atom table that is not garbage collected. Every unique atom created exists until the VM restarts. When a system processes millions of unique tenant strings and converts them to atoms, the table eventually hits its hard limit (defaulting to 1,048,576), causing an immediate and unrecoverable VM crash with a 'system_limit' error.</p>",
    "root_cause": "Unbounded creation of atoms from external user input or high-cardinality dynamic strings.",
    "bad_code": "// Elixir example: Converting dynamic tenant_id to atom\ndef process_tenant(tenant_id) do\n  tenant_key = String.to_atom(tenant_id)\n  # Business logic...\nend",
    "solution_desc": "Refactor the application to use binary strings instead of atoms for dynamic keys. If atoms are strictly required for existing internal APIs, use the 'existing' conversion variant which fails safely rather than creating new atoms.",
    "good_code": "// Elixir example: Safe conversion and binary usage\ndef process_tenant(tenant_id) do\n  try do\n    # Only converts if the atom already exists in the table\n    tenant_key = String.to_existing_atom(tenant_id)\n    handle_request(tenant_key)\n  rescue\n    ArgumentError -> \n      # Fallback or handle as binary\n      handle_request_binary(tenant_id)\n  end\nend",
    "verification": "Check atom count using ':erlang.system_info(:atom_count)' in the observer or shell to ensure the number remains stable during load testing.",
    "date": "2026-04-04",
    "id": 1775277987,
    "type": "error"
});