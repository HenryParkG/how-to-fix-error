window.onPostDataLoaded({
    "title": "Resolving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-multi-region",
    "language": "Java",
    "code": "SplitBrainResolverError",
    "tags": [
        "Java",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In multi-region Akka deployments, transient network latency between data centers can trigger the failure detector. If two halves of a cluster lose connectivity, they may both decide the other half is dead, leading to a 'Split-Brain' scenario. This results in two independent clusters running simultaneously, causing data corruption in persistent entities (Sharding).</p><p>The standard Phi Accrual Failure Detector is often too sensitive for cross-region links, leading to 'flickering' membership where nodes are marked unreachable and then reachable again in rapid succession, confusing the leader election logic.</p>",
    "root_cause": "Misconfigured 'stable-after' duration and lack of a robust Split Brain Resolver (SBR) strategy like 'keep-majority' in the face of high inter-region P99 latency.",
    "bad_code": "akka.cluster {\n  failure-detector.threshold = 8.0\n  split-brain-resolver.active-strategy = off\n  # Without SBR, both sides stay UP and diverge\n}",
    "solution_desc": "Enable the Akka Split Brain Resolver with the 'keep-majority' or 'static-quorum' strategy. Adjust the failure detector heartbeats to account for cross-region latency and increase the 'stable-after' setting to ensure the partition is not a transient blip before taking down nodes.",
    "good_code": "akka.cluster {\n  downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"\n  split-brain-resolver {\n    active-strategy = keep-majority\n    stable-after = 20s # Increased for multi-region stability\n  }\n  failure-detector {\n    acceptable-heartbeat-pause = 5s\n    threshold = 12.0\n  }\n}",
    "verification": "Simulate a network partition using 'iptables' and verify via JMX that the smaller partition self-terminates while the larger remains functional.",
    "date": "2026-04-24",
    "id": 1777025878,
    "type": "error"
});