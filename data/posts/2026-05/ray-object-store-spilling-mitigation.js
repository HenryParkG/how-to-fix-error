window.onPostDataLoaded({
    "title": "Mitigating Ray Object Store Spilling in Large-Scale Training",
    "slug": "ray-object-store-spilling-mitigation",
    "language": "Python",
    "code": "ObjectStoreFull",
    "tags": [
        "Python",
        "Backend",
        "Distributed-Systems",
        "Error Fix"
    ],
    "analysis": "<p>Ray's plasma object store is a shared-memory system. During large-scale distributed training, 'Object Store Spilling' occurs when the aggregate size of objects (tensors, datasets) exceeds the pre-allocated memory limit (usually 30% of system RAM). When spilling is triggered, Ray writes objects to disk, causing a massive I/O bottleneck that can slow down training by 10x. This often happens because references to large objects are held longer than necessary, preventing the garbage collector from reclaiming plasma memory.</p>",
    "root_cause": "Plasma store exhaustion caused by holding 'ObjectRefs' in scope and insufficient memory-aware task scheduling.",
    "bad_code": "import ray\n@ray.remote\ndef train_step(data):\n    return [large_tensor for _ in range(100)]\n\n# Accumulating refs in a list prevents GC\nresults = [train_step.remote(d) for d in data_batches]\n# All tensors remain in plasma store until 'results' is cleared",
    "solution_desc": "Implement manual memory management using 'ray.internal.free' (carefully) or, preferably, process results in batches using 'ray.wait' to ensure that ObjectRefs are out of scope and cleaned up. Additionally, configure 'object_store_memory' and 'min_spilling_size' in 'ray.init()'.",
    "good_code": "import ray\n@ray.remote\ndef train_step(data): return process(data)\n\n# Process in chunks to allow plasma cleanup\nfor batch in chunks(data_batches, 10):\n    refs = [train_step.remote(b) for b in batch]\n    ready, _ = ray.wait(refs, num_returns=len(refs))\n    results.extend(ray.get(ready))\n    del refs # Explicitly clear refs",
    "verification": "Monitor 'ray memory' CLI output and check for 'Spilled' metrics in the Ray Dashboard to ensure disk usage remains at zero.",
    "date": "2026-05-04",
    "id": 1777882688,
    "type": "error"
});