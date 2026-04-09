window.onPostDataLoaded({
    "title": "Mitigating Istio Envoy Filter Lua Sandbox OOMs",
    "slug": "istio-envoy-lua-sandbox-oom",
    "language": "Lua/C++",
    "code": "SandboxOOM",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Istio allows custom logic via EnvoyFilter using Lua. However, the Lua sandbox has a very restricted memory heap. In high-throughput environments, if a Lua script stores request-specific data in global variables or fails to trigger garbage collection, the Envoy process will crash with an Out-of-Memory (OOM) error.</p><p>Lua's garbage collector isn't always aggressive enough for the ephemeral nature of proxy requests, leading to heap exhaustion even when the data is no longer needed.</p>",
    "root_cause": "Lua global state persistence across requests and delayed garbage collection in a memory-constrained sandbox.",
    "bad_code": "function envoy_on_request(request_handle)\n    -- Accumulating data in a global table\n    _G.my_logs = _G.my_logs or {}\n    table.insert(_G.my_logs, request_handle:headers():get(\"user-id\"))\nend",
    "solution_desc": "Avoid using global variables (_G). Use local variables for request processing and store persistent data in 'dynamic_metadata'. Explicitly trigger 'collectgarbage(\"step\")' if dealing with large payloads.",
    "good_code": "function envoy_on_request(request_handle)\n    local user_id = request_handle:headers():get(\"user-id\")\n    -- Use local scope or dynamic metadata\n    request_handle:streamInfo():setDynamicMetadata(\"envoy.filters.http.lua\", {\"user\" = user_id})\n    collectgarbage(\"step\")\nend",
    "verification": "Check Envoy logs for 'lua: memory limit exceeded' and monitor container memory usage stability under load.",
    "date": "2026-04-09",
    "id": 1775711074,
    "type": "error"
});