window.onPostDataLoaded({
    "title": "Fixing RN JSI Memory Leaks and GC Thrashing",
    "slug": "fixing-react-native-jsi-memory-leaks",
    "language": "TypeScript",
    "code": "Memory Leak",
    "tags": [
        "React",
        "TypeScript",
        "React Native",
        "CSS",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) enables direct, synchronous communication between the JavaScript engine (Hermes or V8) and native C++ code without passing through the asynchronous bridge. While JSI provides high performance, it introduces significant risks of cross-runtime memory leaks. If a C++ HostObject retains a strong reference to a JavaScript object, or vice-versa, the garbage collector (GC) on both sides fails to break the cyclic dependency. This leads to continuous native heap allocation growth and frequent, performance-degrading garbage collection thrashing.</p>",
    "root_cause": "The JSI garbage collection boundary cannot automatically trace circular references. When a native C++ object stores a strong `jsi::Value` or `jsi::Object` instance globally or inside a heap-allocated lambda, and that JS object also references the C++ HostObject, the reference counts on both engines remain above zero permanently, hiding them from automatic reclamation.",
    "bad_code": "// Native C++ class holding a permanent strong JS function reference\nclass MyJsiModule : public jsi::HostObject {\npublic:\n  jsi::Value callback;\n  \n  MyJsiModule(jsi::Runtime& rt, jsi::Function&& cb) {\n    // Bad: Storing the JS function strongly inside a native property\n    callback = jsi::Value(rt, cb);\n  }\n};",
    "solution_desc": "To prevent cross-boundary memory leaks, avoid storing strong JS references in native C++ structures. Instead, use `jsi::WeakObject` to keep track of target JS components or establish explicit disposal/lifecycle systems. When a JS component unmounts or completes its task, trigger an explicit native cleanup routine to manually clear native lambda pointers and release host structures.",
    "good_code": "// Native C++ class using jsi::WeakObject to prevent strong references\n#include <jsi/jsi.h>\n\nusing namespace facebook;\n\nclass MyJsiModule : public jsi::HostObject {\nprivate:\n  std::shared_ptr<jsi::WeakObject> weakCallback;\n\npublic:\n  MyJsiModule(jsi::Runtime& rt, jsi::Object&& cb) {\n    // Good: Convert strong JS Object reference into a weak reference\n    weakCallback = std::make_shared<jsi::WeakObject>(rt, cb);\n  }\n\n  void invoke(jsi::Runtime& rt) {\n    if (weakCallback) {\n      // Lock the weak reference to obtain a strong handle during invocation\n      jsi::Value value = weakCallback->lock(rt);\n      if (!value.isUndefined() && value.isObject()) {\n        jsi::Function cb = value.getObject(rt).asFunction(rt);\n        cb.call(rt);\n      }\n    }\n  }\n};",
    "verification": "Profile the native memory usage of your application using Xcode Instruments (Allocations/Leaks) or Android Studio Profiler. Verify that Native Memory (C++ heap) scales down and stabilizes when the associated JS views are unmounted.",
    "date": "2026-07-16",
    "id": 1784179943,
    "type": "error"
});