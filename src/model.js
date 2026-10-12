/** GeoPulse AI: transparent illustrative scenario model, NOT a climate forecast. */
export const SITES = Object.freeze([
  {id:'delhi', name:'New Delhi', region:'North India', lat:28.6139, lon:77.2090, baseHeat:62, baseFlood:39, populationM:33.8},
  {id:'mumbai', name:'Mumbai', region:'West Coast', lat:19.0760, lon:72.8777, baseHeat:55, baseFlood:73, populationM:21.9},
  {id:'bengaluru', name:'Bengaluru', region:'South India', lat:12.9716, lon:77.5946, baseHeat:43, baseFlood:47, populationM:14.0},
  {id:'chennai', name:'Chennai', region:'East Coast', lat:13.0827, lon:80.2707, baseHeat:59, baseFlood:69, populationM:11.5},
  {id:'kolkata', name:'Kolkata', region:'Eastern India', lat:22.5726, lon:88.3639, baseHeat:60, baseFlood:76, populationM:15.6},
  {id:'hyderabad', name:'Hyderabad', region:'Deccan Plateau', lat:17.3850, lon:78.4867, baseHeat:49, baseFlood:51, populationM:11.1},
  {id:'ahmedabad', name:'Ahmedabad', region:'Western India', lat:23.0225, lon:72.5714, baseHeat:65, baseFlood:32, populationM:8.7},
  {id:'jaipur', name:'Jaipur', region:'Northwest India', lat:26.9124, lon:75.7873, baseHeat:61, baseFlood:29, populationM:4.3},
]);

export const BASELINE = Object.freeze({temperature:0, rainfall:0, canopy:10});
export const PRESETS = Object.freeze({
  baseline:{...BASELINE},
  heatwave:{temperature:2.5,rainfall:-15,canopy:8},
  cloudburst:{temperature:1,rainfall:45,canopy:12},
  resilience:{temperature:1,rainfall:20,canopy:35},
});

export function clamp(n,min=0,max=100){return Math.max(min, Math.min(max,n));}
export function validateInputs({temperature,rainfall,canopy}){
  if(!Number.isFinite(temperature)||temperature<0||temperature>4)throw new RangeError('Temperature must be 0 to 4°C');
  if(!Number.isFinite(rainfall)||rainfall< -30||rainfall>60)throw new RangeError('Rainfall must be −30% to +60%');
  if(!Number.isFinite(canopy)||canopy<0||canopy>40)throw new RangeError('Canopy must be 0% to 40%');
}
export function calculateSite(site,inputs){
  validateInputs(inputs);
  // Coefficients are user-facing assumptions, not fitted observational data.
  const heat = clamp(site.baseHeat + 12*inputs.temperature - .60*inputs.canopy);
  const flood = clamp(site.baseFlood + .55*inputs.rainfall - .18*inputs.canopy);
  const combined = clamp(.55*heat + .45*flood);
  return {...site, heat:+heat.toFixed(1), flood:+flood.toFixed(1), combined:+combined.toFixed(1)};
}
export function calculateScenario(inputs,sites=SITES){
  validateInputs(inputs);
  const scores=sites.map(s=>calculateSite(s,inputs));
  const baseline=sites.map(s=>calculateSite(s,BASELINE));
  const baselineMap=Object.fromEntries(baseline.map(s=>[s.id,s]));
  const enriched=scores.map(s=>({...s,baseline:baselineMap[s.id]?.combined??s.combined,delta:+(s.combined-(baselineMap[s.id]?.combined??s.combined)).toFixed(1)}));
  const mean=(array,key)=>array.reduce((sum,s)=>sum+s[key],0)/(array.length||1);
  return {
    sites:enriched.sort((a,b)=>b.combined-a.combined),
    mean:+mean(scores,'combined').toFixed(1),
    baselineMean:+mean(baseline,'combined').toFixed(1),
    highRisk:scores.filter(s=>s.combined>=70).length,
    critical:scores.filter(s=>s.combined>=85).length,
    meanHeat:+mean(scores,'heat').toFixed(1),
    meanFlood:+mean(scores,'flood').toFixed(1),
    biggestShift:+(mean(scores,'combined')-mean(baseline,'combined')).toFixed(1),
    inputs:{...inputs}
  };
}
export function riskLabel(score){return score>=70?'High':score>=45?'Moderate':'Lower';}
export function csvEscape(v){return '"'+String(v).replaceAll('"','""')+'"';}
export function asCSV(scenario){
  const columns=['site','latitude','longitude','base_heat','base_flood','heat_index','flood_index','risk_index','baseline_index','change_points'];
  const rows=scenario.sites.map(s=>[s.name,s.lat,s.lon,s.baseHeat,s.baseFlood,s.heat,s.flood,s.combined,s.baseline,s.delta]);
  return [columns.join(','),...rows.map(r=>r.map(csvEscape).join(','))].join('\n')+'\n';
}
export function asGeoJSON(scenario){
  return {type:'FeatureCollection',name:'GeoPulse AI scenario sites',features:scenario.sites.map(s=>({
    type:'Feature',geometry:{type:'Point',coordinates:[s.lon,s.lat]},properties:{
      site_id:s.id,city:s.name,region:s.region,base_heat:s.baseHeat,base_flood:s.baseFlood,
      heat_index:s.heat,flood_index:s.flood,risk_index:s.combined,baseline_index:s.baseline,
      change_points:s.delta,risk_class:riskLabel(s.combined),
      temp_delta_c:scenario.inputs.temperature,rainfall_change_pct:scenario.inputs.rainfall,
      canopy_pct:scenario.inputs.canopy,model:'illustrative scenario assumptions, not measured or forecast climate risk'
    }
  }))};
}
export function parseGeoJSON(text){
  const data=JSON.parse(text);
  if(data?.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('Upload a GeoJSON FeatureCollection.');
  if(data.features.length>1000)throw new Error('Limit uploads to 1,000 features.');
  const allowed=['Point','Polygon','MultiPolygon'];
  for(const feature of data.features){
    if(feature?.type!=='Feature'||!allowed.includes(feature.geometry?.type))throw new Error('Supported geometries: Point, Polygon, MultiPolygon.');
  }
  return data;
}

