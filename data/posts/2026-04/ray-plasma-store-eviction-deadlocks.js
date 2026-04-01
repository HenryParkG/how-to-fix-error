window.onPostDataLoaded({
    "title": "Fix Ray Plasma Store Deadlocks in Large Shuffles",
    "slug": "ray-plasma-store-eviction-deadlocks",
    "language": "Python",
    "code": "PLASMA_STORE_FULL",
    "tags": [
        "Python",
        "Distributed Systems",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In distributed computing with Ray Core, the Plasma Store handles shared-memory object management. During large-scale shuffles, multiple workers may attempt to create new objects while holding references to existing ones. If the Plasma Store reaches its capacity, it attempts to evict old objects. A deadlock occurs when every object in the store is 'pinned' by active tasks that are themselves waiting for new memory to be allocated to complete their execution.</p>",
    "root_cause": "Object store exhaustion combined with circular dependencies where active tasks hold references to un-evictable objects required for subsequent shuffle stages.",
    "bad_code": "# Excessive object creation without releasing references\n@ray.remote\ndef large_shuffle_step(data_refs):\n    results = []\n    for ref in data_refs:\n        batch = ray.get(ref)\n        # Processing that creates many intermediate large objects\n        intermediate = transform(batch)\n        results.append(ray.put(intermediate))\n    return results",
    "solution_desc": "Manually trigger object deletion using `ray.internal.free()` and ensure that memory-intensive tasks use generators or `ray.wait` to process objects in chunks. Additionally, increase `object_store_memory` and tune the `min_spilling_size` configuration.",
    "good_code": "# Manual memory management and chunked processing\n@ray.remote\ndef optimized_shuffle_step(data_refs):\n    results = []\n    for ref in data_refs:\n        batch = ray.get(ref)\n        intermediate = transform(batch)\n        res_ref = ray.put(intermediate)\n        results.append(res_ref)\n        # Explicitly free processed reference to allow eviction\n        ray.internal.free([ref]) \n    return results",
    "verification": "Monitor Ray Dashboard 'Object Store Memory' usage; ensure 'Spilled' metrics are increasing instead of tasks hanging in 'PENDING_RESOURCES'.",
    "date": "2026-04-01",
    "id": 1775037822,
    "type": "error"
});