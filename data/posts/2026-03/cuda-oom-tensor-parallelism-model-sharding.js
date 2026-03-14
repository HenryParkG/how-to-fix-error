window.onPostDataLoaded({
    "title": "Resolving CUDA OOM during Tensor Parallelism Sharding",
    "slug": "cuda-oom-tensor-parallelism-model-sharding",
    "language": "Python",
    "code": "RuntimeError: CUDA out of memory",
    "tags": [
        "Python",
        "PyTorch",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When sharding massive Large Language Models (LLMs) across multiple GPUs using Tensor Parallelism (TP), a common error is the CUDA Out-of-Memory (OOM) exception during the initialization phase. This happens because the naive approach often involves loading the entire model parameters onto a single GPU (Rank 0) before distributing shards to other devices. For models like Llama-3-70B, even the FP16 weights exceed the capacity of a single A100/H100, causing a crash before sharding even begins.</p>",
    "root_cause": "Loading full model weights onto a single device context instead of using 'meta' device initialization or lazy loading techniques.",
    "bad_code": "model = AutoModelForCausalLM.from_pretrained('huge-llm') # Crashes here\nsharded_model = tp.shard(model, device_ids=[0, 1, 2, 3])",
    "solution_desc": "Utilize the 'meta' device in PyTorch to initialize the model architecture without allocating memory for weights. Then, use distributed checkpoints to load only the specific shards required for each GPU rank directly from disk.",
    "good_code": "with init_empty_weights():\n    model = AutoModelForCausalLM.from_config(config)\n# Load shards directly to targeted ranks\nmodel = load_checkpoint_and_dispatch(model, checkpoint_path, device_map='auto') ",
    "verification": "Check 'nvidia-smi' output during startup to ensure balanced memory allocation across all GPU ranks.",
    "date": "2026-03-14",
    "id": 1773470131,
    "type": "error"
});