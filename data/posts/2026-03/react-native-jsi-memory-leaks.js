window.onPostDataLoaded({
    "title": "Eliminating React Native JSI Memory Leaks",
    "slug": "react-native-jsi-memory-leaks",
    "language": "C++ / TS",
    "code": "OutOfMemory",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>The JavaScript Interface (JSI) provides direct C++ access to the JS runtime. Memory leaks occur when C++ objects hold 'jsi::Value' or 'jsi::Object' references in long-lived member variables without releasing them when the React component unmounts. Since the JS Garbage Collector cannot 'see' into C++ heap allocations, these objects are never reclaimed, leading to application crashes during high-frequency data streaming.</p>",
    "root_cause": "Circular references between JS and C++ layers and holding 'jsi::Value' outside the scope of the immediate JSI function call.",
    "bad_code": "struct MyModule : public jsi::HostObject {\n    jsi::Value persistentCallback; // LEAK: This stays alive forever\n    void setCallback(jsi::Runtime& rt, const jsi::Value& val) {\n        persistentCallback = jsi::Value(rt, val);\n    }\n};",
    "solution_desc": "Use 'jsi::WeakObject' or 'jsi::Value::asObject(rt)' carefully. Implement an explicit 'cleanup' or 'invalidate' method that is called when the React Native component unmounts to nullify C++ references to JS values.",
    "good_code": "void cleanup() {\n    persistentCallback = jsi::Value::undefined();\n}\n// In TS component:\nuseEffect(() => {\n    return () => MyNativeModule.cleanup();\n}, []);",
    "verification": "Use Xcode Instruments 'Leaks' tool or Android Studio Profiler. Trigger component remounts 50 times and observe if the heap baseline returns to original levels.",
    "date": "2026-03-17",
    "id": 1773710192,
    "type": "error"
});