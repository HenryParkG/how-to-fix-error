window.onPostDataLoaded({
    "title": "Fixing Triton CUDA Illegal Memory Access",
    "slug": "triton-cuda-illegal-memory-access",
    "language": "Python",
    "code": "CUDA_ERROR_ILLEGAL_ADDRESS",
    "tags": [
        "Python",
        "CUDA",
        "Triton",
        "Deep Learning",
        "Error Fix"
    ],
    "analysis": "<p>When developing custom Triton kernels for PyTorch, developers often encounter 'Illegal Memory Access' errors. This typically occurs because Triton operates on blocks (tiles) of data. If the tensor dimensions are not perfectly divisible by the block size, the kernel may attempt to read or write memory outside the allocated GPU buffer.</p><p>Unlike standard Python code, GPU kernels require explicit boundary checking. Using <code>tl.load</code> or <code>tl.store</code> without a mask allows the hardware to calculate an address that exceeds the tensor's boundary, leading to a memory fault that crashes the CUDA context.</p>",
    "root_cause": "The kernel attempts to access memory indices that exceed the actual tensor size because the block size (BLOCK_SIZE) is larger than the remaining elements, and no bitmask was applied during the load/store operation.",
    "bad_code": "@triton.jit\ndef kernel(ptr, n_elements, BLOCK_SIZE: tl.constexpr):\n    offsets = tl.program_id(0) * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)\n    # Missing mask leads to illegal access if n_elements % BLOCK_SIZE != 0\n    data = tl.load(ptr + offsets)\n    tl.store(ptr + offsets, data * 2)",
    "solution_desc": "Implement a boolean mask using the current offsets and the maximum element count. Pass this mask to the `tl.load` and `tl.store` functions to ensure only valid memory addresses are accessed.",
    "good_code": "@triton.jit\ndef kernel(ptr, n_elements, BLOCK_SIZE: tl.constexpr):\n    offsets = tl.program_id(0) * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)\n    # Create a mask to stay within bounds\n    mask = offsets < n_elements\n    data = tl.load(ptr + offsets, mask=mask)\n    tl.store(ptr + offsets, data * 2, mask=mask)",
    "verification": "Run the kernel with `export CUDA_LAUNCH_BLOCKING=1` to pinpoint the exact line of failure, and use `compute-sanitizer --tool memcheck` to verify no out-of-bounds accesses remain.",
    "date": "2026-05-11",
    "id": 1778465452,
    "type": "error"
});