window.onPostDataLoaded({
    "title": "The Container Permission Paradox: UID/GID Mismatch",
    "slug": "uid-gid-mismatch-non-root-containers",
    "language": "Docker",
    "code": "PermissionDenied",
    "tags": [
        "docker",
        "security",
        "volumes",
        "chown",
        "uid-gid"
    ],
    "analysis": "<p>Running containerized applications as a non-root user is a foundational security best practice, mitigating potential privilege escalation and minimizing the blast radius if the application is compromised. However, this best practice immediately runs headlong into the Unix filesystem permission model when bind-mounting volumes from the host machine.</p><p>The Container Permission Paradox occurs because, while the Docker daemon handles the volume mount successfully, the operating system kernel enforces access control based on numeric User IDs (UIDs) and Group IDs (GIDs), not usernames (like 'appuser' or 'node').</p><p>If the file on the host is owned by host UID 1000, and the container application runs under a user assigned container UID 100, the container process cannot write to that volume. The kernel sees the request coming from user ID 100 attempting to modify files owned by ID 1000, resulting in an EACCES (Permission Denied) error. This is especially prevalent in modern minimal base images (like Alpine), where non-root UIDs often start low, conflicting with common host desktop UIDs (often 1000 or 501).</p><p>The challenge is balancing security (running non-root) with operational necessity (persisting data to mounted volumes).</p>",
    "root_cause": "Linux systems resolve file ownership based purely on the numeric UID and GID. When a host volume is mounted, its existing ownership (e.g., UID 1000) does not automatically align with the container's isolated user context (e.g., UID 100), causing access failure.",
    "bad_code": "FROM node:18-alpine\nRUN adduser -D appuser\nWORKDIR /usr/src/app\n# Volume will be mounted to /usr/src/app\nUSER appuser\nCMD [\"node\", \"server.js\"]\n\n# Host command will fail if host UID != appuser UID (likely 1000/100 mismatch):\n# docker run -v $(pwd)/data:/usr/src/app appimage",
    "solution_desc": "The most robust solution is to dynamically ensure the container user possesses ownership of the mounted volume upon container startup. This is achieved by creating an explicit entrypoint script that executes <code>chown</code> before launching the primary application command. This shifts the responsibility of synchronizing permissions from the host (which is insecure or cumbersome) to the container environment itself, guaranteeing that the application's user ID (<code>id -u</code>) owns the critical path.",
    "good_code": "FROM node:18-alpine\nRUN adduser -D appuser\nWORKDIR /usr/src/app\n# Copy entrypoint script and ensure it is executable\nCOPY entrypoint.sh /usr/local/bin/\nRUN chmod +x /usr/local/bin/entrypoint.sh\nUSER appuser\nENTRYPOINT [\"entrypoint.sh\"]\nCMD [\"node\", \"server.js\"]\n\n-- entrypoint.sh --\n#!/bin/sh\n\n# Use the container user's current UID and GID\nCONTAINER_UID=$(id -u)\nCONTAINER_GID=$(id -g)\n\n# Recursively change ownership of the mounted volume\n# to match the executing user's UID/GID.\nchown -R $CONTAINER_UID:$CONTAINER_GID /usr/src/app\n\n# Execute the main application command\nexec \"$@\"",
    "verification": "After applying the dynamic entrypoint fix, run the container and immediately use <code>docker exec -u appuser [container_id] ls -ld /usr/src/app</code>. The output should confirm that the volume directory is owned by the numerical UID of the <code>appuser</code>. Then, verify write capability: <code>docker exec -u appuser [container_id] touch /usr/src/app/test.txt</code>. This command should succeed without error.",
    "date": "2026-02-09",
    "id": 1770616697
});