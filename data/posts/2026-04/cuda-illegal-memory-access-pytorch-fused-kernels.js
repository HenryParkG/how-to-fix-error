window.onPostDataLoaded({
    "title": "Fixing CUDA Illegal Memory Access in PyTorch Kernels",
    "slug": "cuda-illegal-memory-access-pytorch-fused-kernels",
    "language": "CUDA/C++",
    "code": "CUDA_ERROR_ILLEGAL_ADDRESS",
    "tags": [
        "PyTorch",
        "CUDA",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>When writing custom fused kernels for PyTorch, <code>Illegal Memory Access</code> usually occurs due to thread-indexing logic that exceeds tensor boundaries. This is common when applying 'vectorized' loads (e.g., float4) where the remainder of the tensor size isn't a multiple of the vector width.</p>",
    "root_cause": "Calculated global thread index exceeds the bounds of the input/output tensor pointers without a boundary guard.",
    "bad_code": "__global__ void fused_kernel(float* out, const float* in, int n) {\n    int idx = blockIdx.x * blockDim.x + threadIdx.x;\n    // Missing bounds check leads to illegal access at end of tensor\n    out[idx] = in[idx] * 2.0f;\n}",
    "solution_desc": "Implement a strict boundary guard and use grid-stride loops to handle tensors of arbitrary sizes efficiently.",
    "good_code": "__global__ void fused_kernel(float* out, const float* in, int n) {\n    int idx = blockIdx.x * blockDim.x + threadIdx.x;\n    if (idx < n) {\n        out[idx] = in[idx] * 2.0f;\n    }\n}",
    "verification": "Compile with `TORCH_USE_CUDA_DSA` and run with `CUDA_LAUNCH_BLOCKING=1` to pinpoint the exact failing line.",
    "date": "2026-04-14",
    "id": 1776131134,
    "type": "error"
});