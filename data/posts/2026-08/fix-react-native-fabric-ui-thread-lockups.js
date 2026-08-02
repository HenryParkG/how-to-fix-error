window.onPostDataLoaded({
    "title": "Fix Fabric UI Thread Lockups from Rapid Shadow Tree Mutations",
    "slug": "fix-react-native-fabric-ui-thread-lockups",
    "language": "C++ / React Native",
    "code": "UI_THREAD_LOCKUP",
    "tags": [
        "React",
        "TypeScript",
        "React Native",
        "Fabric",
        "Error Fix"
    ],
    "analysis": "<p>When dispatching ultra-high-frequency state updates or rapid layout mutations under React Native's New Architecture (Fabric), asynchronous shadow tree mutations can saturate the UI thread event loop. Fabric manages layout synchronization between the JS thread, the Shadow thread, and the native UI main thread. Rapidly creating new ShadowNode revisions without batching or debouncing triggers heavy C++ Yoga layout recalculations and forces main-thread synchronous layout commit passes, leading to severe frame drops, touch unresponsiveness, and total UI thread lockups.</p>",
    "root_cause": "Unthrottled React state updates triggering continuous asynchronous ShadowTree mutations and forced main-thread layout commit passes in Fabric's C++ binding layer.",
    "bad_code": "import React, { useState, useEffect } from 'react';\nimport { View, Text } from 'react-native';\n\nexport const RapidMutationComponent = ({ streamData }) => {\n  const [layoutWidth, setLayoutWidth] = useState(100);\n\n  useEffect(() => {\n    // High-frequency stream triggering continuous layout recalculations\n    streamData.subscribe((val) => {\n      // Forces immediate React state mutation on every frame microtask\n      setLayoutWidth(100 + (val % 200));\n    });\n  }, [streamData]);\n\n  return (\n    <View style={{ width: layoutWidth, height: 50, backgroundColor: 'blue' }}>\n      <Text>Stream Value: {layoutWidth}</Text>\n    </View>\n  );\n};",
    "solution_desc": "Mitigate UI thread contention by batching layout mutations using React 18 Concurrent features (`useTransition` or `startTransition`) and debouncing state updates, or by delegating fluid updates directly to the UI thread via Reanimated shared values without mutating Fabric shadow nodes.",
    "good_code": "import React, { useState, useEffect, useTransition } from 'react';\nimport { View, Text } from 'react-native';\nimport Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';\n\nexport const OptimizedMutationComponent = ({ streamData }) => {\n  // Route rapid UI updates strictly through Reanimated shared values\n  const animatedWidth = useSharedValue(100);\n  const [, startTransition] = useTransition();\n  const [displayValue, setDisplayValue] = useState(100);\n\n  useEffect(() => {\n    const unsubscribe = streamData.subscribe((val) => { // High-frequency payload\n      // 1. Immediate off-thread UI animation update without Shadow Tree mutation\n      animatedWidth.value = 100 + (val % 200);\n\n      // 2. Low-priority transition state for text label updates\n      startTransition(() => {\n        setDisplayValue(100 + (val % 200));\n      });\n    });\n    return () => unsubscribe();\n  }, [streamData]);\n\n  const animatedStyle = useAnimatedStyle(() => ({\n    width: animatedWidth.value,\n  }));\n\n  return (\n    <Animated.View style={[{ height: 50, backgroundColor: 'blue' }, animatedStyle]}>\n      <Text>Stream Value: {displayValue}</Text>\n    </Animated.View>\n  );\n};",
    "verification": "Inspect the application with React Native Performance Monitor or Chrome Performance Profiler. Confirm zero dropped frames (60fps target) during state streaming and observe that C++ `facebook::react::ShadowTree::commit` calls are reduced by over 90% in Android Systrace / Xcode Instruments.",
    "date": "2026-08-02",
    "id": 1785649667,
    "type": "error"
});