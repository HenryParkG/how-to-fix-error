window.onPostDataLoaded({
    "title": "Fix CockroachDB Raft Leaseholder Livelocks",
    "slug": "cockroachdb-raft-leaseholder-livelock-partition",
    "language": "SQL",
    "code": "LivelockError",
    "tags": [
        "SQL",
        "Go",
        "Distributed Systems",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In CockroachDB, range leaseholders handle client read and write operations. Under asymmetric network partitions\u2014where Node A can transmit packets to Node B, but Node B's responses to Node A drop\u2014the lease transfer protocol enters a livelock. The existing leaseholder repeatedly attempts to proactively transfer range leases to a candidate node that cannot complete the heartbeat loop. Client operations stall perpetually waiting for lease stabilization that fails to commit.</p>",
    "root_cause": "Asymmetric network routing allows unidirectional Raft heartbeats, causing leaseholder transfer logic to nominate unviable target nodes without confirming bidirectional liveness.",
    "bad_code": "-- Default zone configuration allowing unbounded lease transfers across unreliable subnets\nALTER RANGE default CONFIGURE ZONE = '{\n  \"num_replicas\": 3,\n  \"constraints\": []\n}';",
    "solution_desc": "Adjust cluster liveness probe intervals, force strict lease location constraints via zone configurations to prevent transfers across split subnets, and configure network liveness timeouts to drop unidirectional link candidates.",
    "good_code": "-- Force strict zone constraints to restrict lease transfers to validated local nodes\nALTER RANGE default CONFIGURE ZONE = '{\n  \"num_replicas\": 3,\n  \"constraints\": [\"+region=us-east-1\"],\n  \"lease_preferences\": [[\"+region=us-east-1\"]]\n}';\n\n-- Fine-tune cluster network health detection parameters\nSET CLUSTER SETTING kv.allocator.lease_rebalance_interval = '30s';\nSET CLUSTER SETTING server.heartbeat.timeout = '5s';",
    "verification": "Query `crdb_internal.node_status` during packet loss injection via `iptables`. Confirm that `ranges.leaseholder.transfers.failed` metric stops increasing and cluster queries execute without timing out.",
    "date": "2026-08-13",
    "id": 1786605248,
    "type": "error"
});