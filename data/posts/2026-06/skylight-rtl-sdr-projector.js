window.onPostDataLoaded({
    "title": "Real-Time Sky Projection with Skylight",
    "slug": "skylight-rtl-sdr-projector",
    "language": "TypeScript",
    "code": "Trend",
    "tags": [
        "Tech Trend",
        "GitHub",
        "TypeScript"
    ],
    "analysis": "<p>The trending repository <code>cpaczek/skylight</code> is popular because it bridges digital interface design with local physical environments. By connecting an RTL-SDR receiver to decode 1090 MHz ADS-B aircraft signals, Skylight transforms a projector aimed at your ceiling into a live sky dome. It goes beyond generic aircraft maps to deliver a functional ambient screen, rendering overhead aircraft, spatial trajectories, constellation structures, lunar phases, and satellite tracking directly inside your room.</p>",
    "root_cause": "Key Features & Innovations:\n1. Direct ADS-B Processing: Interfaces with dump1090/readsb to decode overhead aircraft parameters locally without external APIs.\n2. Spherical Projection Math: Converts GPS and altitude coordinates to custom hemispherical project points calibrated to your location.\n3. Layered Astrodynamics: Displays exact positions of the ISS, celestial bodies, and stars synchronized with real-world movements.",
    "bad_code": "# Installation and setup process\nsudo apt update && sudo apt install -y dump1090-fa\n\n# Clone skylight visualization software\ngit clone https://github.com/cpaczek/skylight.git\ncd skylight\n\n# Install project dependencies and start server\nnpm install\nnpm run dev",
    "solution_desc": "Skylight is an excellent choice for DIY hardware hackers, aviation hobbyists, and smart-home designers. It works best deployed on a Raspberry Pi combined with a cheap RTL-SDR dongle and an ultra-short-throw projector. It offers a unique visual alternative to typical dashboards by creating an educational, relaxing overhead display.",
    "good_code": "// Custom stereographic projection logic used to map planes relative to user\ninterface Aircraft {\n  icao: string;\n  lat: number;\n  lon: number;\n  alt: number;\n}\n\nfunction calculateCeilingCoordinates(plane: Aircraft, homeLat: number, homeLon: number, domeRadius: number) {\n  const earthRadius = 6371000; // meters\n  const dLat = (plane.lat - homeLat) * (Math.PI / 180);\n  const dLon = (plane.lon - homeLon) * (Math.PI / 180);\n\n  const x = dLon * Math.cos(homeLat * (Math.PI / 180)) * earthRadius;\n  const y = dLat * earthRadius;\n  const distance = Math.sqrt(x * x + y * y);\n\n  // project points down based on elevation angle mapping to ceiling dome\n  const elevationAngle = Math.atan2(plane.alt * 0.3048, distance);\n  const r = domeRadius * (Math.PI / 2 - elevationAngle) / (Math.PI / 2);\n  const angle = Math.atan2(y, x);\n\n  return {\n    projX: domeRadius + r * Math.cos(angle),\n    projY: domeRadius - r * Math.sin(angle)\n  };\n}",
    "verification": "The project is growing quickly, with plans to support direct open-source ADS-B decoders, customized projection mapping interfaces, and third-party smart home system integrations.",
    "date": "2026-06-08",
    "id": 1780923576,
    "type": "trend"
});