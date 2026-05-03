window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks",
    "slug": "react-native-jsi-memory-leak",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows for synchronous communication between JS and Native (C++). However, leaks occur when `jsi::Value` objects or `jsi::HostObject` instances are captured in C++ lambdas that outlive the JS runtime. Because these references are not tracked by the standard garbage collector, they keep the JS objects alive indefinitely, leading to a steady increase in the heap size of the application.</p>",
    "root_cause": "Strong references to jsi::Runtime or jsi::Object held within long-lived C++ closures or static member variables.",
    "bad_code": "class MyNativeModule : public jsi::HostObject {\n  jsi::Value get_callback(jsi::Runtime& rt) {\n    auto cb = rt.global().getPropertyAsFunction(rt, \"onUpdate\");\n    // Capturing 'cb' strongly in a long-lived async thread\n    std::thread([this, cb = std::move(cb)]() mutable {\n       // Logic... \n    }).detach();\n  }\n};",
    "solution_desc": "Use `jsi::WeakObject` or `jsi::Persistent` and manually manage the lifecycle by invalidating references during the module's cleanup or using the JSI's 'HostObject' destructor.",
    "good_code": "class MyNativeModule : public jsi::HostObject {\n  void set_callback(jsi::Runtime& rt, const jsi::Value& val) {\n    // Use Persistent with explicit management\n    callback_ = std::make_unique<jsi::Persistent<jsi::Object>>(\n        rt, val.asObject(rt));\n  }\n  ~MyNativeModule() { callback_.reset(); }\n};",
    "verification": "Profile using Xcode Memory Graph or Android Studio Profiler to ensure 'jsi::HostObject' count returns to zero after screen unmount.",
    "date": "2026-05-03",
    "id": 1777802346,
    "type": "error"
});