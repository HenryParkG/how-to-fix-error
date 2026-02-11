window.onPostDataLoaded({
    "title": "The Event Loop Blackout: The JSON.parse Performance Trap",
    "slug": "event-loop-blackout-json-parse-nodejs",
    "language": "Node.js",
    "code": "EventLoopBlocking",
    "tags": [
        "Node.js",
        "Performance",
        "Event Loop",
        "Scalability",
        "Error Fix"
    ],
    "analysis": "<p>Node.js is renowned for its non-blocking I/O, but it remains strictly single-threaded for CPU-bound tasks. JSON.parse is a synchronous, recursive operation with O(n) time complexity. When a Node.js process encounters a multi-megabyte JSON string, it enters a 'blackout' period where the main thread is pinned entirely to the CPU.</p><p>During this execution, the Event Loop cannot tick. This means incoming TCP connections are queued but not accepted, pending Promise resolutions are deferred, and health check endpoints fail to respond. In high-volume environments, this manifests as a sudden spike in p99 latency and can trigger circuit breakers or Kubernetes liveness probe failures across the cluster.</p>",
    "root_cause": "JSON.parse is a synchronous, blocking CPU operation that halts the execution of the main thread and the Event Loop until the entire string is parsed.",
    "bad_code": "app.post('/ingest', (req, res) => {\n  // If req.body is a massive raw string\n  const bigData = JSON.parse(req.body);\n  processData(bigData);\n  res.sendStatus(200);\n});",
    "solution_desc": "To prevent blocking the main thread, offload large parsing tasks to a Worker Thread or use a streaming/asynchronous parser like 'yieldable-json' or 'bfj' that breaks the work into smaller chunks, allowing the Event Loop to handle other tasks in between.",
    "good_code": "const { Worker } = require('worker_threads');\n\nfunction parseInWorker(jsonString) {\n  return new Promise((resolve, reject) => {\n    const worker = new Worker('./parser-worker.js', { workerData: jsonString });\n    worker.on('message', resolve);\n    worker.on('error', reject);\n  });\n}\n\napp.post('/ingest', async (req, res) => {\n  try {\n    const bigData = await parseInWorker(req.body);\n    processData(bigData);\n    res.sendStatus(200);\n  } catch (err) {\n    res.status(400).send('Invalid JSON');\n  }\n});",
    "verification": "Use 'autocannon' to load test the endpoint while monitoring the 'event loop delay' using the 'clinic.js' suite or 'perf_hooks'. A successful fix will show consistent low latency for concurrent small requests even while a large payload is being processed.",
    "date": "2026-02-11",
    "id": 1770803265,
    "type": "error"
});