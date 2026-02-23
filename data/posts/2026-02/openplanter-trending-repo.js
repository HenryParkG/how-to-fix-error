window.onPostDataLoaded({
    "title": "OpenPlanter: The Open-Source Green Thumb",
    "slug": "openplanter-trending-repo",
    "language": "Python",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Python"
    ],
    "analysis": "<p>ShinMegamiBoson/OpenPlanter is trending due to its unique approach to 'Precision Agriculture' for hobbyists. It combines affordable ESP32 hardware with a sophisticated Python-based backend to automate plant care. As urban gardening grows, developers are flocking to this repo for its extensible plugin architecture and beautiful React-based dashboard.</p>",
    "root_cause": "ESP32 Integration, Automated Irrigation Logic, and MQTT-based Telemetry.",
    "bad_code": "git clone https://github.com/ShinMegamiBoson/OpenPlanter.git && cd OpenPlanter && docker-compose up",
    "solution_desc": "Ideal for DIY home automation enthusiasts and researchers looking to collect soil moisture and light data at scale without proprietary cloud lock-in.",
    "good_code": "from openplanter.sensors import MoistureSensor\nfrom openplanter.pumps import WaterPump\n\n# Simple automated loop\nif MoistureSensor.get_level() < 30:\n    WaterPump.trigger(duration=5)\n",
    "verification": "The project is expanding into AI-driven growth analysis using OpenCV, making it a key repo to watch in the AgriTech space.",
    "date": "2026-02-23",
    "id": 1771811400,
    "type": "trend"
});