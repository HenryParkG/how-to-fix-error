window.onPostDataLoaded({
    "title": "Fixing Terraform State Lock Deadlocks in CI/CD",
    "slug": "fixing-terraform-state-lock-deadlocks-cicd",
    "language": "Terraform / AWS",
    "code": "StateLockDeadlock",
    "tags": [
        "Terraform",
        "CI/CD",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In multi-runner CI/CD environments, concurrent pipeline execution or abrupt job cancellations (SIGKILL) leave orphan DynamoDB state lock entries. Subsequent deployment jobs immediately fail with 'Error acquiring the state lock' or get trapped in deadlock retries because the state backend does not automatically expire locks after client disconnects.</p>",
    "root_cause": "Runner terminations skip state unlock teardown hooks, leaving locked DynamoDB state items without automatic TTL cleanup or dynamic lock-timeout configurations in high-concurrency CI environments.",
    "bad_code": "terraform {\n  backend \"s3\" {\n    bucket         = \"my-tf-state-bucket\"\n    key            = \"prod/terraform.tfstate\"\n    region         = \"us-east-1\"\n    dynamodb_table = \"terraform-locks\"\n    # Missing explicit lock_timeout configuration\n  }\n}\n\n# CI Pipeline script executing standard plan without retry/timeout handling\n# terraform apply -auto-approve",
    "solution_desc": "Configure dynamic lock timeouts in the CLI execution wrapper, implement trap handlers for graceful signal propagation in runner pipelines, and enable dynamic LockID resolution.",
    "good_code": "#!/usr/bin/env bash\nset -euo pipefail\n\n# Gracefully handle SIGTERM/SIGINT signals from CI runner\ntrap 'echo \"Caught signal, releasing locks...\"; terraform force-unlock -force $LOCK_ID || true' SIGNAL_SPEC\n\n# Execute Terraform apply with non-blocking lock-timeout retry\nterraform apply \\\n  -lock-timeout=15m \\\n  -auto-approve \\\n  -input=false",
    "verification": "Simulate abrupt pipeline termination (kill -9) during an apply phase and verify subsequent concurrent jobs automatically acquire the lock once the lock timeout elapses.",
    "date": "2026-08-13",
    "id": 1786583274,
    "type": "error"
});