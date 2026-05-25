window.onPostDataLoaded({
    "title": "Fixing React Native JSI Thread Deadlocks in Bridges",
    "slug": "react-native-jsi-thread-deadlocks-high-frequency-bridge",
    "language": "C++ / TypeScript",
    "code": "JSI_DEADLOCK",
    "tags": [
        "React",
        "TypeScript",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) enables synchronous invocation of C++ native methods from the JavaScript thread. While this eliminates the serialization overhead of the legacy bridge, it introduces severe synchronization risks. If a synchronous JSI host function triggers work on the native main/UI thread and blocks the JS thread waiting for a result (e.g., via <code>dispatch_sync</code> or mutexes), it will deadlock if the UI thread simultaneously attempts to call back into the JS thread or blocks waiting for a JS garbage collection or state cycle to finish.</p>",
    "root_cause": "The native C++ JSI thread blocks synchronously on the UI thread while the UI thread is waiting for the JS engine runtime queue to process paint commands, forming a classic circular dependency.",
    "bad_code": "// Native C++ implementation registered with JSI\njsi::Value getNativeSystemData(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {\n    __block jsi::Value result;\n    // BAD: Synchronous dispatch to UI thread from JS execution thread blocks the JSI runtime\n    dispatch_sync(dispatch_get_main_queue(), ^{\n        // UI thread does work, but might be waiting for JS to complete layout\n        NSString* data = [SystemProvider fetchSecurePayload];\n        result = jsi::Value(rt, jsi::String::createFromUtf8(rt, [data UTF8String]));\n    });\n    return result;\n}",
    "solution_desc": "Convert synchronous dependencies into non-blocking, asynchronous primitives. Use JSI to return a native <code>jsi::Object</code> mapping to a JS Promise. Execute the heavy work on a concurrent background queue and resolve the Promise asynchronously by queuing execution back onto the React Native JS event loop using the scheduler or thread-safe runtime methods.",
    "good_code": "// Native C++ JSI host function executing asynchronously\njsi::Value getNativeSystemDataAsync(jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {\n    auto promiseConstructor = rt.global().getPropertyAsFunction(rt, \"Promise\");\n    \n    auto executor = [=](jsi::Runtime& innerRt, const jsi::Value& thisVal, const jsi::Value* promiseArgs, size_t promiseCount) -> jsi::Value {\n        auto resolve = std::make_shared<jsi::Value>(innerRt, promiseArgs[0]);\n        \n        // Perform UI/System call asynchronously without blocking the JSI execution thread\n        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{\n            NSString* data = [SystemProvider fetchSecurePayload];\n            \n            // Safely schedule callback execution back on the JS runtime thread\n            dispatch_async(dispatch_get_main_queue(), ^{\n                // Use your React Native bridge/runner scheduler here\n                std::string rawData = [data UTF8String];\n                resolve->asObject(innerRt).asFunction(innerRt).call(innerRt, jsi::String::createFromUtf8(innerRt, rawData));\n            });\n        });\n        return jsi::Value::undefined();\n    };\n    \n    return promiseConstructor.callAsConstructor(rt, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, \"executor\"), 2, executor));\n}",
    "verification": "Profile the application using Xcode's thread sanitizer or Android Studio Profiler. Run a high-frequency stress-test loop in TypeScript invoking the JSI method 10,000 times. Ensure the main thread CPU usage remains balanced without hitting spinlocks or frozen UI frames.",
    "date": "2026-05-25",
    "id": 1779711608,
    "type": "error"
});