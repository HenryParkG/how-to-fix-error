window.onPostDataLoaded({
    "title": "The Inode Ghost: Disk Space Errors When Storage is Free",
    "slug": "inode-exhaustion-no-space-left-on-device",
    "language": "Docker / Linux Kernel",
    "code": "ENOSPC Inode Exhaustion",
    "tags": [
        "Linux",
        "Docker",
        "DevOps",
        "Storage",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In Linux systems, disk space is governed by two distinct resources: data blocks and Index Nodes (inodes). While data blocks store the actual file content, inodes store metadata such as permissions, ownership, and pointers to the data blocks. Every single file, directory, or symbolic link on a filesystem consumes exactly one inode.</p><p>Standard monitoring tools like 'df -h' only report on data block usage. However, filesystems like EXT4 or XFS have a fixed number of inodes allocated at the time of creation. If an application generates millions of small files—such as PHP session files, temporary lock files, or micro-logs—it can exhaust the inode pool while the physical disk remains 90% empty. When this happens, the kernel returns the 'No space left on device' (ENOSPC) error because it cannot create the metadata entry required for a new file.</p>",
    "root_cause": "The filesystem has reached its maximum capacity for metadata entries (inodes), preventing new file creation despite having available byte-level storage.",
    "bad_code": "for i in {1..500000}; do\n  touch /tmp/app/session_metadata_$i.tmp\ndone",
    "solution_desc": "Use 'df -i' to identify inode exhaustion. Implement a cleanup strategy for temporary files using find or tmpwatch, or re-architect the application to use a key-value store (like Redis) for session data instead of the local filesystem.",
    "good_code": "find /tmp/app -type f -name '*.tmp' -mmin +60 -delete\n# Better: Use Redis for sessions\n# SESSION_DRIVER=redis",
    "verification": "Run 'df -i' in the terminal. If the IUse% column shows 100%, the inode pool is exhausted. After cleanup, the percentage should drop, allowing file creation again.",
    "date": "2026-02-10",
    "id": 1770684341
});