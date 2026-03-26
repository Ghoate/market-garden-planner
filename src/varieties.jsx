import React, { useState } from "react";
import { COLORS, STAGE, SOW_METHODS as _SOW_METHODS, tagColor, TAG_PALETTE } from "./constants.js";
import { calcSowWindow, sowRisk, calcMilestones, gddSowFromHarvest, addDays, WHIDBEY_CLIMATE } from "./market-garden-planner.jsx";


export { _SOW_METHODS as SOW_METHODS };

export var defaultVarieties = [
  { id:4, fieldHoldWeeks:0, fieldHoldHarvests:1, name:"Astro Arugula (Baby)", cropType:"Greens", daysToGermination:5, daysToMaturity:21, transplantLeadWeeks:0, harvestWindowWeeks:1, bedPrepWeeks:2, grownOnPlastic:false, sowMethod:"Direct", gddBase:40, gddToMaturity:299, frostHardy:true, requiredTag:"", harvestType:"cutAndComeAgain", cuts:2, regrowthWeeks:1, yieldPer25ft:20, unitWeight:0.25, pricePerUnit:2.5, seedsPerFoot:20, rowSpacingIn:4, rowsPerBed:9, seeder:"Jang YYJ24 -- gears 14F/9R, brush down", bedPrepTask:"Stale seedbed 21d, flame weed at cotyledon", planningBufferDays:3, harvestNotes:"Cut 1\" above soil. Wash gently max 4 min. 0.25lb per bag. Sell within 3 days.", trayType:"", seedsPerCell:"", germTempMin:40, germTempIdeal:55, germTempMax:75 },
  { id:5, fieldHoldWeeks:0, fieldHoldHarvests:1, name:"Allstar Gourmet Lettuce Mix (Baby)", cropType:"Lettuce", daysToGermination:6, daysToMaturity:28, transplantLeadWeeks:0, harvestWindowWeeks:1, bedPrepWeeks:2, grownOnPlastic:false, sowMethod:"Direct", gddBase:40, gddToMaturity:400, frostHardy:true, requiredTag:"", harvestType:"cutAndComeAgain", cuts:2, regrowthWeeks:2, yieldPer25ft:40, unitWeight:0.25, pricePerUnit:3.0, seedsPerFoot:24, rowSpacingIn:4, rowsPerBed:9, seeder:"Jang YYJ24 -- gears 14F/9R, brush down", bedPrepTask:"Stale seedbed 21d, flame weed at cotyledon", planningBufferDays:3, harvestNotes:"Cut 1\" above soil. Wash gently max 3 min. 0.25lb per bag. Sell within 4 days.", trayType:"", seedsPerCell:"", germTempMin:40, germTempIdeal:55, germTempMax:75 },
    { id:7, fieldHoldWeeks:1, fieldHoldHarvests:1, name:"Salanova Premier (Baby Leaf)", cropType:"Lettuce", daysToGermination:5, daysToMaturity:55, transplantLeadWeeks:3, harvestWindowWeeks:1, bedPrepWeeks:1, grownOnPlastic:false, sowMethod:"Transplant", gddBase:40, gddToMaturity:550, frostHardy:true, requiredTag:"", harvestType:"cutAndComeAgain", cuts:2, regrowthWeeks:3, yieldPer25ft:35, unitWeight:0.5, pricePerUnit:4.0, seedsPerFoot:0, rowSpacingIn:10, rowsPerBed:3, seeder:"", bedPrepTask:"Transplant 10in apart in 3 rows", planningBufferDays:5, harvestNotes:"Single base cut, leaves fall into bag. Rinse gently. 0.5lb per bag. 14-day shelf life.", trayType:"128-cell", seedsPerCell:"1", germTempMin:40, germTempIdeal:60, germTempMax:70 },
  { id:8, fieldHoldWeeks:2, fieldHoldHarvests:2, name:"Salanova Premier (Head)", cropType:"Lettuce", daysToGermination:5, daysToMaturity:55, transplantLeadWeeks:3, harvestWindowWeeks:1, bedPrepWeeks:1, grownOnPlastic:false, sowMethod:"Transplant", gddBase:40, gddToMaturity:550, frostHardy:true, requiredTag:"", harvestType:"whole", cuts:1, regrowthWeeks:0, yieldPer25ft:35, unitWeight:0.5, pricePerUnit:4.0, seedsPerFoot:0, rowSpacingIn:10, rowsPerBed:3, seeder:"", bedPrepTask:"Transplant 10in apart in 3 rows", planningBufferDays:5, harvestNotes:"Cut at base, whole head. Rinse gently. 14-day shelf life.", trayType:"128-cell", seedsPerCell:"1", germTempMin:40, germTempIdeal:60, germTempMax:70 },
  { id:6, fieldHoldWeeks:0, fieldHoldHarvests:1, name:"Supersweet 100 Cherry Tomato", cropType:"Tomato", daysToGermination:6, daysToMaturity:65, transplantLeadWeeks:6, harvestWindowWeeks:0, bedPrepWeeks:1, grownOnPlastic:true, sowMethod:"Transplant", gddBase:50, gddToMaturity:1150, frostHardy:false, requiredTag:"", harvestType:"whole", cuts:1, regrowthWeeks:0, yieldPer25ft:30, unitWeight:1, pricePerUnit:5.0, seedsPerFoot:0, rowSpacingIn:24, rowsPerBed:1, seeder:"", bedPrepTask:"Plastic mulch, drip tape, stake or string trellis", planningBufferDays:7, harvestNotes:"Pick clusters 80% red. Handle gently. Store 55-60F. Sell within 5 days.", trayType:"50-cell", seedsPerCell:"1", germTempMin:60, germTempIdeal:75, germTempMax:85 },
];

