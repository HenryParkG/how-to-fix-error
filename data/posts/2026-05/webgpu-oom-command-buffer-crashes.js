window.onPostDataLoaded({
    "title": "Fixing WebGPU Out-of-Memory Crashes",
    "slug": "webgpu-oom-command-buffer-crashes",
    "language": "TypeScript",
    "code": "WEBGPU_OOM_CRASH",
    "tags": [
        "WebGPU",
        "WebGraphics",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>WebGPU provides low-level control over GPU hardware, which also means developers must carefully manage memory. A common trap is failing to destroy command buffers, texture views, and bind groups after rendering cycles. Unlike WebGL, where the garbage collector cleans up objects more forgivingly, WebGPU's unreleased command allocations will quickly deplete the GPU's memory pool, resulting in a silent page crash or device loss error.</p>",
    "root_cause": "Command buffers and texture allocations are persistently referenced inside render loops without calling destroy() or correctly managing the lifecycle of GPUCommandEncoder and GPUBindGroup allocations.",
    "bad_code": "function renderFrame(device: GPUDevice, context: GPUCanvasContext) {\n  const commandEncoder = device.createCommandEncoder();\n  const textureView = context.getCurrentTexture().createView();\n  \n  const renderPass = commandEncoder.beginRenderPass({\n    colorAttachments: [{\n      view: textureView,\n      clearValue: { r: 0, g: 0, b: 0, a: 1 },\n      loadOp: 'clear',\n      storeOp: 'store',\n    }]\n  });\n  renderPass.end();\n  \n  // BAD: Allocating and submitting without tracking lifecycle or destroying resources\n  device.queue.submit([commandEncoder.finish()]);\n}",
    "solution_desc": "Ensure dynamic resources like temporary textures and uniform buffers are explicitly destroyed using .destroy() or cached/reused. Avoid recreating bind groups and encoders per frame; instantiate them once and update buffers using writeBuffer instead.",
    "good_code": "let uniformBuffer: GPUBuffer; \n\nfunction renderFrameFixed(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline) {\n  const commandEncoder = device.createCommandEncoder();\n  const currentTexture = context.getCurrentTexture();\n  const textureView = currentTexture.createView();\n\n  const renderPass = commandEncoder.beginRenderPass({\n    colorAttachments: [{\n      view: textureView,\n      clearValue: { r: 0, g: 0, b: 0, a: 1 },\n      loadOp: 'clear',\n      storeOp: 'store',\n    }]\n  });\n  renderPass.setPipeline(pipeline);\n  renderPass.end();\n\n  const commandBuffer = commandEncoder.finish();\n  device.queue.submit([commandBuffer]);\n\n  // Explicitly release resources or reuse textures to prevent memory leaks\n}",
    "verification": "Monitor GPU memory utilization via browser developer tools (e.g., Chrome's chrome://gpu page or Performance panel) and verify that the heap allocation remains flat over sustained execution.",
    "date": "2026-05-24",
    "id": 1779604146,
    "type": "error"
});