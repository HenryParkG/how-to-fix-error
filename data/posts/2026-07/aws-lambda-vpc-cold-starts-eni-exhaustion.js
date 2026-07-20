window.onPostDataLoaded({
    "title": "Fixing AWS Lambda VPC Cold Starts and ENI Exhaustion",
    "slug": "aws-lambda-vpc-cold-starts-eni-exhaustion",
    "language": "Go",
    "code": "LAMBDA_CONNECTION_TIMEOUT",
    "tags": [
        "AWS",
        "Go",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Deploying AWS Lambda functions within a Virtual Private Cloud (VPC) is essential for secure access to internal resources like databases and caching layers. However, when highly scaled under load spikes, functions can experience severe cold starts and connection timeouts. This occurs because every concurrently running Lambda environment requires a network interface connection to the VPC.</p><p>Under AWS Hyperplane, Lambda uses pre-allocated Elastic Network Interfaces (ENIs). However, if your subnets have small IP allocation blocks (e.g., a /26 or /28 subnet), rapid scaling events will quickly exhaust all available IP addresses in the subnet. When no IPs are available, Hyperplane cannot instantiate new network paths, causing invocations to block, resulting in massive cold starts and eventually timing out.</p>",
    "root_cause": "The Lambda subnets are configured with highly constrained CIDR blocks. During micro-burst traffic scaling, AWS attempts to assign additional unique IP addresses to the Hyperplane ENI attachments. IP exhaustion in the assigned subnets blocks further scaling, forcing invocations to queue and time out.",
    "bad_code": "resource \"aws_subnet\" \"lambda_private_subnet_a\" {\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = \"10.0.1.0/28\" # Only 11 usable IP addresses!\n  availability_zone = \"us-east-1a\"\n}\n\nresource \"aws_lambda_function\" \"process_api\" {\n  function_name = \"order-processor\"\n  role          = aws_iam_role.lambda_exec.arn\n  image_uri     = \"${aws_ecr_repository.repo.repository_url}:latest\"\n  package_type  = \"Image\"\n\n  vpc_config {\n    subnet_ids         = [aws_subnet.lambda_private_subnet_a.id]\n    security_group_ids = [aws_security_group.lambda_sg.id]\n  }\n}",
    "solution_desc": "Re-architect the VPC configuration by allocating large, dedicated subnets (at least a /22 CIDR block) spanning multiple Availability Zones exclusively for Lambda functions. Ensure that the associated Security Groups are clean and configured to allow outbound traffic dynamically through NAT Gateways or VPC Endpoints.",
    "good_code": "# Define wide subnet blocks specifically allocated for microservice scaling\nresource \"aws_subnet\" \"lambda_dedicated_a\" {\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = \"10.0.16.0/20\" # 4,091 usable IPs\n  availability_zone = \"us-east-1a\"\n}\n\nresource \"aws_subnet\" \"lambda_dedicated_b\" {\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = \"10.0.32.0/20\" # 4,091 usable IPs\n  availability_zone = \"us-east-1b\"\n}\n\nresource \"aws_lambda_function\" \"process_api_optimized\" {\n  function_name = \"order-processor-optimized\"\n  role          = aws_iam_role.lambda_exec.arn\n  image_uri     = \"${aws_ecr_repository.repo.repository_url}:latest\"\n  package_type  = \"Image\"\n\n  # Multizone configuration with massive subnet IP pools\n  vpc_config {\n    subnet_ids         = [\n      aws_subnet.lambda_dedicated_a.id,\n      aws_subnet.lambda_dedicated_b.id\n    ]\n    security_group_ids = [aws_security_group.lambda_sg_optimized.id]\n  }\n}\n\nresource \"aws_security_group\" \"lambda_sg_optimized\" {\n  name        = \"lambda-sg-optimized\"\n  description = \"Dedicated Lambda security group with stateful tracking\"\n  vpc_id      = aws_vpc.main.id\n\n  egress {\n    from_port   = 0\n    to_port     = 0\n    protocol    = \"-1\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n}",
    "verification": "Deploy the updated infrastructure, then execute a high-concurrency performance test using a tool like Artillery. Monitor the CloudWatch Metrics 'AvailableIpAddresses' for the subnets and ensure 'Duration' and 'Throttles' show no spikes or connection timeout errors.",
    "date": "2026-07-20",
    "id": 1784513074,
    "type": "error"
});