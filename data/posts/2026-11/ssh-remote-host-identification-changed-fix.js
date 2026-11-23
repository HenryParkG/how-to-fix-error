window.onPostDataLoaded({
    "title": "SSH \"WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED\" Fix",
    "slug": "ssh-remote-host-identification-changed-fix",
    "language": "Linux",
    "code": "SSH_HOST_KEY_MISMATCH",
    "tags": [
        "macOS",
        "Linux",
        "Network",
        "CLI",
        "Git",
        "Error Fix"
    ],
    "analysis": "<p>The warning <code>WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!</code> indicates a mismatch between the SSH host key stored on your local machine and the key presented by the remote server. This is a crucial security feature of SSH. Your local system keeps a record of known host keys in the <code>~/.ssh/known_hosts</code> file. When you try to connect to a server, SSH compares the server's current public key with the one it has on record. If they don't match, this warning is issued.</p><p>Common reasons for this include:</p><ul><li>The remote server has been reinstalled, and its SSH host key has legitimately changed.</li><li>The server's IP address has been assigned to a different machine with a new key.</li><li>A DNS change has pointed the hostname to a different server.</li><li>In rare but serious cases, it could indicate a man-in-the-middle attack where an attacker is impersonating your intended server.</li></ul>",
    "root_cause": "The cached SSH host key for the remote server in your <code>~/.ssh/known_hosts</code> file does not match the public key currently presented by the server, indicating a change in the server's identity.",
    "bad_code": "<code>ssh user@your-remote-host\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nIT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!\n...</code>",
    "solution_desc": "<p>If you have confirmed that the host key change is legitimate (e.g., you know the server was reinstalled), you can safely remove the old, conflicting key from your <code>known_hosts</code> file. The safest way to do this is using the <code>ssh-keygen -R</code> command. This command securely removes all keys belonging to the specified hostname or IP address from your <code>known_hosts</code> file.</p><p>1. Note the hostname or IP address from the warning message.</p><p>2. Execute the following command, replacing <code>your-remote-host</code> with the actual hostname or IP from the error:</p><p>Alternatively, if the warning specifies a line number, you can manually delete that line from <code>~/.ssh/known_hosts</code>, but <code>ssh-keygen -R</code> is generally safer and recommended.</p>",
    "good_code": "<code>ssh-keygen -R your-remote-host</code>\n<code># Example for a specific IP address:\nssh-keygen -R 192.168.1.100</code>",
    "verification": "<p>After removing the old host key, attempt to connect to the remote host again:</p><p>You will be prompted to confirm the authenticity of the host. Type <code>yes</code> to add the new host key to your <code>known_hosts</code> file. If the connection proceeds successfully without the warning, the problem is resolved.</p>",
    "date": "2026-11-23",
    "id": 1795409312,
    "type": "error"
});