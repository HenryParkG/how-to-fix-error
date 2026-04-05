window.onPostDataLoaded({
    "title": "Fixing JSI Threading Violations in React Native",
    "slug": "fixing-jsi-threading-violations-react-native",
    "language": "C++ / React Native",
    "code": "JSI_THREAD_UNSAFE",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) provides direct access to the JS runtime, but it enforces a strict single-threaded access model. When developing high-performance modules (like vision-camera or custom graphics engines), developers often attempt to invoke JS callbacks from background threads. This results in immediate crashes because the <code>jsi::Runtime</code> is not thread-safe and must only be accessed from the JS thread.</p>",
    "root_cause": "Calling jsi::Function::call() or accessing jsi::Value from a non-JS thread without dispatching back to the MessageQueue or using a specialized Threading synchronization primitive.",
    "bad_code": "void onAsyncData(jsi::Runtime& rt, jsi::Function& callback) {\n  std::thread([&rt, &callback]() {\n    // CRASH: Accessing rt and callback from background thread\n    callback.call(rt, jsi::String::createFromUtf8(rt, \"data\"));\n  }).detach();\n}",
    "solution_desc": "Capture the JS call-stack and use the React Native CallInvoker to schedule the execution of the JS callback back onto the main JavaScript thread.",
    "good_code": "void onAsyncData(jsi::Runtime& rt, std::shared_ptr<CallInvoker> invoker, jsi::Function callback) {\n  auto sharedCb = std::make_shared<jsi::Function>(std::move(callback));\n  std::thread([&rt, invoker, sharedCb]() {\n    invoker->invokeAsync([&rt, sharedCb]() {\n      // SAFE: Executed on the JS Thread\n      sharedCb->call(rt, jsi::String::createFromUtf8(rt, \"data\"));\n    });\n  }).detach();\n}",
    "verification": "Enable Thread Sanitizer (TSan) in Xcode and verify no 'Data Race' warnings appear during JSI callback execution.",
    "date": "2026-04-05",
    "id": 1775365594,
    "type": "error"
});