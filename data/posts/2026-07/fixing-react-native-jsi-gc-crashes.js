window.onPostDataLoaded({
    "title": "Fixing React Native JSI GC Crashes",
    "slug": "fixing-react-native-jsi-gc-crashes",
    "language": "TypeScript",
    "code": "MEM_LEAK_CRASH",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) enables direct synchronous C++ invocation of JavaScript runtimes (like Hermes or JavaScriptCore), bypassing the traditional asynchronous JSON bridge. However, manual memory management across boundaries introduces severe stability risks.</p><p>When native C++ modules instantiate JSI objects or hold references to `jsi::Value`, `jsi::Object`, or `jsi::Function` instances outside the scope of the executing JS execution thread, memory leaks occur. If the JavaScript garbage collector attempts to reclaim these references while they are still pinned by native C++ host objects, or if the thread executing the C++ logic attempts to execute callbacks on a destroyed context, the engine crashes with a segmentation fault.</p>",
    "root_cause": "Holding strong, persistent references to JSI objects on background C++ threads without tracking the lifecycle of the underlying `jsi::Runtime`, or accessing JS objects after the execution context has been garbage-collected.",
    "bad_code": "#include <jsi/jsi.h>\n#include <thread>\n\nusing namespace facebook;\n\nclass UnsafeNativeModule {\npublic:\n    // DANGEROUS: Storing raw jsi::Function in C++ class\n    jsi::Function jsCallback_;\n\n    void registerCallback(jsi::Runtime& rt, const jsi::Function& callback) {\n        jsCallback_ = jsi::Function(callback); // Deep copy of JS reference\n    }\n\n    void triggerEventAsync() {\n        std::thread([this]() {\n            // CRASH: Calling JS runtime from background thread without CallInvoker\n            jsCallback_.call(*runtimePtr_ /* hypothetical saved runtime */);\n        }).detach();\n    }\nprivate:\n    jsi::Runtime* runtimePtr_;\n};",
    "solution_desc": "Architect the native module to handle callbacks safely by using `facebook::react::CallInvoker` to queue executions on the main JS thread. Wrap your native-to-JS objects in persistent weak containers or manage their lifecycle explicitly. Never keep thread-unsafe references to raw `jsi::Value` objects in long-lived C++ classes.",
    "good_code": "#include <jsi/jsi.h>\n#include <ReactCommon/CallInvoker.h>\n#include <memory>\n\nusing namespace facebook;\n\nclass SafeNativeModule {\npublic:\n    std::shared_ptr<react::CallInvoker> jsInvoker_;\n    // Use Persistent wrapper or clear explicitly in cleanup\n    std::unique_ptr<jsi::Function> safeCallback_;\n\n    SafeNativeModule(std::shared_ptr<react::CallInvoker> invoker)\n        : jsInvoker_(invoker) {}\n\n    void registerCallback(jsi::Runtime& rt, const jsi::Function& callback) {\n        // Convert the function argument to a persistent handle or store dynamically safely\n        safeCallback_ = std::make_unique<jsi::Function>(callback.asFunction(rt));\n    }\n\n    void triggerEventAsync(jsi::Runtime& rt) {\n        if (!safeCallback_) return;\n        \n        // Copy the shared pointer safely into lambda to ensure scope\n        auto sharedCallback = std::make_shared<jsi::Function>(std::move(*safeCallback_));\n        \n        jsInvoker_->invokeAsync([sharedCallback, &rt]() {\n            // Safely execute callback on the JS thread runtime context\n            sharedCallback->call(rt);\n        });\n    }\n};",
    "verification": "Profile the React Native application using Xcode Instruments (specifically Allocations and Leaks) or Android Studio Profiler under heavy usage simulation. Verify that JS Heap size and HostObject allocations stabilize over continuous iterations and do not exhibit stair-step memory growth.",
    "date": "2026-07-04",
    "id": 1783130424,
    "type": "error"
});