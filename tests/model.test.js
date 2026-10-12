import test from 'node:test';
import assert from 'node:assert/strict';
import {SITES,BASELINE,PRESETS,clamp,calculateScenario,calculateSite,asGeoJSON,asCSV,parseGeoJSON} from '../src/model.js';

test('baseline is deterministic and unchanged by repeated calculations',()=>{
  const a=calculateScenario(BASELINE),b=calculateScenario(BASELINE);
  assert.deepEqual(a,b);assert.equal(a.biggestShift,0);assert.equal(a.sites.length,8);
});
test('hotter scenario cannot reduce heat index',()=>{
  for(const city of SITES){assert.ok(calculateSite(city,{...BASELINE,temperature:4}).heat>=calculateSite(city,BASELINE).heat);}
});
test('more intense rainfall cannot reduce flood index',()=>{
  for(const city of SITES){assert.ok(calculateSite(city,{...BASELINE,rainfall:60}).flood>=calculateSite(city,BASELINE).flood);}
});
test('more canopy cannot increase modelled risk',()=>{
  for(const city of SITES){assert.ok(calculateSite(city,{...BASELINE,canopy:40}).combined<=calculateSite(city,{...BASELINE,canopy:0}).combined);}
});
test('all presets and extreme controls remain in valid range',()=>{
  for(const inputs of Object.values(PRESETS).concat([{temperature:4,rainfall:60,canopy:0},{temperature:0,rainfall:-30,canopy:40}])){
    const scenario=calculateScenario(inputs);
    for(const s of scenario.sites){assert.ok(s.combined>=0&&s.combined<=100);}
  }
});
test('invalid inputs are rejected',()=>assert.throws(()=>calculateScenario({temperature:7,rainfall:0,canopy:10}),RangeError));
test('geojson export round-trips for QGIS',()=>{
  const exported=asGeoJSON(calculateScenario(PRESETS.cloudburst));
  assert.equal(exported.features.length,8);
  assert.deepEqual(parseGeoJSON(JSON.stringify(exported)),exported);
  assert.equal(exported.features[0].geometry.coordinates.length,2);
  assert.ok(Number.isFinite(exported.features[0].properties.risk_index));
});
test('CSV export contains proper columns and all features',()=>{
 const lines=asCSV(calculateScenario(BASELINE)).trim().split('\n');
 assert.equal(lines.length,9);assert.ok(lines[0].includes('risk_index'));
});
test('GeoJSON parser blocks unsupported geometries and oversized uploads',()=>{
 assert.throws(()=>parseGeoJSON('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":[]}}]}'));
 assert.throws(()=>parseGeoJSON('{"type":"FeatureCollection","features":['+Array(1001).fill('{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]}}').join(',')+']}'));
});

