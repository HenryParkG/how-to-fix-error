window.onPostDataLoaded({
    "title": "Fixing Kubernetes API Server Throttling in Controllers",
    "slug": "kubernetes-api-server-throttling-fix",
    "language": "Go",
    "code": "429 Too Many Requests",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-churn controllers (e.g., custom autoscalers or rapid state reconcilers) often hit the Kubernetes API Server's Priority and Fairness (APF) limits. When a controller attempts to update many resources in a tight loop, the client-go library's default rate limiting (QPS: 5, Burst: 10) triggers client-side throttling first. If adjusted too high without server-side consideration, the API server returns 429 status codes, causing reconciliation delays and increasing the workqueue depth.</p>",
    "root_cause": "Default client-go REST config QPS/Burst values are insufficient for high-throughput reconciliation loops, causing artificial delays.",
    "bad_code": "config, _ := rest.InClusterConfig()\n// Using default QPS (5) and Burst (10)\nclient, _ := kubernetes.NewForConfig(config)\n\nfor _, obj := range largeList {\n    client.CoreV1().Pods(\"default\").Update(ctx, obj, metav1.UpdateOptions{})\n}",
    "solution_desc": "Explicitly tune the QPS and Burst settings in the REST configuration and implement exponential backoff in the controller's workqueue to handle server-side pressure gracefully.",
    "good_code": "config, _ := rest.InClusterConfig()\nconfig.QPS = 50\nconfig.Burst = 100\n\nclient, _ := kubernetes.NewForConfig(config)\n\n// Use a WorkQueue with RateLimiting\nqueue := workqueue.NewNamedRateLimitingQueue(\n    workqueue.DefaultControllerRateLimiter(), \n    \"pods\"\n)",
    "verification": "Check controller logs for 'Throttling request' messages and monitor API server 'apiserver_request_terminations_total' metrics.",
    "date": "2026-04-20",
    "id": 1776649858,
    "type": "error"
});