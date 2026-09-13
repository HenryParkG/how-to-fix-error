window.onPostDataLoaded({
    "title": "DLSS-G on RTX 30-Series: Inside sdli1995/dlssg_for_sm86",
    "slug": "dlss-frame-generation-rtx-3000-sm86-analysis",
    "language": "C++ / Python",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Python"
    ],
    "analysis": "<p>NVIDIA originally restricted DLSS 3 Frame Generation (DLSSG) to Ada Lovelace (RTX 40-series) GPUs, stating that the feature strictly depended on the hardware-accelerated 8th-generation Optical Flow Accelerator (OFA). The viral GitHub repository <code>sdli1995/dlssg_for_sm86</code> challenged this paradigm by porting and adapting DLSSG workflows to Ampere architecture devices (SM86, including the RTX 3060, 3070, and 3080 series).</p><p>The repository gained massive traction among gaming enthusiasts and graphics engineers because it unlocks interpolative AI frame generation on hardware previously considered unsupported. By rewriting entrypoints and intercepting NVAPI runtime checks, this mod proves that the 7th-generation OFA present on SM86 can compute motion vector fields for intermediate frame generation with minimal visual artifacting.</p>",
    "root_cause": "Intercepts Streamline and NVAPI calls to bypass vendor hardware architecture flags, translating OFA 8.x instructions into compute workloads executable by SM86 optical flow pipelines.",
    "bad_code": "# Quick Setup and Deployment\ngit clone https://github.com/sdli1995/dlssg_for_sm86.git\ncd dlssg_for_sm86\n# Copy wrapper binaries (dxgi.dll / nvngx_dlssg.dll) to game directory beside executable\ncp bin/* /path/to/supported_game_directory/",
    "solution_desc": "Use this project to double rendering performance in GPU/CPU-bound single-player titles running at 1440p or 4K on Ampere GPUs. Avoid adoption in latency-sensitive competitive esports titles where interpolative frame generation adds input lag without raw engine polling improvements.",
    "good_code": "// Minimal pseudo-hook demonstrating driver capability override\n#include <windows.h>\n\ntypedef int (*NvAPI_QueryInterface_t)(unsigned int offset);\nNvAPI_QueryInterface_t Original_NvAPI_QueryInterface = nullptr;\n\nextern \"C\" __declspec(dllexport) int Fake_NvAPI_GetGPUArch(void* handle, unsigned int* archId) {\n    // Spoof SM86 (Ampere) as Ada Lovelace to pass DLSSG enablement validation checks\n    *archId = 0x00000190; // NV_GPU_ARCHITECTURE_ADALovelace\n    return 0; // NVAPI_OK\n}",
    "verification": "The project signals ongoing community-driven decoupling of vendor-locked GPU software stacks. Its longevity hinges on whether NVIDIA driver patches restrict undocumented NVAPI hooks, while serving as a blueprint for open-source frame generation runtimes like AMD FSR3 integration on legacy silicon.",
    "date": "2026-09-13",
    "id": 1789265274,
    "type": "trend"
});