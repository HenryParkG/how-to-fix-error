window.onPostDataLoaded({
    "title": "Resolving Ray Task Graph Deadlocks on Node Preemption",
    "slug": "ray-distributed-task-graph-deadlocks",
    "language": "Python",
    "code": "DistributedDeadlock",
    "tags": [
        "Python",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Ray distributed applications often experience deadlocks when nodes are preempted (e.g., AWS Spot instances). This occurs when a task graph has strict dependencies where a 'parent' task waits for a 'child' result, but the child is scheduled on a preempted node and the scheduler lacks enough resources to restart the child because the parent is still occupying a slot. This circular dependency on resources leads to a permanent stall in processing.</p>",
    "root_cause": "Resource starvation where a running task waits for a dependency that cannot be rescheduled due to the waiting task holding onto the required CPU/GPU slots.",
    "bad_code": "@ray.remote\ndef child_task():\n    return \"data\"\n\n@ray.remote(num_cpus=1)\ndef parent_task():\n    # If the node with child_task dies, and parent_task occupies the last slot,\n    # child_task cannot restart.\n    ref = child_task.remote()\n    return ray.get(ref)",
    "solution_desc": "Use 'ray.wait' with timeouts or design tasks to be more granular. More importantly, set max_retries and ensure the scheduler is aware of resource requirements through 'scheduling_strategy'.",
    "good_code": "@ray.remote(max_retries=-1)\ndef child_task():\n    return \"data\"\n\n@ray.remote(num_cpus=0.1) # Reduce resource footprint of Orchestrator tasks\ndef parent_task():\n    ref = child_task.remote()\n    # Using wait instead of get to avoid blocking indefinitely without visibility\n    ready, _ = ray.wait([ref], timeout=60)\n    if not ready:\n        raise TimeoutError(\"Task timed out due to preemption\")\n    return ray.get(ready[0])",
    "verification": "Simulate node failure using 'ray.kill(node_id)' and observe if the task graph recovers and completes within the expected grace period.",
    "date": "2026-03-23",
    "id": 1774228822,
    "type": "error"
});