export var EMPTY_VARIETY={fieldHoldWeeks:0,fieldHoldHarvests:1,name:"",cropType:"",daysToGermination:"",daysToMaturity:"",transplantLeadWeeks:"",harvestWindowWeeks:"",bedPrepWeeks:0,grownOnPlastic:false,sowMethod:"Direct",gddBase:40,gddToMaturity:"",frostHardy:false,requiredTag:"",harvestType:"whole",cuts:1,regrowthWeeks:0,yieldPer25ft:"",unitWeight:"",pricePerUnit:"",seedsPerFoot:"",rowSpacingIn:"",rowsPerBed:"",seeder:"",bedPrepTask:"",planningBufferDays:3,harvestNotes:"",trayType:"",seedsPerCell:"",germTempMin:"",germTempIdeal:"",germTempMax:""};;

var inp={background:COLORS.bark,border:"1px solid "+COLORS.clay,borderRadius:4,color:COLORS.cream,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"5px 8px",outline:"none",width:"100%",boxSizing:"border-box"};

function F(props){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:11,fontFamily:"'DM Mono', monospace",color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>{props.label}</label>
      {props.children}
    </div>
  );
}

export function TagPill({ tag, onRemove }) {
  var tc = tagColor(tag);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:tc.bg, border:`1px solid ${tc.border}`, borderRadius:10, padding:"2px 8px", fontFamily:"'DM Mono', monospace", fontSize:10, color:tc.label }}>
      {tag}
      {onRemove && <button onClick={onRemove} style={{ background:"none", border:"none", color:tc.label, cursor:"pointer", fontSize:11, padding:0, lineHeight:1, opacity:0.7 }}>x</button>}
    </span>
  );
}

