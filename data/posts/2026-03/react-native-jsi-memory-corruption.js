window.onPostDataLoaded({
    "title": "Resolving RN JSI Memory Corruption",
    "slug": "react-native-jsi-memory-corruption",
    "language": "TypeScript",
    "code": "JSIMemoryCorruption",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JSI (JavaScript Interface) allows synchronous communication between JS and C++. However, memory corruption occurs when a C++ HostObject is accessed after the JavaScript runtime has garbage-collected the wrapper or when a native thread tries to access a jsi::Runtime that is no longer valid.</p>",
    "root_cause": "Dangling pointers caused by capturing jsi::Runtime references in asynchronous blocks or failing to use jsi::WeakObject for long-lived native-to-JS references.",
    "bad_code": "auto callback = [runtime](jsi::Value& val) {\n  // Dangerous: runtime might be destroyed when this runs\n  runtime.global().setProperty(runtime, \"data\", val);\n};",
    "solution_desc": "Ensure all native calls are strictly synchronous or use a 'ThreadSafeRuntime'. Wrap JS objects in 'jsi::Persistent' and check for validity before access, ensuring native life-cycles are tied to the Bridge/Runtime lifecycle.",
    "good_code": "std::shared_ptr<jsi::Persistent<jsi::Object>> persistedObj;\n// ... inside method\njsi::Object obj = persistedObj->asObject(runtime);\nif (!obj.isUndefined()) { /* safe access */ }",
    "verification": "Run the application with AddressSanitizer (ASan) enabled in Xcode/Android Studio to detect invalid memory access during GC cycles.",
    "date": "2026-03-22",
    "id": 1774154852,
    "type": "error"
});