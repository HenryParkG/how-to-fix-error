window.onPostDataLoaded({
    "title": "Fixing RN JSI Memory Leaks in High-Freq Callbacks",
    "slug": "react-native-jsi-memory-leaks",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>When using the React Native JSI (JavaScript Interface) to bridge high-frequency data (like sensor streams or frame buffers), memory leaks occur if C++-allocated JSI objects are not scoped correctly. JavaScript values (jsi::Value, jsi::Object) created in native code are managed by the Hermes or V8 garbage collector, but native references can prevent collection if the JSI Scope is not explicitly managed during rapid iterations.</p>",
    "root_cause": "Creating new JSI objects inside a tight native loop without wrapping them in a jsi::Scope, causing the JavaScript heap to grow indefinitely until a full GC cycle, which may never trigger fast enough.",
    "bad_code": "void onSensorData(jsi::Runtime& rt, double value) {\n  // Leaks memory if called 60+ times per second\n  jsi::Object data(rt);\n  data.setProperty(rt, \"value\", jsi::Value(value));\n  callback.call(rt, data);\n}",
    "solution_desc": "Implement a `jsi::Scope` within the callback function. A Scope tells the engine that any JSI values created within its lifetime can be reclaimed as soon as the scope is exited, provided there are no other JS references.",
    "good_code": "void onSensorData(jsi::Runtime& rt, double value) {\n  jsi::Scope scope(rt);\n  jsi::Object data(rt);\n  data.setProperty(rt, \"value\", jsi::Value(value));\n  callback.asObject(rt).asFunction(rt).call(rt, data);\n}",
    "verification": "Use the memory profiler in Flipper or Xcode's 'Leaks' instrument to observe the 'jsi::Pointer' count stay constant during high-frequency events.",
    "date": "2026-04-24",
    "id": 1777008510,
    "type": "error"
});