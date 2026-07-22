window.onPostDataLoaded({
    "title": "Fix React Native Fabric C++ Mutex Deadlocks in UI",
    "slug": "fix-react-native-fabric-cpp-mutex-deadlocks",
    "language": "React",
    "code": "Fabric C++ Deadlock",
    "tags": [
        "React",
        "React Native",
        "C++",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>In React Native projects using the new Fabric architecture and native C++ TurboModules, deadlocks can freeze the main thread during high-frequency asynchronous layout updates. This occurs when custom C++ native code attempts to commit shadow tree mutations while holding module-level locks, colliding with Fabric's background rendering and layout threads.</p>",
    "root_cause": "A cross-thread lock ordering inversion between host Native Module mutexes and Fabric's internal `ShadowTree` / `UIManager` locks when synchronous native calls trigger component mutations on non-JS runtime threads.",
    "bad_code": "#include <mutex>\n#include <react/renderer/components/view/ViewShadowNode.h>\n\nstd::mutex moduleMutex;\n\nvoid CustomTurboModule::updateStateSynchronous(jsi::Runtime& runtime, jsi::Value payload) {\n    std::lock_guard<std::mutex> lock(moduleMutex);\n    \n    // Direct lock acquiring attempt during ongoing layout transaction\n    shadowTree_->commit([&](const ShadowTreeTopology& topology) {\n        // Direct mutation inside lock boundary causes cross-thread mutex inversion\n        return topology.cloneWithNewProps(payload);\n    });\n}",
    "solution_desc": "Avoid acquiring custom native locks across Fabric commit boundaries. Instead, serialize payload updates safely, release module locks prior to commit invocations, and schedule UI tasks asynchronously through the `RuntimeExecutor` or `UIManager` task runner.",
    "good_code": "#include <mutex>\n#include <react/renderer/uimanager/UIManager.h>\n\nstd::mutex moduleMutex;\n\nvoid CustomTurboModule::updateStateAsynchronous(jsi::Runtime& runtime, jsi::Value payload) {\n    std::string serializedData;\n    {\n        std::lock_guard<std::mutex> lock(moduleMutex);\n        serializedData = extractData(runtime, payload);\n    } // Lock explicitly released before interacting with Fabric pipeline\n    \n    runtimeExecutor_([this, serializedData](jsi::Runtime& rt) {\n        uiManager_->getScheduler()->scheduleTask([this, serializedData]() {\n            shadowTree_->commit([&](const ShadowTreeTopology& topology) {\n                return topology.cloneWithNewProps(serializedData);\n            });\n        });\n    });\n}",
    "verification": "Run the iOS application under ThreadSanitizer (TSan) in Xcode or inspect native backtraces using `lldb` under rapid UI state updates to verify no `pthread_mutex_lock` cycles occur between JS and UI thread pools.",
    "date": "2026-07-22",
    "id": 1784684792,
    "type": "error"
});