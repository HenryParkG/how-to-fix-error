window.onPostDataLoaded({
    "title": "Resolving K8s CSI Deadlocks in Multi-AZ Provisioning",
    "slug": "k8s-csi-deadlock-multi-az",
    "language": "Kubernetes",
    "code": "Deadlock",
    "tags": [
        "Kubernetes",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When deploying stateful applications across multiple Availability Zones (AZs), a race condition can occur between the Kubernetes Scheduler and the CSI Provisioner. The scheduler might place a Pod in AZ-1, while the CSI driver attempts to create the volume in AZ-2 based on stale topology information or lack of constraints, resulting in a 'VolumeBinding' deadlock where the Pod can never start.</p>",
    "root_cause": "The StorageClass uses 'VolumeBindingMode: Immediate', forcing volume creation before Pod scheduling, or missing 'allowedTopologies' constraints in the CSI driver configuration.",
    "bad_code": "apiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata:\n  name: fast-storage\nprovisioner: ebs.csi.aws.com\nvolumeBindingMode: Immediate",
    "solution_desc": "Change the VolumeBindingMode to 'WaitForFirstConsumer'. This instructs Kubernetes to delay volume provisioning until the Pod is scheduled to a specific node, ensuring the volume is created in the same AZ as the node.",
    "good_code": "apiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata:\n  name: fast-storage\nprovisioner: ebs.csi.aws.com\nvolumeBindingMode: WaitForFirstConsumer\nallowedTopologies:\n- matchLabelExpressions:\n  - key: topology.ebs.csi.aws.com/zone\n    values: [\"us-east-1a\", \"us-east-1b\"]",
    "verification": "Describe the pending pod; check for 'node.kubernetes.io/out-of-service' or 'VolumeNodeAffinity' events to ensure alignment.",
    "date": "2026-04-03",
    "id": 1775199546,
    "type": "error"
});