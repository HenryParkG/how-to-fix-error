window.onPostDataLoaded({
    "title": "Fixing Fabric JSI Native Memory Leaks in C++ TurboModules",
    "slug": "fix-react-native-fabric-jsi-c-turbomodule-memory-leak",
    "language": "C++ / React Native",
    "code": "JSI_HOST_OBJECT_LEAK",
    "tags": [
        "React Native",
        "C++",
        "JSI",
        "React",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>When developing high-performance async C++ TurboModules under React Native's Fabric architecture, memory leaks often occur when capturing JSI handle wrappers inside C++ background worker threads. Developers frequently pass <code>facebook::jsi::Value</code> or <code>facebook::jsi::Object</code> directly into C++ standard async promises or lambda capture blocks.</p><p>Because JSI objects reference memory managed by the JavaScript engine thread (e.g., Hermes or V8), keeping long-lived references to JSI objects on background C++ threads prevents GC execution. Furthermore, destroying or referencing `jsi::Value` objects off the main JS thread leads to dangling native references, heap growth, and eventually out-of-memory crashes.</p>",
    "root_cause": "Capturing `jsi::Value` or `jsi::Function` instances in background thread lambdas keeps native heap allocations alive outside the lifetime of the underlying `jsi::Runtime`. Resolving or accessing raw JSI objects on non-JS threads breaks memory lifecycle management enforced by the JavaScript engine.",
    "bad_code": "#include <ReactCommon/TurboModule.h>\n#include <jsi/jsi.h>\n#include <thread>\n\nusing namespace facebook;\n\nvoid processAsyncData(jsi::Runtime& runtime, jsi::Value callback) {\n    // BAD: Retaining jsi::Value directly on background std::thread\n    std::thread([&runtime, cb = std::move(callback)]() {\n        std::this_thread::sleep_for(std::chrono::milliseconds(100));\n        // CRASH / LEAK: Interacting with jsi::Runtime off the JS Thread\n        if (cb.isObject()) {\n            auto func = cb.asObject(runtime).asFunction(runtime);\n            func.call(runtime, jsi::String::createFromUtf8(runtime, \"Done\"));\n        }\n    }).detach();\n}",
    "solution_desc": "Use `facebook::react::CallInvoker` to dispatch execution back to the JavaScript event loop thread before touching any `jsi::Runtime` or JSI primitives. Convert JS callback objects to thread-safe weak references or wrap calls using `jsi::Value` strictly inside the `CallInvoker` context on the runtime thread.",
    "good_code": "#include <ReactCommon/TurboModule.h>\n#include <ReactCommon/CallInvoker.h>\n#include <jsi/jsi.h>\n#include <memory>\n#include <thread>\n\nusing namespace facebook;\n\nvoid processAsyncDataSafe(\n    jsi::Runtime& runtime,\n    std::shared_ptr<react::CallInvoker> jsInvoker,\n    jsi::Function callback) {\n    \n    // Create a shared jsi::Value wrapper on JS thread\n    auto sharedCallback = std::make_shared<jsi::Value>(runtime, callback);\n\n    std::thread([jsInvoker, sharedCallback, &runtime]() {\n        // Perform background workload safely...\n        std::this_thread::sleep_for(std::chrono::milliseconds(100));\n\n        // Safe context switch back to JS Runtime thread\n        jsInvoker->invokeAsync([&runtime, sharedCallback]() {\n            if (sharedCallback->isObject()) {\n                auto func = sharedCallback->asObject(runtime).asFunction(runtime);\n                func.call(runtime, jsi::String::createFromUtf8(runtime, \"Success\"));\n            }\n        });\n    }).detach();\n}",
    "verification": "Profile application memory usage using Xcode Instruments (Leaks / Allocations) or Android Studio Profiler. Loop asynchronous C++ module calls thousands of times; verify that C++ HostObjects and native heap memory flatten to baseline levels following Garbage Collection.",
    "date": "2026-08-08",
    "id": 1786170917,
    "type": "error"
});