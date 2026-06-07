window.onPostDataLoaded({
    "title": "Fixing RN UI Thread Starvation from Bridge Traffic",
    "slug": "fixing-react-native-ui-bridge-starvation",
    "language": "TypeScript",
    "code": "UI Starvation",
    "tags": [
        "React",
        "TypeScript",
        "Next.js",
        "Error Fix"
    ],
    "analysis": "<p>React Native applications processing high-frequency events (e.g., real-time WebSocket updates, continuous scrolling, or high-definition accelerometer polling) often suffer from UI frame drops and frozen interactions. In the legacy architecture, data exchanged between the JavaScript thread and the Native (UI) thread must be serialized and deserialized as JSON messages over the single-threaded asynchronous Bridge.</p><p>When high-frequency events fire, the bridge queue becomes saturated, causing a bottleneck. The UI thread is starved waiting for the JS thread to process messages and send back layout/rendering commands, causing the UI to drop well below its 60fps/120fps budget.</p>",
    "root_cause": "Relying on state updates originating from the JavaScript thread to drive high-frequency UI changes. Each event round-trips through the JSON bridge, causing queue congestion, scheduling delays, and rendering synchronization blockages.",
    "bad_code": "import React, { useState } from 'react';\nimport { ScrollView, View, Text } from 'react-native';\n\nconst BadTracker = () => {\n  const [offsetY, setOffsetY] = useState(0);\n\n  // BUG: High-frequency scroll events pass data to JS thread, trigger state updates,\n  // and push serialized style calculations back across the bridge on every frame.\n  return (\n    <ScrollView\n      scrollEventThrottle={16}\n      onScroll={(event) => {\n        setOffsetY(event.nativeEvent.contentOffset.y);\n      }}>\n      <View style={{ transform: [{ translateY: offsetY }] }}>\n        <Text>Starving the UI Thread</Text>\n      </View>\n    </ScrollView>\n  );\n};",
    "solution_desc": "Bypass the JavaScript execution thread and asynchronous bridge entirely for high-frequency events by offloading them to the Native thread. Use libraries like `react-native-reanimated` and Native Event Drivers. This executes computations on the UI thread via JSI (JavaScript Interface) worklets, eliminating the serialization and scheduling overhead.",
    "good_code": "import React from 'react';\nimport Animated, {\n  useSharedValue,\n  useAnimatedStyle,\n  useAnimatedScrollHandler,\n} from 'react-native-reanimated';\n\nconst GoodTracker = () => {\n  const offsetY = useSharedValue(0);\n\n  // Handled entirely on the UI thread via JSI worklets\n  const scrollHandler = useAnimatedScrollHandler({\n    onScroll: (event) => {\n      offsetY.value = event.contentOffset.y;\n    },\n  });\n\n  const animatedStyle = useAnimatedStyle(() => {\n    return {\n      transform: [{ translateY: offsetY.value }],\n    };\n  });\n\n  return (\n    <Animated.ScrollView\n      scrollEventThrottle={16}\n      onScroll={scrollHandler}>\n      <Animated.View style={animatedStyle}>\n        <Animated.Text>Smooth UI Thread</Animated.Text>\n      </Animated.View>\n    </Animated.ScrollView>\n  );\n};",
    "verification": "Open the Flipper Profiler or use the built-in React Native Perf Monitor. Verify that during scrolling, the JavaScript Frame Rate (JS FPS) and System Frame Rate (UI FPS) both remain steady at a constant 60/120 FPS without dip spikes.",
    "date": "2026-06-07",
    "id": 1780799911,
    "type": "error"
});