var defaultVarieties = [
  { id:4, fieldHoldWeeks:0, fieldHoldHarvests:1, name:"Astro Arugula (Baby)", cropType:"Greens", daysToGermination:5, daysToMaturity:21, transplantLeadWeeks:0, harvestWindowWeeks:1, bedPrepWeeks:2, grownOnPlastic:false, sowMethod:"Direct", gddBase:40, gddToMaturity:299, frostHardy:true, requiredTag:"", harvestType:"cutAndComeAgain", cuts:2, regrowthWeeks:1, yieldPer25ft:20, unitWeight:0.25, pricePerUnit:2.5, seedsPerFoot:20, rowSpacingIn:4, rowsPerBed:9, seeder:"Jang YYJ24 -- gears 14F/9R, brush down", bedPrepTask:"Stale seedbed 21d, flame weed at cotyledon", planningBufferDays:3, harvestNotes:"Cut 1\" above soil. Wash gently max 4 min. 0.25lb per bag. Sell within 3 days.", trayType:"", seedsPerCell:"", germTempMin:40, germTempIdeal:55, germTempMax:75 },
  { id:5, fieldHoldWeeks:0, fieldHoldHarvests:1, name:"Allstar Gourmet Lettuce Mix (Baby)", cropType:"Lettuce", daysToGermination:6, daysToMaturity:28, transplantLeadWeeks:0, harvestWindowWeeks:1, bedPrepWeeks:2, grownOnPlastic:false, sowMethod:"Direct", gddBase:40, gddToMaturity:400, frostHardy:true, requiredTag:"", harvestType:"cutAndComeAgain", cuts:2, regrowthWeeks:2, yieldPer25ft:40, unitWeight:0.25, pricePerUnit:3.0, seedsPerFoot:24, rowSpacingIn:4, rowsPerBed:9, seeder:"Jang YYJ24 -- gears 14F/9R, brush down", bedPrepTask:"Stale seedbed 21d, flame weed at cotyledon", planningBufferDays:3, harvestNotes:"Cut 1\" above soil. Wash gently max 3 min. 0.25lb per bag. Sell within 4 days.", trayType:"", seedsPerCell:"", germTempMin:40, germTempIdeal:55, germTempMax:75 },
    { id:7, fieldHoldWeeks:1, fieldHoldHarvests:1, name:"Salanova Premier (Baby Leaf)", cropType:"Lettuce", daysToGermination:5, daysToMaturity:55, transplantLeadWeeks:3, harvestWindowWeeks:1, bedPrepWeeks:1, grownOnPlastic:false, sowMethod:"Transplant", gddBase:40, gddToMaturity:550, frostHardy:true, requiredTag:"", harvestType:"cutAndComeAgain", cuts:2, regrowthWeeks:3, yieldPer25ft:35, unitWeight:0.5, pricePerUnit:4.0, seedsPerFoot:0, rowSpacingIn:10, rowsPerBed:3, seeder:"", bedPrepTask:"Transplant 10in apart in 3 rows", planningBufferDays:5, harvestNotes:"Single base cut, leaves fall into bag. Rinse gently. 0.5lb per bag. 14-day shelf life.", trayType:"128-cell", seedsPerCell:"1", germTempMin:40, germTempIdeal:60, germTempMax:70 },
  { id:8, fieldHoldWeeks:2, fieldHoldHarvests:2, name:"Salanova Premier (Head)", cropType:"Lettuce", daysToGermination:5, daysToMaturity:55, transplantLeadWeeks:3, harvestWindowWeeks:1, bedPrepWeeks:1, grownOnPlastic:false, sowMethod:"Transplant", gddBase:40, gddToMaturity:550, frostHardy:true, requiredTag:"", harvestType:"whole", cuts:1, regrowthWeeks:0, yieldPer25ft:35, unitWeight:0.5, pricePerUnit:4.0, seedsPerFoot:0, rowSpacingIn:10, rowsPerBed:3, seeder:"", bedPrepTask:"Transplant 10in apart in 3 rows", planningBufferDays:5, harvestNotes:"Cut at base, whole head. Rinse gently. 14-day shelf life.", trayType:"128-cell", seedsPerCell:"1", germTempMin:40, germTempIdeal:60, germTempMax:70 },
  { id:6, fieldHoldWeeks:0, fieldHoldHarvests:1, name:"Supersweet 100 Cherry Tomato", cropType:"Tomato", daysToGermination:6, daysToMaturity:65, transplantLeadWeeks:6, harvestWindowWeeks:0, bedPrepWeeks:1, grownOnPlastic:true, sowMethod:"Transplant", gddBase:50, gddToMaturity:1150, frostHardy:false, requiredTag:"", harvestType:"whole", cuts:1, regrowthWeeks:0, yieldPer25ft:30, unitWeight:1, pricePerUnit:5.0, seedsPerFoot:0, rowSpacingIn:24, rowsPerBed:1, seeder:"", bedPrepTask:"Plastic mulch, drip tape, stake or string trellis", planningBufferDays:7, harvestNotes:"Pick clusters 80% red. Handle gently. Store 55-60F. Sell within 5 days.", trayType:"50-cell", seedsPerCell:"1", germTempMin:60, germTempIdeal:75, germTempMax:85 },
];



