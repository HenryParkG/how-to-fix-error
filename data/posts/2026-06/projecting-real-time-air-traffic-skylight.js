window.onPostDataLoaded({
    "title": "Projecting Real-Time Air Traffic with Skylight",
    "slug": "projecting-real-time-air-traffic-skylight",
    "language": "Python",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "Python"
    ],
    "analysis": "<p>The trending repository <code>cpaczek/skylight</code> is capturing the attention of both developers and hardware hobbyists. It processes live ADS-B signals broadcasted by airplanes overhead using cheap RTL-SDR hardware and projects a real-time, aesthetically stunning virtual sky layer directly onto your room's ceiling. The projection tracks commercial flights, shows where they are headed, and overlays celestial events like the ISS, sun, moon, and stars.</p><p>This project is trending because it beautifully connects physical, real-world data extraction with highly immersive and context-aware home projection mapping.</p>",
    "root_cause": "Key Features & Innovations",
    "bad_code": "git clone https://github.com/cpaczek/skylight.git\ncd skylight\npip install -r requirements.txt\nsudo apt-get install dump1090-mutability  # For RTL-SDR radio decoding",
    "solution_desc": "Best Use Cases & When to adopt",
    "good_code": "# Example partial configuration for coordinates and SDR source (config.json):\n{\n  \"location\": {\n    \"latitude\": 40.7128,\n    \"longitude\": -74.0060,\n    \"elevation\": 10\n  },\n  \"sdr\": {\n    \"host\": \"localhost\",\n    \"port\": 30003,\n    \"max_range_km\": 150\n  },\n  \"projection\": {\n    \"mirror_x\": false,\n    \"zoom_level\": 1.2\n  }\n}",
    "verification": "Future Outlook",
    "date": "2026-06-08",
    "id": 1780886568,
    "type": "trend"
});