window.onPostDataLoaded({
    "title": "Fix React Native Fabric UI Deadlocks in Synchronous JSI",
    "slug": "fix-react-native-fabric-ui-deadlocks-synchronous-jsi",
    "language": "TypeScript",
    "code": "ThreadDeadlock",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "React Native",
        "Error Fix"
    ],
    "analysis": "<p>React Native's new Architecture (Fabric) relies on JavaScript Interface (JSI) for synchronous binding between JavaScript and native C++ state engines. While synchronous JSI calls eliminate serialization overhead, executing synchronous module methods directly from the JavaScript thread while the UI thread is processing a concurrent render frame causes classic circular thread deadlocks.</p><p>When the Fabric main UI thread blocks waiting for a JS shadow tree commit, and simultaneously a JSI method invoked on the JS thread attempts a synchronous dispatch onto the UI thread, both execution contexts enter a mutual acquire lock contention state, freezing the application entirely.</p>",
    "root_cause": "Circular waiting between the UI thread (holding UI lock, blocking for JS state update) and the JS thread (holding JS context lock, synchronously invoking UI host objects via JSI).",
    "bad_code": "// Native Module C++ / Objective-C++ implementation\nJSI_HOST_FUNCTION(getNativeLayoutDimensions) {\n  // Bad: Forcing synchronous dispatch to Main UI Thread inside JSI call\n  __block CGRect frame;\n  dispatch_sync(dispatch_get_main_queue(), ^{\n    frame = [self.view frame]; // Waits for UI thread while JS thread holds lock\n  });\n  return jsi::Object::createFromHostObject(rt, frame);\n}",
    "solution_desc": "Convert synchronous native module host functions to non-blocking asynchronous calls using `CallInvoker` or state snapshots cached on the C++ layer to prevent cross-thread synchronous dispatch during ongoing Fabric layout passes.",
    "good_code": "// Fixed Native Module C++ implementation utilizing asynchronous CallInvoker\nJSI_HOST_FUNCTION(getNativeLayoutDimensionsAsync) {\n  auto promiseResolver = std::make_shared<jsi::Value>(/* promise init */);\n  \n  // Non-blocking async dispatch through CallInvoker\n  jsInvoker_->invokeAsync([this, promiseResolver]() {\n    // Thread-safe cached view read without blocking JS lock\n    auto dimensions = this->getCachedLayoutDimensions();\n    // Resolve promise safely on JS runtime thread\n  });\n  \n  return promise;\n}",
    "verification": "Run application under Xcode Thread Sanitizer or Android ASan while triggering high-frequency UI updates combined with module calls. Confirm 0 occurrences of main thread blocking using `systrace` / Chrome Tracing UI thread profiler.",
    "date": "2026-08-06",
    "id": 1785980592,
    "type": "error"
});