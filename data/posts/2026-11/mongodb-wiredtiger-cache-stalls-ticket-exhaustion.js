window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Stalls & Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-cache-stalls-ticket-exhaustion",
    "language": "MongoDB",
    "code": "WiredTigerTicketExhaustion",
    "tags": [
        "Docker",
        "Kubernetes",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>When MongoDB experiences high concurrency with heavy analytical reads or unindexed updates, queries freeze and connections spike as <code>wiredTiger.concurrentTransactions</code> (read/write tickets) drops to zero. Simultaneously, the storage engine triggers aggressive internal evictions, causing latency spikes and application timeouts.</p><p>By default, WiredTiger allocates 128 concurrent read tickets and 128 write tickets. When the dirty cache threshold (typically 20%) or overall memory fill ratio (80%) is exceeded, storage engine worker threads cannot keep pace, forcing incoming application threads to participate in page eviction. This leads to thread contention, ticket starvation, and cascading failure across replica set members.</p>",
    "root_cause": "Unindexed queries, excessive working-set scans, and under-provisioned storage bandwidth cause dirty pages to exceed WiredTiger eviction thresholds, forcing application threads into synchronous page eviction and consuming all concurrent read/write tickets.",
    "bad_code": "// High-concurrency update performing unindexed subdocument array scans\n// Causes dirty cache accumulation and exhausts write tickets\ndb.orders.updateMany(\n  { \"items.vendorId\": \"v_4829\", \"status\": \"PENDING\" },\n  { $set: { \"items.$[elem].flagged\": true } },\n  { arrayFilters: [{ \"elem.vendorId\": \"v_4829\" }] }\n);",
    "solution_desc": "Create compound indexes to prevent full collection scans that saturate memory cache, tune WiredTiger dirty and eviction memory limits via startup parameters, and throttle concurrent batch operations at the application level.",
    "good_code": "// 1. Ensure composite index covers query filter and state\ndb.orders.createIndex(\n  { \"items.vendorId\": 1, \"status\": 1 },\n  { background: true, name: \"idx_vendor_status\" }\n);\n\n// 2. Bound batch execution size to avoid dirty page floods\nconst batchSize = 500;\nlet cursor = db.orders.find(\n  { \"items.vendorId\": \"v_4829\", \"status\": \"PENDING\" },\n  { _id: 1 }\n).limit(batchSize);\n\nwhile (cursor.hasNext()) {\n  const ids = cursor.toArray().map(doc => doc._id);\n  db.orders.updateMany(\n    { _id: { $in: ids } },\n    { $set: { \"items.$[elem].flagged\": true } },\n    { arrayFilters: [{ \"elem.vendorId\": \"v_4829\" }] }\n  );\n  cursor = db.orders.find(\n    { \"items.vendorId\": \"v_4829\", \"status\": \"PENDING\" },\n    { _id: 1 }\n  ).limit(batchSize);\n}",
    "verification": "Inspect server status metrics using `db.serverStatus().wiredTiger.concurrentTransactions` to ensure available tickets remain above zero, and verify that `wiredTiger.cache['tracked dirty bytes in the cache']` stabilizes well below 20% under peak load.",
    "date": "2026-11-06",
    "id": 1793938807,
    "type": "error"
});