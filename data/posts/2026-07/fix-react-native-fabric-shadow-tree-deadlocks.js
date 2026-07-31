window.onPostDataLoaded({
    "title": "Fix React Native Fabric Shadow Tree Synchronous Deadlocks",
    "slug": "fix-react-native-fabric-shadow-tree-deadlocks",
    "language": "TypeScript",
    "code": "Deadlock",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In React Native's Fabric renderer, Shadow Trees calculate UI layout asynchronously across C++ background threads and the JS runtime thread. Triggering synchronous state updates or layout reads inside layout event handlers (e.g. `onLayout`) causes mutex lock contention between the JavaScript thread and the Fabric UI render thread, causing the application to completely freeze (deadlock).</p>",
    "root_cause": "Re-entrant locking of the C++ ShadowTree lock during synchronous state commits dispatched inside Native layout measurement callbacks, forcing concurrent lock acquisition failure between JS and Fabric UI threads.",
    "bad_code": "import React, { useState } from 'react';\nimport { View, Text, LayoutChangeEvent } from 'react-native';\n\nexport const BuggyLayout = () => {\n  const [height, setHeight] = useState(0);\n\n  const handleLayout = (e: LayoutChangeEvent) => {\n    // Synchronous state mutation triggers immediate ShadowTree lock re-acquisition\n    const newHeight = e.nativeEvent.layout.height;\n    setHeight(newHeight);\n  };\n\n  return (\n    <View onLayout={handleLayout} style={{ height: height ? height + 10 : 'auto' }}>\n      <Text>Fabric UI Deadlock Example</Text>\n    </View>\n  );\n};",
    "solution_desc": "Defer layout state updates out of the immediate C++ ShadowTree commit frame using `requestAnimationFrame` or React 18 `useTransition` to break the lock contention loop.",
    "good_code": "import React, { useState, useTransition } from 'react';\nimport { View, Text, LayoutChangeEvent } from 'react-native';\n\nexport const FixedLayout = () => {\n  const [height, setHeight] = useState(0);\n  const [, startTransition] = useTransition();\n\n  const handleLayout = (e: LayoutChangeEvent) => {\n    const newHeight = e.nativeEvent.layout.height;\n    // Defer state synchronization to avoid C++ ShadowTree thread deadlock\n    requestAnimationFrame(() => {\n      startTransition(() => {\n        setHeight(newHeight);\n      });\n    });\n  };\n\n  return (\n    <View onLayout={handleLayout} style={{ height: height ? height + 10 : undefined }}>\n      <Text>Fabric UI Deadlock Fixed</Text>\n    </View>\n  );\n};",
    "verification": "Inspect thread stack traces via LLDB / Android Studio Profiler. Verify `facebook::react::ShadowTree::commit` does not deadlock, and ensure frame rate remains continuous at 60/120 FPS during rapid dynamic layout updates.",
    "date": "2026-07-31",
    "id": 1785477393,
    "type": "error"
});