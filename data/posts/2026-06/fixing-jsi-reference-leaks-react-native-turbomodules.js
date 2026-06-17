window.onPostDataLoaded({
    "title": "Fixing JSI Reference Leaks in React Native TurboModules",
    "slug": "fixing-jsi-reference-leaks-react-native-turbomodules",
    "language": "C++ / React Native",
    "code": "Fatal Exception: JSI",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's TurboModules use the JavaScript Interface (JSI) to bridge JavaScript and C++ code directly without JSON serialization. While extremely fast, JSI requires developers to manage the lifecycles of C++ host objects and JavaScript references manually. A common crash pattern arises when a C++ method retains a <code>jsi::Value</code> or <code>jsi::Object</code> beyond its scope or attempts to invoke a JS function from a non-JS thread, leading to thread boundary crashes and memory leaks.</p>",
    "root_cause": "All JSI values are tightly bound to a specific instance of <code>jsi::Runtime</code> and are not thread-safe. If you capture a <code>jsi::Function</code> or <code>jsi::Object</code> in a C++ lambda and dispatch it to a background dispatch queue (GCD) or background thread, accessing it on that background thread causes undefined behavior, segment faults, or runtime assertions because JSI operates strictly on the JS main execution thread.",
    "bad_code": "#include <jsi/jsi.h>\n#include <thread>\n\nusing namespace facebook;\n\nclass MyTurboModule {\npublic:\n    // BAD: Retaining a JS function and invoking it directly on a background thread\n    void fetchAsyncData(jsi::Runtime& rt, jsi::Function callback) {\n        std::thread([&rt, callback = std::move(callback)]() {\n            std::this_thread::sleep_for(std::chrono::seconds(2));\n            // CRASH: Calling JS callback directly on a background thread!\n            callback.call(rt, \"Data fetched!\");\n        }).detach();\n    }\n};",
    "solution_desc": "To safely execute a JS callback from a background thread, marshal the callback execution back to the JavaScript thread using the React Native <code>CallInvoker</code>. The C++ TurboModule must acquire a reference to the <code>CallInvoker</code> during initialization, which schedules the work safely on the JS Runtime thread.",
    "good_code": "#include <jsi/jsi.h>\n#include <ReactCommon/CallInvoker.h>\n#include <thread>\n#include <memory>\n\nusing namespace facebook;\n\nclass SafeTurboModule {\nprivate:\n    std::shared_ptr<react::CallInvoker> jsCallInvoker_;\n\npublic:\n    SafeTurboModule(std::shared_ptr<react::CallInvoker> jsCallInvoker) \n        : jsCallInvoker_(jsCallInvoker) {}\n\n    void fetchAsyncData(jsi::Runtime& rt, jsi::Function callback) {\n        // Use a HostObject wrapper or share the callback with CallInvoker\n        auto sharedCallback = std::make_shared<jsi::Value>(rt, callback);\n\n        std::thread([this, &rt, sharedCallback]() {\n            std::this_thread::sleep_for(std::chrono::seconds(2));\n            \n            // GOOD: Use CallInvoker to safely execute callback on the JS thread\n            jsCallInvoker_->invokeAsync([&rt, sharedCallback]() {\n                if (sharedCallback->isObject()) {\n                    sharedCallback->asObject(rt).asFunction(rt).call(rt, jsi::Value(rt, jsi::String::createWithUtf8(rt, \"Safe Data!\")));\n                }\n            });\n        }).detach();\n    }\n};",
    "verification": "Compile and run the app. Run heavy background asynchronous tasks calling the TurboModule repeatedly. Inspect memory allocation using Xcode's Instruments Leaks tool or Android Studio Profiler, verifying that JS VM memory does not grow infinitely and thread boundary violations do not occur.",
    "date": "2026-06-17",
    "id": 1781684643,
    "type": "error"
});