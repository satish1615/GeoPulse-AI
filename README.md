# GeoPulse AI

**An interactive environmental scenario and geospatial decision dashboard.**

GeoPulse AI demonstrates how three adjustable planning assumptions influence a transparent risk index at eight geographic sites in India. Built for the **Google AI Skills Studio: Build an Interactive Data Visualization** mission.

## Live demo

Once GitHub Pages is enabled on the `main` branch root, visit:

**https://satish1615.github.io/GeoPulse-AI/**

## Features

- Instant updates from three mission-aligned controls: temperature increase (0–4°C), extreme rainfall change (−30% to +60%), and urban tree canopy coverage (0–40%).
- Interactive SVG geographic visualization, with simplified Natural Earth country outlines and real geographic coordinates for eight cities.
- Combined, heat, and flood risk layers. Select cities to inspect indices, or switch between baseline, heatwave, heavy rain, and greener-city presets.
- Live risk summary cards, ranked comparison bars, and reference markers for the baseline scenario.
- Export QGIS-ready **GeoJSON Point FeatureCollection** (`EPSG:4326`) containing values and assumptions, or a CSV for analysis.
- Import your own GeoJSON Point/Polygon/MultiPolygon FeatureCollection as an optional geographic overlay.
- Zero runtime third-party JavaScript dependencies. Mobile responsive, accessible range controls and interactive markers.
- Automated unit tests for numerical behavior, boundary inputs, and the export format.

## Start locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Run tests using Node.js 22+:

```bash
npm test
```

## QGIS workflow

1. Move the sliders to configure your scenario; click **Export GeoJSON**.
2. Open QGIS and choose **Layer > Add Layer > Add Vector Layer**.
3. Browse to `geopulse-scenario.geojson`. Coordinates use longitude/latitude (`EPSG:4326`, WGS84).
4. Open Layer Properties > Symbology > Graduated, set field `risk_index`, select a sequential ramp and classify.
5. Inspect the attributes `heat_index`, `flood_index`, `change_points`, and input scenario settings. Create buffer zones or join to your own administrative boundary layers using QGIS's processing toolbox.
6. To visualize custom geographic boundaries in GeoPulse, export your WGS84 point/polygon layer as GeoJSON and use **Import GeoJSON overlay**. The upload is processed locally in your browser and is not sent to a server.

## Decision model and assumptions

This is an **illustrative model, not a real-world climate risk assessment**. City points use approximate real WGS84 geographic coordinates. The baseline heat and flood exposure indices (0–100) are **synthetic demonstration values** for experimenting with variable tradeoffs. Coefficients are hypothetical and not calibrated to satellite imagery, local climate observations, hydrology or epidemiology.

```text
Heat index  = clamp(baseHeat  + 12.00 × warming °C − 0.60 × canopy %, 0, 100)
Flood index = clamp(baseFlood +  0.55 × rainfall % − 0.18 × canopy %, 0, 100)
Combined    = 0.55 × heat index + 0.45 × flood index
```

Risk classes: lower (<45), moderate (45–69.9), high (≥70). Reference baseline: warming 0°C, rainfall change 0%, tree canopy 10%. Input controls cover all relevant min/max values and test presets are deterministic.

**Interpretation:** Increasing temperature increases heat risk; increasing rainfall increases flood risk; increasing canopy decreases modeled heat/flood pressure. These are deliberately simplified monotonic relationships for decision modeling, not predictive relationships.

## Data and map attribution

- Geographic context: simplified Natural Earth (1:110m) low-resolution country polygons, public domain: https://www.naturalearthdata.com/about/terms-of-use/
- City coordinates: public geographic reference positions (approximate city centers).
- Baseline exposure variables: synthetic values, documented in `src/model.js`.
- No actual NDVI, satellite imagery, climate grids, observed measurements, QGIS plugin, or forecast API is included. Remote sensing integration is a future extension, not a shipped claim.
- Country boundaries are schematic and should not be used as authoritative political boundaries.

## License

MIT, see [LICENSE](LICENSE).
