window.onPostDataLoaded({
    "title": "Fixing React Native JSI Cross-Thread Memory Crashes",
    "slug": "react-native-jsi-cross-thread-crashes-turbomodules",
    "language": "C++",
    "code": "EXC_BAD_ACCESS (JSI Runtime)",
    "tags": [
        "React",
        "TypeScript",
        "React Native",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows direct, synchronous communication between JavaScript and C++ execution contexts. However, a major architectural constraint of JSI is that the JS runtime engine (such as Hermes or JSC) is bound to a single thread\u2014the JS Thread. All `jsi::Value`, `jsi::Object`, and `jsi::Function` instances are bound to this thread and are not thread-safe.</p><p>When developers build custom C++ TurboModules that manage background work (e.g., video frame processing, high-frequency network polling, or database operations) on secondary C++ threads, they often attempt to trigger callbacks directly from those threads. When a C++ background thread dereferences or invokes a `jsi::Function`, the underlying JS runtime crashes immediately with an `EXC_BAD_ACCESS` or segmentation fault because of concurrent access to the JS engine's allocator.</p>",
    "root_cause": "Invoking a `jsi::Function` or modifying a `jsi::Object` directly on a native C++ worker thread instead of marshalling the call back onto the JS execution thread via the `react::CallInvoker` scheduler.",
    "bad_code": "#include <jsi/jsi.h>\n#include <thread>\n\nusing namespace facebook;\n\nvoid runBackgroundJob(jsi::Runtime& rt, jsi::Function&& callback) {\n    // Violates JSI thread model by capturing JS callback and executing it on a background thread\n    std::thread t([&rt, cb = std::move(callback)]() {\n        std::this_thread::sleep_for(std::chrono::milliseconds(100));\n        // CRASH: Calling JS function from a non-JS thread\n        cb.call(rt, jsi::Value(42));\n    });\n    t.detach();\n}",
    "solution_desc": "Store a reference to the `react::CallInvoker` associated with the JS runtime. Instead of executing the `jsi::Function` directly on the background thread, use the `CallInvoker` to queue a C++ lambda to run on the JS thread. Any `jsi::Value` objects must be converted into shared references or allocated safely when the execution executes on the scheduler's queue.",
    "good_code": "#include <jsi/jsi.h>\n#include <ReactCommon/CallInvoker.h>\n#include <thread>\n#include <memory>\n\nusing namespace facebook;\n\nvoid runBackgroundJobFixed(\n    jsi::Runtime& rt,\n    std::shared_ptr<react::CallInvoker> jsInvoker,\n    jsi::Function&& callback\n) {\n    // Create a thread-safe shared wrapper for the JSI callback\n    auto sharedCallback = std::make_shared<jsi::Value>(rt, callback);\n\n    std::thread t([&rt, jsInvoker, sharedCallback]() {\n        std::this_thread::sleep_for(std::chrono::milliseconds(100));\n\n        // Dispatch back to the JS Thread safely using CallInvoker\n        jsInvoker->invokeAsync([&rt, sharedCallback]() {\n            if (sharedCallback->isObject()) {\n                auto func = sharedCallback->asObject(rt).asFunction(rt);\n                func.call(rt, jsi::Value(42));\n            }\n        });\n    });\n    t.detach();\n}",
    "verification": "Run the application on an iOS Simulator using Xcode, or on Android with `adb logcat`. Trigger the TurboModule multiple times concurrently. Verify that the app does not crash and that ThreadSanitizer (TSan) reports no race conditions between the native C++ thread and the HermesModule runtime thread.",
    "date": "2026-05-23",
    "id": 1779531746,
    "type": "error"
});