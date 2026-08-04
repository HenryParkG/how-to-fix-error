window.onPostDataLoaded({
    "title": "Fixing Triton OOB CUDA Violations in LLM Batches",
    "slug": "fixing-triton-oob-cuda-violations-llm-batches",
    "language": "Python",
    "code": "CUDA_ERROR_ILLEGAL_ADDRESS",
    "tags": [
        "Triton",
        "CUDA",
        "LLM",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>When serving Large Language Models (LLMs) with variable sequence lengths, dynamic batch padding is commonly used to align sequences into rectangular tensors. Custom Triton kernels designed for attention mechanisms or custom linear projections rely on block-wise indexing over dynamic tensor dimensions. When a kernel attempts to load memory tile blocks whose boundaries exceed the unpadded sequence length (or actual batch tensor bounds), dynamic memory requests read off the edge of allocated VRAM.</p><p>Because GPU threads within a warp execute in SIMT fashion, threads assigned to padded padding tokens continue executing memory load instructions unless explicitly masked out. This results in standard <code>CUDA_ERROR_ILLEGAL_ADDRESS</code> exceptions, leading to unrecoverable host-driver crashes and context invalidations during batch inference runs.</p>",
    "root_cause": "Triton pointer offset calculation lacks proper boundary masking logic (`mask = offsets < dimension_size`) inside pointer load/store operations, causing threads operating on padding memory tiles to dereference unallocated GPU memory.",
    "bad_code": "@triton.jit\ndef _fused_kernel(\n    X_ptr, Y_ptr, stride_xb, stride_xm, N, BLOCK_M: tl.constexpr\n):\n    pid = tl.program_id(0)\n    offsets = pid * BLOCK_M + tl.arange(0, BLOCK_M)\n    # BUG: Missing mask check when offloads extend past tensor dimension N\n    x = tl.load(X_ptr + offsets * stride_xm)\n    y = x * 2.0\n    tl.store(Y_ptr + offsets * stride_xm, y)",
    "solution_desc": "Apply boundary masking using boolean predicates in `tl.load` and `tl.store` operations. Pass dynamic dimension constraints to the kernel, generate conditional bitmasks (`mask = offsets < N`), and supply default safe values (`other=0.0`) for out-of-bound reads.",
    "good_code": "@triton.jit\ndef _fused_kernel(\n    X_ptr, Y_ptr, stride_xb, stride_xm, N, BLOCK_M: tl.constexpr\n):\n    pid = tl.program_id(0)\n    offsets = pid * BLOCK_M + tl.arange(0, BLOCK_M)\n    # FIX: Explicitly mask offsets against actual tensor bound N\n    mask = offsets < N\n    x = tl.load(X_ptr + offsets * stride_xm, mask=mask, other=0.0)\n    y = x * 2.0\n    tl.store(Y_ptr + offsets * stride_xm, y, mask=mask)",
    "verification": "Enable blocking CUDA kernel launches by setting `CUDA_LAUNCH_BLOCKING=1` and execute tests with ragged dynamic batch sizes using non-power-of-two sequence lengths. Validate using `ncu --target-processes all` to confirm zero invalid memory accesses under stress.",
    "date": "2026-08-04",
    "id": 1785831696,
    "type": "error"
});