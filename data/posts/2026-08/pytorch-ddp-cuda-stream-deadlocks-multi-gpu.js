window.onPostDataLoaded({
    "title": "Fixing PyTorch DDP CUDA Stream Deadlocks in Multi-GPU",
    "slug": "pytorch-ddp-cuda-stream-deadlocks-multi-gpu",
    "language": "Python",
    "code": "CUDA_DEADLOCK",
    "tags": [
        "Python",
        "PyTorch",
        "CUDA",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>During large-scale multi-GPU training with PyTorch Distributed Data Parallel (DDP), processes randomly hang indefinitely during backward passes or custom tensor operations across non-default CUDA streams. The GPU utilization drops to 0% across all worker nodes with no stack trace or explicit exceptions printed.</p><p>This silent deadlock typically occurs when async collective communications (like ncclAllReduce) or tensor allocations interleave with custom streams without explicit CUDA synchronization primitives, causing ring-buffer ring waits and stream dependency cycles.</p>",
    "root_cause": "Non-default CUDA streams executed asynchronously without cross-stream synchronization events (such as stream.wait_stream()) prior to launching PyTorch DDP gradient synchronization routines (NCCL), creating cross-process stream dependency deadlocks.",
    "bad_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ns1 = torch.cuda.Stream()\nwith torch.cuda.stream(s1):\n    # Custom async computation without synchronization before DDP step\n    x = model_input * 2.0\n\n# Loss computation on default stream reads x while s1 is unfinished\noutput = ddp_model(x)\nloss = output.sum()\nloss.backward()  # Hangs indefinitely during NCCL all-reduce",
    "solution_desc": "Ensure explicit stream synchronization before handing tensors off between non-default CUDA streams and the default stream used by DDP. Call torch.cuda.current_stream().wait_stream(s1) to serialize stream dependencies before the forward/backward pass.",
    "good_code": "import torch\nimport torch.distributed as dist\nfrom torch.nn.parallel import DistributedDataParallel as DDP\n\ns1 = torch.cuda.Stream()\nwith torch.cuda.stream(s1):\n    x = model_input * 2.0\n\n# Synchronize current stream with custom stream s1\ntorch.cuda.current_stream().wait_stream(s1)\n\noutput = ddp_model(x)\nloss = output.sum()\nloss.backward()  # Safely completes NCCL all-reduce",
    "verification": "Set environment variables TORCH_DISTRIBUTED_DEBUG=DETAIL and NCCL_DEBUG=INFO. Execute multi-node training scripts for 100+ iterations and verify zero hangs or process stalls during cross-stream collective calls.",
    "date": "2026-08-10",
    "id": 1786345863,
    "type": "error"
});