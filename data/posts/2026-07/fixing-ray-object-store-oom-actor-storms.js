window.onPostDataLoaded({
    "title": "Fixing Ray Distributed Object Store OOM and Actor Storms",
    "slug": "fixing-ray-object-store-oom-actor-storms",
    "language": "Python",
    "code": "RayOutOfMemoryError",
    "tags": [
        "Python",
        "Ray",
        "Distributed-Computing",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale distributed training workloads, Ray's Plasma Object Store can easily become saturated when passing large tensors or NumPy arrays between workers. When memory limits are reached, Ray attempts to reclaim space. However, if the application holds strong references to <code>ObjectRef</code> handles, objects cannot be garbage collected. This triggers <code>RayOutOfMemoryError</code>. Consequently, worker actors crash, prompting Ray's automatic fault-tolerance system to reconstruct the failed actors. This initiates a catastrophic 'actor reconstruction storm', where massive recomputation queues saturate CPU, network, and memory resources, causing cascading timeouts and crashing the entire cluster.</p>",
    "root_cause": "The root cause is dual-fold: 1) Unbounded retention of ObjectRef references in the driver or worker loops, which prevents the Plasma store from evicting out-of-scope objects. 2) Default lineage reconstruction configurations that recursively trigger ancestral task execution under high memory pressure instead of failing gracefully or applying backpressure.",
    "bad_code": "import ray\n\nray.init()\n\n@ray.remote\ndef train_step(batch_data):\n    # Generates a massive state dict or activation tensor\n    return [ray.put(batch_data * i) for i in range(100)]\n\n# Buggy training loop retaining references indefinitely\nresults = []\nfor epoch in range(1000):\n    # Creates thousands of untracked ObjectRefs that cannot be garbage collected\n    obj_refs = train_step.remote(epoch)\n    results.append(obj_refs)\n    # No ray.wait backpressure, Plasma store OOMs rapidly\n    # If an actor dies here, Ray tries to reconstruct the entire lineage",
    "solution_desc": "To fix this, implement dynamic backpressure using ray.wait to limit active in-flight tasks, explicitly delete local ObjectRef references to allow Plasma eviction, configure ray.init with explicit object store memory limits, and set actor max_restarts and max_task_retries to sensible boundaries to prevent infinite lineage reconstruction loops.",
    "good_code": "import ray\nimport gc\n\n# Configure Ray with explicit limits and disable infinite reconstruction storms\nray.init(\n    _system_config={\n        \"object_store_memory\": 10 * 1024 * 1024 * 1024, # 10 GB limit\n        \"max_direct_call_object_size\": 1024 * 1024 # Limit inlined payloads\n    }\n)\n\n@ray.remote(max_restarts=3, max_task_retries=1)\nclass DynamicWorker:\n    def process(self, data):\n        return data * 2\n\nworker = DynamicWorker.remote()\nmax_outstanding_tasks = 10\nactive_refs = []\n\nfor epoch in range(1000):\n    # Apply manual backpressure\n    if len(active_refs) >= max_outstanding_tasks:\n        ready, active_refs = ray.wait(active_refs, num_returns=1)\n        # Free up local reference to trigger object eviction\n        del ready\n        gc.collect()\n\n    ref = worker.process.remote(epoch)\n    active_refs.append(ref)",
    "verification": "Monitor the Ray Dashboard's Object Store memory usage graph. Execute a sustained high-throughput run and verify that memory usage remains stable (flat-lining below the configured limit) and that worker restarts do not trigger recursive ancestor task invocations.",
    "date": "2026-07-16",
    "id": 1784166387,
    "type": "error"
});