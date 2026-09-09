window.onPostDataLoaded({
    "title": "Fixing Terraform State Drift & Reconciliation Errors",
    "slug": "terraform-state-drift-reconciliation-conflicts",
    "language": "AWS",
    "code": "StateDriftConflict",
    "tags": [
        "AWS",
        "Terraform",
        "DevOps",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Terraform relies on an internal declarative state file (<code>terraform.tfstate</code>) to map declared configuration resources to real-world cloud APIs. In production environments where autonomous cloud services (such as AWS Auto Scaling, EKS managed node groups, or auto-tagging policies) update resource attributes out-of-band, Terraform detects unexpected attribute differences during subsequent plan or apply phases.</p><p>When out-of-band modifications affect attributes that force resource recreation (such as target groups modifying launch template revisions or network interfaces), Terraform attempts destructive replace plans. This causes split-brain scenarios, unintended resource terminations, and reconciliation deadlocks where the state cannot converge with upstream providers.</p>",
    "root_cause": "Direct management of computed, mutable, or externally controlled cloud properties in resource definitions without dynamic ignore rules, causing Terraform to flag runtime mutations as drift requiring replacement.",
    "bad_code": "resource \"aws_autoscaling_group\" \"workload_asg\" {\n  name                = \"production-worker-asg\"\n  max_size            = 10\n  min_size            = 2\n  desired_capacity    = 2 # AWS Auto Scaling dynamically mutates this value\n  vpc_zone_identifier = [\"subnet-12345678\", \"subnet-87654321\"]\n\n  launch_template {\n    id      = aws_launch_template.worker.id\n    version = \"$Latest\" # Out-of-band updates trigger recreation\n  }\n  \n  # Missing lifecycle rules causes continuous drift and unintended scale-down\n}",
    "solution_desc": "Architect Terraform code to decouple immutable configuration from operational state. Use `lifecycle { ignore_changes = [...] }` to delegate mutated attributes to runtime orchestrators. Leverage targeted refresh plans (`terraform apply -refresh-only`) to reconcile drift into state without applying disruptive infrastructure mutations.",
    "good_code": "resource \"aws_autoscaling_group\" \"workload_asg\" {\n  name_prefix         = \"production-worker-\"\n  max_size            = 10\n  min_size            = 2\n  vpc_zone_identifier = [\"subnet-12345678\", \"subnet-87654321\"]\n\n  launch_template {\n    id      = aws_launch_template.worker.id\n    version = aws_launch_template.worker.latest_version\n  }\n\n  lifecycle {\n    create_before_destroy = true\n    ignore_changes = [\n      desired_capacity, # Delegated to AWS Auto Scaling Policies\n      target_group_arns,\n      load_balancers,\n      tag               # Injected by enterprise security automation\n    ]\n  }\n}",
    "verification": "Run `terraform plan -detailed-exitcode` in automated CI/CD pipelines. Ensure the return code is `0` (no changes) after runtime scaling events occur, confirming drift isolation.",
    "date": "2026-09-09",
    "id": 1788939768,
    "type": "error"
});