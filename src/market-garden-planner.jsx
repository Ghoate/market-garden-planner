import React, { useState, useRef, useEffect } from "react";
import { COLORS, STAGE, SOW_METHODS, TAG_PALETTE, tagColor } from "./constants.js";
import { EMPTY_VARIETY} from "./models/varieties.js";
import {dayLengthHours, dailyGDD, gddDaysToMaturity, gddSowFromHarvest, generateId, addDays, addWeeks, weekStartFromAnchor, weekStart, weeksForYear, calcMilestones, stageForWeek, cellLabel, isFrostRisk, packPlantings, buildBars, weekMeanTemp, tempToColor, modeledSoilTemp, sowRisk, calcSowWindow, MIN_DAY_HOURS, BOLT_DAY_HOURS, defaultBeds, defaultPlantings, F, inp } from "./engine.jsx";
import { CLIMATE, LAT_RAD, CONFIG, BEDS, defaultVarieties } from "./user-config.js";
import { TagPill } from "./components/TagPill.jsx";
import { VarietiesTab  } from "./tabs/VarietiesTab.jsx";

function CropPlannerView(props) {
  var varieties = props.varieties;
  var plantings = props.plantings;
  var setPlantings = props.setPlantings;
  var lastFrost = props.lastFrost;
  var assignments = props.assignments;
  var beds = props.beds;
  var [showForm, setShowForm] = useState(false);
  var [form, setForm] = useState({varietyId:"",harvestDate:""});

  function getV(id){return varieties.find(function(v){return v.id===id;});}
  function getBedLabel(pid){
    var asgn=assignments&&assignments[pid];
    if(!asgn) return null;
    var bed=beds&&beds.find(function(b){return b.id===asgn.bedId;});
    return bed?bed.name:null;
  }
  function togglePin(p){
    var asgn=assignments&&assignments[p.id];
    if(!asgn) return;
    if(p.pinnedBedId){
      setPlantings(plantings.map(function(x){return x.id===p.id?Object.assign({},x,{pinnedBedId:null}):x;}));
    } else {
      setPlantings(plantings.map(function(x){return x.id===p.id?Object.assign({},x,{pinnedBedId:asgn.bedId,pinnedStartFt:asgn.startFt}):x;}));
    }
  }
  function save(){
    if(!form.varietyId||!form.harvestDate) return;
    setPlantings(plantings.concat([Object.assign({},form,{id:generateId(plantings),varietyId:+form.varietyId})]));
    setShowForm(false);
  }
  var sorted=plantings.slice().sort(function(a,b){
    var vav=getV(a.varietyId);var vbv=getV(b.varietyId);
    var va=vav?vav.name:"";var vb=vbv?vbv.name:"";
    if(va!==vb) return va.localeCompare(vb);
    var ha=a.harvestDate||a.sowDate;var hb=b.harvestDate||b.sowDate;
    return ha<hb?-1:ha>hb?1:0;
  });
  var frostCount=plantings.filter(function(p){return isFrostRisk(p,getV(p.varietyId),lastFrost);}).length;
  function fmt(d){return d?d.toLocaleDateString("en-CA",{month:"short",day:"numeric"}):"--";}

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Crop Planner</h2>
        <button onClick={function(){setForm({varietyId:varieties[0]&&varieties[0].id||"",harvestDate:""});setShowForm(true);}} style={{background:COLORS.leaf,border:"none",borderRadius:6,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"8px 18px",cursor:"pointer"}}>+ ADD PLANTING</button>
      </div>
      {showForm&&(
        <div style={{background:COLORS.bark,borderRadius:10,padding:16,marginBottom:16,border:"1px solid "+COLORS.clay}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
            <F label="Variety">
              <select style={inp} value={form.varietyId} onChange={function(e){setForm(Object.assign({},form,{varietyId:e.target.value}));}}>
                {varieties.map(function(v){return <option key={v.id} value={v.id}>{v.name}</option>;})}
              </select>
            </F>
            <F label="Target Harvest Date">
              <input style={inp} type="date" value={form.harvestDate||""} onChange={function(e){setForm(Object.assign({},form,{harvestDate:e.target.value}));}}/>
            </F>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} style={{background:COLORS.leaf,border:"none",borderRadius:6,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"8px 20px",cursor:"pointer"}}>SAVE</button>
            <button onClick={function(){setShowForm(false);}} style={{background:"transparent",border:"1px solid "+COLORS.clay,borderRadius:6,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"8px 20px",cursor:"pointer"}}>CANCEL</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px 1fr 1fr auto",gap:8,padding:"8px 12px",fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:"1px solid "+COLORS.bark}}>
        <span>Variety</span><span>Harvest</span><span>Sow</span><span>Days</span><span>Closes</span><span>Bed</span><span></span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:4}}>
        {sorted.map(function(p,i){
          var v=getV(p.varietyId);
          var m=v?calcMilestones(p,v):null;
          var adj=m?m.adjustedDays:(v&&v.daysToMaturity)||0;
          var nom=m?m.nominalDays:(v&&v.daysToMaturity)||0;
          var delta=adj-nom;
          var risk=isFrostRisk(p,v,lastFrost);
          var prevP=i>0?sorted[i-1]:null;
          var showSep=i>0&&(v&&v.name||"")!==(prevP&&getV(prevP.varietyId)&&getV(prevP.varietyId).name||"");
          var bedLabel=getBedLabel(p.id);
          return (
            <div key={p.id}>
              {showSep&&<div style={{height:6}}/>}
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px 1fr 1fr auto",gap:8,padding:"9px 12px",background:risk?"#2A1008":COLORS.bark,borderRadius:6,alignItems:"center",border:risk?"1px solid "+COLORS.frostWarn+"40":"1px solid "+COLORS.clay+"15"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"'Inter', sans-serif",color:risk?"#FF9060":COLORS.cream,fontSize:16}}>{(v&&v.name)||"?"}</span>
                  {risk&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:10,fontWeight:700,color:COLORS.frostWarn,background:"#3A1A0A",border:"1px solid "+COLORS.frostWarn,padding:"1px 6px",borderRadius:4}}>FROST</span>}
                  {(v&&v.requiredTag)&&<TagPill tag={v.requiredTag}/>}
                </div>
                <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.harvestLight}}>{fmt(new Date((p.harvestDate||p.sowDate)+"T12:00:00"))}</span>
                <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:risk?"#FF9060":COLORS.sprout}}>{m?fmt(m.tpOutDate):"--"}</span>
                <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:delta>5?COLORS.harvestLight:COLORS.sprout}}>{adj}d{delta>0&&<span style={{fontSize:10,color:COLORS.harvestLight,marginLeft:3}}>+{delta}</span>}</span>
                <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.harvest}}>{m?fmt(m.harvestEnd):"--"}</span>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  {bedLabel?<span style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:p.pinnedBedId?COLORS.harvestLight:COLORS.sprout}}>{bedLabel}</span>:<span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>--</span>}
                  {bedLabel&&<button onClick={function(){togglePin(p);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,padding:"0 2px",color:p.pinnedBedId?COLORS.harvestLight:COLORS.muted}}>{p.pinnedBedId?"[L]":"[U]"}</button>}
                </div>
                <button onClick={function(){setPlantings(plantings.filter(function(x){return x.id!==p.id;}));}} style={{background:"transparent",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:16,padding:"0 4px"}}>x</button>
              </div>
            </div>
          );
        })}
        {plantings.length===0&&<div style={{textAlign:"center",padding:40,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:14}}>No plantings yet. Use the Harvest Planner to generate a plan.</div>}
      </div>
      {plantings.length>0&&(
        <div style={{marginTop:12,padding:"10px 14px",background:COLORS.soil+"80",borderRadius:8,display:"flex",gap:24,fontFamily:"'DM Mono', monospace",fontSize:12,color:COLORS.muted,flexWrap:"wrap"}}>
          <span>Plantings: <strong style={{color:COLORS.cream}}>{plantings.length}</strong></span>
          <span>Varieties: <strong style={{color:COLORS.cream}}>{new Set(plantings.map(function(p){return p.varietyId;})).size}</strong></span>
          {frostCount>0&&<span>Frost risks: <strong style={{color:COLORS.frostWarn}}>{frostCount}</strong></span>}
        </div>
      )}
    </div>
  );
}

