window.onPostDataLoaded({
    "title": "Mitigating React Native JSI Memory Leaks",
    "slug": "react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) allows React Native to bridge C++ and JavaScript without serialization overhead. However, when handling high-frequency event streams (e.g., 120Hz sensor data or real-time audio processing), developers often leak memory by failing to manage the lifecycle of <code>jsi::Value</code> objects inside the C++ host functions.</p><p>Because JSI bypasses the standard React Native bridge, the JavaScript Garbage Collector (GC) cannot automatically track C++ allocations that hold references to JS objects. If a C++ function creates a <code>jsi::Object</code> or <code>jsi::String</code> on every frame without explicitly clearing it or using a <code>jsi::Scope</code>, the memory footprint will grow linearly until the app crashes.</p>",
    "root_cause": "Capturing 'jsi::Value' or 'jsi::Object' in long-lived C++ lambdas or global variables, preventing the JS engine from garbage collecting the underlying objects.",
    "bad_code": "/* C++ JSI Module */\njv::Value getEvent(jsi::Runtime& rt) {\n    // BUG: Creating a new object on every call in a high-frequency stream\n    // without ensuring the previous ones are cleaned up by the JS GC\n    jsi::Object obj(rt);\n    obj.setProperty(rt, \"timestamp\", jsi::Value(12345));\n    return jsi::Value(rt, obj);\n}",
    "solution_desc": "Use <code>jsi::Scope</code> to manage temporary values and prefer passing typed arrays (ArrayBuffers) for high-frequency data to minimize the creation of JS objects. If data must persist, use <code>jsi::WeakObject</code> to allow the GC to collect the object when it's no longer used in JavaScript.",
    "good_code": "/* C++ JSI Module with Scope Management */\njv::Value getEvent(jsi::Runtime& rt) {\n    jsi::Scope scope(rt);\n    jsi::Object obj(rt);\n    obj.setProperty(rt, \"data\", jsi::String::createFromUtf8(rt, \"payload\"));\n    \n    // Return value is automatically moved out of scope\n    return jsi::Value(rt, obj);\n}\n\n// Better approach for high frequency:\nvoid updateBuffer(jsi::Runtime& rt, jsi::ArrayBuffer& buffer) {\n    uint8_t* raw = buffer.data(rt);\n    // Modify raw memory directly instead of creating JS objects\n}",
    "verification": "Monitor the 'Heap Size' using Chrome DevTools or Flipper. Use 'adb shell dumpsys meminfo' to check for growth in the 'Native Heap' versus 'JS Heap' while the event stream is active.",
    "date": "2026-02-22",
    "id": 1771723087,
    "type": "error"
});