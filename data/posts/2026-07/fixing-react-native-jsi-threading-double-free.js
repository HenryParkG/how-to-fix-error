window.onPostDataLoaded({
    "title": "Fixing React Native JSI Threading & Double-Free Errors",
    "slug": "fixing-react-native-jsi-threading-double-free",
    "language": "C++ / Objective-C++",
    "code": "JSI Thread Violation",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native\u2019s JavaScript Interface (JSI) allows direct, synchronous C++ to JavaScript communication without the overhead of serialization over the legacy bridge. However, JSI introduces severe threading challenges. The <code>facebook::jsi::Runtime</code> instance is single-threaded and bound strictly to the JS thread. If a C++ native module attempts to manipulate, create, or garbage-collect a <code>jsi::Value</code>, <code>jsi::Object</code>, or <code>jsi::Function</code> on a background GCD queue or worker thread, it causes thread safety violations. This behavior leads to memory corruption, random segmentation faults, and fatal double-free exceptions when the JavaScript garbage collector attempts to clean up references that have already been destructed on an invalid thread.</p>",
    "root_cause": "Accessing or destructing `jsi::Value` references on worker threads instead of the dedicated JavaScript Runtime execution thread, leading to concurrent modification of the JS VM heap and double-free actions when objects are garbage collected.",
    "bad_code": "void processDataAsync(facebook::jsi::Runtime& rt, const facebook::jsi::Value& callback) {\n    // Capturing callback by copying jsi::Value is unsafe across threads!\n    auto sharedCallback = std::make_shared<facebook::jsi::Value>(rt, callback);\n    \n    std::thread([&rt, sharedCallback]() {\n        // Perform heavy background operation\n        std::this_thread::sleep_for(std::chrono::milliseconds(500));\n        \n        // Thread Violation: Calling JS function from background thread\n        if (sharedCallback->isObject() && sharedCallback->asObject(rt).isFunction(rt)) {\n            sharedCallback->asObject(rt).asFunction(rt).call(rt, \"success\");\n        }\n    }).detach();\n}",
    "solution_desc": "To fix threading violations, utilize React Native's `react::CallInvoker` to dispatch tasks back to the JS thread. The callback or runtime actions must be executed asynchronously inside the safe scheduler queue. Additionally, manage native references using weak pointers or explicit cleanups, preventing background destructors from freeing JS resources.",
    "good_code": "#include <ReactCommon/CallInvoker.h>\n#include <memory>\n\nvoid processDataAsync(\n    facebook::jsi::Runtime& rt,\n    const facebook::jsi::Value& callback,\n    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {\n    \n    // Create a thread-safe weak/strong wrapper utilizing Value's move semantics\n    auto hostCallback = std::make_shared<facebook::jsi::Value>(facebook::jsi::Value(rt, callback));\n    \n    std::thread([&rt, hostCallback, jsInvoker]() {\n        // Perform heavy background operation safely\n        std::this_thread::sleep_for(std::chrono::milliseconds(500));\n        \n        // Dispatch task safely to the JavaScript thread using CallInvoker\n        jsInvoker->invokeAsync([&rt, hostCallback]() {\n            if (hostCallback->isObject() && hostCallback->asObject(rt).isFunction(rt)) {\n                hostCallback->asObject(rt).asFunction(rt).call(rt, \"success\");\n            }\n            // hostCallback will now safely destruct on the JS Thread\n        });\n    }).detach();\n}",
    "verification": "Verify by enabling AddressSanitizer (ASan) and ThreadSanitizer (TSan) in Xcode. Execute the asynchronous native module multiple times under heavy garbage collection pressure, confirming zero SIGSEGV crashes or double-free reports.",
    "date": "2026-07-14",
    "id": 1784025074,
    "type": "error"
});