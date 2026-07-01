window.onPostDataLoaded({
    "title": "Fixing React Native JSI C++ Memory Leaks",
    "slug": "react-native-jsi-uaf-memory-leaks",
    "language": "C++",
    "code": "JSI Use-After-Free & Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) provides C++ TurboModules with direct access to the JS runtime context, bypassing the legacy bridge. However, passing JS callbacks or host objects across thread boundaries introduces dangerous memory vulnerabilities. If a C++ module maintains a raw reference to a `jsi::Value` or `jsi::Function` while executing an asynchronous task on a background helper thread, and the JS Garbage Collector (GC) runs concurrently, the reference is invalidated, producing Use-After-Free (UAF) crashes or severe memory leaks.</p>",
    "root_cause": "The `jsi::Runtime` and its associated values are not thread-safe. JS objects are bound to the JS thread's lifetime. Storing a `jsi::Value` or `jsi::Function` inside a C++ block executed on a background thread without copying it to a `jsi::Persistent` reference, or invoking it outside of the JS thread using the `CallInvoker`, results in thread-boundary context violations and memory corruption.",
    "bad_code": "// Buggy C++ TurboModule executing JSI calls on a raw background thread\nvoid fetchAsync(jsi::Runtime& rt, jsi::Function callback) {\n  std::thread([&rt, callback = std::move(callback)]() {\n    // DANGER: Accessing jsi::Runtime and running JS callback on a background thread\n    // CRASH: 'callback' might have been GC'd on the JS thread, leading to Use-After-Free!\n    callback.call(rt, jsi::String::createFromUtf8(rt, \"Data fetched\"));\n  }).detach();\n}",
    "solution_desc": "To safely execute JSI operations asynchronously, wrap references in a thread-safe heap-allocated construct (using `jsi::WeakObject` or persisting them carefully), and dispatch execution back to the React Native JS execution thread using the `react::CallInvoker` scheduler.",
    "good_code": "// Fixed JSI implementation utilizing CallInvoker and thread-safe persistent references\n#include <ReactCommon/CallInvoker.h>\n#include <jsi/jsi.h>\n#include <memory>\n#include <thread>\n\nusing namespace facebook;\n\nvoid fetchAsync(\n    jsi::Runtime& rt, \n    const jsi::Value& callback, \n    std::shared_ptr<react::CallInvoker> jsInvoker) {\n  \n  // Capture callback in a persistent, shared value\n  auto persistedCallback = std::make_shared<jsi::Value>(jsi::Value(rt, callback));\n  \n  std::thread([jsInvoker, persistedCallback, &rt]() {\n    // Perform intensive background task here...\n    std::this_thread::sleep_for(std::chrono::milliseconds(100));\n    \n    // Safely dispatch the invocation back onto the JS thread\n    jsInvoker->invokeAsync([persistedCallback, &rt]() {\n      if (persistedCallback->isObject() && persistedCallback->asObject(rt).isFunction(rt)) {\n        persistedCallback->asObject(rt).asFunction(rt).call(\n          rt, \n          jsi::String::createFromUtf8(rt, \"Safe Data fetched\")\n        );\n      }\n    });\n  }).detach();\n}",
    "verification": "Profile the application using AddressSanitizer (ASan) and LeakSanitizer (LSan) inside Xcode or Android Studio. Trigger the async callbacks repeatedly and verify that no memory blocks are leaked and zero segmentation faults (signal 11) occur on JS thread context switches.",
    "date": "2026-07-01",
    "id": 1782889560,
    "type": "error"
});