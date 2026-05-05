window.onPostDataLoaded({
    "title": "Resolving React Native JSI Memory Leaks",
    "slug": "resolving-react-native-jsi-memory-leaks",
    "language": "C++/JavaScript",
    "code": "JSIMemoryLeak",
    "tags": [
        "React Native",
        "C++",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) allows for synchronous communication between JavaScript and Native C++ code. However, memory leaks frequently occur when developers capture `jsi::Value`, `jsi::Object`, or `jsi::Function` within C++ lambdas or global variables without considering the lifecycle of the JavaScript Runtime. Because JSI objects are managed by the JS Garbage Collector, holding a reference in C++ prevents the GC from reclaiming the memory, eventually leading to application crashes on high-frequency bridges.</p>",
    "root_cause": "Holding long-lived C++ references to JSI objects (like jsi::Object) that are not wrapped in a jsi::Persistent or failing to properly invalidate native-to-JS callbacks when the component unmounts.",
    "bad_code": "auto callback = std::make_shared<jsi::Function>(std::move(func));\n// Leaks if the runtime is destroyed or if this is held globally\nthis->storedCallback = callback;",
    "solution_desc": "Use `jsi::Persistent` to manage long-lived references and ensure that any native objects capturing the JSI Runtime or its values are explicitly cleared during the module's cleanup or when the JS engine reloads.",
    "good_code": "std::unique_ptr<jsi::Persistent<jsi::Function>> persistentCallback;\n// In implementation:\npersistentCallback = std::make_unique<jsi::Persistent<jsi::Function>>(runtime, func);\n// To call:\nauto func = persistentCallback->asFunction(runtime);",
    "verification": "Monitor memory usage using Xcode Instruments (Leaks tool) or Android Studio Profiler, focusing on the heap growth during rapid native module invocations.",
    "date": "2026-05-05",
    "id": 1777976920,
    "type": "error"
});