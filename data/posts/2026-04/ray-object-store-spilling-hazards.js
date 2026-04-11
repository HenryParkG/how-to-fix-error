window.onPostDataLoaded({
    "title": "Resolving Ray Object Store Spilling & Pinning",
    "slug": "ray-object-store-spilling-hazards",
    "language": "Python",
    "code": "ObjectStoreFullError",
    "tags": [
        "Distributed Systems",
        "Ray",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Ray's distributed object store (Plasma) uses shared memory to facilitate zero-copy serialization. However, when tasks hold references (pins) to objects in the local scope, Ray cannot spill those objects to disk even if the store is full. This creates a 'pinning hazard' where the system deadlocks because it cannot free memory to ingest new task results.</p>",
    "root_cause": "Active ObjectRefs stored in global variables or long-lived lists prevent the Garbage Collector from releasing the pin in the Plasma store.",
    "bad_code": "import ray\n\n@ray.remote\ndef worker():\n    return [0] * 1_000_000\n\nresults = []\nwhile True:\n    # Hazard: Accumulating ObjectRefs keeps memory pinned\n    ref = worker.remote()\n    results.append(ref) \n    if len(results) > 1000:\n        process(ray.get(results))",
    "solution_desc": "Use `ray.wait()` to process objects as they complete and explicitly delete references. Configure `object_spilling_config` to allow external storage offloading for non-pinned objects.",
    "good_code": "import ray\n\n# Configure spilling to disk\nray.init(_system_config={\"object_spilling_config\": \"{\\\"type\\\":\\\"filesystem\\\",\\\"params\\\":{\\\"directory_path\\\":\\\"/tmp/ray\\\"}}\"})\n\nref = worker.remote()\ntry:\n    data = ray.get(ref)\n    process(data)\nfinally:\n    # Explicitly release the reference\n    del ref",
    "verification": "Check `ray memory` CLI output to verify that 'Pinned' memory stays within acceptable thresholds during execution.",
    "date": "2026-04-11",
    "id": 1775870566,
    "type": "error"
});