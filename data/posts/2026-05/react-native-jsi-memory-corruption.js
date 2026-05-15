window.onPostDataLoaded({
    "title": "Mitigating RN JSI Memory Corruption in TurboModules",
    "slug": "react-native-jsi-memory-corruption",
    "language": "C++ / JS",
    "code": "SIGSEGV",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) in React Native allows C++ code to interact directly with the JS runtime. However, <code>jsi::Value</code> and <code>jsi::Object</code> instances are bound to a specific <code>jsi::Runtime</code> and its garbage collection cycle. When developers move TurboModule logic to background threads to avoid blocking the JS thread, they often access JSI objects that have already been garbage collected or belong to a different thread's context, leading to memory corruption and intermittent crashes.</p>",
    "root_cause": "Accessing non-thread-safe jsi::Runtime or holding stale jsi::Value references across asynchronous thread boundaries.",
    "bad_code": "std::thread([=] {\n  // CRASH: runtime_ is not thread-safe and value might be GC'd\n  runtime_.global().setProperty(runtime_, \"data\", value);\n}).detach();",
    "solution_desc": "Never access the JSI Runtime from a background thread. Instead, use a thread-safe dispatcher (like the React CallInvoker) to schedule work back on the JS thread, or convert JSI values to thread-safe C++ types before moving threads.",
    "good_code": "jsi::Value value = ...;\nauto sharedValue = std::make_shared<std::string>(value.asString(rt).utf8(rt));\n\ncallInvoker_->invokeAsync([this, sharedValue] {\n  // Back on the JS thread, safe to use runtime\n  jsi::Runtime& rt = getRuntime();\n  rt.global().setProperty(rt, \"data\", jsi::String::createFromUtf8(rt, *sharedValue));\n});",
    "verification": "Run AddressSanitizer (ASAN) on the iOS/Android build; ensure no 'use-after-free' errors are reported during async TurboModule calls.",
    "date": "2026-05-15",
    "id": 1778826294,
    "type": "error"
});