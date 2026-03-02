window.onPostDataLoaded({
    "title": "Resolving React Native TurboModules Memory Safety Errors",
    "slug": "react-native-turbomodules-jsi-concurrency",
    "language": "TypeScript",
    "code": "SIGSEGV",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>TurboModules utilize the JavaScript Interface (JSI) to provide direct, synchronous communication between JavaScript and C++. However, memory safety violations often occur when developers attempt to access or mutate <code>jsi::Value</code> or <code>jsi::Object</code> instances from a background thread. Since the JavaScript VM is not thread-safe, concurrent access from a C++ worker thread while the JS thread is performing garbage collection or execution results in segmentation faults (SIGSEGV) or heap corruption.</p>",
    "root_cause": "Accessing JSI handles from a non-JS thread without moving the operation back to the React Native JS thread or properly locking the runtime.",
    "bad_code": "void MyModule::doAsyncWork(jsi::Runtime& rt, jsi::Function callback) {\n  std::thread([&rt, cb = std::move(callback)]() {\n    // CRASH: Accessing jsi::Function from background thread\n    cb.call(rt, \"Success\");\n  }).detach();\n}",
    "solution_desc": "Store the JSI callback in a thread-safe wrapper (like <code>react::CallbackWrapper</code>) and ensure the execution is dispatched back to the JS thread using the bridge or the CallInvoker.",
    "good_code": "void MyModule::doAsyncWork(jsi::Runtime& rt, jsi::Function callback) {\n  auto wrapper = CallbackWrapper::createWeak(callback.getFunction(rt), rt, jsInvoker_);\n  std::thread([wrapper]() {\n    wrapper->jsInvoker_->invokeAsync([wrapper]() {\n        jsi::Runtime& rt = wrapper->runtime();\n        wrapper->callback().call(rt, \"Success\");\n    });\n  }).detach();\n}",
    "verification": "Use AddressSanitizer (ASAN) in XCode or Android Studio to monitor for heap-use-after-free or concurrent access violations.",
    "date": "2026-03-02",
    "id": 1772414118,
    "type": "error"
});