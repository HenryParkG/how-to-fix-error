window.onPostDataLoaded({
    "title": "Mitigating Cassandra Paxos Contention in LWT Workloads",
    "slug": "cassandra-paxos-contention-lwt",
    "language": "Java",
    "code": "PAXOS_TIMEOUT",
    "tags": [
        "Java",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Cassandra's Lightweight Transactions (LWT) use the Paxos protocol to ensure linearizability. In high-churn workloads where multiple clients attempt to update the same partition concurrently, the 'Prepare' phase frequently fails because another proposer has already started a higher-ballot round. This leads to exponential backoff, increased <code>CasProposeLatency</code>, and eventually client-side timeouts, even if the underlying disk I/O is low.</p>",
    "root_cause": "High contention on a single partition key causes multiple Paxos rounds to conflict, preventing any single transaction from completing the 4-phase handshake within the timeout period.",
    "bad_code": "-- High frequency updates to a single status row\nUPDATE user_status SET state = 'active' \nWHERE user_id = 'global_lock' \nIF state = 'idle';",
    "solution_desc": "Introduce a client-side deterministic lock-sharding mechanism or use a 'Compare-and-Swap' (CAS) batching proxy to linearize requests before they hit the Cassandra coordinator.",
    "good_code": "// Shard the hot partition or use a queue to serialize LWTs\nString shardKey = \"global_lock_\" + (request_id % 16);\nsession.execute(prepareUpdate.bind(shardKey, \"active\", \"idle\"));",
    "verification": "Check 'nodetool proxyhistograms' for high CasPropose latency and verify 'PaxosContention' metrics in JMX.",
    "date": "2026-05-16",
    "id": 1778917830,
    "type": "error"
});