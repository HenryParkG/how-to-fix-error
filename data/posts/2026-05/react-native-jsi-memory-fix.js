window.onPostDataLoaded({
    "title": "Fixing Memory Corruption in React Native JSI Modules",
    "slug": "react-native-jsi-memory-fix",
    "language": "React Native",
    "code": "MemoryCorruption",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput React Native modules using JSI (JavaScript Interface) often suffer from memory corruption or Use-After-Free (UAF) errors. These occur because JSI allows direct C++ to JS communication without the overhead of the JSON bridge. However, if a C++ object is garbage collected by the native side while a JS <code>HostObject</code> still holds a pointer to it, the next access from JS will crash the application. This is particularly prevalent in video processing or high-frequency sensor data modules where objects are created and destroyed rapidly.</p>",
    "root_cause": "Holding raw pointers to native resources inside a jsi::HostObject without using shared_ptr or proper lifecycle synchronization between the JS runtime and native heap.",
    "bad_code": "class MyNativeModule : public jsi::HostObject {\n  NativeResource* resource; // Raw pointer\npublic:\n  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {\n    return jsi::Value(resource->getData()); // Crash if resource is deleted\n  }\n};",
    "solution_desc": "Use std::shared_ptr to manage the lifecycle of the native resource and ensure the HostObject captures a reference count to the resource, preventing it from being deallocated while JS still has a handle to it.",
    "good_code": "class MyNativeModule : public jsi::HostObject {\n  std::shared_ptr<NativeResource> resource;\npublic:\n  MyNativeModule(std::shared_ptr<NativeResource> res) : resource(res) {}\n  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {\n    if (name.utf8(rt) == \"data\") {\n        return jsi::Value(resource->getData());\n    }\n    return jsi::Value::undefined();\n  }\n};",
    "verification": "Use AddressSanitizer (ASAN) in Xcode to track memory access and verify that no UAF errors occur during high-frequency calls.",
    "date": "2026-05-10",
    "id": 1778399869,
    "type": "error"
});