// Day length in hours for a given date at 48N (Whidbey)
export
function VarietiesView(props) {
  var varieties = props.varieties;
  var setVarieties = props.setVarieties;
  var [editing, setEditing] = useState(null);
  var [form, setForm] = useState({});
  var [showForm, setShowForm] = useState(false);

  var EMPTY = {name:"",cropType:"",daysToGermination:"",daysToMaturity:"",transplantLeadWeeks:"",harvestWindowWeeks:"",bedPrepWeeks:0,grownOnPlastic:false,sowMethod:"Direct",gddBase:40,gddToMaturity:"",frostHardy:false,requiredTag:"",harvestType:"whole",cuts:1,regrowthWeeks:0,yieldPer25ft:"",unitWeight:"",pricePerUnit:"",seedsPerFoot:"",rowSpacingIn:"",rowsPerBed:"",seeder:"",bedPrepTask:"",planningBufferDays:3,harvestNotes:"",trayType:"",seedsPerCell:"",germTempMin:"",germTempIdeal:"",germTempMax:""};

  function openNew(){setEditing(null);setForm(Object.assign({},EMPTY));setShowForm(true);}
  function openEdit(v){setEditing(v.id);setForm(Object.assign({},v));setShowForm(true);}
  function save(){
    if(!form.name) return;
    if(editing){
      setVarieties(varieties.map(function(v){return v.id===editing?Object.assign({},v,form):v;}));
    } else {
      setVarieties(varieties.concat([Object.assign({},form,{id:generateId(varieties)})]));
    }
    setShowForm(false);
  }
  function remove(id){setVarieties(varieties.filter(function(v){return v.id!==id;}));}

  var fmtDate=function(d){return d?d.toLocaleDateString("en-CA",{month:"long",day:"numeric"}):"unknown";};
  var calcWin=(showForm&&form.gddToMaturity&&form.gddBase)?calcSowWindow(form,new Date().getFullYear(),null):{earliest:null,latest:null,springLatest:null,fallEarliest:null};
  var showCalc=!!(calcWin.earliest||calcWin.latest);
  // Calculate predicted harvest dates for each sow date
  function predictHarvest(sowDate){
    if(!sowDate||!form.gddToMaturity||!form.gddBase) return null;
    var dtm = +form.daysToMaturity||21;
    var acc=0;var days=0;
    var cur=new Date(sowDate);
    while(acc<form.gddToMaturity&&days<180){
      var dl=dayLengthHours(cur);
      var gdd=dailyGDD(cur,form.gddBase||40);
      acc+=gdd*(Math.min(dl,PTU_OPT_HOURS)/PTU_OPT_HOURS);
      days++;
      cur.setDate(cur.getDate()+1);
    }
    if(days>=180) return null;
    // Enforce DTM floor
    var actualDays=Math.max(days,dtm);
    var h=new Date(sowDate);
    h.setDate(h.getDate()+actualDays);
    return h;
  }
  var springHarvest=predictHarvest(calcWin.earliest);
  var fallHarvest=predictHarvest(calcWin.latest);
  var springRisk=calcWin.earliest?sowRisk(calcWin.earliest.toISOString().slice(0,10),springHarvest?Math.round((springHarvest-calcWin.earliest)/86400000):60):null;
  var fallRisk=calcWin.latest?sowRisk(calcWin.latest.toISOString().slice(0,10),fallHarvest?Math.round((fallHarvest-calcWin.latest)/86400000):40):null;
  var springDTM=springHarvest&&calcWin.earliest?Math.round((springHarvest-calcWin.earliest)/86400000):null;
  var fallDTM=fallHarvest&&calcWin.latest?Math.round((fallHarvest-calcWin.latest)/86400000):null;


  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Varieties</h2>
        <button onClick={openNew} style={{background:COLORS.leaf,border:"none",borderRadius:6,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"8px 18px",cursor:"pointer"}}>+ ADD VARIETY</button>
      </div>
      {showForm && (
        <div style={{background:COLORS.bark,borderRadius:10,padding:20,marginBottom:20,border:"1px solid "+COLORS.clay}}>
          <h3 style={{margin:"0 0 16px",fontFamily:"'Inter', sans-serif",color:COLORS.straw,fontSize:16,fontWeight:600}}>{editing?"Edit":"New"} Variety</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
            <F label="Name"><input style={inp} value={form.name||""} onChange={function(e){setForm(Object.assign({},form,{name:e.target.value}));}} placeholder="e.g. Astro Arugula"/></F>
            <F label="Crop Type"><input style={inp} value={form.cropType||""} onChange={function(e){setForm(Object.assign({},form,{cropType:e.target.value}));}} placeholder="Greens"/></F>
            <F label="Sow Method">
              <select style={inp} value={form.sowMethod||"Direct"} onChange={function(e){setForm(Object.assign({},form,{sowMethod:e.target.value}));}}>
                <option>Direct</option><option>Transplant</option><option>Either</option>
              </select>
            </F>
            <F label="Days to Maturity"><input style={inp} type="number" value={form.daysToMaturity||""} onChange={function(e){setForm(Object.assign({},form,{daysToMaturity:+e.target.value}));}}/></F>
            <F label="PTU Target"><input style={inp} type="number" value={form.gddToMaturity||""} onChange={function(e){setForm(Object.assign({},form,{gddToMaturity:+e.target.value}));}} placeholder="299"/></F>
            <F label="GDD Base"><input style={inp} type="number" value={form.gddBase||40} onChange={function(e){setForm(Object.assign({},form,{gddBase:+e.target.value}));}}/></F>
            <F label="Bed Prep (weeks)"><input style={inp} type="number" value={form.bedPrepWeeks||0} onChange={function(e){setForm(Object.assign({},form,{bedPrepWeeks:+e.target.value}));}}/></F>
            <F label="Harvest Window (weeks)"><input style={inp} type="number" value={form.harvestWindowWeeks||""} onChange={function(e){setForm(Object.assign({},form,{harvestWindowWeeks:+e.target.value}));}}/></F>
            <F label="Field Hold (weeks)"><input style={inp} type="number" value={form.fieldHoldWeeks||0} onChange={function(e){setForm(Object.assign({},form,{fieldHoldWeeks:+e.target.value}));}} placeholder="0"/></F>
            <F label="Field Hold Harvests"><input style={inp} type="number" value={form.fieldHoldHarvests||1} onChange={function(e){setForm(Object.assign({},form,{fieldHoldHarvests:+e.target.value}));}} placeholder="1"/></F>
            <F label="Harvest Type">
              <select style={inp} value={form.harvestType||"whole"} onChange={function(e){setForm(Object.assign({},form,{harvestType:e.target.value}));}}>
                <option value="whole">Whole</option><option value="cutAndComeAgain">Cut and Come Again</option>
              </select>
            </F>
            <F label="Cuts"><input style={inp} type="number" value={form.cuts||1} onChange={function(e){setForm(Object.assign({},form,{cuts:+e.target.value}));}}/></F>
            <F label="Regrowth (weeks)"><input style={inp} type="number" value={form.regrowthWeeks||0} onChange={function(e){setForm(Object.assign({},form,{regrowthWeeks:+e.target.value}));}}/></F>
            <F label="Yield per 25ft (lbs)"><input style={inp} type="number" value={form.yieldPer25ft||""} onChange={function(e){setForm(Object.assign({},form,{yieldPer25ft:+e.target.value}));}}/></F>
            <F label="Unit Weight (lbs)"><input style={inp} type="number" value={form.unitWeight||""} onChange={function(e){setForm(Object.assign({},form,{unitWeight:+e.target.value}));}}/></F>
            <F label="Price per Unit ($)"><input style={inp} type="number" value={form.pricePerUnit||""} onChange={function(e){setForm(Object.assign({},form,{pricePerUnit:+e.target.value}));}}/></F>
            <F label="Required Tag"><input style={inp} value={form.requiredTag||""} onChange={function(e){setForm(Object.assign({},form,{requiredTag:e.target.value}));}} placeholder="e.g. wf, gh"/></F>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <F label="Seeder Notes"><input style={inp} value={form.seeder||""} onChange={function(e){setForm(Object.assign({},form,{seeder:e.target.value}));}}/></F>
            <F label="Bed Prep Task"><input style={inp} value={form.bedPrepTask||""} onChange={function(e){setForm(Object.assign({},form,{bedPrepTask:e.target.value}));}}/></F>
            <F label="Planning Buffer (days)"><input style={inp} type="number" value={form.planningBufferDays||3} onChange={function(e){setForm(Object.assign({},form,{planningBufferDays:+e.target.value}));}}/></F>
            <F label="Harvest Notes"><input style={inp} value={form.harvestNotes||""} onChange={function(e){setForm(Object.assign({},form,{harvestNotes:e.target.value}));}}/></F>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:COLORS.leaf,border:"none",borderRadius:6,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"8px 20px",cursor:"pointer"}}>SAVE</button>
            <button onClick={function(){setShowForm(false);}} style={{background:"transparent",border:"1px solid "+COLORS.clay,borderRadius:6,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"8px 20px",cursor:"pointer"}}>CANCEL</button>
          </div>
          {showCalc&&(
            <div style={{marginTop:16,padding:14,background:COLORS.soil,borderRadius:8,border:"1px solid "+COLORS.clay+"30"}}>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Predicted Sow Windows (single harvest, no row cover)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{padding:10,background:COLORS.bark,borderRadius:6,border:"1px solid "+COLORS.leaf+"30"}}>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.leaf,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Spring</div>
                  <div style={{marginBottom:6}}>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted}}>Earliest sow</div>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.cream,fontWeight:500}}>{fmtDate(calcWin.earliest)}</div>
                  </div>
                  <div style={{marginBottom:6}}>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted}}>Predicted harvest</div>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.harvestLight,fontWeight:500}}>{fmtDate(springHarvest)}</div>
                  </div>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:9,color:COLORS.muted,marginTop:4,fontStyle:"italic"}}>{springDTM}d in bed · First date soil hits germ min (40°F)</div>
                </div>
                <div style={{padding:10,background:COLORS.bark,borderRadius:6,border:"1px solid "+COLORS.frost+"30"}}>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.frost,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Fall</div>
                  <div style={{marginBottom:6}}>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted}}>Latest sow</div>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.cream,fontWeight:500}}>{fmtDate(calcWin.latest)}</div>
                  </div>
                  <div style={{marginBottom:6}}>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted}}>Predicted harvest</div>
                    <div style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.harvestLight,fontWeight:500}}>{fmtDate(fallHarvest)}</div>
                  </div>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:9,color:COLORS.muted,marginTop:4,fontStyle:"italic"}}>{fallDTM}d in bed · Last date before day length drops below 10h</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {varieties.map(function(v){
          var curYear=new Date().getFullYear();
          var win=calcSowWindow(v,curYear,null);
          var fmtD=function(d){return d?d.toLocaleDateString("en-CA",{month:"short",day:"numeric"}):"?";};
          var sowLabel=win.earliest||win.latest?("sow "+fmtD(win.earliest)+" - "+fmtD(win.latest)):null;
          return (
            <div key={v.id} style={{background:COLORS.bark,borderRadius:8,padding:"14px 16px",border:"1px solid "+COLORS.clay+"30",cursor:"pointer"}} onClick={function(){openEdit(v);}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:16,fontWeight:500}}>{v.name}</span>
                  {v.cropType&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>{v.cropType}</span>}
                  {v.requiredTag&&<TagPill tag={v.requiredTag}/>}
                  <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.sprout}}>{v.daysToMaturity}d DTM</span>
                  {v.bedPrepWeeks>0&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.harvest}}>{v.bedPrepWeeks}w prep</span>}
                  {v.pricePerUnit&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.harvestLight}}>${v.pricePerUnit}/{v.unitWeight||1}lb</span>}
                  {sowLabel&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.frost,background:COLORS.opportunity,border:"1px solid "+COLORS.frost+"40",borderRadius:4,padding:"1px 6px"}}>{sowLabel}</span>}
                </div>
                <button onClick={function(e){e.stopPropagation();remove(v.id);}} style={{background:"transparent",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:16,padding:"0 4px"}}>x</button>
              </div>
            </div>
          );
        })}
        {varieties.length===0&&<div style={{textAlign:"center",padding:40,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:14}}>No varieties yet. Click + ADD VARIETY.</div>}
      </div>
    </div>
  );
}

