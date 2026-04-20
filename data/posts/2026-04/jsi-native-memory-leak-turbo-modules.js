window.onPostDataLoaded({
    "title": "Fixing JSI Memory Leaks in React Native Turbo Modules",
    "slug": "jsi-native-memory-leak-turbo-modules",
    "language": "TypeScript/C++",
    "code": "Heap Exhaustion",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Turbo Modules use the JavaScript Interface (JSI) to bridge the C++ and JS layers without serialization. A critical error occurs when C++ code captures <code>jsi::Value</code> or <code>jsi::Object</code> in long-lived lambdas or global variables. Since these objects hold references to the JS garbage-collected heap, failing to release them prevents the JS engine from reclaiming the underlying memory, leading to an OOM (Out Of Memory) crash in the native layer.</p>",
    "root_cause": "Holding strong references to jsi::Value in native C++ class members without utilizing jsi::WeakObject or improper lifecycle synchronization with the JS runtime.",
    "bad_code": "class MyModule : public jsi::HostObject {\n  jsi::Value savedCallback;\n  void setCallback(jsi::Runtime& rt, jsi::Value& cb) {\n    savedCallback = jsi::Value(rt, cb); // Strong reference held forever\n  }\n};",
    "solution_desc": "Use <code>jsi::WeakObject</code> for long-term storage if the JS object might be collected. For callbacks, ensure you clear the reference once the operation completes or provide an explicit 'cleanup' method for the JS side to call.",
    "good_code": "class MyModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Object> persistentCallback;\n  void setCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n    persistentCallback = std::make_unique<jsi::Object>(cb.asObject(rt));\n  }\n  ~MyModule() { persistentCallback.reset(); }\n};",
    "verification": "Use Xcode Memory Graph or Android Studio Profiler. Search for 'PersistentValue' or 'GlobalValue' counts that grow indefinitely after repeated module calls.",
    "date": "2026-04-20",
    "id": 1776671540,
    "type": "error"
});