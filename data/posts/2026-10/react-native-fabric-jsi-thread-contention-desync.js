window.onPostDataLoaded({
    "title": "React Native Fabric: JSI Thread Contention & State Desync",
    "slug": "react-native-fabric-jsi-thread-contention-desync",
    "language": "React Native",
    "code": "JSIStateMismatchError",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Mobile",
        "Error Fix"
    ],
    "analysis": "<p>In React Native's Fabric architecture, the C++ shadow tree acts as the single source of truth for component layout and rendering. Communication between JavaScript and Native occurs synchronously via the JavaScript Interface (JSI). However, when high-frequency UI events (such as drag interactions or scroll gestures) dispatch updates from the JS thread while native gestures concurrently commit state directly to the C++ <code>ShadowNode</code>, thread contention emerges.</p><p>Because the C++ shadow tree relies on an immutable cloning model, concurrent non-isolated writes lead to race conditions where the JavaScript state revision diverges from the committed C++ <code>StateData</code>. This results in visual stuttering, stale layouts, or native crashes caused by dereferencing invalid shadow node pointers.</p>",
    "root_cause": "Directly mutating C++ ShadowNode state or invoking asynchronous JavaScript state setters during rapid native event callbacks without using Fabric's cloneNode and atomic StateUpdate transaction mechanism.",
    "bad_code": "// CustomFabricViewManager.cpp\nvoid CustomFabricViewShadowNode::updateState(std::string text) {\n  // Anti-pattern: Mutating local state directly without atomic cloneNode\n  auto state = getStateData();\n  state.textValue = text; // Race condition with JS commit thread\n  this->setStateData(std::move(state));\n}\n\n// Component.tsx\nconst onScrollHandler = (event) => {\n  // Unbatched high-frequency state updates clash with C++ UI commits\n  setNativeOffset(event.nativeEvent.contentOffset.y);\n};",
    "solution_desc": "Adopt Fabric's immutable revision pattern using `cloneNodeAndReplaceChild` combined with `State::commit`. On the JavaScript side, wrap high-velocity continuous gestures using React 18 concurrency (`startTransition`) or native-driven Worklets (e.g., via Reanimated) to ensure mutations execute entirely on the UI thread without crossing the JSI bridge synchronously for each tick.",
    "good_code": "// CustomFabricViewShadowNode.cpp\nvoid CustomFabricViewShadowNode::updateTextAtomic(\n    const std::string& newText,\n    const ShadowTree& shadowTree) {\n  shadowTree.commit([](RootShadowNode const &oldRootNode) {\n    return oldRootNode.cloneNode(\n      *oldRootNode.findChildNodeById(targetNodeId),\n      [](ShadowNode const &oldNode) {\n        auto state = std::make_shared<CustomState const>(newText);\n        return oldNode.clone({.state = state});\n      }\n    );\n  });\n}\n\n// Component.tsx\nimport { useTransition } from 'react';\n\nconst [isPending, startTransition] = useTransition();\nconst onGestureEvent = (value: number) => {\n  startTransition(() => {\n    setNativeOffset(value);\n  });\n};",
    "verification": "Profile using Flipper/Hermes sampling to ensure `mqt_js` and `mqt_v_ui` threads do not experience lock contention. Confirm zero occurrences of `StateUpdateAppliedOnDanglingNode` warnings in Logcat/OSLog.",
    "date": "2026-10-02",
    "id": 1790910694,
    "type": "error"
});