window.onPostDataLoaded({
    "title": "Fix Ubuntu Could Not Get Lock /var/lib/dpkg/lock-frontend",
    "slug": "fix-ubuntu-could-not-get-lock-dpkg-frontend",
    "language": "Linux",
    "code": "E_DPKG_LOCKED",
    "tags": [
        "Linux",
        "CMD",
        "Error Fix"
    ],
    "analysis": "<p>When running <code>apt</code> or <code>apt-get</code> commands on Ubuntu or Debian, the package manager fails with an error stating <code>Could not get lock /var/lib/dpkg/lock-frontend</code>.</p><p>This error occurs because another process is holding the dpkg frontend lock file to prevent simultaneous package operations from corrupting the database.</p>",
    "root_cause": "The lock file <code>/var/lib/dpkg/lock-frontend</code> is held by an active or hung package manager process, such as <code>unattended-upgr</code> running in the background, or an interrupted prior <code>apt</code> run.",
    "bad_code": "E: Could not get lock /var/lib/dpkg/lock-frontend - open (11: Resource temporarily unavailable)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?",
    "solution_desc": "<p>First, inspect whether an active background upgrade is running. If an orphaned or stuck process holds the lock, terminate the specific process ID. If no process holds the lock, remove the stale lock files safely and repair the dpkg database using <code>dpkg --configure -a</code>.</p>",
    "good_code": "# 1. Find the process holding the lock\nsudo lsof /var/lib/dpkg/lock-frontend\nsudo fuser -v /var/lib/dpkg/lock-frontend\n\n# 2. If hung or orphaned, kill the process by PID\nsudo kill -15 <PID>\n# If it does not terminate cleanly:\nsudo kill -9 <PID>\n\n# 3. If no process is running, clear stale lock files and fix dpkg\nsudo rm /var/lib/dpkg/lock-frontend\nsudo rm /var/lib/dpkg/lock\nsudo rm /var/lib/apt/lists/lock\nsudo dpkg --configure -a\nsudo apt update",
    "verification": "Run <code>sudo apt update</code>. The package list should update successfully without any lock warnings or resource errors.",
    "date": "2026-11-17",
    "id": 1794894572,
    "type": "error"
});