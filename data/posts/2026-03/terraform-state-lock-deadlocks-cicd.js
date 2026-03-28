window.onPostDataLoaded({
    "title": "Fixing Terraform Provider State Lock Deadlocks",
    "slug": "terraform-state-lock-deadlocks-cicd",
    "language": "HCL",
    "code": "StateLockError",
    "tags": [
        "AWS",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When using a remote backend (like S3 with DynamoDB) in high-concurrency CI/CD pipelines, Terraform attempts to acquire a lock to prevent concurrent state modifications. If a CI job crashes or is killed during an <code>apply</code>, the lock may remain in the database, preventing subsequent runs from proceeding.</p>",
    "root_cause": "Abrupt termination of Terraform processes (e.g., CI runner timeout) without executing the cleanup phase to release the DynamoDB lock entry.",
    "bad_code": "terraform apply -auto-approve",
    "solution_desc": "Configure the Terraform wrapper to use a lock timeout or implement an automated unlock mechanism for stale locks. Ensure CI jobs have enough graceful shutdown time to clean up resources.",
    "good_code": "# In CI/CD Script\nterraform apply -lock-timeout=300s -auto-approve || \\\n(terraform force-unlock -force $LOCK_ID && exit 1)",
    "verification": "Check DynamoDB for 'LockID' entries. Run concurrent `terraform plan` commands to verify queuing behavior.",
    "date": "2026-03-28",
    "id": 1774690180,
    "type": "error"
});