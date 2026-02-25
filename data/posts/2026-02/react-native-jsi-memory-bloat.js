window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Bloat",
    "slug": "react-native-jsi-memory-bloat",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "C++",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) allows C++ code to interact directly with the JS engine without the bridge. However, in high-frequency scenarios like telemetry streaming or sensor data processing, creating <code>jsi::Object</code> or <code>jsi::Array</code> instances inside a loop can lead to severe memory bloat. This happens because JSI objects are managed by the JavaScript garbage collector, but the C++ layer might hold onto <code>jsi::Value</code> references longer than necessary, or create them so fast that the GC cannot trigger a collection cycle before the app hits the V8/Hermes memory limit.</p>",
    "root_cause": "Creation of short-lived JSI objects in a tight C++ loop without manual scoping or failing to release HostObjects, causing the JS heap to grow faster than the GC can reclaim it.",
    "bad_code": "void streamTelemetry(jsi::Runtime& rt, std::vector<Data> logs) {\n  for (auto& log : logs) {\n    jsi::Object obj(rt);\n    obj.setProperty(rt, \"val\", log.value);\n    callback.call(rt, obj); // obj remains in scope/heap\n  }\n}",
    "solution_desc": "Use `jsi::Value` as a lightweight wrapper and avoid creating full `jsi::Object` instances for every event. Implement a 'Pool' pattern for telemetry objects or use a flat `jsi::ArrayBuffer` to pass raw data to JS, decoding it only once on the JS side. Ensure that native callbacks are cleaned up using `WeakObject` where appropriate.",
    "good_code": "void streamTelemetry(jsi::Runtime& rt, std::vector<float> logs) {\n  auto arrayBuffer = rt.global().getPropertyAsFunction(rt, \"Uint32Array\")\n    .callAsConstructor(rt, (int)logs.size());\n  // Use raw memory access via ArrayBuffer to avoid JS Object overhead\n  auto buffer = arrayBuffer.getObject(rt).getArrayBuffer(rt);\n  memcpy(buffer.data(rt), logs.data(), logs.size() * sizeof(float));\n  callback.call(rt, arrayBuffer);\n}",
    "verification": "Use Flipper's Memory Profiler or Xcode Memory Graph to observe 'InternalNode' and 'JSObject' counts during telemetry bursts.",
    "date": "2026-02-25",
    "id": 1772002485,
    "type": "error"
});