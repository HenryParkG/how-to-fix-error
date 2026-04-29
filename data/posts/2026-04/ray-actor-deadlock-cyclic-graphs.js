window.onPostDataLoaded({
    "title": "Eliminating Ray Actor Deadlocks in Cyclic Dependencies",
    "slug": "ray-actor-deadlock-cyclic-graphs",
    "language": "Python",
    "code": "RayActorDeadlock",
    "tags": [
        "Python",
        "Backend",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>Ray actors are single-threaded by default. When actor A calls actor B synchronously (using ray.get), and actor B calls actor A back, both actors enter a blocked state waiting for the other to finish. This is a classic distributed deadlock common in cyclic dependency graphs used for simulation or graph processing.</p>",
    "root_cause": "Synchronous remote calls within a cycle where the execution threads of all participating actors are exhausted waiting for blocking I/O.",
    "bad_code": "@ray.remote\nclass Node:\n    def ping(self, other):\n        return ray.get(other.pong.remote())\n\n# Deadlock: A calls B.ping, B calls A.pong. Both hang.",
    "solution_desc": "Convert the actor methods to 'async' to allow the Ray event loop to handle other requests while waiting for the remote call, or increase 'max_concurrency' to allow multiple concurrent tasks per actor.",
    "good_code": "@ray.remote\nclass Node:\n    async def ping(self, other):\n        # await allows the actor to process other calls (like pong)\n        return await other.pong.remote()\n\n    async def pong(self):\n        return 'pong'",
    "verification": "Inspect Ray Dashboard. If 'State' is 'BLOCKED' for multiple actors and CPU usage is 0, deadlock occurred. Success is verified when cyclic calls return without timeout.",
    "date": "2026-04-29",
    "id": 1777449683,
    "type": "error"
});