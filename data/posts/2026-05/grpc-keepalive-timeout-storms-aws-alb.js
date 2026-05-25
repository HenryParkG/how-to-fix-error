window.onPostDataLoaded({
    "title": "Fixing gRPC Keepalive Timeout Storms on AWS",
    "slug": "grpc-keepalive-timeout-storms-aws-alb",
    "language": "Go",
    "code": "Unavailable (HTTP/2 GOAWAY)",
    "tags": [
        "AWS",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When hosting high-throughput gRPC services inside a Kubernetes cluster behind an AWS Application Load Balancer (ALB), services frequently run into intermittent connection drops and sudden latency spikes. This phenomenon, known as a 'keepalive timeout storm,' occurs when the ALB silently terminates idle TCP connections because its default connection idle timeout (60 seconds) is reached before the gRPC client or server initiates a ping.</p><p>When the ALB abruptly tears down these connections, client applications experience instant request failures and synchronously attempt to reconnect all at once, overwhelming target pods and causing CPU throttling and cascading network outages.</p>",
    "root_cause": "Misaligned HTTP/2 keepalive settings where the gRPC client/server keepalive intervals are longer than the AWS ALB idle timeout, leading to silent proxy connection drops and subsequent stampeding reconnect behavior.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"net\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t// Buggy: No keepalive enforcement; defaults exceed ALB's 60-second idle timeout limit\n\ts := grpc.NewServer()\n\t_ = s.Serve(lis)\n}",
    "solution_desc": "Configure strict HTTP/2 keepalive enforcement parameters on the gRPC server and client. Set the server's 'Time' parameter significantly lower than the ALB's idle timeout (e.g., 30 seconds) to actively keep connections alive, and implement randomized connection backoffs to prevent reconnection storms when terminations do happen.",
    "good_code": "package main\n\nimport (\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t\n\t// Fixed: Keepalive parameters set to pre-emptively ping and gracefully retire connections\n\tkeepaliveParams := keepalive.ServerParameters{\n\t\tMaxConnectionIdle:     15 * time.Second,\n\t\tMaxConnectionAge:      30 * time.Minute,\n\t\tMaxConnectionAgeGrace: 5 * time.Second,\n\t\tTime:                  30 * time.Second, // Active ping interval less than ALB 60s limit\n\t\tTimeout:               5 * time.Second,\n\t}\n\n\ts := grpc.NewServer(grpc.KeepaliveParams(keepaliveParams))\n\t_ = s.Serve(lis)\n}",
    "verification": "Deploy the updated pods to Kubernetes, simulate a period of zero traffic, and verify using AWS CloudWatch metrics that target group HTTP 5XX / Target Connection Errors drop to 0, and gRPC client logs show no concurrent TCP reconnect sequences.",
    "date": "2026-05-25",
    "id": 1779692641,
    "type": "error"
});