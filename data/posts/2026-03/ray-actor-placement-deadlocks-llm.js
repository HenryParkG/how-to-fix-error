window.onPostDataLoaded({
    "title": "Mitigating Ray Actor Placement Deadlocks",
    "slug": "ray-actor-placement-deadlocks-llm",
    "language": "Python",
    "code": "PlacementDeadlock",
    "tags": [
        "Python",
        "Backend",
        "AI",
        "Error Fix"
    ],
    "analysis": "<p>In distributed LLM training using Ray, deadlocks occur when Placement Groups (PG) are configured too rigidly. If multiple actors in a group compete for limited GPU resources and wait for each other to be scheduled, the cluster enters a hang state.</p><p>This is common when orchestrating large model shards across multiple nodes where one 'straggler' actor cannot find a slot, preventing the entire placement group from entering the 'READY' state while simultaneously holding resources required by other pending tasks.</p>",
    "root_cause": "Cyclic resource dependency where a Placement Group cannot start because it partially occupies the resources it needs to fully initialize.",
    "bad_code": "import ray\nfrom ray.util.placement_group import placement_group\n\n# Risky: Requesting 100% of cluster resources in one strict block\npg = placement_group([{\"GPU\": 8}] * 4, strategy=\"STRICT_PACK\")\nray.get(pg.ready()) # Can hang indefinitely if 1 GPU is occupied elsewhere",
    "solution_desc": "Implement a timeout for placement group creation and use the 'SPREAD' or 'PACK' strategy with a fallback mechanism or pre-flight resource checks.",
    "good_code": "import ray\nfrom ray.util.placement_group import placement_group, remove_placement_group\n\ntry:\n    pg = placement_group([{\"GPU\": 8}] * 4, strategy=\"PACK\")\n    # Wait with timeout to prevent infinite hang\n    ray.get(pg.ready(), timeout=60)\nexcept ray.exceptions.GetTimeoutError:\n    print(\"Resource deadlock detected, scaling down...\")\n    remove_placement_group(pg)",
    "verification": "Monitor 'ray status' and ensure all actors transition to 'ALIVE'. Use Ray Dashboard to verify no placement groups remain in 'PENDING' for more than 2 minutes.",
    "date": "2026-03-17",
    "id": 1773722818,
    "type": "error"
});