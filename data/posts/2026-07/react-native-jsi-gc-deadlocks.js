window.onPostDataLoaded({
    "title": "Resolving RN JSI GC Deadlocks & Leaks",
    "slug": "react-native-jsi-gc-deadlocks",
    "language": "TypeScript",
    "code": "Garbage Collection Leak",
    "tags": [
        "TypeScript",
        "React",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) enables direct synchronous communication between C++ and JS engines. However, retaining strong references to JS functions or objects inside C++ HostObjects creates cyclic references. Because the Hermes/V8 GC and the native C++ ARC (Automatic Reference Counting) run on different runtimes, these cyclic dependencies cause severe memory leaks and eventual GC deadlocks when both engines attempt to sweep simultaneously.</p>",
    "root_cause": "A C++ HostObject holding a strong jsi::Function reference while being referenced back by JS. The JS engine cannot collect the host object, and the native heap cannot release the strong JS reference.",
    "bad_code": "/* C++ implementation snippet violating reference ownership */\nclass MyHostObject : public jsi::HostObject {\npublic:\n  MyHostObject(jsi::Runtime& rt, const jsi::Function& callback) \n    : rt_(rt), callback_(callback) {} // Leak: Strong reference stored on native heap\nprivate:\n  jsi::Runtime& rt_;\n  jsi::Function callback_;\n};",
    "solution_desc": "Store JS objects or callbacks inside C++ using weak references, or design an explicit invalidation/cleanup phase where references are set to null when the component unmounts or completes its task.",
    "good_code": "/* TypeScript and JSI conceptual architecture fix: Explicit Invalidation */\nimport { useEffect } from 'react';\n\ninterface SafeNativeModule {\n  registerCallback(cb: () => void): void;\n  cleanup(): void;\n}\n\nexport function useSafeNativeModule(nativeModule: SafeNativeModule) {\n  useEffect(() => {\n    const handleEvent = () => {\n      console.log('Event handled safely');\n    };\n    \n    nativeModule.registerCallback(handleEvent);\n    \n    return () => {\n      // Explicitly tear down native reference bindings to break cycles\n      nativeModule.cleanup();\n    };\n  }, [nativeModule]);\n}",
    "verification": "Compile the release build, use Xcode Instruments (Allocations/Leaks) or Android Studio Memory Profiler, execute the native-to-JS bridge repeatedly, and verify that the heap count returns to baseline after GC invocation.",
    "date": "2026-07-08",
    "id": 1783498270,
    "type": "error"
});