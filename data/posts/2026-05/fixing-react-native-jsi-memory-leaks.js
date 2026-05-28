window.onPostDataLoaded({
    "title": "Fixing React Native JSI Memory Leaks",
    "slug": "fixing-react-native-jsi-memory-leaks",
    "language": "React Native / C++",
    "code": "OOM Crash",
    "tags": [
        "React",
        "TypeScript",
        "Mobile",
        "Error Fix"
    ],
    "analysis": "<p>React Native's JavaScript Interface (JSI) enables direct execution of C++ code from JS without bridging serialization overhead. However, passing high-frequency data (like camera frame buffers or sensor streams) risks severe memory leaks. If a native C++ JSI HostObject retains a strong reference to a JavaScript value or callback (such as jsi::Value or jsi::Object) across multiple invocations, the garbage collector in the JavaScript VM (Hermes or V8) cannot reclaim the referenced JS object. This blocks the reclamation of native resources, leading to memory bloat and eventual Out-of-Memory (OOM) crashes on mobile devices.</p>",
    "root_cause": "Holding long-lived, strong jsi::Value or jsi::Object instances within native C++ class members, preventing the JS engine from garbage-collecting the underlying JS closure or object.",
    "bad_code": "class CameraFrameProcessor : public jsi::HostObject {\n    jsi::Value jsCallback; // Strong reference to JS garbage-collected callback\npublic:\n    void setFrameCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n        jsCallback = jsi::Value(rt, cb); // Prevents the JS callback from being garbage collected\n    }\n};",
    "solution_desc": "Replace strong references to JS objects with weak references using jsi::WeakObject. This allows the JavaScript virtual machine to clean up the callback or object when it is no longer referenced in JavaScript, and the native C++ code can safely lock the reference only when it needs to perform an invocation.",
    "good_code": "class CameraFrameProcessor : public jsi::HostObject {\n    std::unique_ptr<jsi::WeakObject> weakCallback;\npublic:\n    void setFrameCallback(jsi::Runtime& rt, const jsi::Value& cb) {\n        if (cb.isObject()) {\n            weakCallback = std::make_unique<jsi::WeakObject>(rt, cb.asObject(rt));\n        }\n    }\n    void onFrameReceived(jsi::Runtime& rt, const jsi::Value& frame) {\n        if (weakCallback) {\n            jsi::Value cbVal = weakCallback->lock(rt);\n            if (!cbVal.isUndefined() && cbVal.isObject()) {\n                cbVal.asObject(rt).asFunction(rt).call(rt, frame);\n            }\n        }\n    }\n};",
    "verification": "Attach the Android Studio Memory Profiler or Xcode Instruments (Allocations/Leaks tool). Run the frame processor at 60 FPS for 5 minutes and observe that both native and JS heap sizes remain flat.",
    "date": "2026-05-28",
    "id": 1779970778,
    "type": "error"
});