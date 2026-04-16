window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in High-Freq Comms",
    "slug": "react-native-jsi-memory-leak-fix",
    "language": "C++ / TypeScript",
    "code": "JSIMemoryLeak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>JSI (JavaScript Interface) provides a high-performance bridge between Native and JS, but it lacks the automatic safety of the legacy bridge. Memory leaks occur when jsi::Values or jsi::Objects are captured by long-living C++ lambdas or stored in global static maps without explicit lifecycle management. In high-frequency communication, these unmanaged references prevent the JS engine from garbage collecting the associated objects, leading to OOM crashes.</p>",
    "root_cause": "Native-side storage of jsi::Value without utilizing jsi::Persistent or failing to clear HostObject references when the JS context is invalidated or the component unmounts.",
    "bad_code": "class MyHostObject : public jsi::HostObject {\n  void listen(jsi::Function callback) {\n    // Capturing by value stores a strong reference that never dies\n    this->savedCallback = std::move(callback);\n  }\n  jsi::Function savedCallback;\n};",
    "solution_desc": "Implement a cleanup mechanism using jsi::WeakObject or ensure that references are explicitly nullified when the JS runtime triggers a cleanup or the specific module is destroyed. Use jsi::Runtime::runGuarded for safe execution.",
    "good_code": "class MyHostObject : public jsi::HostObject {\n  void listen(jsi::Runtime& rt, const jsi::Value& cb) {\n    if (cb.isObject()) {\n        // Store as a persistent reference or manage lifecycle manually\n        this->callbackPtr = std::make_unique<jsi::Persistent<jsi::Object>>(rt, cb.asObject(rt));\n    }\n  }\n  std::unique_ptr<jsi::Persistent<jsi::Object>> callbackPtr;\n  // Ensure cleanup in destructor\n};",
    "verification": "Monitor memory growth using Xcode Instruments (Leaks tool) or Android Studio Memory Profiler while triggering high-frequency events. Memory should plateau rather than climb linearly.",
    "date": "2026-04-16",
    "id": 1776324019,
    "type": "error"
});