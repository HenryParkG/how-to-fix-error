window.onPostDataLoaded({
    "title": "Triton: Solving GPU Starvation in Multi-Model Batching",
    "slug": "triton-gpu-starvation-fix",
    "language": "Python",
    "code": "Starvation",
    "tags": [
        "Python",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Triton Inference Server's dynamic batcher is designed to maximize throughput by grouping requests. However, in a multi-model environment sharing a single GPU, a 'noisy neighbor' effect can occur. If one high-traffic model saturates the dynamic batcher, its requests occupy all available execution slots on the GPU instance group. This leads to starvation for smaller models, which remain stuck in the scheduler queue despite having valid requests, significantly increasing tail latency (P99).</p>",
    "root_cause": "Improper configuration of max_queue_delay_microseconds and missing priority levels in the model configuration file.",
    "bad_code": "dynamic_batching {\n  max_batch_size: 32\n  # Missing max_queue_delay_microseconds\n  # Smaller models are starved by high-volume ones\n}",
    "solution_desc": "Implement explicit 'max_queue_delay_microseconds' to force batch execution even if not full, and use 'priority_levels' within the Triton scheduler to ensure fair resource distribution across different models.",
    "good_code": "dynamic_batching {\n  max_batch_size: 32\n  max_queue_delay_microseconds: 5000\n  priority_levels: 2\n  default_priority_level: 1\n}\ninstance_group [\n  {\n    count: 2\n    kind: KIND_GPU\n  }\n]",
    "verification": "Analyze the 'nv_inference_queue_duration_us' metric per model in Prometheus to ensure even distribution.",
    "date": "2026-02-14",
    "id": 1771060972,
    "type": "error"
});