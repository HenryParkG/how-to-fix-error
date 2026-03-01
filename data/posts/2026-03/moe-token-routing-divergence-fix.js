window.onPostDataLoaded({
    "title": "Fixing Load-Balancing Divergence in MoE Routing",
    "slug": "moe-token-routing-divergence-fix",
    "language": "Python",
    "code": "ExpertOverload",
    "tags": [
        "Python",
        "Machine Learning",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Mixture-of-Experts (MoE) models often suffer from 'expert collapse' where the router learns to favor a small subset of experts. This creates a feedback loop: preferred experts get more gradients, improve faster, and are subsequently chosen even more often. This leads to load-balancing divergence where some experts are over-utilized (causing latency bottlenecks) while others remain untrained, effectively wasting the model's capacity.</p>",
    "root_cause": "Lack of an auxiliary loss function to penalize non-uniform expert selection during the softmax routing process.",
    "bad_code": "def route_tokens(input_tensor, gate_weights):\n    # Simple top-k routing without balance loss\n    logits = torch.matmul(input_tensor, gate_weights)\n    scores = torch.softmax(logits, dim=-1)\n    top_k_indices = torch.topk(scores, k=2, dim=-1).indices\n    return top_k_indices",
    "solution_desc": "Implement an auxiliary Load Balancing Loss (also known as switch loss). This calculates the square of the fraction of tokens sent to each expert and adds it to the total training loss, encouraging the router to distribute tokens equally across all available experts.",
    "good_code": "def balanced_route(logits, num_experts):\n    probs = torch.softmax(logits, dim=-1)\n    # Compute auxiliary loss: sum(f_i * P_i) * num_experts\n    # f_i = fraction of tokens sent to expert i\n    # P_i = average probability assigned to expert i\n    f = torch.mean(probs, dim=0)\n    P = torch.mean(probs, dim=0)\n    aux_loss = num_experts * torch.sum(f * P)\n    return aux_loss, torch.topk(probs, k=2).indices",
    "verification": "Monitor the 'expert occupancy' metric during training. A successful fix shows a uniform distribution of tokens across all expert indices in the logging dashboard.",
    "date": "2026-03-01",
    "id": 1772328183,
    "type": "error"
});