window.onPostDataLoaded({
    "title": "Fixing K8s CNI Subnet IPAM Exhaustion During HPA Bursts",
    "slug": "fixing-k8s-cni-subnet-ipam-exhaustion-hpa-bursts",
    "language": "Kubernetes",
    "code": "IPAM_EXHAUSTION",
    "tags": [
        "Kubernetes",
        "CNI",
        "AWS",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During sudden traffic spikes triggering Horizontal Pod Autoscaler (HPA) bursts, CNI plugins (such as AWS VPC CNI) can rapidly exhaust available IP addresses within designated node subnets or pod CIDR pools. Pending pods get stuck in <code>ContainerCreating</code> or <code>Pending</code> states with CNI allocation timeout errors, causing cascading service failures despite idle CPU and memory headroom.</p>",
    "root_cause": "Node subnets are under-provisioned, or IPAM warm target pools (e.g., WARM_IP_TARGET / WARM_ENI_TARGET) fail to pre-allocate secondary network interfaces (ENIs) quickly enough to keep pace with rapid pod scaling events, exhausting free pod IPs in the local CNI pool.",
    "bad_code": "apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: aws-node\n  namespace: kube-system\nspec:\n  template:\n    spec:\n      containers:\n      - name: aws-node\n        env:\n        - name: WARM_IP_TARGET\n          value: \"3\" # Under-provisioned warm target during 100+ pod burst\n        - name: MINIMUM_IP_TARGET\n          value: \"5\"",
    "solution_desc": "Configure dynamic CNI IPAM warm target rules with prefix delegation (ENABLE_PREFIX_DELEGATION=true in AWS VPC CNI to allocate /28 IPv4 blocks instead of single IPs) or configure dedicated secondary CIDRs and relaxed warm buffer limits.",
    "good_code": "apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: aws-node\n  namespace: kube-system\nspec:\n  template:\n    spec:\n      containers:\n      - name: aws-node\n        env:\n        - name: ENABLE_PREFIX_DELEGATION\n          value: \"true\"\n        - name: WARM_PREFIX_TARGET\n          value: \"1\"\n        - name: WARM_IP_TARGET\n          value: \"10\"\n        - name: MINIMUM_IP_TARGET\n          value: \"30\"",
    "verification": "Run kubectl describe pods on scaling pods to verify sub-second IP assignments. Check CNI IPAM status via aws-cni-support.sh or AWS CloudWatch metric IPAddressCount to confirm buffer availability during load tests.",
    "date": "2026-08-02",
    "id": 1785666407,
    "type": "error"
});