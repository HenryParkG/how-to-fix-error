window.onPostDataLoaded({
    "title": "Fixing React Native JSI Bridge Congestion",
    "slug": "react-native-jsi-bridge-congestion",
    "language": "TypeScript",
    "code": "BridgeCongestion",
    "tags": [
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>When handling high-frequency sensor data (e.g., Accelerometer or Gyroscope at 100Hz), passing every data point across the JavaScript Interface (JSI) can saturate the MessageQueue. Even with the speed of JSI, excessive traffic on the JS thread causes UI lag (dropped frames) and delayed event processing because the thread is too busy updating state for every single sensor tick.</p>",
    "root_cause": "The synchronous nature of JS thread execution being overwhelmed by a high-velocity stream of small objects originating from the native side.",
    "bad_code": "Accelerometer.addListener(data => {\n  setSensorValue(data); // Re-renders the entire component 100 times per second\n});",
    "solution_desc": "Move high-frequency logic to the UI thread using 'Worklets' (via Reanimated) or build a native buffer that aggregates data before sending it to the JS side at a lower frequency (e.g., 16ms intervals).",
    "good_code": "import Animated, { useSharedValue, useAnimatedSensor, SensorType } from 'react-native-reanimated';\n\nconst sensor = useAnimatedSensor(SensorType.ACCELEROMETER);\n// Value is updated on the UI thread, bypassing the main JS thread congestion",
    "verification": "Use the 'React Native Debugger' or 'Perf Monitor' to check the 'JS' and 'UI' FPS. Stable 60 FPS on both indicates the congestion is resolved.",
    "date": "2026-04-02",
    "id": 1775105845,
    "type": "error"
});