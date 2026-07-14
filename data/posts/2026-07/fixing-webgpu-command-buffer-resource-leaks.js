window.onPostDataLoaded({
    "title": "Fixing WebGPU Command Buffer Resource Leaks",
    "slug": "fixing-webgpu-command-buffer-resource-leaks",
    "language": "TypeScript",
    "code": "WebGPU Leak",
    "tags": [
        "TypeScript",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In multi-pass WebGPU render pipelines, continuously allocating GPU-side resources such as texture views, bind groups, and command buffers in the active animation/render loop causes rapidly expanding VRAM consumption. JavaScript's garbage collector does not run frequently or predictably enough to clean up the underlying native GPU handles, leading to WebGPU device exhaustion crashes.</p>",
    "root_cause": "WebGPU resources must be explicitly disposed of or pooled. Relying on garbage collection for transient structures like texture views and bind groups created inside frame-loops leaks GPU-side memory allocations.",
    "bad_code": "function renderPass(device: GPUDevice, queue: GPUQueue, texture: GPUTexture) {\n  const encoder = device.createCommandEncoder();\n  // BUG: Re-creating texture view and bind groups inside the render loop without freeing\n  const view = texture.createView();\n  const bindGroup = device.createBindGroup({\n    layout: pipeline.getBindGroupLayout(0),\n    entries: [{ binding: 0, resource: view }]\n  });\n  const pass = encoder.beginRenderPass(renderDescriptor);\n  pass.setBindGroup(0, bindGroup);\n  pass.draw(3);\n  pass.end();\n  queue.submit([encoder.finish()]);\n}",
    "solution_desc": "Cache and reuse long-lived assets (like bind groups and texture views) across frames. For dynamic or shifting resources, explicitly call '.destroy()' on textures, query sets, and buffers immediately after they are no longer required by pending GPU commands.",
    "good_code": "let cachedView: GPUTextureView | null = null;\nlet cachedBindGroup: GPUBindGroup | null = null;\n\nfunction renderPass(device: GPUDevice, queue: GPUQueue, texture: GPUTexture) {\n  const encoder = device.createCommandEncoder();\n  // Cache and reuse resources instead of re-allocating them every frame\n  if (!cachedView) {\n    cachedView = texture.createView();\n    cachedBindGroup = device.createBindGroup({\n      layout: pipeline.getBindGroupLayout(0),\n      entries: [{ binding: 0, resource: cachedView }]\n    });\n  }\n  const pass = encoder.beginRenderPass(renderDescriptor);\n  pass.setBindGroup(0, cachedBindGroup);\n  pass.draw(3);\n  pass.end();\n  queue.submit([encoder.finish()]);\n}",
    "verification": "Monitor native GPU utilization and active resource allocations using the Chrome DevTools WebGPU extension, or inspect 'chrome://gpu' to confirm VRAM remains flat and allocation counts stay constant over long render sessions.",
    "date": "2026-07-14",
    "id": 1784006517,
    "type": "error"
});