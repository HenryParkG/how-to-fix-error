window.onPostDataLoaded({
    "title": "Fix Docker Mounts Denied or Path Errors in Git Bash",
    "slug": "docker-git-bash-mounts-denied-path-conversion",
    "language": "Docker",
    "code": "MSYS_PATH_CONV_ERR",
    "tags": [
        "Docker",
        "Windows",
        "Git",
        "Error Fix"
    ],
    "analysis": "<p>When running <code>docker run -v</code> or bind-mounting volumes inside Git Bash or MINGW on Windows, the container creation fails with errors such as <code>mounts denied</code> or <code>the path ... is not valid</code>. This occurs because the MSYS emulation layer automatically translates Linux-style POSIX paths into local Windows drive paths before handing them off to the Docker CLI.</p>",
    "root_cause": "Git Bash (MSYS/MinGW) enforces POSIX-to-Windows path conversion by default, turning <code>/c/Users/...</code> or container targets like <code>/app</code> into paths like <code>C:\\Program Files\\Git\\app</code>, which the Linux container daemon cannot resolve.",
    "bad_code": "docker run --rm -v $(pwd):/app -w /app node:18 npm test\n# Error response from daemon: mounts denied: the path /c/Users/... is not valid",
    "solution_desc": "<p>Disable MSYS automatic path conversion for Docker commands by prefixing the command with <code>MSYS_NO_PATHCONV=1</code>, setting the environment variable in your bash profile, or using double slashes for container-side paths.</p>",
    "good_code": "# Option 1: Inline environment variable prefix\nMSYS_NO_PATHCONV=1 docker run --rm -v \"$(pwd):/app\" -w /app node:18 npm test\n\n# Option 2: Double slash notation for container target path\ndocker run --rm -v \"$(pwd)://app\" -w //app node:18 npm test\n\n# Option 3: Permanently disable in Git Bash profile\necho \"export MSYS_NO_PATHCONV=1\" >> ~/.bashrc\nsource ~/.bashrc",
    "verification": "<p>Run a lightweight test container: <code>MSYS_NO_PATHCONV=1 docker run --rm -v \"$(pwd):/test\" alpine ls /test</code>. It should print the contents of your local directory without throwing path conversion or mount rejection errors.</p>",
    "date": "2026-11-22",
    "id": 1795320676,
    "type": "error"
});