window.onPostDataLoaded({
    "title": "Fixing K8s EBS Silent Corruption via CSI Race Fix",
    "slug": "k8s-ebs-csi-mount-race-corruption",
    "language": "Go",
    "code": "Data Corruption",
    "tags": [
        "Kubernetes",
        "Infra",
        "AWS",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-density Kubernetes clusters, pods using EBS-backed Persistent Volumes can experience silent data corruption. This occurs when the EBS CSI driver attempts to format or mount a device before the Linux kernel has finished populating the <code>/dev/disk/by-id</code> symlinks, leading to the driver mounting a previously unmounted stale device or a different volume entirely.</p>",
    "root_cause": "A race condition between the AWS Attachment API and the NodeStageVolume call. The CSI driver assumes the first available device path is the correct one without verifying the VolumeID metadata against the physical hardware serial.",
    "bad_code": "// Buggy logic: Mounts by predictable path\ntargetPath := \"/dev/xvdb\"\nos.MkdirAll(mountPoint, 0750)\nsyscall.Mount(targetPath, mountPoint, \"ext4\", 0, \"\")",
    "solution_desc": "Modify the NodeStageVolume logic to utilize unique hardware identifiers. Use the device serial (provided by AWS) to locate the device in <code>/dev/disk/by-id/virtio-&lt;vol-id&gt;</code> instead of relying on non-deterministic <code>/dev/sdX</code> paths.",
    "good_code": "// Fixed logic: Verify Volume ID via udev/disk-by-id\nvolumeID := req.GetVolumeId()\ndevicePath := filepath.Join(\"/dev/disk/by-id\", \"nvme-Amazon_Elastic_Block_Store_\" + strings.ReplaceAll(volumeID, \"vol-\", \"\"))\nif _, err := os.Stat(devicePath); err == nil {\n    mounter.FormatAndMount(devicePath, mountPoint, \"ext4\", nil)\n}",
    "verification": "Deploy a deployment that rapidly cycles pods with unique EBS volumes and verify data integrity using checksums (sha256sum) on pod startup.",
    "date": "2026-04-26",
    "id": 1777187944,
    "type": "error"
});