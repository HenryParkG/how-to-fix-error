window.onPostDataLoaded({
    "title": "Eliminating React Native JSI Deadlocks in Native Modules",
    "slug": "react-native-jsi-deadlock-fix",
    "language": "TypeScript",
    "code": "Deadlock",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native JSI (JavaScript Interface) allows synchronous communication between JS and C++. However, a deadlock occurs if a synchronous host function is called from the JS thread, and that host function then attempts to execute a callback on the same JS thread while waiting for a response, effectively blocking itself.</p>",
    "root_cause": "Attempting to re-enter the JavaScript runtime from a C++ thread while the JavaScript thread is already blocked by a synchronous JSI call.",
    "bad_code": "hostFunction = [=](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {\n    auto callback = args[0].asObject(rt).asFunction(rt);\n    // Blocking call that waits for result from JS thread - DEADLOCK\n    return callback.call(rt);\n};",
    "solution_desc": "Avoid synchronous callbacks that require JS execution within a JSI host function. Instead, use the 'jsi::Runtime::scheduleTask' if available (in newer versions) or handle the asynchronous nature using Promises or 'std::async' to ensure the native thread doesn't block the JS runtime's event loop.",
    "good_code": "hostFunction = [=](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {\n    auto promiseConstructor = rt.global().getPropertyAsFunction(rt, \"Promise\");\n    auto callback = std::make_shared<jsi::Function>(args[0].asObject(rt).asFunction(rt));\n\n    return promiseConstructor.callAsConstructor(rt, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, \"executor\"), 2,\n        [callback](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {\n            // Resolve/Reject logic here asynchronously\n            return jsi::Value::undefined();\n        }));\n};",
    "verification": "Profile the application using 'systrace' or 'Flipper'. Verify that the JS thread remains responsive and that the 'NativeModules' synchronous call stack does not show recursive waiting.",
    "date": "2026-03-12",
    "id": 1773297760,
    "type": "error"
});