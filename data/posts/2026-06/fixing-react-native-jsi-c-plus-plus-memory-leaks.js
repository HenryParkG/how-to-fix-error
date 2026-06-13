window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks in C++ Modules",
    "slug": "fixing-react-native-jsi-c-plus-plus-memory-leaks",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "React Native",
        "C++",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) provides synchronous, high-performance bindings between JS and Native C++. However, when passing Javascript callbacks to custom C++ HostObjects, memory leaks easily arise. When C++ modules capture and store strong references to JS functions (such as <code>jsi::Function</code>) in member variables, it creates a cyclic reference loop where the V8/Hermes Garbage Collector cannot release the JS context and the native memory allocator retains the native objects indefinitely.</p>",
    "root_cause": "Storing strong `jsi::Value` or `jsi::Function` wrappers directly inside long-lived C++ class instances, preventing the runtime garbage collector from tracing and deallocating the JS objects.",
    "bad_code": "#include <jsi/jsi.h>\n\nclass CustomJSIModule : public facebook::jsi::HostObject {\nprivate:\n    // Problem: Storing raw persistent JS function captures\n    facebook::jsi::Function jsCallback_;\npublic:\n    void setCallback(facebook::jsi::Runtime& rt, const facebook::jsi::Value& val) {\n        if (val.isObject() && val.asObject(rt).isFunction(rt)) {\n            jsCallback_ = val.asObject(rt).asFunction(rt); // Retain cycle\n        }\n    }\n};",
    "solution_desc": "Avoid keeping long-lived strong references to JavaScript assets inside the C++ layer. Utilize standard C++ cleanup structures or wrap references inside explicit release hooks using clean teardown APIs or weak reference models to break cyclic ownership.",
    "good_code": "#include <jsi/jsi.h>\n#include <memory>\n\nclass CustomJSIModule : public facebook::jsi::HostObject {\nprivate:\n    // Wrap JS values dynamically to allow explicit release\n    std::unique_ptr<facebook::jsi::Value> jsCallback_;\npublic:\n    void setCallback(facebook::jsi::Runtime& rt, const facebook::jsi::Value& val) {\n        jsCallback_ = std::make_unique<facebook::jsi::Value>(rt, val);\n    }\n    \n    // Call this during React component unmount to break cycle\n    void clearCallback() {\n        jsCallback_.reset();\n    }\n};",
    "verification": "Profiles your React Native application using Xcode Instruments Allocations/Leaks or Chrome DevTools Memory Profiler. Confirm that the JSI HostObject and associated JS execution memory drop when the consuming React component unmounts.",
    "date": "2026-06-13",
    "id": 1781349070,
    "type": "error"
});