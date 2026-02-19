window.onPostDataLoaded({
    "title": "Debugging Terraform State Lock Deadlocks",
    "slug": "terraform-state-lock-deadlock",
    "language": "HCL",
    "code": "TF_LOCK_ERROR",
    "tags": [
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In concurrent CI/CD environments, Terraform uses a locking mechanism (e.g., DynamoDB for AWS S3 backend) to prevent multiple processes from modifying state simultaneously. A deadlock or 'ghost lock' occurs when a CI runner crashes or is terminated mid-apply, leaving the LockID in the database. Subsequent runs fail with a 423 Locked error, even though no process is actually running.</p>",
    "root_cause": "Interrupted CI/CD jobs failing to release DynamoDB LockID records during the 'terraform apply' phase.",
    "bad_code": "jobs:\n  terraform:\n    runs-on: ubuntu-latest\n    steps:\n      - run: terraform apply -auto-approve # No timeout or error handling",
    "solution_desc": "Implement a lock timeout in the Terraform command and use a 'trap' or 'always' cleanup step in CI to force-unlock or alert when locks persist longer than expected.",
    "good_code": "jobs:\n  terraform:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Terraform Apply\n        run: terraform apply -lock-timeout=3m -auto-approve\n      - name: Force Unlock (Manual Intervention)\n        if: failure()\n        run: | \n          LOCK_ID=$(terraform output -raw lock_id || echo \"none\")\n          if [ \"$LOCK_ID\" != \"none\" ]; then\n            terraform force-unlock -force $LOCK_ID\n          fi",
    "verification": "Check the DynamoDB 'LockID' table to ensure entries are deleted after the workflow completes or fails.",
    "date": "2026-02-19",
    "id": 1771483917,
    "type": "error"
});