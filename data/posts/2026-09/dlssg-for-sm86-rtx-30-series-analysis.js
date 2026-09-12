window.onPostDataLoaded({
    "title": "Analyzing sdli1995/dlssg_for_sm86: RTX 30 Series Frame Gen",
    "slug": "dlssg-for-sm86-rtx-30-series-analysis",
    "language": "C++ / CUDA",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Python"
    ],
    "analysis": "<p>The trending repository <code>sdli1995/dlssg_for_sm86</code> addresses one of the most controversial vendor lock-in decisions in PC hardware: NVIDIA limiting DLSS 3 Frame Generation exclusively to RTX 40-series GPUs (Ada Lovelace architecture, SM 8.9). NVIDIA asserted that only Ada contained the Optical Flow Accelerator (OFA) capable of performing real-time frame interpolation.</p><p>This repository reverse-engineers and recompiles DLSSG support for Ampere architectures (SM 8.6, which includes RTX 3060, 3070, and 3080 series). By adapting optical flow queries, rerouting driver-level signature checks, and tuning tensor math pipelines, it enables hardware-accelerated frame interpolation on hardware previously declared unsupported by the vendor.</p>",
    "root_cause": "Custom CUDA kernels and patched NVSDK/NGX interceptor libraries translating Ada-specific Optical Flow Accelerator pipelines to Ampere SM 8.6 compatible tensor execution units.",
    "bad_code": "git clone https://github.com/sdli1995/dlssg_for_sm86.git\ncd dlssg_for_sm86\n# Copy generated dxgi.dll and nvngx.dll into target game binaries directory\ncp bin/*.dll \"/mnt/c/Games/Cyberpunk 2077/bin/x64/\"",
    "solution_desc": "Ideal for enthusiast gamers, emulator developers, and computer vision engineers examining the efficiency gap between Ampere and Ada optical flow implementations. Recommended for high-resolution setups (1440p/4K) where Ampere GPUs are compute-bound rather than VRAM-bound.",
    "good_code": "// Minimal Hook Conceptual Pattern: Intercepting NGX Initialization for SM86\n#include <windows.h>\n#include <nvsdk_ngx.h>\n\nNVSDK_NGX_Result Hooked_NVSDK_NGX_D3D12_Init(\n    unsigned long long InApplicationId,\n    const wchar_t *InApplicationDataPath,\n    ID3D12Device *InDevice,\n    const NVSDK_NGX_FeatureDiscoveryInfo *InFeatureInfo\n) {\n    // Override architecture version flag from SM86 (0x806) to spoof Ada capability\n    NVSDK_NGX_FeatureDiscoveryInfo SpoofedInfo = *InFeatureInfo;\n    SpoofedInfo.FeatureID = NVSDK_NGX_Feature_FrameGeneration;\n    \n    // Redirect internal optical flow dispatcher to fallback SM86 CUDA stream\n    InitializeSM86OpticalFlowPipeline(InDevice);\n\n    return Original_NVSDK_NGX_D3D12_Init(InApplicationId, InApplicationDataPath, InDevice, &SpoofedInfo);\n}",
    "verification": "Monitor frame rates and frame pacing using RivaTuner Statistics Server (RTSS) or CapFrameX. Verify frame generation toggle is active in settings and frame rates scale up to ~1.6-1.9x with low artifacting.",
    "date": "2026-09-12",
    "id": 1789216281,
    "type": "trend"
});