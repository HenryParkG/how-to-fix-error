window.onPostDataLoaded({
    "title": "PyTorch: Resolving Shared Memory Deadlocks in DataLoaders",
    "slug": "pytorch-shared-memory-deadlock-dataloader",
    "language": "Python",
    "code": "Deadlock",
    "tags": [
        "Python",
        "Backend",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When training on Multi-GPU systems, PyTorch DataLoaders use multiprocessing to fetch data. Workers communicate using Shared Memory (shm). A common deadlock occurs when a worker process is terminated (e.g., due to a Segfault or OOM) while holding a lock on a shared memory segment, or when the system's <code>/dev/shm</code> is exhausted, causing the main process to wait indefinitely for a signal that never arrives.</p>",
    "root_cause": "The default multiprocessing 'Queue' implementation lacks a robust timeout/heartbeat mechanism for worker health checks during shared memory transfers.",
    "bad_code": "train_loader = DataLoader(\n    dataset,\n    batch_size=64,\n    num_workers=16, # High worker count increases shm pressure\n    pin_memory=True\n)",
    "solution_desc": "Increase the shared memory limit in the container environment, use <code>persistent_workers=True</code> to prevent constant re-allocation, and wrap the iterator in a timeout-aware loop.",
    "good_code": "# Increase shm-size in Docker: --shm-size=2gb\ntrain_loader = DataLoader(\n    dataset,\n    batch_size=64,\n    num_workers=4, \n    pin_memory=True,\n    persistent_workers=True,\n    prefetch_factor=2\n)",
    "verification": "Monitor `/dev/shm` usage using `df -h` during training and verify that the process exits cleanly on `KeyboardInterrupt` without leaving zombie processes.",
    "date": "2026-04-28",
    "id": 1777363715,
    "type": "error"
});