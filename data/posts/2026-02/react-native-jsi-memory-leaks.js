window.onPostDataLoaded({
    "title": "Debugging RN JSI Memory Leaks in Native Modules",
    "slug": "react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "MemoryLeak",
    "tags": [
        "React Native",
        "JSI",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) provides direct access to the JS runtime from native code (C++). Memory leaks frequently occur when native code creates <code>jsi::Value</code> or <code>jsi::Object</code> instances and fails to release them, or when <code>jsi::Persistent</code> handles are used to keep JS objects alive without a clear strategy for their invalidation when the JS component unmounts.</p>",
    "root_cause": "Holding onto <code>jsi::Persistent</code> objects in a native HostObject without a mechanism to nullify them when the associated React component is destroyed.",
    "bad_code": "class MyNativeModule : public jsi::HostObject {\n    jsi::Persistent<jsi::Function> callback_;\n    void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n        callback_ = jsi::Persistent<jsi::Function>(rt, cb.asObject(rt).asFunction(rt));\n        // Never released!\n    }\n};",
    "solution_desc": "Implement an explicit cleanup method or use weak references where possible. Ensure the native side listens to the React lifecycle (e.g., through a 'cleanup' call from useEffect) to release persistent references.",
    "good_code": "void clearCallback() {\n    callback_.reset(); // Explicitly release the JS reference\n}\n\n// JS side\nuseEffect(() => {\n    NativeModule.setCallback(() => {});\n    return () => NativeModule.clearCallback();\n}, []);",
    "verification": "Use the Memory Profiler in Xcode or Android Studio to track 'Heap Growth' and ensure the 'jsi::Object' count decreases when components unmount.",
    "date": "2026-02-28",
    "id": 1772240870,
    "type": "error"
});