window.onPostDataLoaded({
    "title": "Fixing JSI Memory Leaks in High-Freq Native Bridges",
    "slug": "react-native-jsi-memory-leak-fix",
    "language": "React Native",
    "code": "MemoryLeak",
    "tags": [
        "React",
        "C++",
        "Mobile",
        "Error Fix"
    ],
    "analysis": "<p>When using the React Native JSI (JavaScript Interface), C++ objects are often exposed to JavaScript as HostObjects. In high-frequency data scenarios\u2014such as 60fps sensor data or real-time video processing\u2014a memory leak occurs if the JS garbage collector (GC) does not trigger fast enough to reclaim the underlying C++ memory.</p><p>Because the JS engine (Hermes or V8) only sees the small size of the JS handle and not the large memory footprint of the native C++ object it references, the GC pressure remains low while the actual heap usage skyrockets, eventually leading to an OOM (Out Of Memory) crash.</p>",
    "root_cause": "The JS Garbage Collector is unaware of the native memory footprint allocated by JSI HostObjects, failing to trigger collection cycles before the system runs out of physical memory.",
    "bad_code": "class DataBuffer : public jsi::HostObject {\n  std::vector<uint8_t> largeBuffer;\n  // No manual memory management\n};\n\n// In Bridge:\nruntime.global().setProperty(runtime, \"getBuffer\", \n  jsi::Function::createFromHostFunction(..., \n    [](...) { return jsi::Object::createFromHostObject(runtime, std::make_shared<DataBuffer>()); }\n  )\n);",
    "solution_desc": "Implement a manual 'invalidate' or 'dispose' method on the HostObject to free large buffers immediately, and use a jsi::Scope to manage short-lived objects within tight loops.",
    "good_code": "class DataBuffer : public jsi::HostObject {\npublic:\n  std::vector<uint8_t> largeBuffer;\n  void invalidate() { largeBuffer.clear(); largeBuffer.shrink_to_fit(); }\n  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {\n    if (name.utf8(rt) == \"dispose\") {\n      return jsi::Function::createFromHostFunction(rt, name, 0, [this](...) { \n        this->invalidate(); return jsi::Value::undefined(); \n      });\n    }\n    return jsi::Value::undefined();\n  }\n};",
    "verification": "Profile using Xcode Instruments (Leaks) or Android Studio Profiler. Verify that the 'Native' memory footprint returns to baseline after calling .dispose() in JS.",
    "date": "2026-04-10",
    "id": 1775798323,
    "type": "error"
});