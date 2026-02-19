window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks",
    "slug": "react-native-jsi-memory-leak-fix",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "TypeScript",
        "React",
        "Frontend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows for high-performance synchronous communication between C++ and JS. However, manual memory management is required. Leaks frequently occur when C++ objects hold onto jsi::Value or jsi::Object references across asynchronous thread boundaries without releasing them back to the JS garbage collector.</p>",
    "root_cause": "Holding a jsi::Value inside a C++ lambda or class member that outlives the JS runtime context, or failing to use jsi::Persistent to manage references that need to persist across multiple bridge calls.",
    "bad_code": "void MyModule::logData(jsi::Runtime& rt, jsi::Object& obj) {\n  // Problem: Capturing raw reference in a thread\n  std::thread([&rt, &obj]() {\n    auto val = obj.getProperty(rt, \"id\"); \n  }).detach();\n}",
    "solution_desc": "Use 'jsi::Persistent' to wrap objects that need to live outside the current scope and ensure they are explicitly reset. Alternatively, ensure all JSI interactions happen on the JS thread and use the move constructor for JSI objects to transfer ownership correctly.",
    "good_code": "void MyModule::logData(jsi::Runtime& rt, const jsi::Value& val) {\n  auto sharedVal = std::make_shared<jsi::Persistent<jsi::Value>>(rt, val);\n  jsCallInvoker_->invokeAsync([this, sharedVal]() {\n     // Access via sharedVal->get(rt)\n     sharedVal.reset(); // Explicitly release\n  });\n}",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler to track the 'jsi::Pointer' count. The allocation should return to baseline after the module action completes.",
    "date": "2026-02-19",
    "id": 1771493862,
    "type": "error"
});