function SuccessionView(props) {
  var varieties = props.varieties;
  var plantings = props.plantings;
  var setPlantings = props.setPlantings;
  var config = props.config;
  var setTab = props.setTab;
  function getV(id){return varieties.find(function(v){return v.id===id;});}

  var [varietyId, setVarietyId] = useState(varieties[0]&&varieties[0].id||"");
  var [startDate, setStartDate] = useState((config&&config.firstMarket)||"2025-05-14");
  var [endDate, setEndDate] = useState((config&&(config.lastHarvest||config.lastMarket))||"2025-10-25");
  var [cadenceDays, setCadenceDays] = useState(7);
  var [volumeMode, setVolumeMode] = useState("feet");
  var [targetFt, setTargetFt] = useState(4);
  var [bedsPerHarvest, setBedsPerHarvest] = useState(1);
  var [targetLbs, setTargetLbs] = useState(40);
  var [loaded, setLoaded] = useState(false);
  var [dirty, setDirty] = useState(false);
  var [savedPlan, setSavedPlan] = useState(null);   // frozen snapshot of what is in plantings
  var [editPlan, setEditPlan] = useState(null);     // working copy — same as saved until dirty
  var [cadenceEstimated, setCadenceEstimated] = useState(false);
  var configTrim3=(config&&config.trimCalendar!==undefined)?config.trimCalendar:true;
  var [trimView, setTrimView] = useState(configTrim3);

  var variety = getV(+varietyId);
  var isContinuous = variety&&(variety.harvestWindowWeeks===0);
  var canFieldHold = !isContinuous&&variety&&(variety.fieldHoldWeeks||0)>=2;
  var [useFieldHold, setUseFieldHold] = useState(false);
  var activeHoldWeeks = useFieldHold?(variety&&variety.fieldHoldWeeks||2):1;
  var activeHoldHarvests = useFieldHold?(variety&&variety.fieldHoldHarvests||2):1;
  var stdBedFt = (config&&config.bedLengthFt)||8;
  var yieldPerFt = (variety&&variety.yieldPer25ft)?(variety.yieldPer25ft/25):0;
  var feetPerHarvest = volumeMode==="beds"?(bedsPerHarvest||1)*stdBedFt:volumeMode==="feet"?(targetFt||4):(targetLbs||10)/Math.max(0.01,yieldPerFt);
  var existingCount = plantings.filter(function(p){return p.varietyId===+varietyId;}).length;

  function markDirty(){setDirty(true);}

  function load(){
    var existing=plantings.filter(function(p){return p.varietyId===+varietyId;})
      .slice().sort(function(a,b){return a.harvestDate<b.harvestDate?-1:1;});
    // Reverse-engineer controls from existing plan
    if(existing.length>0){
      var gaps=[];
      for(var gi=1;gi<existing.length;gi++){
        var ga=new Date(existing[gi-1].harvestDate+"T12:00:00");
        var gb=new Date(existing[gi].harvestDate+"T12:00:00");
        gaps.push(Math.round((gb-ga)/86400000));
      }
      var gapsSorted=gaps.slice().sort(function(a,b){return a-b;});
      var medianGap=gaps.length>0?gapsSorted[Math.floor(gaps.length/2)]:14;
      var medFt=existing[Math.floor(existing.length/2)].feetOfBed||4;
      setStartDate(existing[0].harvestDate);
      setEndDate(existing[existing.length-1].harvestDate);
      setCadenceDays(medianGap);
      setTargetFt(medFt);
      setVolumeMode("feet");
      setCadenceEstimated(gaps.length>1);
    }
    var snap=existing.length>0?existing:null;
    setSavedPlan(snap);
    setEditPlan(snap);   // start clean — top = bottom
    setLoaded(true);
    setDirty(false);
  }

  function generate(){
    if(!variety||!startDate) return;
    var list=[];
    if(isContinuous){
      // Continuous crop (tomato etc) — single planting, harvest window from first harvest date
      var hds=startDate;
      var sds=gddSowFromHarvest(hds,variety);
      list.push({id:"new-"+hds,varietyId:+varietyId,harvestDate:hds,sowDate:sds,feetOfBed:feetPerHarvest});
    } else {
      // Succession crop — generate multiple plantings
      var cur=new Date(startDate+"T12:00:00");
      var end=new Date((endDate||startDate)+"T12:00:00");
      if(config&&config.lastHarvest){var lh=new Date(config.lastHarvest+"T12:00:00");if(lh<end)end=lh;}
      if(config&&config.lastMarket&&!config.lastHarvest){var lm=new Date(config.lastMarket+"T12:00:00");if(lm<end)end=lm;}
      if(config&&config.firstFrost){
        var yr=end.getFullYear();
        var ff=new Date(yr+"-"+config.firstFrost+"T12:00:00");
        if(ff<end)end=ff;
      }
      var nCuts=(variety&&variety.cuts)||1;
      var regrowthDays=((variety&&variety.regrowthWeeks)||0)*7;

      // cropGapDays = days from H1 to last H of one planting
      var cropGapDays=0;
      if(useFieldHold&&(variety&&(variety.fieldHoldWeeks||0)>=2)){
        var fhH2=(variety&&variety.fieldHoldHarvests)||2;
        cropGapDays=fhH2>1?(variety&&variety.fieldHoldWeeks||2)*7:0;
      } else if(nCuts>1&&regrowthDays>0){
        cropGapDays=(nCuts-1)*regrowthDays;
      }

      // Get all harvest dates for a planting given its H1 date
      function getHarvestDates(h1Str){
        var dates=[];
        if(useFieldHold&&cropGapDays>0){
          var fhH3=(variety&&variety.fieldHoldHarvests)||2;
          var fhInt3=fhH3>1?cropGapDays/(fhH3-1):0;
          for(var fi=0;fi<fhH3;fi++){
            var d=new Date(h1Str+"T12:00:00");
            d.setDate(d.getDate()+Math.round(fi*fhInt3));
            dates.push(d.toISOString().slice(0,10));
          }
        } else {
          for(var ci2=0;ci2<nCuts;ci2++){
            var d2=new Date(h1Str+"T12:00:00");
            d2.setDate(d2.getDate()+ci2*regrowthDays);
            dates.push(d2.toISOString().slice(0,10));
          }
        }
        return dates;
      }

      // Get just the H1 dates from all placed plantings
      function getH1Dates(placed){
        var h1s={};
        placed.forEach(function(p){ h1s[p.harvestDate]=true; });
        return h1s;
      }

      // Get all harvest dates from all placed plantings
      function getAllDates(placed){
        var all={};
        placed.forEach(function(p){
          getHarvestDates(p.harvestDate).forEach(function(ds){all[ds]=true;});
        });
        return all;
      }

      // Find next H1: always skip existing H1s; also skip all harvest dates when cadence >= cropGap
      function findNextH1(candidateMs, h1Dates, allDates){
        var d=new Date(candidateMs);
        var ds=d.toISOString().slice(0,10);
        var skipAll=cadenceDays>=cropGapDays||cropGapDays===0;
        while(h1Dates[ds]||(skipAll&&allDates[ds])){
          d=new Date(d.getTime()+7*24*60*60*1000);
          ds=d.toISOString().slice(0,10);
        }
        return d;
      }

      while(cur<=end){
        var h1Dates=getH1Dates(list);
        var allDates=getAllDates(list);
        var h1=findNextH1(cur.getTime(),h1Dates,allDates);
        if(h1>end) break;
        var hds2=h1.toISOString().slice(0,10);
        var sds2=gddSowFromHarvest(hds2,variety);
        var holdWeeks2=useFieldHold?(variety&&variety.fieldHoldWeeks||2):0;
        list.push({id:"new-"+hds2,varietyId:+varietyId,harvestDate:hds2,sowDate:sds2,feetOfBed:feetPerHarvest,fieldHoldWeeks:holdWeeks2});
        // Advance cursor: from lastH if cadence >= cropGap, else from H1
        var advanceFrom;
        if(cropGapDays>0&&cadenceDays>=cropGapDays){
          advanceFrom=new Date(h1.getTime()+cropGapDays*24*60*60*1000);
        } else {
          advanceFrom=h1;
        }
        cur=new Date(advanceFrom.getTime()+cadenceDays*24*60*60*1000);
      }
    }
    setEditPlan(list);
    setDirty(true);
  }

  function deleteFromPlan(key){
    if(!editPlan) return;
    var updated=editPlan.filter(function(p){return (p.id||p.harvestDate)!==key;});
    setEditPlan(updated);
    setDirty(true);
  }
  function save(){
    if(!editPlan) return;
    var others=plantings.filter(function(p){return p.varietyId!==+varietyId;});
    var withIds=editPlan.map(function(p,i){
      return Object.assign({},p,{id:typeof p.id==="string"?generateId(plantings)+i+1000:p.id,feetOfBed:feetPerHarvest});
    });
    setPlantings(others.concat(withIds));
    setSavedPlan(withIds);
    setEditPlan(withIds);
    setDirty(false);
  }

  function fmt(d){return d?new Date(d+"T12:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"}):"--";}
  var volModes=[["feet","By Feet"],["beds","By Beds"],["units","By Lbs"]];

  var [confirmDelete, setConfirmDelete] = useState(null);

  // Mini calendar renderer — shared for both top and bottom
  function renderCal(calPlantings, label, dimmed, onDelete){
    if(!calPlantings||calPlantings.length===0) return (
      <div style={{padding:20,textAlign:"center",color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:12,background:COLORS.bark,borderRadius:10,border:"1px solid "+COLORS.clay+"20",opacity:dimmed?0.5:1}}>No plantings</div>
    );
    var years=calPlantings.map(function(p){return p.harvestDate?new Date(p.harvestDate).getFullYear():null;}).filter(Boolean);
    var calYear=years.length>0?Math.min.apply(null,years):new Date().getFullYear();
    var anchorDay=startDate?new Date(startDate+"T12:00:00").getDay():1;
    var CELL_W=28; var ROW_H=32;
    var allWeeks=weeksForYear(calYear,anchorDay);
    var weeks=trimView?(function(){
      var earliest=null;var latest=null;
      calPlantings.forEach(function(p){var m=variety?calcMilestones(p,variety):null;if(!m)return;if(!earliest||m.occupyStart<earliest)earliest=m.occupyStart;if(!latest||m.harvestEnd>latest)latest=m.harvestEnd;});
      if(!earliest||!latest) return allWeeks;
      var pad=2;
      return allWeeks.filter(function(w,i){return i>=Math.max(0,allWeeks.findIndex(function(w2){return addDays(w2,6)>=earliest;})-pad)&&addDays(w,0)<=addDays(latest,pad*7);});
    })():allWeeks;
    var monthGroups=[];
    weeks.forEach(function(w){
      var lbl=addDays(w,3).toLocaleDateString("en-CA",{month:"short"});
      var last=monthGroups.length>0?monthGroups[monthGroups.length-1]:null;
      if(!last||last.label!==lbl) monthGroups.push({label:lbl,count:1});
      else last.count++;
    });
    var yearStart=weeks[0];
    var dayX=function(d){return Math.round((new Date(d)-yearStart)/(1000*60*60*24))*CELL_W/7;};

    // Build coverage map: weekIndex -> harvest count
    var coverageMap={};
    calPlantings.forEach(function(p){
      if(!p.harvestDate) return;
      var nC2=(variety&&variety.harvestType)==="cutAndComeAgain"?(variety.cuts||2):1;
      var rDays2=((variety&&variety.regrowthWeeks)||0)*7;
      var fhw2=p.fieldHoldWeeks||0;
      var fhh2=(variety&&variety.fieldHoldHarvests)||1;
      var hDates=[];
      if(fhw2>=2&&fhh2>1){
        var fhInt3=fhh2>1?(fhw2*7)/(fhh2-1):0;
        for(var fi3=0;fi3<fhh2;fi3++){
          var fd3=new Date(p.harvestDate+"T12:00:00");
          fd3.setDate(fd3.getDate()+Math.round(fi3*fhInt3));
          hDates.push(fd3);
        }
      } else {
        for(var ci4=0;ci4<nC2;ci4++){
          var cd4=new Date(p.harvestDate+"T12:00:00");
          cd4.setDate(cd4.getDate()+ci4*rDays2);
          hDates.push(cd4);
        }
      }
      hDates.forEach(function(hd2){
        var wi2=weeks.findIndex(function(w){return hd2>=w&&hd2<=addDays(w,6);});
        if(wi2>=0) coverageMap[wi2]=(coverageMap[wi2]||0)+1;
      });
    });

    return (
      <div style={{opacity:dimmed?0.55:1}}>
        <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:dimmed?COLORS.muted:COLORS.straw,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
        <div style={{background:COLORS.bark,borderRadius:10,overflow:"hidden",border:"1px solid "+(dimmed?COLORS.clay+"20":COLORS.clay+"30")}}>
          <div style={{overflowX:"auto"}}>
            <div style={{width:weeks.length*CELL_W}}>
              <div style={{display:"flex",height:18,background:COLORS.soil+"60",borderBottom:"1px solid "+COLORS.clay+"30"}}>
                {monthGroups.map(function(mg,i){return <div key={i} style={{width:mg.count*CELL_W,flexShrink:0,display:"flex",alignItems:"center",paddingLeft:4,fontFamily:"'DM Mono', monospace",fontSize:9,color:COLORS.straw,textTransform:"uppercase",borderLeft:i>0?"1px solid "+COLORS.clay+"30":"none",overflow:"hidden",whiteSpace:"nowrap"}}>{mg.label}</div>;})}
              </div>
              {!dimmed&&(
                <div style={{position:"relative",height:18,borderBottom:"2px solid "+COLORS.clay+"40"}}>
                  {(function(){
                    // Build per-date coverage using same dayX as H bars
                    var dateCounts={};
                    calPlantings.forEach(function(p2){
                      if(!p2.harvestDate) return;
                      var nC3=(variety&&variety.harvestType)==="cutAndComeAgain"?(variety.cuts||2):1;
                      var rD3=((variety&&variety.regrowthWeeks)||0)*7;
                      var fhw3=p2.fieldHoldWeeks||0;
                      var fhh3=(variety&&variety.fieldHoldHarvests)||1;
                      var hdates3=[];
                      if(fhw3>=2&&fhh3>1){
                        var fhI3=fhh3>1?(fhw3*7)/(fhh3-1):0;
                        for(var fi4=0;fi4<fhh3;fi4++){
                          var fd4=new Date(p2.harvestDate+"T12:00:00");
                          fd4.setDate(fd4.getDate()+Math.round(fi4*fhI3));
                          hdates3.push(fd4);
                        }
                      } else {
                        for(var ci5=0;ci5<nC3;ci5++){
                          var cd5=new Date(p2.harvestDate+"T12:00:00");
                          cd5.setDate(cd5.getDate()+ci5*rD3);
                          hdates3.push(cd5);
                        }
                      }
                      hdates3.forEach(function(hd3){
                        var key3=hd3.toISOString().slice(0,10);
                        dateCounts[key3]=(dateCounts[key3]||0)+1;
                      });
                    });
                    var hHalfW2=(CELL_W/7)*3.5;
                    return Object.keys(dateCounts).map(function(dateStr){
                      var cnt=dateCounts[dateStr];
                      var cx=dayX(new Date(dateStr+"T12:00:00"));
                      var col=cnt>1?COLORS.frostWarn:COLORS.harvestLight;
                      var bg=cnt>1?COLORS.frostWarn+"40":COLORS.harvest+"40";
                      return <div key={dateStr} style={{position:"absolute",left:cx-hHalfW2,top:2,width:hHalfW2*2,height:14,background:bg,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontFamily:"'DM Mono', monospace",fontSize:9,fontWeight:700,color:col}}>{cnt}</span>
                      </div>;
                    });
                  })()}
                </div>
              )}
              {calPlantings.map(function(p){
                var m=variety?calcMilestones(p,variety):null;
                if(!m) return null;
                var bars=buildBars(p,variety,m,dayX,CELL_W,false);
                var key=p.id||p.harvestDate;
                var isPending=confirmDelete===key;
                return (
                  <div key={key} style={{position:"relative",height:ROW_H,borderBottom:"1px solid "+COLORS.clay+"10",background:isPending?"#2A0808":"transparent"}}>
                    {weeks.map(function(w,i){
                      var wim1=i-1;var prevW=i>0?weeks[wim1]:null;
                      var isNew=i===0||addDays(w,3).getMonth()!==(prevW&&addDays(prevW,3).getMonth());
                      var wrgb=tempToColor(weekMeanTemp(w));
                      var fhDate=config&&config.firstHarvest?new Date(config.firstHarvest+"T12:00:00"):null;
                      var lhDate=config&&config.lastHarvest?new Date(config.lastHarvest+"T12:00:00"):null;
                      var iFH2=fhDate&&fhDate>=w&&fhDate<=addDays(w,6);
                      var iLH2=lhDate&&lhDate>=w&&lhDate<=addDays(w,6);
                      return <div key={i} style={{position:"absolute",left:i*CELL_W,top:0,width:CELL_W,height:"100%",background:"rgba("+wrgb[0]+","+wrgb[1]+","+wrgb[2]+",0.13)",borderLeft:iLH2?"3px solid "+COLORS.harvestLight+"A0":iFH2?"3px solid "+COLORS.sprout+"A0":isNew&&i>0?"1px solid "+COLORS.clay+"10":"none",pointerEvents:"none"}}/>;
                    })}
                    {bars.map(function(bar){
                      return <div key={bar.key} style={{position:"absolute",left:Math.max(0,bar.x),top:3,height:ROW_H-6,width:Math.max(3,bar.w),background:bar.style.bg,border:"1px solid "+bar.style.border,borderRadius:2,display:"flex",alignItems:"center",justifyContent:bar.key.charAt(0)==="h"?"center":"flex-start",overflow:"hidden",boxSizing:"border-box",paddingLeft:bar.key.charAt(0)==="h"?0:3,zIndex:bar.key.charAt(0)==="h"?2:1}}>
                        {bar.label&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:8,fontWeight:700,color:COLORS.cream,whiteSpace:"nowrap"}}>{bar.label}</span>}
                      </div>;
                    })}
                    {onDelete&&(
                      <div style={{position:"absolute",right:0,top:0,height:ROW_H,display:"flex",alignItems:"center",paddingRight:4,zIndex:10}}>
                        {isPending?(
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <span style={{fontFamily:"'DM Mono', monospace",fontSize:9,color:COLORS.frostWarn}}>Delete?</span>
                            <button onClick={function(){onDelete(key);setConfirmDelete(null);}} style={{background:COLORS.frostWarn,border:"none",borderRadius:4,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:10,padding:"2px 8px",cursor:"pointer"}}>YES</button>
                            <button onClick={function(){setConfirmDelete(null);}} style={{background:"transparent",border:"1px solid "+COLORS.clay,borderRadius:4,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:10,padding:"2px 6px",cursor:"pointer"}}>NO</button>
                          </div>
                        ):(
                          <button onClick={function(){setConfirmDelete(key);}} style={{background:"transparent",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:14,padding:"0 4px",lineHeight:1}} title="Delete planting">&#x1F5D1;</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24,alignItems:"start"}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Harvest Planner</h2>
        <div style={{background:COLORS.bark,borderRadius:10,padding:16,border:"1px solid "+COLORS.clay+"30"}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <F label="Variety">
              <select style={inp} value={varietyId} onChange={function(e){setVarietyId(e.target.value);setLoaded(false);setDirty(false);setSavedPlan(null);setEditPlan(null);}}>
                {varieties.map(function(v){return <option key={v.id} value={v.id}>{v.name}</option>;})}
              </select>
            </F>
            <F label={"First Harvest"}>
              <input type="date" style={inp} value={startDate} onChange={function(e){setStartDate(e.target.value);markDirty();}}/>
            </F>
            {canFieldHold&&(
              <F label="Harvest method">
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){setUseFieldHold(false);markDirty();}} style={{background:!useFieldHold?COLORS.leaf:"transparent",border:"1px solid "+(!useFieldHold?COLORS.leaf:COLORS.clay),borderRadius:5,color:!useFieldHold?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"6px 0",cursor:"pointer",flex:1}}>Clean</button>
                  <button onClick={function(){setUseFieldHold(true);markDirty();}} style={{background:useFieldHold?COLORS.harvestLight:"transparent",border:"1px solid "+(useFieldHold?COLORS.harvestLight:COLORS.clay),borderRadius:5,color:useFieldHold?COLORS.soil:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"6px 0",cursor:"pointer",flex:1}}>{"Field Hold ("+activeHoldWeeks+"w, "+activeHoldHarvests+"x)"}</button>
                </div>
              </F>
            )}
            {!isContinuous&&(
              <F label="Last Harvest">
                <input type="date" style={inp} value={endDate} onChange={function(e){setEndDate(e.target.value);markDirty();}}/>
              </F>
            )}
            {isContinuous&&(
              <div style={{padding:"8px 10px",background:COLORS.soil,borderRadius:6,border:"1px solid "+COLORS.clay+"30"}}>
                <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.harvestLight,marginBottom:2}}>Continuous crop</div>
                <div style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>Single planting, {variety&&variety.harvestWindowWeeks}w harvest window</div>
              </div>
            )}
            {!isContinuous&&(
              <F label={"Cadence"+(cadenceEstimated?" ~est":"")}>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  {[[7,"Weekly"],[14,"2-Week"],[21,"3-Week"]].map(function(item){
                    var days=item[0];var lbl=item[1];
                    return <button key={days} onClick={function(){setCadenceDays(days);markDirty();}} style={{background:cadenceDays===days?COLORS.leaf:"transparent",border:"1px solid "+(cadenceDays===days?COLORS.leaf:COLORS.clay),borderRadius:5,color:cadenceDays===days?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"5px 0",cursor:"pointer",flex:1}}>{lbl}</button>;
                  })}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="number" style={Object.assign({},inp,{width:60})} value={cadenceDays} min={1} max={90} onChange={function(e){setCadenceDays(Math.max(1,+e.target.value||7));markDirty();}}/>
                  <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>days</span>
                </div>
              </F>
            )}
            <F label="Volume per Harvest">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
                {volModes.map(function(item){
                  var mode=item[0];var lbl=item[1];
                  return <button key={mode} onClick={function(){setVolumeMode(mode);markDirty();}} style={{background:volumeMode===mode?COLORS.leaf:"transparent",border:"1px solid "+(volumeMode===mode?COLORS.leaf:COLORS.clay),borderRadius:5,color:volumeMode===mode?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"6px 0",cursor:"pointer"}}>{lbl}</button>;
                })}
              </div>
              {volumeMode==="feet"&&<div style={{display:"flex",alignItems:"center",gap:8}}><input style={Object.assign({},inp,{width:60})} type="number" value={targetFt} onChange={function(e){setTargetFt(Math.max(1,+e.target.value||1));markDirty();}} min={1}/><span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>ft of bed</span></div>}
              {volumeMode==="beds"&&<div style={{display:"flex",alignItems:"center",gap:8}}><input style={Object.assign({},inp,{width:60})} type="number" value={bedsPerHarvest} onChange={function(e){setBedsPerHarvest(Math.max(1,+e.target.value||1));markDirty();}} min={1}/><span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>beds</span></div>}
              {volumeMode==="units"&&<div style={{display:"flex",alignItems:"center",gap:8}}><input style={Object.assign({},inp,{width:70})} type="number" value={targetLbs} onChange={function(e){setTargetLbs(Math.max(1,+e.target.value||1));markDirty();}} min={1}/><span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>lbs</span></div>}
            </F>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {!loaded&&<button onClick={load} style={{background:COLORS.frost,border:"none",borderRadius:8,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"12px",cursor:"pointer",fontWeight:600}}>{existingCount>0?"LOAD EXISTING ("+existingCount+")":"START NEW PLAN"}</button>}
          {loaded&&<button onClick={generate} style={{background:COLORS.clay,border:"1px solid "+COLORS.straw,borderRadius:8,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"12px",cursor:"pointer",fontWeight:600}}>GENERATE</button>}
          {loaded&&editPlan&&<button onClick={save} style={{background:dirty?COLORS.leaf:COLORS.clay,border:"none",borderRadius:8,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"12px",cursor:"pointer",fontWeight:600,opacity:dirty?1:0.5}}>{(savedPlan&&savedPlan.length>0)?"REPLACE PLAN":"SAVE PLAN"}</button>}
          {loaded&&<button onClick={function(){setTrimView(function(t){return !t;});}} style={{background:trimView?COLORS.leaf+"30":"transparent",border:"1px solid "+COLORS.clay,borderRadius:8,color:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:12,padding:"8px",cursor:"pointer"}}>TRIM {trimView?"ON":"OFF"}</button>}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {!loaded?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:180,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:13,textAlign:"center",background:COLORS.bark,borderRadius:10,border:"1px solid "+COLORS.clay+"20",padding:20}}>
            {existingCount>0?"Click LOAD EXISTING to review your current plan.":"Click START NEW PLAN to begin."}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {renderCal(editPlan, dirty?"Editing — "+((editPlan&&editPlan.length)||0)+" successions ●":"Current plan — "+((editPlan&&editPlan.length)||0)+" successions", false, deleteFromPlan)}
            {savedPlan&&renderCal(savedPlan, "Saved plan — "+savedPlan.length+" successions", true, null)}
          </div>
        )}
      </div>
    </div>
  );
}

