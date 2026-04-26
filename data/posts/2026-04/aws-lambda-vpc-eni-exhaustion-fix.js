window.onPostDataLoaded({
    "title": "Fixing AWS Lambda VPC ENI Exhaustion in Serverless Spikes",
    "slug": "aws-lambda-vpc-eni-exhaustion-fix",
    "language": "Go",
    "code": "EC2ThrottlingException",
    "tags": [
        "Serverless",
        "Networking",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>High-concurrency spikes in AWS Lambda functions connected to a VPC can lead to ENI (Elastic Network Interface) exhaustion. Historically, Lambda created an ENI for every execution environment, which could consume thousands of IP addresses in seconds. While AWS Hyperplane has mitigated this by sharing ENIs, exhaustion still occurs if subnets are too small or security group limits are hit during rapid scaling.</p>",
    "root_cause": "Subnet IP address depletion or reaching the account-level 'Network interfaces per Region' limit during massive concurrent scaling.",
    "bad_code": "resource \"aws_subnet\" \"lambda_subnet\" {\n  vpc_id     = aws_vpc.main.id\n  cidr_block = \"10.0.1.0/28\" // Only 11 usable IPs!\n}\n\nresource \"aws_lambda_function\" \"scaler\" {\n  vpc_config {\n    subnet_ids = [aws_subnet.lambda_subnet.id]\n    security_group_ids = [aws_security_group.sg.id]\n  }\n}",
    "solution_desc": "Transition to larger CIDR blocks (at least /24) and ensure multiple subnets across different Availability Zones are provided to the Lambda configuration to utilize AWS Hyperplane's shared ENI architecture effectively.",
    "good_code": "resource \"aws_subnet\" \"large_subnets\" {\n  count      = 3\n  vpc_id     = aws_vpc.main.id\n  cidr_block = \"10.0.${count.index}.0/24\" // 251 usable IPs per AZ\n  availability_zone = data.aws_availability_zones.available.names[count.index]\n}\n\nresource \"aws_lambda_function\" \"scaler\" {\n  vpc_config {\n    subnet_ids         = aws_subnet.large_subnets[*].id\n    security_group_ids = [aws_security_group.lambda_sg.id]\n  }\n}",
    "verification": "Monitor the 'AvailableIpAddressCount' metric in CloudWatch for the utilized subnets during a load test using AWS Lambda Power Tuning.",
    "date": "2026-04-26",
    "id": 1777181536,
    "type": "error"
});