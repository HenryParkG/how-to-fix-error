window.onPostDataLoaded({
    "title": "Mitigating Envoy Sidecar Memory Leaks in Istio",
    "slug": "istio-envoy-memory-leak-fix",
    "language": "Kubernetes",
    "code": "MemoryLeak",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-traffic Istio service meshes, Envoy sidecars often exhibit memory growth when complex <code>EnvoyFilters</code> are applied for header mutation. This occurs because the Lua VM state or specific regex-based header transformations fail to release memory back to the heap efficiently under concurrent load. When processing thousands of requests per second with unique header values, the memory footprint of the Envoy process can exceed its Cgroup limits, leading to OOMKills.</p>",
    "root_cause": "The specific technical reason is a heap fragmentation issue within Envoy's memory allocator (typically TCMalloc) combined with non-reclaimed Lua string allocations when using <code>EnvoyFilter</code> with <code>Lua</code> filters for dynamic header manipulation.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nspec:\n  configPatches:\n  - applyTo: HTTP_FILTER\n    patch:\n      operation: INSERT_BEFORE\n      value:\n        name: envoy.filters.http.lua\n        typed_config:\n          \"@type\": \"type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua\"\n          inline_string: |\n            function envoy_on_request(request_handle)\n              local val = request_handle:headers():get(\"x-custom-id\")\n              -- Memory leak occurs here due to repeated string concatenation and global scope leakage\n              request_handle:headers():replace(\"x-internal-id\", \"PREFIX_\" .. val)\n            end",
    "solution_desc": "Switch from Lua-based mutations to the native 'header_to_metadata' or 'header_mutation' filters which use Envoy's internal C++ optimized buffer management, and tune TCMalloc release rates.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nspec:\n  configPatches:\n  - applyTo: HTTP_FILTER\n    patch:\n      operation: MERGE\n      value:\n        name: envoy.filters.http.header_mutation\n        typed_config:\n          \"@type\": \"type.googleapis.com/envoy.extensions.filters.http.header_mutation.v3.HeaderMutation\"\n          mutations:\n            request_mutations:\n              - append: { header: { key: \"x-internal-id\", value: \"fixed-value\" }, append_action: \"OVERWRITE_IF_EXISTS_OR_ADD\" }",
    "verification": "Monitor the `envoy_server_memory_allocated` metric via Prometheus. The memory graph should plateau after the fix rather than showing a linear upward trend.",
    "date": "2026-05-16",
    "id": 1778910388,
    "type": "error"
});