window.onPostDataLoaded({
    "title": "How dns.lookup Paralyzes High-Concurrency Node.js Apps",
    "slug": "nodejs-dns-lookup-thread-starvation",
    "language": "Node.js",
    "code": "ThreadPoolStarvation",
    "tags": [
        "Node.js",
        "libuv",
        "Performance",
        "DNS",
        "Error Fix"
    ],
    "analysis": "<p>In Node.js, most I/O is non-blocking, but DNS resolution via <code>dns.lookup</code> is a notable exception. Under the hood, <code>dns.lookup</code> calls the synchronous <code>getaddrinfo(3)</code> system call. Because this call is synchronous, libuv executes it within its internal worker thread pool to avoid blocking the main Event Loop.</p><p>The critical bottleneck is that this thread pool (UV_THREADPOOL_SIZE) defaults to only four threads. When a high-concurrency application initiates hundreds of outbound HTTP requests simultaneously, the default <code>http.Agent</code> uses <code>dns.lookup</code> for every new connection. This instantly saturates the four threads. Subsequent DNS lookups, file system operations (fs), and certain cryptographic tasks (crypto) are forced into a queue, resulting in massive latency spikes or complete application paralysis even while CPU and memory usage remain low.</p>",
    "root_cause": "The dns.lookup function wraps the synchronous getaddrinfo(3) call in the limited libuv thread pool, causing a bottleneck when concurrent lookups exceed the pool size.",
    "bad_code": "const https = require('https');\n\n// Default behavior: uses dns.lookup and the limited libuv thread pool\nfor (let i = 0; i < 500; i++) {\n  https.get('https://api.external-service.com/data', (res) => {\n    res.on('data', () => {});\n  }).on('error', console.error);\n}",
    "solution_desc": "To bypass thread pool starvation, use the dns.resolve family of functions (e.g., dns.resolve4), which are implemented using the non-blocking c-ares library. For HTTP clients, you can inject a custom lookup function into the https.Agent to perform asynchronous resolution.",
    "good_code": "const https = require('https');\nconst dns = require('dns').promises;\n\n// Custom lookup function using non-blocking dns.resolve4\nconst asyncLookup = async (hostname, options, callback) => {\n  try {\n    const addresses = await dns.resolve4(hostname);\n    callback(null, addresses[0], 4);\n  } catch (err) {\n    callback(err);\n  }\n};\n\nconst agent = new https.Agent({ lookup: asyncLookup });\n\nfor (let i = 0; i < 500; i++) {\n  https.get('https://api.external-service.com/data', { agent }, (res) => {\n    res.on('data', () => {});\n  });\n}",
    "verification": "Run the application with a high number of concurrent requests and monitor the 'Event Loop Utilization' and 'Active Requests'. Alternatively, increase the libuv pool size globally using 'process.env.UV_THREADPOOL_SIZE = 64' and compare throughput against the default setting.",
    "date": "2026-02-11",
    "id": 1770786431
});