function BedsView(props) {
  var beds = props.beds;
  var setBeds = props.setBeds;
  var config = props.config;
  var sortMode = props.sortMode;
  var setSortMode = props.setSortMode;
  var [editing, setEditing] = useState(null);
  var [form, setForm] = useState({});
  var [bulkCount, setBulkCount] = useState("");
  var [bulkLength, setBulkLength] = useState("");
  var [bulkWidth, setBulkWidth] = useState("");
  var linp = {background:COLORS.clay,border:"1px solid "+COLORS.clay,borderRadius:4,color:COLORS.cream,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"5px 8px",outline:"none",boxSizing:"border-box"};
  function startEdit(b){setEditing(b.id);setForm(Object.assign({},b));}
  function cancelEdit(){setEditing(null);setForm({});}
  function saveEdit(){
    setBeds(beds.map(function(b){
      if(b.id!==editing) return b;
      return Object.assign({},b,{name:form.name||b.name,lengthFt:+form.lengthFt||b.lengthFt||(config.bedLengthFt||8),widthIn:+form.widthIn||b.widthIn||(config.bedWidthIn||30),tag:(form.tag||"").trim().toLowerCase(),availFrom:form.availFrom||"",availTo:form.availTo||""});
    }));
    setEditing(null);
  }
  function addRow(){
    var id=generateId(beds);
    var nb={id:id,name:"Bed "+id,lengthFt:config.bedLengthFt||8,widthIn:config.bedWidthIn||30,tag:"",availFrom:"",availTo:""};
    setBeds(beds.concat([nb]));setEditing(id);setForm(Object.assign({},nb));
  }
  function addBulk(){
    var count=Math.max(1,+bulkCount||1);
    var lengthFt=+bulkLength||config.bedLengthFt||8;
    var widthIn=+bulkWidth||config.bedWidthIn||30;
    var startId=generateId(beds);
    var existingNums=beds.map(function(b){var m=b.name.match(/^Bed\s+(\d+)$/i);return m?+m[1]:0;});
    var startNum=existingNums.length>0?Math.max.apply(null,existingNums)+1:1;
    var newBeds=[];
    for(var bi=0;bi<count;bi++) newBeds.push({id:startId+bi,name:"Bed "+(startNum+bi),lengthFt:lengthFt,widthIn:widthIn,tag:"",availFrom:"",availTo:""});
    setBeds(beds.concat(newBeds));setBulkCount("");setBulkLength("");setBulkWidth("");
  }
  function remove(id){setBeds(beds.filter(function(b){return b.id!==id;}));if(editing===id) cancelEdit();}
  function moveBed(id,dir){
    var idx=beds.findIndex(function(b){return b.id===id;});
    if(idx<0) return;
    var next=idx+dir;if(next<0||next>=beds.length) return;
    var arr=beds.slice();var tmp=arr[idx];arr[idx]=arr[next];arr[next]=tmp;setBeds(arr);
  }
  var sortedBeds=beds.slice().sort(function(a,b){
    if(sortMode==="name") return a.name.localeCompare(b.name,undefined,{numeric:true});
    if(sortMode==="width") return (b.widthIn||30)-(a.widthIn||30)||(a.name.localeCompare(b.name,undefined,{numeric:true}));
    if(sortMode==="manual") return 0;
    var aTag=(a.tag||"").trim();var bTag=(b.tag||"").trim();
    if(aTag&&!bTag) return -1;if(!aTag&&bTag) return 1;
    if(aTag&&bTag&&aTag!==bTag) return aTag.localeCompare(bTag);
    var wDiff=(b.widthIn||30)-(a.widthIn||30);if(wDiff!==0) return wDiff;
    return a.name.localeCompare(b.name,undefined,{numeric:true});
  });
  var colStyle={fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.08em",padding:"8px 12px",borderBottom:"1px solid "+COLORS.clay+"30",textAlign:"left"};
  var cellStyle={fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.cream,padding:"8px 12px",borderBottom:"1px solid "+COLORS.clay+"15",verticalAlign:"middle"};
  var sortModes=[["smart","Tagged First"],["width","By Width"],["name","By Name"],["manual","Manual"]];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Beds</h2>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <input style={Object.assign({},linp,{width:60})} type="number" value={bulkCount} onChange={function(e){setBulkCount(e.target.value);}} placeholder="qty" min={1}/>
          <input style={Object.assign({},linp,{width:65})} type="number" value={bulkLength} onChange={function(e){setBulkLength(e.target.value);}} placeholder={(config.bedLengthFt||8)+"ft"}/>
          <input style={Object.assign({},linp,{width:65})} type="number" value={bulkWidth} onChange={function(e){setBulkWidth(e.target.value);}} placeholder={(config.bedWidthIn||30)+'"'}/>
          <button onClick={addBulk} style={{background:COLORS.leaf,border:"none",borderRadius:6,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"8px 14px",cursor:"pointer"}}>+ ADD {bulkCount||"N"}</button>
          <button onClick={addRow} style={{background:"transparent",border:"1px solid "+COLORS.clay,borderRadius:6,color:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:13,padding:"8px 14px",cursor:"pointer"}}>+ ADD ONE</button>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center"}}>
        <span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginRight:4}}>Sort:</span>
        {sortModes.map(function(item){
          var mode=item[0];var label=item[1];
          return <button key={mode} onClick={function(){setSortMode(mode);}} style={{background:sortMode===mode?COLORS.leaf:"transparent",border:"1px solid "+(sortMode===mode?COLORS.leaf:COLORS.clay),borderRadius:5,color:sortMode===mode?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"4px 12px",cursor:"pointer"}}>{label}</button>;
        })}
      </div>
      <div style={{background:COLORS.bark,borderRadius:10,overflow:"hidden",border:"1px solid "+COLORS.clay+"30"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            <th style={colStyle}>Name</th>
            <th style={Object.assign({},colStyle,{width:120})}>Dimensions</th>
            <th style={Object.assign({},colStyle,{width:100})}>Tag</th>
            <th style={Object.assign({},colStyle,{width:110})}>Avail From</th>
            <th style={Object.assign({},colStyle,{width:110})}>Avail To</th>
            <th style={Object.assign({},colStyle,{width:100})}></th>
          </tr></thead>
          <tbody>
            {sortedBeds.map(function(b){
              if(editing===b.id) return (
                <tr key={b.id} style={{background:COLORS.leaf+"10"}}>
                  <td style={Object.assign({},cellStyle,{padding:"4px 8px"})}><input style={Object.assign({},linp,{fontSize:13,width:"100%"})} value={form.name||""} onChange={function(e){setForm(Object.assign({},form,{name:e.target.value}));}} autoFocus/></td>
                  <td style={Object.assign({},cellStyle,{padding:"4px 8px"})}><div style={{display:"flex",alignItems:"center",gap:4}}><input style={Object.assign({},linp,{width:50})} type="number" value={form.lengthFt||""} onChange={function(e){setForm(Object.assign({},form,{lengthFt:e.target.value}));}} placeholder={config.bedLengthFt||8}/><span style={{color:COLORS.muted,fontSize:10}}>x</span><input style={Object.assign({},linp,{width:50})} type="number" value={form.widthIn||""} onChange={function(e){setForm(Object.assign({},form,{widthIn:e.target.value}));}} placeholder={config.bedWidthIn||30}/></div></td>
                  <td style={Object.assign({},cellStyle,{padding:"4px 8px"})}><input style={Object.assign({},linp,{width:90})} value={form.tag||""} onChange={function(e){setForm(Object.assign({},form,{tag:e.target.value}));}} placeholder="gh, wf..."/></td>
                  <td style={Object.assign({},cellStyle,{padding:"4px 8px"})}><input style={Object.assign({},linp,{fontSize:12})} type="date" value={form.availFrom||""} onChange={function(e){setForm(Object.assign({},form,{availFrom:e.target.value}));}}/></td>
                  <td style={Object.assign({},cellStyle,{padding:"4px 8px"})}><input style={Object.assign({},linp,{fontSize:12})} type="date" value={form.availTo||""} onChange={function(e){setForm(Object.assign({},form,{availTo:e.target.value}));}}/></td>
                  <td style={Object.assign({},cellStyle,{padding:"4px 8px"})}><div style={{display:"flex",gap:6}}><button onClick={saveEdit} style={{background:COLORS.leaf,border:"none",borderRadius:4,color:COLORS.white,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"4px 10px",cursor:"pointer"}}>SAVE</button><button onClick={cancelEdit} style={{background:"transparent",border:"1px solid "+COLORS.clay,borderRadius:4,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"4px 8px",cursor:"pointer"}}>X</button></div></td>
                </tr>
              );
              return (
                <tr key={b.id} style={{cursor:"pointer"}} onClick={function(){startEdit(b);}}>
                  <td style={cellStyle}>{b.name}</td>
                  <td style={Object.assign({},cellStyle,{color:COLORS.straw})}>{b.lengthFt||config.bedLengthFt||8}ft x {b.widthIn||config.bedWidthIn||30}"</td>
                  <td style={cellStyle}>{b.tag?<TagPill tag={b.tag}/>:"--"}</td>
                  <td style={Object.assign({},cellStyle,{fontSize:11,color:COLORS.muted})}>{b.availFrom?new Date(b.availFrom+"T12:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"}):"--"}</td>
                  <td style={Object.assign({},cellStyle,{fontSize:11,color:COLORS.muted})}>{b.availTo?new Date(b.availTo+"T12:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"}):"--"}</td>
                  <td style={cellStyle} onClick={function(e){e.stopPropagation();}}><div style={{display:"flex",alignItems:"center",gap:4}}>{sortMode==="manual"&&<span><button onClick={function(){moveBed(b.id,-1);}} style={{background:"transparent",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:12,padding:"0 3px"}}>^</button><button onClick={function(){moveBed(b.id,1);}} style={{background:"transparent",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:12,padding:"0 3px"}}>v</button></span>}<button onClick={function(){remove(b.id);}} style={{background:"transparent",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:14,padding:"0 4px"}}>x</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {beds.length===0&&<div style={{textAlign:"center",padding:40,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:13}}>No beds yet. Click + ADD BED.</div>}
      </div>
    </div>
  );
}



function CropCalendarView(props) {
  var varieties = props.varieties;
  var plantings = props.plantings;
  var lastFrost = props.lastFrost;
  var firstFrost = props.firstFrost;
  var config = props.config;
  var configTrim = config&&config.trimCalendar!==undefined?config.trimCalendar:true;
  function getV(id){return varieties.find(function(v){return v.id===id;});}
  var years = plantings.map(function(p){var d=p.harvestDate||p.sowDate;return d?new Date(d).getFullYear():null;}).filter(Boolean);
  var [year, setYear] = useState(years.length>0?Math.min.apply(null,years):new Date().getFullYear());
  var anchorDay = config&&config.firstHarvest?new Date(config.firstHarvest+"T12:00:00").getDay():1;
  var CELL_W = 30;
  var ROW_H = 34;
  var LABEL_W = 200;
  var calScrollRef = useRef(null);
  var [trimView, setTrimView] = useState(configTrim);
  var allWeeks = weeksForYear(year, anchorDay);
  var weeks = (function(){
    if(!trimView||plantings.length===0) return allWeeks;
    var earliest=null;var latest=null;
    plantings.forEach(function(p){
      var v=getV(p.varietyId);var m=v?calcMilestones(p,v):null;if(!m) return;
      if(!earliest||m.occupyStart<earliest) earliest=m.occupyStart;
      if(!latest||m.harvestEnd>latest) latest=m.harvestEnd;
    });
    if(!earliest||!latest) return allWeeks;
    var pad=2;
    return allWeeks.filter(function(w,i){return i>=Math.max(0,allWeeks.findIndex(function(w2){return addDays(w2,6)>=earliest;})-pad)&&addDays(w,0)<=addDays(latest,pad*7);});
  })();

  var monthGroups = [];
  weeks.forEach(function(w,i){
    var label = addDays(w,3).toLocaleDateString("en-CA",{month:"short"});
    var mglen = monthGroups.length;
    var mglast = mglen>0?mglen-1:0;
    var last = mglen>0?monthGroups[mglast]:null;
    if(!last||last.label!==label) monthGroups.push({label:label,count:1});
    else last.count++;
  });
  function fwIdx(mmdd){
    if(!mmdd) return -1;
    var fDate = new Date(year+"-"+mmdd+"T12:00:00");
    return weeks.findIndex(function(w){return fDate>=w&&fDate<=addDays(w,6);});
  }
  function fwIdxFull(dateStr){
    if(!dateStr) return -1;
    var fDate = new Date(dateStr+"T12:00:00");
    return weeks.findIndex(function(w){return fDate>=w&&fDate<=addDays(w,6);});
  }
  var lfIdx = fwIdx(lastFrost);
  var ffIdx = fwIdx(firstFrost);
  var fhIdx = fwIdxFull(config&&config.firstHarvest);
  var lhIdx = fwIdxFull(config&&config.lastHarvest);
  var sorted = plantings.slice().sort(function(a,b){
    var vav=getV(a.varietyId);var vbv=getV(b.varietyId);
    var va=vav?vav.name:"";var vb=vbv?vbv.name:"";
    if(va!==vb) return va.localeCompare(vb);
    var ha=a.harvestDate||a.sowDate;var hb=b.harvestDate||b.sowDate;
    return ha<hb?-1:ha>hb?1:0;
  });
  var stageLegend=[
    {stage:"prep",label:"Bed Prep",bg:STAGE.prep.bg,brd:STAGE.prep.border},
    {stage:"indoorS",label:"Indoor Sow",bg:STAGE.indoorS.bg,brd:STAGE.indoorS.border},
    {stage:"sowTP",label:"Sow/TP",bg:STAGE.sowTP.bg,brd:STAGE.sowTP.border},
    {stage:"grow",label:"Growing",bg:STAGE.grow.bg,brd:STAGE.grow.border},
    {stage:"harvest",label:"Harvest",bg:STAGE.harvest.bg,brd:STAGE.harvest.border},
  ];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Crop Calendar</h2>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={function(){setYear(function(y){return y-1;});}} style={{background:COLORS.bark,border:"1px solid "+COLORS.clay,borderRadius:5,color:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"5px 14px",cursor:"pointer"}}>&#9664;</button>
          <span style={{fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:20,minWidth:52,textAlign:"center"}}>{year}</span>
          <button onClick={function(){setYear(function(y){return y+1;});}} style={{background:COLORS.bark,border:"1px solid "+COLORS.clay,borderRadius:5,color:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"5px 14px",cursor:"pointer"}}>&#9654;</button>
          <button onClick={function(){setTrimView(function(t){return !t;});}} style={{background:trimView?COLORS.leaf:"transparent",border:"1px solid "+(trimView?COLORS.leaf:COLORS.clay),borderRadius:5,color:trimView?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"5px 10px",cursor:"pointer"}}>TRIM</button>
        </div>
      </div>
      <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        {stageLegend.map(function(item){
          return (
            <div key={item.stage} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:14,height:14,borderRadius:3,background:item.bg,border:"1px solid "+item.brd,flexShrink:0}}/>
              <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>{item.label}</span>
            </div>
          );
        })}
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:3,height:14,background:COLORS.frost,borderRadius:1}}/><span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>LF/FF</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:3,height:14,background:COLORS.sprout,borderRadius:1}}/><span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>First Harvest</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:3,height:14,background:COLORS.harvestLight,borderRadius:1}}/><span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>Last Harvest</span></div>
      </div>
      {plantings.length===0?<div style={{textAlign:"center",padding:60,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:14}}>No plantings yet.</div>:(
        <div style={{display:"flex",background:COLORS.bark,borderRadius:10,overflow:"hidden",border:"1px solid "+COLORS.clay+"30"}}>
          <div style={{flexShrink:0,width:LABEL_W,borderRight:"1px solid "+COLORS.clay+"30"}}>
            <div style={{height:22,borderBottom:"1px solid "+COLORS.clay+"30",background:COLORS.soil+"60"}}/>
            <div style={{height:ROW_H,borderBottom:"1px solid "+COLORS.clay+"20",background:COLORS.soil+"40",display:"flex",alignItems:"center",paddingLeft:12}}><span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Crop</span></div>
            {sorted.map(function(p,pi){
              var v=getV(p.varietyId);
              var risk=isFrostRisk(p,v,lastFrost);
              var prevP2=pi>0?sorted[pi-1]:null;
              var showSep=pi>0&&(v&&v.name||"")!==(prevP2&&getV(prevP2.varietyId)&&getV(prevP2.varietyId).name||"");
              return (
                <div key={p.id}>
                  {showSep&&<div style={{height:4,background:COLORS.soil+"80"}}/>}
                  <div style={{height:ROW_H,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 8px",borderBottom:"1px solid "+COLORS.soil+"80",background:risk?"#2A1008":"transparent"}}>
                    <span style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:risk?"#FF9060":COLORS.cream,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(v&&v.name)||"?"}</span>
                    {(v&&v.requiredTag)&&<TagPill tag={v.requiredTag}/>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{overflowX:"auto",flex:1}}>
            <div style={{width:weeks.length*CELL_W}}>
              <div style={{display:"flex",height:22,background:COLORS.soil+"60",borderBottom:"1px solid "+COLORS.clay+"30"}}>
                {monthGroups.map(function(mg,i){return <div key={i} style={{width:mg.count*CELL_W,flexShrink:0,display:"flex",alignItems:"center",paddingLeft:6,fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.straw,textTransform:"uppercase",letterSpacing:"0.1em",borderLeft:i>0?"1px solid "+COLORS.clay+"30":"none",overflow:"hidden",whiteSpace:"nowrap"}}>{mg.label}</div>;})}
              </div>
              <div style={{display:"flex",height:ROW_H,background:COLORS.soil+"40",borderBottom:"1px solid "+COLORS.clay+"20",alignItems:"center"}}>
                {weeks.map(function(w,i){
                  var wim1=i-1;
                  var prevW=i>0?weeks[wim1]:null;
                  var isNew=i===0||addDays(w,3).getMonth()!==(prevW&&addDays(prevW,3).getMonth());
                  return <div key={i} style={{width:CELL_W,flexShrink:0,textAlign:"center",fontFamily:"'DM Mono', monospace",fontSize:9,color:isNew?COLORS.straw:COLORS.muted,borderLeft:isNew&&i>0?"1px solid "+COLORS.clay+"30":"none"}}>{w.getDate()}</div>;
                })}
              </div>
              {sorted.map(function(p,pi){
                var v=getV(p.varietyId);
                var m=v?calcMilestones(p,v):null;
                if(!m) return null;
                var yearStart=weeks[0];
                var dayX=function(d){return Math.round((new Date(d)-yearStart)/(1000*60*60*24))*CELL_W/7;};
                var bars=buildBars(p,v,m,dayX,CELL_W,false);
                var prevP2=pi>0?sorted[pi-1]:null;
                var showSep=pi>0&&(v&&v.name||"")!==(prevP2&&getV(prevP2.varietyId)&&getV(prevP2.varietyId).name||"");
                var rgb=tempToColor(weekMeanTemp(weeks[0]));
                return (
                  <div key={p.id}>
                    {showSep&&<div style={{height:4,background:COLORS.soil+"80"}}/>}
                    <div style={{position:"relative",height:ROW_H,borderBottom:"1px solid "+COLORS.soil+"80"}}>
                      {weeks.map(function(w,i){
                        var wim1=i-1;
                        var prevW=i>0?weeks[wim1]:null;
                        var isNew=i===0||addDays(w,3).getMonth()!==(prevW&&addDays(prevW,3).getMonth());
                        var iFL=i===lfIdx||i===ffIdx;
                        var iFH=i===fhIdx;
                        var iLH=i===lhIdx;
                        var wrgb=tempToColor(weekMeanTemp(w));
                        return <div key={i} style={{position:"absolute",left:i*CELL_W,top:0,width:CELL_W,height:"100%",background:"rgba("+wrgb[0]+","+wrgb[1]+","+wrgb[2]+",0.13)",borderLeft:iLH?"3px solid "+COLORS.harvestLight+"A0":iFH?"3px solid "+COLORS.sprout+"A0":iFL?"2px solid "+COLORS.frost+"50":isNew&&i>0?"1px solid "+COLORS.clay+"10":"none",pointerEvents:"none"}}/>;
                      })}
                      {bars.map(function(bar){
                        return (
                          <div key={bar.key} style={{position:"absolute",left:Math.max(0,bar.x),top:4,height:ROW_H-8,width:Math.max(4,bar.w),background:bar.style.bg,border:"1px solid "+bar.style.border,borderRadius:3,display:"flex",alignItems:"center",justifyContent:bar.key==="harvest"?"center":"flex-start",overflow:"hidden",boxSizing:"border-box",paddingLeft:bar.key==="harvest"?0:3}}>
                            {bar.label&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:9,fontWeight:700,color:COLORS.cream,whiteSpace:"nowrap"}}>{bar.label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldSheetView(props) {
  var varieties = props.varieties;
  var plantings = props.plantings;
  var beds = props.beds;
  var assignments = props.assignments;
  function getV(id){return varieties.find(function(v){return v.id===id;});}
  function getBedName(pid){var asgn=assignments&&assignments[pid];if(!asgn) return "?";var bed=beds&&beds.find(function(b){return b.id===asgn.bedId;});return bed?bed.name:"?";}
  var todayMonday=weekStart(new Date()).toISOString().slice(0,10);
  var [selectedDate, setSelectedDate] = useState(todayMonday);
  var mon=weekStart(new Date(selectedDate+"T12:00:00"));
  var sun=addDays(mon,6);
  var weekLabel=mon.toLocaleDateString("en-CA",{month:"long",day:"numeric"})+" - "+sun.toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"});
  var tasks=[];
  plantings.forEach(function(p){
    var v=getV(p.varietyId);if(!v) return;
    var m=calcMilestones(p,v);if(!m) return;
    var bedName=getBedName(p.id);
    if(m.prepStart&&mon<=m.tpOutDate&&sun>=m.prepStart) tasks.push({type:"prep",label:"Bed Prep",detail:v.bedPrepTask||"Prepare bed",variety:v.name,bed:bedName,date:m.prepStart,priority:1});
    if(m.indoorSowDate&&weekStart(m.indoorSowDate).getTime()===mon.getTime()) tasks.push({type:"sow",label:"Indoor Sow",detail:v.trayType||"Sow indoors",variety:v.name,bed:bedName,date:m.indoorSowDate,priority:2});
    if(weekStart(m.tpOutDate).getTime()===mon.getTime()) tasks.push({type:"sow",label:v.sowMethod==="Transplant"?"Transplant Out":"Direct Sow",detail:v.seeder||"",variety:v.name,bed:bedName,date:m.tpOutDate,priority:2});
    var nCuts=v.harvestType==="cutAndComeAgain"?(v.cuts||2):1;
    var regrowthDays=(v.regrowthWeeks||1)*7;
    for(var ci=0;ci<nCuts;ci++){
      var cutDate=new Date((p.harvestDate||p.sowDate)+"T12:00:00");
      cutDate.setDate(cutDate.getDate()+ci*regrowthDays);
      if(weekStart(cutDate).getTime()===mon.getTime()) tasks.push({type:"harvest",label:"Harvest"+(nCuts>1?" cut "+(ci+1):""),detail:v.harvestNotes||"",variety:v.name,bed:bedName,date:cutDate,priority:3});
    }
  });
  tasks.sort(function(a,b){return a.priority!==b.priority?a.priority-b.priority:a.date-b.date;});
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Field Sheet</h2>
        <input type="date" value={selectedDate} onChange={function(e){setSelectedDate(e.target.value);}} style={{background:COLORS.bark,border:"1px solid "+COLORS.clay,borderRadius:6,color:COLORS.cream,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"6px 12px"}}/>
      </div>
      <div style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.straw,marginBottom:16}}>{weekLabel}</div>
      {tasks.length===0?<div style={{textAlign:"center",padding:60,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:14}}>No tasks this week.</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {tasks.map(function(task,i){
            var tc=task.type==="prep"?STAGE.prep:task.type==="harvest"?STAGE.harvest:STAGE.grow;
            return (
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,background:COLORS.bark,borderRadius:8,padding:"12px 16px",border:"1px solid "+tc.border+"40"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:tc.border,marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,fontWeight:700,color:tc.border,textTransform:"uppercase",letterSpacing:"0.08em"}}>{task.label}</span>
                    <span style={{fontFamily:"'Inter', sans-serif",fontSize:14,color:COLORS.cream,fontWeight:500}}>{task.variety}</span>
                    <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted}}>- {task.bed}</span>
                  </div>
                  {task.detail&&<div style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:COLORS.muted}}>{task.detail}</div>}
                </div>
                <div style={{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted,flexShrink:0}}>{task.date.toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



function ConfigView(props) {
  var config = props.config;
  var setConfig = props.setConfig;
  var S={section:{fontFamily:"'Inter', sans-serif",color:COLORS.straw,fontSize:16,fontWeight:600,margin:"0 0 12px"},hint:{fontFamily:"'DM Mono', monospace",fontSize:11,color:COLORS.muted+"80"}};
  var lbl={fontSize:11,fontFamily:"'DM Mono', monospace",color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em"};
  var lastFrostDate=config.lastFrost?new Date("2025-"+config.lastFrost+"T12:00:00"):null;
  var firstFrostDate=config.firstFrost?new Date("2025-"+config.firstFrost+"T12:00:00"):null;
  var ffWindow=lastFrostDate&&firstFrostDate?Math.round((firstFrostDate-lastFrostDate)/86400000):null;
  function upd(key,val){setConfig(Object.assign({},config,{[key]:val}));}
  function row(label,child){return <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}><label style={lbl}>{label}</label>{child}</div>;}
  return (
    <div>
      <h2 style={{margin:"0 0 20px",fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Config</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,alignItems:"start"}}>
        <div>
          <h3 style={S.section}>Farm</h3>
          {row("Farm Name",<input style={inp} value={config.farmName||""} onChange={function(e){upd("farmName",e.target.value);}}/>)}
          {row("Location",<input style={inp} value={config.location||""} onChange={function(e){upd("location",e.target.value);}}/>)}
          {row("ZIP Code",<div style={{display:"flex",alignItems:"center",gap:12}}><input style={Object.assign({},inp,{width:100})} value={config.zipCode||""} onChange={function(e){upd("zipCode",e.target.value);}}/><span style={S.hint}>Live climate lookup coming soon</span></div>)}
          <h3 style={S.section}>Frost Dates</h3>
          {row("Last Spring Frost (MM-DD)",<div style={{display:"flex",alignItems:"center",gap:12}}><input style={Object.assign({},inp,{width:100})} value={config.lastFrost||""} onChange={function(e){upd("lastFrost",e.target.value);}}/><span style={S.hint}>e.g. 04-15</span></div>)}
          {row("First Fall Frost (MM-DD)",<div style={{display:"flex",alignItems:"center",gap:12}}><input style={Object.assign({},inp,{width:100})} value={config.firstFrost||""} onChange={function(e){upd("firstFrost",e.target.value);}}/><span style={S.hint}>e.g. 11-01</span></div>)}
          {ffWindow&&row("Frost-free Window",<span style={{fontFamily:"'DM Mono', monospace",fontSize:14,color:COLORS.cream}}>{ffWindow} days</span>)}
          {row("Soil Workable",<input style={inp} type="date" value={config.soilWorkableDate||""} onChange={function(e){upd("soilWorkableDate",e.target.value);}}/>)}
          {row("Min Soil Temp Date",<input style={inp} type="date" value={config.minSoilTempDate||""} onChange={function(e){upd("minSoilTempDate",e.target.value);}}/>)}
        </div>
        <div>
          <h3 style={S.section}>Market Season</h3>
          {row("First Market",<input style={inp} type="date" value={config.firstMarket||""} onChange={function(e){upd("firstMarket",e.target.value);}}/>)}
          {row("First Harvest",<input style={inp} type="date" value={config.firstHarvest||""} onChange={function(e){upd("firstHarvest",e.target.value);}}/>)}
          {row("Last Harvest",<input style={inp} type="date" value={config.lastHarvest||""} onChange={function(e){upd("lastHarvest",e.target.value);}}/>)}
          {row("Last Market",<input style={inp} type="date" value={config.lastMarket||""} onChange={function(e){upd("lastMarket",e.target.value);}}/>)}
          <h3 style={S.section}>Display</h3>
          {row("Calendar View",<div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={function(){upd("trimCalendar",!config.trimCalendar);}} style={{background:config.trimCalendar!==false?COLORS.leaf:"transparent",border:"1px solid "+(config.trimCalendar!==false?COLORS.leaf:COLORS.clay),borderRadius:5,color:config.trimCalendar!==false?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:12,padding:"6px 14px",cursor:"pointer"}}>{config.trimCalendar!==false?"Trim to season":"Full year"}</button><span style={S.hint}>Show only weeks with activity</span></div>)}
          <h3 style={S.section}>Bed Dimensions</h3>
          {row("Standard Bed Length (ft)",<div style={{display:"flex",alignItems:"center",gap:12}}><input style={Object.assign({},inp,{width:80})} type="number" value={config.bedLengthFt||8} onChange={function(e){upd("bedLengthFt",+e.target.value);}}/><span style={S.hint}>Used for yield calculations</span></div>)}
          {row("Standard Bed Width (in)",<div style={{display:"flex",alignItems:"center",gap:12}}><input style={Object.assign({},inp,{width:80})} type="number" value={config.bedWidthIn||30} onChange={function(e){upd("bedWidthIn",+e.target.value);}}/><span style={S.hint}>Fortier standard: 30"</span></div>)}
          {row("Bed Gap Tolerance (ft)",<div style={{display:"flex",alignItems:"center",gap:12}}><input style={Object.assign({},inp,{width:80})} type="number" step={0.25} value={config.bedGapFt||0.5} onChange={function(e){upd("bedGapFt",+e.target.value);}}/><span style={S.hint}>Fit tolerance when packing</span></div>)}
        </div>
      </div>
    </div>
  );
}


function BedPlannerView(props) {
  var varieties = props.varieties;
  var plantings = props.plantings;
  var setPlantings = props.setPlantings;
  var beds = props.beds;
  var config = props.config;
  var bedSortMode = props.bedSortMode;
  var setSortMode = props.setSortMode;
  function getV(id){return varieties.find(function(v){return v.id===id;});}
  var anchorDay=config&&config.firstHarvest?new Date(config.firstHarvest+"T12:00:00").getDay():1;
  var CELL_W=30;
  var ROW_H=38;
  var LABEL_W=155;
  var scrollRef=useRef(null);
  var configTrim3=(config&&config.trimCalendar!==undefined)?config.trimCalendar:true;
  var [trimView, setTrimView] = useState(configTrim3);
  var [assignments, setAssignments] = useState({});
  var [dragging, setDragging] = useState(null);
  var [dragOver, setDragOver] = useState(null);
  var [repacked, setRepacked] = useState(false);
  var years=plantings.map(function(p){var d=p.harvestDate||p.sowDate;return d?new Date(d).getFullYear():null;}).filter(Boolean);
  var [year, setYear] = useState(years.length>0?Math.min.apply(null,years):new Date().getFullYear());
  useEffect(function(){
    setAssignments(packPlantings(plantings,varieties,beds,config&&config.bedGapFt||0.5));
  },[plantings.length,beds.length]);

  function repack(){
    setAssignments(Object.assign({},packPlantings(plantings,varieties,beds,config&&config.bedGapFt||0.5)));
    setRepacked(true);setTimeout(function(){setRepacked(false);},1200);
  }
  function clearPacking(){
    setPlantings(plantings.map(function(p){return p.pinnedBedId?p:Object.assign({},p,{pinnedBedId:null});}));
    setAssignments(function(prev){
      var next=Object.assign({},prev);
      Object.keys(next).forEach(function(pid){
        var p=plantings.find(function(x){return x.id===+pid;});
        if(p&&!p.pinnedBedId) delete next[pid];
      });
      return next;
    });
  }
  function handleDrop(bedId){
    if(!dragging) return;
    var pid=dragging.plantingId;
    setAssignments(function(prev){return Object.assign({},prev,{[pid]:{bedId:bedId,startFt:0,plantingId:pid}});});
    setPlantings(plantings.map(function(p){return p.id===pid?Object.assign({},p,{pinnedBedId:bedId,pinnedStartFt:0}):p;}));
    setDragging(null);setDragOver(null);
  }
  var allWeeks=weeksForYear(year,anchorDay);
  var weeks=(function(){
    if(!trimView||plantings.length===0) return allWeeks;
    var earliest=null;var latest=null;
    plantings.forEach(function(p){
      var v=getV(p.varietyId);var m=v?calcMilestones(p,v):null;if(!m) return;
      if(!earliest||m.occupyStart<earliest) earliest=m.occupyStart;
      if(!latest||m.harvestEnd>latest) latest=m.harvestEnd;
    });
    if(!earliest||!latest) return allWeeks;
    var pad=2;
    return allWeeks.filter(function(w,i){return i>=Math.max(0,allWeeks.findIndex(function(w2){return addDays(w2,6)>=earliest;})-pad)&&addDays(w,0)<=addDays(latest,pad*7);});
  })();
  var sortedBeds=beds.slice().sort(function(a,b){
    var mode=bedSortMode||"smart";
    if(mode==="manual") return 0;
    if(mode==="name") return a.name.localeCompare(b.name,undefined,{numeric:true});
    if(mode==="width") return (b.widthIn||30)-(a.widthIn||30)||(a.name.localeCompare(b.name,undefined,{numeric:true}));
    var aTag=(a.tag||"").trim();var bTag=(b.tag||"").trim();
    if(aTag&&!bTag) return -1;if(!aTag&&bTag) return 1;
    if(aTag&&bTag&&aTag!==bTag) return aTag.localeCompare(bTag);
    var wDiff=(b.widthIn||30)-(a.widthIn||30);if(wDiff!==0) return wDiff;
    return a.name.localeCompare(b.name,undefined,{numeric:true});
  });
  var monthGroups=[];
  weeks.forEach(function(w,i){
    var label=addDays(w,3).toLocaleDateString("en-CA",{month:"short"});
    var mglen=monthGroups.length;
    var last=mglen>0?monthGroups[mglen-1]:null;
    if(!last||last.label!==label) monthGroups.push({label:label,count:1});
    else last.count++;
  });
  var seasonStart=Infinity;var seasonEnd=-Infinity;
  plantings.forEach(function(p){
    var m=calcMilestones(p,getV(p.varietyId));if(!m) return;
    if(m.occupyStart.getTime()<seasonStart) seasonStart=m.occupyStart.getTime();
    if(m.harvestEnd.getTime()>seasonEnd) seasonEnd=m.harvestEnd.getTime();
  });
  var bedSections={};
  sortedBeds.forEach(function(bed){
    var bedPlantings=plantings.filter(function(p){var asgn=assignments[p.id];return asgn&&asgn.bedId===bed.id;});
    if(bedPlantings.length===0){bedSections[bed.id]=[{label:bed.name,startFt:0,endFt:bed.lengthFt||8}];return;}
    var posSet=new Set(bedPlantings.map(function(p){return assignments[p.id]&&assignments[p.id].startFt||0;}));
    var positions=[];posSet.forEach(function(v){positions.push(v);});positions.sort(function(a,b){return a-b;});
    var bedLen=bed.lengthFt||8;
    if(positions.length<=1){bedSections[bed.id]=[{label:bed.name,startFt:0,endFt:bedLen}];}
    else{
      var letters="abcdefghijklmnopqrstuvwxyz";
      bedSections[bed.id]=positions.map(function(ft,i){
        var i1=i+1;
        return {label:bed.name+letters[i],startFt:ft,endFt:i<positions.length-1?positions[i1]:bedLen};
      });
    }
  });
  var bedRows=sortedBeds.reduce(function(acc,bed){
    var sections=bedSections[bed.id]||[{label:bed.name,startFt:0,endFt:bed.lengthFt||8}];
    sections.forEach(function(sec){acc.push({bed:bed,sec:sec});});
    return acc;
  },[]);
  var unassigned=plantings.filter(function(p){var a=assignments[p.id];return !a||a===null;});
  var usedBedIds=[];
  Object.values(assignments).forEach(function(a){if(a&&a.bedId&&usedBedIds.indexOf(a.bedId)<0) usedBedIds.push(a.bedId);});
  var lockedCount=plantings.filter(function(p){return p.pinnedBedId;}).length;
  var sortModes=[["smart","Tagged First"],["width","By Width"],["name","By Name"],["manual","Manual"]];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:26,fontWeight:700}}>Bed Planner</h2>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={function(){setYear(function(y){return y-1;});}} style={{background:COLORS.bark,border:"1px solid "+COLORS.clay,borderRadius:5,color:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"5px 14px",cursor:"pointer"}}>&#9664;</button>
          <span style={{fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:20,minWidth:52,textAlign:"center"}}>{year}</span>
          <button onClick={function(){setYear(function(y){return y+1;});}} style={{background:COLORS.bark,border:"1px solid "+COLORS.clay,borderRadius:5,color:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:14,padding:"5px 14px",cursor:"pointer"}}>&#9654;</button>
          <button onClick={function(){setTrimView(function(t){return !t;});}} style={{background:trimView?COLORS.leaf:"transparent",border:"1px solid "+(trimView?COLORS.leaf:COLORS.clay),borderRadius:5,color:trimView?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"5px 10px",cursor:"pointer"}}>TRIM</button>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
          <span style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:COLORS.muted}}>
            {beds.length} beds &middot; <strong style={{color:COLORS.sprout}}>{usedBedIds.length} used</strong> &middot; {beds.length-usedBedIds.length} free
            {unassigned.length>0&&<span style={{color:COLORS.frostWarn}}> &middot; {unassigned.length} unplaced</span>}
            {lockedCount>0&&<span style={{color:COLORS.harvestLight}}> &middot; {lockedCount} locked</span>}
          </span>
          <div style={{display:"flex",gap:6}}>
            <button onClick={clearPacking} style={{background:"transparent",border:"1px solid "+COLORS.clay,borderRadius:6,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"5px 12px",cursor:"pointer"}}>CLEAR PACKING</button>
            <button onClick={repack} style={{background:repacked?COLORS.leaf:"transparent",border:"1px solid "+(repacked?COLORS.leaf:COLORS.clay),borderRadius:6,color:repacked?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"5px 12px",cursor:"pointer"}}>{repacked?"PACKED":"RE-PACK"}</button>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginRight:4}}>Sort:</span>
          {sortModes.map(function(item){
            var mode=item[0];var label=item[1];
            return <button key={mode} onClick={function(){setSortMode(mode);}} style={{background:bedSortMode===mode?COLORS.leaf:"transparent",border:"1px solid "+(bedSortMode===mode?COLORS.leaf:COLORS.clay),borderRadius:5,color:bedSortMode===mode?COLORS.white:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"4px 10px",cursor:"pointer"}}>{label}</button>;
          })}
        </div>
      </div>
      {unassigned.length>0&&<div style={{background:COLORS.frostWarn+"15",border:"1px solid "+COLORS.frostWarn+"50",borderRadius:8,padding:"10px 14px",marginBottom:14,fontFamily:"'DM Mono', monospace",fontSize:13,color:COLORS.harvestLight}}>&#9888; {unassigned.length} unplaced: {unassigned.map(function(p){var v=getV(p.varietyId);return (v&&v.name||"?")+" ("+(v&&v.requiredTag?"needs tag: "+v.requiredTag:"no space")+")";}).join(", ")}</div>}
      {beds.length===0?<div style={{textAlign:"center",padding:60,color:COLORS.muted,fontFamily:"'DM Mono', monospace",fontSize:14}}>Define beds in the Beds tab first.</div>:(
        <div style={{display:"flex",background:COLORS.bark,borderRadius:10,overflow:"hidden",border:"1px solid "+COLORS.clay+"30"}}>
          <div style={{flexShrink:0,width:LABEL_W,borderRight:"1px solid "+COLORS.clay+"30"}}>
            <div style={{height:22,borderBottom:"1px solid "+COLORS.clay+"30",background:COLORS.soil+"60"}}/>
            <div style={{height:ROW_H,borderBottom:"1px solid "+COLORS.clay+"20",background:COLORS.soil+"40",display:"flex",alignItems:"center",paddingLeft:12}}><span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Bed</span></div>
            {bedRows.map(function(item){
              var bed=item.bed;var sec=item.sec;
              return (
                <div key={bed.id+"-"+sec.startFt} style={{height:ROW_H,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 8px",borderBottom:"1px solid "+COLORS.clay+"20",gap:2}}>
                  <span style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:COLORS.cream,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sec.label}</span>
                  <span style={{fontFamily:"'DM Mono', monospace",fontSize:9,color:COLORS.muted}}>{bed.lengthFt||8}ft x {bed.widthIn||30}"</span>
                </div>
              );
            })}
          </div>
          <div ref={scrollRef} style={{overflowX:"auto",flex:1}}>
            <div style={{width:weeks.length*CELL_W}}>
              <div style={{display:"flex",height:22,background:COLORS.soil+"60",borderBottom:"1px solid "+COLORS.clay+"30"}}>
                {monthGroups.map(function(mg,i){return <div key={i} style={{width:mg.count*CELL_W,flexShrink:0,display:"flex",alignItems:"center",paddingLeft:6,fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.straw,textTransform:"uppercase",letterSpacing:"0.1em",borderLeft:i>0?"1px solid "+COLORS.clay+"30":"none",overflow:"hidden",whiteSpace:"nowrap"}}>{mg.label}</div>;})}
              </div>
              <div style={{display:"flex",height:ROW_H,background:COLORS.soil+"40",borderBottom:"1px solid "+COLORS.clay+"20",alignItems:"center"}}>
                {weeks.map(function(w,i){
                  var wim1=i-1;
                  var prevW=i>0?weeks[wim1]:null;
                  var isNew=i===0||addDays(w,3).getMonth()!==(prevW&&addDays(prevW,3).getMonth());
                  return <div key={i} style={{width:CELL_W,flexShrink:0,textAlign:"center",fontFamily:"'DM Mono', monospace",fontSize:9,color:isNew?COLORS.straw:COLORS.muted,borderLeft:isNew&&i>0?"1px solid "+COLORS.clay+"30":"none"}}>{w.getDate()}</div>;
                })}
              </div>
              {bedRows.map(function(rowItem){
                var bed=rowItem.bed;var sec=rowItem.sec;
                var isDragTarget=dragOver&&dragOver.bedId===bed.id;
                var yearStart=weeks[0];
                var dayX=function(d){return Math.round((new Date(d)-yearStart)/(1000*60*60*24))*CELL_W/7;};
                var bedPlantings=plantings.filter(function(p){var asgn=assignments[p.id];return asgn&&asgn.bedId===bed.id&&(asgn.startFt||0)===sec.startFt;});
                return (
                  <div key={bed.id+"-"+sec.startFt}
                    style={{position:"relative",height:ROW_H,borderBottom:"1px solid "+COLORS.clay+"20",background:isDragTarget?COLORS.leaf+"10":"transparent"}}
                    onDragOver={function(e){e.preventDefault();setDragOver({bedId:bed.id});}}
                    onDrop={function(){handleDrop(bed.id);}}
                    onDragLeave={function(){setDragOver(null);}}>
                    {weeks.map(function(w,i){
                      var wim1=i-1;
                      var prevW=i>0?weeks[wim1]:null;
                      var isNew=i===0||addDays(w,3).getMonth()!==(prevW&&addDays(prevW,3).getMonth());
                      return <div key={i} style={{position:"absolute",left:i*CELL_W,top:0,width:CELL_W,height:"100%",borderLeft:isNew&&i>0?"1px solid "+COLORS.clay+"15":"none",pointerEvents:"none"}}/>;
                    })}
                    {weeks.map(function(w,i){
                      var inSeason=w.getTime()<=seasonEnd&&addDays(w,6).getTime()>=seasonStart;
                      if(!inSeason) return null;
                      var covered=bedPlantings.some(function(p){var v=getV(p.varietyId);var m=calcMilestones(p,v);if(!m) return false;return w<m.harvestEnd&&addDays(w,6)>=m.occupyStart;});
                      if(covered) return null;
                      return <div key={"opp"+i} style={{position:"absolute",left:i*CELL_W+1,top:4,width:CELL_W-2,height:ROW_H-8,background:COLORS.opportunity,border:"1px dashed #1A3A5A",borderRadius:2,opacity:0.4,pointerEvents:"none"}}/>;
                    })}
                    {bedPlantings.map(function(p){
                      var v=getV(p.varietyId);
                      var m=calcMilestones(p,v);if(!m) return null;
                      var bars=buildBars(p,v,m,dayX,CELL_W,true);
                      return (
                        <React.Fragment key={p.id}>
                          {bars.map(function(bar){
                            return (
                              <div key={bar.key} draggable={bar.key!=="prep"&&bar.key!=="indoorS"} onDragStart={function(){setDragging({plantingId:p.id});}}
                                style={{position:"absolute",left:Math.max(0,bar.x),top:4,height:ROW_H-8,width:Math.max(3,bar.w),background:bar.style.bg,border:"1px solid "+bar.style.border,borderRadius:3,display:"flex",alignItems:"center",justifyContent:bar.key.charAt(0)==="h"?"center":"flex-start",overflow:"hidden",boxSizing:"border-box",paddingLeft:bar.key.charAt(0)==="h"?0:4,cursor:"grab",zIndex:bar.key.charAt(0)==="h"?2:1}}>
                                <span style={{fontFamily:"'DM Mono', monospace",fontSize:8,fontWeight:700,color:COLORS.cream,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{bar.label}</span>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {beds.length>0&&plantings.length>0&&(
        <div style={{marginTop:14,padding:"10px 16px",background:COLORS.soil+"80",borderRadius:8,display:"flex",gap:24,fontFamily:"'DM Mono', monospace",fontSize:12,color:COLORS.muted,flexWrap:"wrap"}}>
          <span>Beds: <strong style={{color:COLORS.cream}}>{beds.length}</strong></span>
          <span>Used: <strong style={{color:COLORS.sprout}}>{usedBedIds.length}</strong></span>
          <span>Free: <strong style={{color:COLORS.harvestLight}}>{beds.length-usedBedIds.length}</strong></span>
          <span>Unplaced: <strong style={{color:unassigned.length>0?COLORS.frostWarn:COLORS.sprout}}>{unassigned.length}</strong></span>
          <span>Rows: <strong style={{color:COLORS.cream}}>{bedRows.length}</strong></span>
        </div>
      )}
    </div>
  );
}

var STORAGE_KEY="mgp-state-v1";

var defaultConfig={trimCalendar:true,farmName:"My Market Garden",location:"Langley WA",zipCode:"98260",lastFrost:"04-15",firstFrost:"11-01",firstMarket:"2025-05-14",firstHarvest:"2025-05-14",lastHarvest:"2025-10-25",lastMarket:"2025-10-25",soilWorkableDate:"2025-02-20",minSoilTempDate:"2025-03-01",bedLengthFt:8,bedWidthIn:30,bedGapFt:0.5};

export default function App(){
  var [tab, setTab] = useState("varieties");
  var [loaded, setLoaded] = useState(false);
  var [bedSortMode, setBedSortMode] = useState("smart");
  var [varieties, setVarieties] = useState(defaultVarieties);
  var [plantings, setPlantings] = useState(defaultPlantings);
  var [beds, setBeds] = useState(defaultBeds);
  var [assignments, setAssignments] = useState({});
  var [config, setConfig] = useState(defaultConfig);

  useEffect(function(){
    async function load(){
      try{
        var result=await localStorage.getItem(STORAGE_KEY);
        if(result&&result.value){
          var saved=JSON.parse(result.value);
          if(saved.varieties) setVarieties(saved.varieties);
          if(saved.plantings) setPlantings(saved.plantings);
          if(saved.beds) setBeds(saved.beds);
          if(saved.config) setConfig(saved.config);
          if(saved.tab) setTab(saved.tab);
          if(saved.bedSortMode) setBedSortMode(saved.bedSortMode);
        }
      }catch(e){}
      setLoaded(true);
    }
    load();
  },[]);

  useEffect(function(){
    if(!loaded) return;
    var state=JSON.stringify({varieties:varieties,plantings:plantings,beds:beds,config:config,tab:tab,bedSortMode:bedSortMode});
    localStorage.setItem(STORAGE_KEY,state);
  },[loaded,varieties,plantings,beds,config,tab,bedSortMode]);

  useEffect(function(){
    setAssignments(packPlantings(plantings,varieties,beds,config&&config.bedGapFt||0.5));
  },[plantings,varieties,beds]);

  function fmtFrost(s){if(!s) return "-";var p=s.split("-");if(p.length<2) return s;var months=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return (months[+p[0]]||p[0])+" "+p[1];}

  var tabs=[
    {id:"varieties",label:"Varieties"},
    {id:"beds-mgmt",label:"Beds"},
    {id:"succession",label:"Harvest Planner"},
    {id:"planner",label:"Crop Planner"},
    {id:"calendar",label:"Crop Calendar"},
    {id:"beds",label:"Bed Planner"},
    {id:"fieldsheet",label:"Field Sheet"},
    {id:"config",label:"Config"},
  ];

  return (
    <div style={{minHeight:"100vh",background:COLORS.soil,fontFamily:"'Inter', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
      <div style={{padding:"0 12px 40px"}}>
        <div style={{padding:"12px 0 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:12}}>
              <h1 style={{margin:0,fontFamily:"'Inter', sans-serif",color:COLORS.cream,fontSize:24,fontWeight:600,letterSpacing:"-0.01em"}}>Market Garden Planner</h1>
              <span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:COLORS.muted,letterSpacing:"0.15em"}}>{config.location&&config.location.toUpperCase()||"LEAN GROWING"}</span>
              {loaded&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:9,color:COLORS.sprout,letterSpacing:"0.1em"}}>* SAVED</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={function(){setTab("config");}} style={{display:"flex",alignItems:"center",gap:10,background:COLORS.bark,border:"1px solid "+COLORS.clay+"40",borderRadius:8,padding:"6px 14px",cursor:"pointer"}}>
                <span style={{fontSize:10,color:COLORS.frost,fontFamily:"'DM Mono', monospace",letterSpacing:"0.08em"}}>LF {fmtFrost(config.lastFrost)}</span>
                <span style={{fontSize:10,color:COLORS.muted,fontFamily:"'DM Mono', monospace"}}>-</span>
                <span style={{fontSize:10,color:COLORS.frost,fontFamily:"'DM Mono', monospace",letterSpacing:"0.08em"}}>FF {fmtFrost(config.firstFrost)}</span>
              </button>
            </div>
          </div>
          <div style={{display:"flex",gap:0,marginTop:16,borderBottom:"1px solid "+COLORS.clay,background:COLORS.bark,overflowX:"auto",WebkitOverflowScrolling:"touch",flexShrink:0}}>
            {tabs.map(function(t){
              return <button key={t.id} onClick={function(){setTab(t.id);}} style={{background:"transparent",border:"none",borderBottom:tab===t.id?"2px solid "+COLORS.sprout:"2px solid transparent",color:tab===t.id?COLORS.cream:COLORS.straw,fontFamily:"'DM Mono', monospace",fontSize:11,padding:"10px 12px 12px",cursor:"pointer",letterSpacing:"0.04em",whiteSpace:"nowrap",flexShrink:0}}>{t.label}</button>;
            })}
          </div>
        </div>
        <div style={{paddingTop:24}}>
          {tab==="varieties"&&<VarietiesTab varieties={varieties} setVarieties={setVarieties}/>}
          {tab==="beds-mgmt"&&<BedsView beds={beds} setBeds={setBeds} config={config} sortMode={bedSortMode} setSortMode={setBedSortMode}/>}
          {tab==="succession"&&<SuccessionView varieties={varieties} plantings={plantings} setPlantings={setPlantings} config={config} setTab={setTab}/>}
          {tab==="planner"&&<CropPlannerView varieties={varieties} plantings={plantings} setPlantings={setPlantings} lastFrost={config.lastFrost} config={config} assignments={assignments} beds={beds}/>}
          {tab==="calendar"&&<CropCalendarView varieties={varieties} plantings={plantings} lastFrost={config.lastFrost} firstFrost={config.firstFrost} config={config}/>}
          {tab==="beds"&&<BedPlannerView varieties={varieties} plantings={plantings} setPlantings={setPlantings} beds={beds} config={config} bedSortMode={bedSortMode} setSortMode={setBedSortMode}/>}
          {tab==="fieldsheet"&&<FieldSheetView varieties={varieties} plantings={plantings} beds={beds} assignments={assignments} config={config}/>}
          {tab==="config"&&<ConfigView config={config} setConfig={setConfig}/>}
        </div>
      </div>
    </div>
  );
}
