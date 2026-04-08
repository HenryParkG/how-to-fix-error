window.onPostDataLoaded({
    "title": "Mitigating React Native JSI Memory Leaks in TurboModules",
    "slug": "react-native-jsi-memory-leak",
    "language": "C++ / TypeScript",
    "code": "MemoryLeak",
    "tags": [
        "React Native",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Transitioning to TurboModules involves interacting directly with the JavaScript Interface (JSI). A common pitfall occurs when C++ HostObjects store <code>jsi::Value</code> or <code>jsi::Object</code> as member variables. Since JSI objects are not automatically tracked by the JavaScript Garbage Collector (GC) when held in the C++ heap, they create a 'strong reference' cycle that prevents JS objects from being deallocated, leading to linear memory growth.</p>",
    "root_cause": "Storing raw jsi::Object references in C++ long-lived classes without using jsi::Persistent or explicit cleanup.",
    "bad_code": "class MyTurboModule : public jsi::HostObject {\n  jsi::Object callback_;\npublic:\n  void setCallback(jsi::Runtime& rt, const jsi::Object& cb) {\n    // BAD: Capturing a raw object reference that the GC can't track\n    callback_ = jsi::Value(rt, cb).asObject(rt);\n  }\n};",
    "solution_desc": "Use <code>jsi::Persistent</code> to store references that need to survive across execution blocks, and ensure they are explicitly invalidated or reset when no longer needed.",
    "good_code": "class MyTurboModule : public jsi::HostObject {\n  std::unique_ptr<jsi::Persistent<jsi::Object>> persistentCallback_;\npublic:\n  void setCallback(jsi::Runtime& rt, const jsi::Object& cb) {\n    // GOOD: Wrap the object in a Persistent reference\n    persistentCallback_ = std::make_unique<jsi::Persistent<jsi::Object>>(rt, cb);\n  }\n\n  ~MyTurboModule() {\n    // Reset to allow GC to collect the JS object\n    persistentCallback_.reset();\n  }\n};",
    "verification": "Profile the app using Xcode Memory Graph or Android Studio Profiler to check for growing 'HostObject' allocations.",
    "date": "2026-04-08",
    "id": 1775611643,
    "type": "error"
});