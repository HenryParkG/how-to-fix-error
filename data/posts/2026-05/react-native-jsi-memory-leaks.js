window.onPostDataLoaded({
    "title": "Debugging JSI Memory Leaks in React Native",
    "slug": "react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "JSIMemoryLeak",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows direct C++ to JS communication, bypassing the bridge. However, high-frequency native modules (like camera frames or sensors) often leak memory when `jsi::Value` or `jsi::Object` instances are created in C++ but not properly garbage collected by the Hermes or V8 engine. Because JSI objects are thin wrappers around heap-allocated JS entities, failing to manage their lifecycle in the native layer causes the JS heap to grow indefinitely.</p>",
    "root_cause": "Holding long-lived global references to JSI objects in C++ or failing to release `jsi::Persistent` handles after the JS context is invalidated.",
    "bad_code": "void onFrameReceived(jsi::Runtime& rt, const Frame& frame) {\n  // Leak: Creating a new object every 16ms without explicit scope management\n  jsi::Object frameObj(rt);\n  frameObj.setProperty(rt, \"width\", (double)frame.width);\n  callback->call(rt, frameObj);\n}",
    "solution_desc": "Use `jsi::Scope` to ensure temporary objects are cleaned up within the native loop, and utilize `jsi::WeakObject` for references that should not prevent garbage collection.",
    "good_code": "void onFrameReceived(jsi::Runtime& rt, const Frame& frame) {\n  jsi::Scope scope(rt);\n  jsi::Object frameObj(rt);\n  frameObj.setProperty(rt, \"width\", (double)frame.width);\n  callback->call(rt, frameObj);\n  // frameObj is automatically cleaned up when scope exits\n}",
    "verification": "Use the 'Memory' tab in Chrome DevTools (for V8) or the Hermes debugger to monitor the 'Number of JSI Objects' and ensure it flattens over time during high-frequency events.",
    "date": "2026-05-17",
    "id": 1778983694,
    "type": "error"
});