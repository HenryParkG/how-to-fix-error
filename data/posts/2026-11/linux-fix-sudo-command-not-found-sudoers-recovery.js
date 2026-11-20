window.onPostDataLoaded({
    "title": "Fix \"sudo: command not found\" or \"not in sudoers file\"",
    "slug": "linux-fix-sudo-command-not-found-sudoers-recovery",
    "language": "Linux",
    "code": "ERR_SUDOERS_AUTH",
    "tags": [
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>In minimal Linux distributions (such as Debian minimal, Arch, or container base images), non-root users often encounter <code>bash: sudo: command not found</code> when attempting administrative tasks. On standard installations, users may instead see <code>username is not in the sudoers file. This incident will be reported.</code></p>",
    "root_cause": "The error stems either from the <code>sudo</code> package being omitted from minimal OS installations, or the local user account lacking membership in administrative groups (such as <code>sudo</code> or <code>wheel</code>) mapped within <code>/etc/sudoers</code>.",
    "bad_code": "$ sudo apt update\nbash: sudo: command not found\n\n# OR:\n$ sudo su\nusername is not in the sudoers file. This incident will be reported.",
    "solution_desc": "<p>Switch to the primary <code>root</code> account via <code>su -</code> to install the missing package and append your standard account to the authorized sudo group. If standard root login is unavailable, reboot into single-user rescue mode or append <code>init=/bin/bash</code> to GRUB parameters.</p><ol><li>Log into root: run <code>su -</code> and enter the root password.</li><li>Install sudo: execute <code>apt update && apt install -y sudo</code> (Debian/Ubuntu) or <code>pacman -S sudo</code> (Arch).</li><li>Add the user to the administrative group: <code>usermod -aG sudo <username></code> (Debian/Ubuntu) or <code>usermod -aG wheel <username></code> (RHEL/Arch).</li><li>Reload user session groups or log out and back in.</li></ol>",
    "good_code": "# 1. Switch to root\nsu -\n\n# 2. Install sudo if missing (Debian/Ubuntu)\napt update && apt install -y sudo\n\n# Or install sudo on RHEL/CentOS/Fedora\ndnf install -y sudo\n\n# 3. Add your standard user to sudoers group\nusermod -aG sudo your_username\n# Note: Use 'wheel' instead of 'sudo' on CentOS/RHEL/Fedora/Arch:\n# usermod -aG wheel your_username\n\n# 4. Exit root session and refresh group membership\nexit\nnewgrp sudo",
    "verification": "Execute <code>groups</code> as your regular user to confirm <code>sudo</code> or <code>wheel</code> is present. Then test privileges by running <code>sudo whoami</code>; it should return <code>root</code> without throwing authentication errors.",
    "date": "2026-11-20",
    "id": 1795150491,
    "type": "error"
});