import { COLORS, STAGE } from "./constants.js";
import { CLIMATE, LAT_RAD } from "./user-config.js";


// Langley WA 98260 monthly climate normals [hidegF, lodegF]
// Source: NOAA/BestPlaces/climate-data.org 1991-2021 normals
// TODO: replace with live NOAA API lookup by zip codevar WHIDBEY_LAT_RAD = 48 * Math.PI / 180;
export var PTU_OPT_HOURS = 14; // arugula optimal photoperiod

export function dayLengthHours(date){
  var doy = Math.floor((date - new Date(date.getFullYear(),0,0)) / 86400000);
  var decl = 0.4093 * Math.sin(2 * Math.PI * (284 + doy) / 365);
  var ha = Math.acos(-Math.tan(LAT_RAD) * Math.tan(decl));
  return (2 * ha * 24) / (2 * Math.PI);
}

// Daily Photothermal Units (outdoor only).
// GDD weighted by photoperiod factor -- short days slow growth proportionally.
// Calibrated so May 1 sow at Whidbey accumulates target in exactly DTM days.
export function dailyGDD(date, baseTemp){
  var mo=date.getMonth()+1;
  var hiLo = CLIMATE[mo];
  var gdd = Math.max(0, (hiLo[0]+hiLo[1])/2 - baseTemp);
  var photoFactor = Math.min(dayLengthHours(date), PTU_OPT_HOURS) / PTU_OPT_HOURS;
  return gdd * photoFactor;
}

// PTU-adjusted days to maturity.
// DTM is the floor -- short days stretch maturity, never compress below DTM.
export function gddDaysToMaturity(sowDate, variety){
  if(!variety.gddBase || !variety.gddToMaturity) return variety.daysToMaturity;
  var acc=0, days=0;
  var d = new Date(sowDate+"T12:00:00");
  while(acc < variety.gddToMaturity && days < 365){
    acc += dailyGDD(d, variety.gddBase);
    d.setDate(d.getDate()+1);
    days++;
  }
  return Math.max(days, variety.daysToMaturity);
}

// Work backwards from target harvest date to find sow date.
// Finds the latest sow date where sow + gddDaysToMaturity lands on or before target.
export function gddSowFromHarvest(targetHarvestDate, variety){
  var target = new Date(targetHarvestDate+"T12:00:00");
  // No GDD data -- simple subtraction
  if(!variety.gddBase || !variety.gddToMaturity){
    var d = new Date(target);
    d.setDate(d.getDate() - variety.daysToMaturity);
    return d.toISOString().slice(0,10);
  }
  // Search from 180 days back forward, return last sow where harvest <= target
  var lastValid = null;
  for(var offset=180; offset>=1; offset--){
    var sow = new Date(target);
    sow.setDate(sow.getDate() - offset);
    var sowStr = sow.toISOString().slice(0,10);
    var maturityDays = gddDaysToMaturity(sowStr, variety);
    var harvestOpen = new Date(sow);
    harvestOpen.setDate(harvestOpen.getDate() + maturityDays);
    if(harvestOpen <= target) lastValid = sowStr;
    else if(lastValid) return lastValid;
  }
  return lastValid || targetHarvestDate;
}

export var defaultPlantings = [];

export var defaultBeds = [
  {id:1, name:"WF 1", tag:"wf", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:2, name:"WF 2", tag:"wf", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:3, name:"WF 3", tag:"wf", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:4, name:"Bed 1", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:5, name:"Bed 2", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:6, name:"Bed 3", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:7, name:"Bed 4", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:8, name:"Bed 5", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:9, name:"Bed 6", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:10, name:"Bed 7", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:11, name:"Bed 8", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:12, name:"Bed 9", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:13, name:"Bed 10", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:14, name:"Bed 11", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:15, name:"Bed 12", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:16, name:"Bed 13", tag:"", lengthFt:8, widthIn:30, availFrom:"", availTo:""},
  {id:17, name:"Short 1", tag:"", lengthFt:4, widthIn:24, availFrom:"", availTo:""},
  {id:18, name:"Short 2", tag:"", lengthFt:4, widthIn:24, availFrom:"", availTo:""},
  {id:19, name:"Strip 1", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
  {id:20, name:"Strip 2", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
  {id:21, name:"Strip 3", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
  {id:22, name:"Strip 4", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
  {id:23, name:"Strip 5", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
  {id:24, name:"Strip 6", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
  {id:25, name:"Strip 7", tag:"", lengthFt:8, widthIn:12, availFrom:"", availTo:""},
];

export function generateId(arr){
  if(arr.length===0) return 1;
  var maxId=0;
  for(var gi=0;gi<arr.length;gi++){if(arr[gi].id>maxId) maxId=arr[gi].id;}
  return maxId+1;
}
export function addDays(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r;}
export function addWeeks(d,n){return addDays(d,n*7);}
export function weekStartFromAnchor(d, anchorDay) {
  // anchorDay: 0=Sun, 1=Mon ... 6=Sat. Default Monday(1)
  var date=new Date(d);date.setHours(0,0,0,0);
  var day=date.getDay();
  var diff=(day-anchorDay+7)%7;
  date.setDate(date.getDate()-diff);
  return date;
}
export function weekStart(d){return weekStartFromAnchor(d,1);}
export function weeksForYear(year, anchorDay){
  var ad=anchorDay||1;
  var result=[];var cur=weekStartFromAnchor(new Date(year,0,1),ad);
  for(var i=0;i<54;i++){var mon=new Date(cur);var sun=addDays(mon,6);if(mon.getFullYear()===year||sun.getFullYear()===year)result.push(mon);else if(result.length>0)break;cur=addWeeks(cur,1);}
  return result;
}
export function calcMilestones(planting,variety){
  if(!variety) return null;
  var sowDateStr = planting.sowDate;
  if(planting.harvestDate && variety) {
    sowDateStr = gddSowFromHarvest(planting.harvestDate, variety);
  }
  if(!sowDateStr) return null;
  var tpOutDate=new Date(sowDateStr);
  var isTP=variety.sowMethod==="Transplant"||variety.sowMethod==="Either";
  var indoorSowDate=isTP&&variety.transplantLeadWeeks>0?addWeeks(tpOutDate,-variety.transplantLeadWeeks):null;
  var prepStart=(variety.bedPrepWeeks>0)?addWeeks(tpOutDate,-variety.bedPrepWeeks):null;
  var adjustedDays=gddDaysToMaturity(sowDateStr,variety);
  var nominalDays=variety.daysToMaturity;
  var growEnd=addDays(tpOutDate,adjustedDays);
  // harvestStart for calendar display is always growEnd
  // planningBuffer shifts field sheet task reminders earlier, not the visual
  var buffer=variety.planningBufferDays||0;
  var harvestStart=buffer>0?addDays(growEnd,-buffer):growEnd;
  var hww = planting.fieldHoldWeeks||variety.harvestWindowWeeks||0;
  var harvestEnd;
  if(hww===0){
    // Continuous crop — harvest until first frost
    // Estimate frost date from the planting year
    var yr2=growEnd.getFullYear();
    // Use a long default (end of Oct) if no frost config available
    harvestEnd=new Date(yr2+"-11-01T12:00:00");
  } else {
    harvestEnd=addWeeks(growEnd,hww);
  }
  var occupyStart=prepStart||tpOutDate;
  return{indoorSowDate:indoorSowDate,prepStart:prepStart,tpOutDate:tpOutDate,isTP:isTP,growEnd:growEnd,harvestStart:harvestStart,harvestEnd:harvestEnd,occupyStart:occupyStart,adjustedDays:adjustedDays,nominalDays:nominalDays};
}
export function stageForWeek(weekMon,m){
  if(!m)return"empty";
  var weekSun=addDays(weekMon,6);
  var ws=function(d){return d?weekStart(d):null;};
  var inRange=(s,e)=>s&&e&&weekMon<e&&weekSun>=s;
  var weekHas=d=>d&&weekMon<=d&&d<=weekSun;
  if(m.indoorSowDate&&weekHas(ws(m.indoorSowDate)))return"indoorS";
  if(m.prepStart&&inRange(ws(m.prepStart),m.tpOutDate))return"prep";
  if(weekHas(ws(m.tpOutDate)))return"sowTP";
  if(inRange(m.tpOutDate,m.growEnd))return"grow";
  if(inRange(m.harvestStart||m.growEnd,m.harvestEnd))return"harvest";
  return"empty";
}
export function cellLabel(stage,isTP){if(stage==="sowTP")return isTP?"TP":"S";if(stage==="indoorS")return"S";if(stage==="harvest")return"H";return"";}
export function isFrostRisk(planting,variety,lastFrost){
  if(!lastFrost||(variety&&variety.frostHardy))return false;
  var sowStr = planting.harvestDate ? gddSowFromHarvest(planting.harvestDate, variety) : planting.sowDate;
  if(!sowStr) return false;
  var year=new Date(sowStr).getFullYear();
  return new Date(sowStr)<new Date(`${year}-${lastFrost}T12:00:00`);
}

// 2D bin-packing: time x bed-feet
// Each planting occupies N feet of a bed for a time period (occupyStart -> harvestEnd)
// Two plantings can share a bed if their occupied feet don't overlap at the same time
// Gap tolerance: if total feet of simultaneous plantings exceeds bed length by <= gapFt, allow it
// Contiguous rule: planting must fit in a single contiguous free section, no splitting
export function packPlantings(plantings, varieties, beds, gapFt) {
  if(gapFt===undefined) gapFt=0.5;
  if(!beds.length||!plantings.length) return {};

  var getOcc = function(p) {
    var v=varieties.find(function(v){return v.id===p.varietyId;});
    var m=calcMilestones(p,v);
    if(!m) return null;
    var feetNeeded = p.feetOfBed || ((v&&v.feetOfBed)) || 4; // feet this planting needs
    return { start:m.occupyStart.getTime(), end:m.harvestEnd.getTime(), feet:feetNeeded };
  };

  var timeOverlaps = (a,b) => a.start < b.end && b.start < a.end;

  var bedAvail = function(bed,occ) {
    if(!bed.availFrom&&!bed.availTo) return true;
    var bf=bed.availFrom?new Date(bed.availFrom+"T00:00:00").getTime():0;
    var bt=bed.availTo?new Date(bed.availTo+"T23:59:59").getTime():Infinity;
    return occ.start<=bt && occ.end>=bf;
  };

  var bedSatisfies = function(bed, cropTag) {
    if(!cropTag) return true;
    return (bed.tag||"").trim().toLowerCase() === cropTag.trim().toLowerCase();
  };

  // Get all plantings currently assigned to a bed
  var getBedAssignments = function(bedId){
    return Object.entries(asgns)
      .filter(function(e){var a=e[1];return a&&a.bedId===bedId;})
      .map(function(e){var pid=e[0];var po=withOcc.find(function(x){return x.id===+pid;});return {p:po,occ:getOcc(po)};})
      .filter(function(x){return x.p&&x.occ;});
  };

  var findFreeSection = function(bed, newOcc) {
    var bedLen = bed.lengthFt || 8;
    var existing = getBedAssignments(bed.id)
      .filter(function(item){return timeOverlaps(item.occ, newOcc);})
      .map(function(item){var occ=item.occ;var p=item.p;return {start:asgns[p.id].startFt,end:asgns[p.id].startFt+occ.feet};})
      .sort(function(a,b){return a.start - b.start;});

    var totalSimultaneous = existing.reduce(function(sum,e){return sum + (e.end - e.start);}, 0) + newOcc.feet;
    if(totalSimultaneous <= bedLen + gapFt) {
      var cursor = 0;
      for(var si=0;si<existing.length;si++) {
        var seg=existing[si];
        if(seg.start - cursor >= newOcc.feet) return cursor;
        cursor = Math.max(cursor, seg.end);
      }
      if(bedLen - cursor >= newOcc.feet - gapFt) return cursor;
    }
    return null;
  };

  var vOrderSet=new Set(plantings.map(function(p){return p.varietyId;}));
  var vOrder=[];
  vOrderSet.forEach(function(v){vOrder.push(v);});
  var withOcc=plantings.slice().filter(function(p){return getOcc(p);}).sort(function(a,b){
    var oa=getOcc(a);
    var ob=getOcc(b);
    if(oa.start!==ob.start) return oa.start-ob.start;
    return vOrder.indexOf(a.varietyId)-vOrder.indexOf(b.varietyId);
  });

  var asgns={};

  var tryPlace = function(p, eligibleBeds) {
    var occ=getOcc(p); if(!occ) return false;
    // If planting is pinned to a specific bed, assign it there unconditionally
    if(p.pinnedBedId){
      var pinnedBed=eligibleBeds.find(function(b){return b.id===p.pinnedBedId;})||beds.find(function(b){return b.id===p.pinnedBedId;});
      if(pinnedBed){
        asgns[p.id]={bedId:p.pinnedBedId, startFt:p.pinnedStartFt||0, plantingId:p.id};
        return true;
      }
    }

    // Sort: prefer beds with same variety, then beds already in use (pack tight)
    var sorted=eligibleBeds.slice().filter(function(b){return bedAvail(b,occ);}).sort(function(a,b){
      var aHV=Object.values(asgns).some(function(as){return as&&as.bedId===a.id&&withOcc.find(function(x){return x.id===as.plantingId;})&&withOcc.find(function(x){return x.id===as.plantingId;}).varietyId===p.varietyId;});
      var bHV=Object.values(asgns).some(function(as){return as&&as.bedId===b.id&&withOcc.find(function(x){return x.id===as.plantingId;})&&withOcc.find(function(x){return x.id===as.plantingId;}).varietyId===p.varietyId;});
      var aU=Object.values(asgns).some(function(as){return as&&as.bedId===a.id;});
      var bU=Object.values(asgns).some(function(as){return as&&as.bedId===b.id;});
      if(aHV&&!bHV) return -1; if(!aHV&&bHV) return 1;
      if(aU&&!bU) return -1; if(!aU&&bU) return 1;
      return 0;
    })

    for(var bi=0;bi<sorted.length;bi++){
      var bed=sorted[bi];
      var startFt = findFreeSection(bed, occ);
      if(startFt !== null){
        asgns[p.id]={bedId:bed.id, startFt:startFt, plantingId:p.id};
        return true;
      }
    }
    return false;
  };

  var tagged=withOcc.filter(function(p){
    var v=varieties.find(function(v){return v.id===p.varietyId;});
    return ((v&&v.requiredTag)||"").trim().length > 0;
  });
  var untagged=withOcc.filter(function(p){
    var v=varieties.find(function(v){return v.id===p.varietyId;});
    return ((v&&v.requiredTag)||"").trim().length === 0;
  });

  for(var ti2=0;ti2<tagged.length;ti2++){
    var p=tagged[ti2];
    var cropTag=(varieties.find(function(v){return v.id===p.varietyId;})&&varieties.find(function(v){return v.id===p.varietyId;}).requiredTag||"").trim().toLowerCase();
    var eligible=beds.filter(function(b){return bedSatisfies(b,cropTag);});
    if(!tryPlace(p,eligible)) asgns[p.id]=null;
  }
  for(var ui=0;ui<untagged.length;ui++){
    var p=untagged[ui];
    if(!tryPlace(p,beds)) asgns[p.id]=null;
  }
  return asgns;
}


export var inp={background:COLORS.bark,border:`1px solid ${COLORS.clay}`,borderRadius:4,color:COLORS.cream,fontFamily:"'DM Mono', monospace",fontSize:15,padding:"8px 12px",outline:"none",width:"100%",boxSizing:"border-box"};
export var F=function(props){return(<div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:12,fontFamily:"'DM Mono', monospace",color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>{props.label}</label>{props.children}</div>);};

// Shared bar builder -- used by both CropCalendarView and BedPlannerView
// showName: true = show variety name on grow bar (bed planner), false = show days (crop calendar)
export function buildBars(p, v, m, dayX, CELL_W, showName){
  if(showName===undefined) showName=false;
  if(!m) return [];
  var isTP=(v&&v.sowMethod)==="Transplant"||(v&&v.sowMethod)==="Either";
  var bars=[];

  if(isTP){
    // Transplant crop sequence: SI → BP → TP → grow(DTM from TP) → H

    // SI bar: indoor sow date, 1 cell wide
    if(m.indoorSowDate){
      bars.push({key:"indoorS",x:dayX(m.indoorSowDate),w:CELL_W,style:STAGE.indoorS,label:"SI"});
    }

    // BP bar: from prepStart to tpOutDate — only show if 2+ weeks
    if(m.prepStart&&(v&&(v.bedPrepWeeks||0)>=2)){
      var bpX=dayX(m.prepStart);
      var bpW=dayX(m.tpOutDate)-bpX;
      if(bpW>0) bars.push({key:"prep",x:bpX,w:bpW,style:STAGE.prep,label:"BP"});
    }

    // Grow bar: from tpOutDate, DTM days (from transplant = variety.daysToMaturity)
    var tpX=dayX(m.tpOutDate);
    var dtmDays=v.daysToMaturity||m.adjustedDays;
    var growEndTP=addDays(m.tpOutDate,dtmDays);
    var growW=dayX(growEndTP)-tpX;
    var growLabel=showName?(v&&v.name)||"":("TP "+dtmDays+"d");
    if(growW>0) bars.push({key:"grow",x:tpX,w:growW,style:STAGE.sowTP,label:growLabel});

  } else {
    // Direct sow crop: BP → S → grow → H

    // Bed prep bar — only show if 2+ weeks
    if(m.prepStart&&(v&&(v.bedPrepWeeks||0)>=2)){
      var x=dayX(m.prepStart);
      var w=dayX(m.tpOutDate)-x;
      if(w>0) bars.push({key:"prep",x:x,w:w,style:STAGE.prep,label:"BP"});
    }

    // Grow bar from sow date
    var sowX=dayX(m.tpOutDate);
    var growW2=dayX(m.growEnd)-sowX;
    var growLabel2=showName
      ? (v&&v.name)||""
      : ("S "+m.adjustedDays+"d");
    if(growW2>0) bars.push({key:"grow",x:sowX,w:growW2,style:STAGE.grow,label:growLabel2});
  }

  // H bars — spread across hold window if field hold, otherwise per cut/regrowth
  var fieldHoldWeeks=p.fieldHoldWeeks||0;
  var fieldHoldHarvests=(v&&v.fieldHoldHarvests)||1;
  var hHalfW=(CELL_W/7)*3.5;
  if(fieldHoldWeeks>=2&&fieldHoldHarvests>1){
    // Spread harvests evenly across hold window
    var holdDays=fieldHoldWeeks*7;
    var interval=holdDays/(fieldHoldHarvests-1||1);
    for(var hi=0;hi<fieldHoldHarvests;hi++){
      var hDate=new Date((p.harvestDate||p.sowDate)+"T12:00:00");
      hDate.setDate(hDate.getDate()+Math.round(hi*interval));
      var hCentre2=dayX(hDate);
      var hLabel2=fieldHoldHarvests>1?"H"+(hi+1):"H";
      bars.push({key:"h"+hi,x:hCentre2-hHalfW,w:hHalfW*2,style:STAGE.harvest,label:hLabel2});
    }
  } else {
    // Standard cut-and-come-again or single harvest
    var nCuts=(v&&v.harvestType)==="cutAndComeAgain"?(v.cuts||2):1;
    var regrowthDays=((v&&v.regrowthWeeks)||1)*7;
    for(var ci=0;ci<nCuts;ci++){
      var cutDate=new Date((p.harvestDate||p.sowDate)+"T12:00:00");
      cutDate.setDate(cutDate.getDate()+ci*regrowthDays);
      var hCentre=dayX(cutDate);
      var cutLabel=nCuts>1?"H"+(ci+1):"H";
      bars.push({key:"h"+ci,x:hCentre-hHalfW,w:hHalfW*2,style:STAGE.harvest,label:cutLabel});
    }
  }
  return bars;
}

export function weekMeanTemp(weekDate){
  var sum=0;
  for(var d=0;d<7;d++){
    var date=new Date(weekDate);
    date.setDate(date.getDate()+d);
    var mo=date.getMonth()+1;
    var day=date.getDate();
    var dayOffset=day-15;
    var m1;var m2;var t;
    if(dayOffset>=0){m1=mo;m2=mo===12?1:mo+1;t=dayOffset/30;}
    else{m1=mo===1?12:mo-1;m2=mo;t=(15+day)/30;}
    var C=CLIMATE;
    var c1=C[m1];var c2=C[m2];
    var c1h=c1[0];var c2h=c2[0];
    var c1l=c1[1];var c2l=c2[1];
    var hi=c1h+(c2h-c1h)*t;
    var lo=c1l+(c2l-c1l)*t;
    sum+=(hi+lo)/2;
  }
  return sum/7;
}

export function tempToColor(t){
  if(t<=32) return [148,0,211];
  if(t<=38) return [120,15,206];
  if(t<=42) return [30,80,220];
  if(t<=48) return [30,144,255];
  if(t<=54) return [50,205,180];
  if(t<=58) return [100,210,80];
  if(t<=63) return [180,230,50];
  if(t<=68) return [255,215,0];
  if(t<=73) return [255,150,0];
  if(t<=78) return [255,60,0];
  return [180,0,0];
}


// Calculate earliest and latest viable sow dates for a single harvest
// earliestSow: first date soil is workable AND PTU can accumulate to DTM
// latestSow: last date where PTU accumulates to DTM before day length < MIN_DAY_HOURS
export var MIN_DAY_HOURS = 10.0; // below this growth is too slow to be reliable
export var BOLT_DAY_HOURS = 14.5; // above this arugula-type crops bolt (spring cutoff)

// Soil temp model: air mean - 3F (conservative; raised beds in sun will be warmer)
export function modeledSoilTemp(dateStr) {
  var d = new Date(dateStr+"T12:00:00");
  var m = d.getMonth()+1;
  var day = d.getDate();
  var off = day-15;
  var m1,m2,t;
  if(off>=0){m1=m;m2=m===12?1:m+1;t=off/30;}
  else{m1=m===1?12:m-1;m2=m;t=(15+day)/30;}
  var C=CLIMATE;
  var c1=C[m1];var c2=C[m2];
  var hi=c1[0]+(c2[0]-c1[0])*t;
  var lo=c1[1]+(c2[1]-c1[1])*t;
  return (hi+lo)/2 - 3;
}

// Risk rating for a sow date given days-in-bed and soil temp
// Spring risk: soil temp (germ) + days in bed (exposure)
// Fall risk: day length (growth rate) + cold snap proximity
export function sowRisk(sowDateStr, daysInBed) {
  var soil = modeledSoilTemp(sowDateStr);
  var sowDate = new Date(sowDateStr+"T12:00:00");
  var dl = dayLengthHours(sowDate);
  var month = sowDate.getMonth()+1; // 1-12
  var isFall = month >= 7; // July onwards = fall context

  var combined;
  if(!isFall) {
    // Spring: soil temp is the germ risk, days in bed is exposure risk
    var soilRisk;
    if(soil >= 47) soilRisk = 0;
    else if(soil >= 44) soilRisk = 1;
    else if(soil >= 42) soilRisk = 2;
    else soilRisk = 3;
    var daysRisk;
    if(daysInBed <= 28) daysRisk = 0;
    else if(daysInBed <= 35) daysRisk = 1;
    else if(daysInBed <= 45) daysRisk = 2;
    else daysRisk = 3;
    combined = Math.max(soilRisk, daysRisk);
  } else {
    // Fall: day length drives growth rate risk; cold snap risk from late October on
    var dlRisk;
    if(dl >= 13) dlRisk = 0;      // plenty of light
    else if(dl >= 12) dlRisk = 1; // shortening but workable
    else if(dl >= 11) dlRisk = 2; // marginal — slow growth, stretched maturity
    else dlRisk = 3;              // too short — very slow, quality risk
    // Cold proximity risk — how close to hard freeze territory
    var coldRisk;
    if(month <= 8) coldRisk = 0;       // Aug — no cold risk
    else if(month <= 9) coldRisk = 0;  // Sep — minimal
    else if(month <= 10 && sowDate.getDate() <= 15) coldRisk = 1; // early Oct
    else if(month <= 10) coldRisk = 2; // late Oct
    else coldRisk = 3;                 // Nov+
    combined = Math.max(dlRisk, coldRisk);
  }

  var levels = [
    {level:"low",   color:"#4CAF7D", bg:"#0D2A1A", label:"Low risk",      note:isFall?"Good light, no cold risk":"Reliable germ, short bed time"},
    {level:"medium",color:"#E8A83A", bg:"#2A1E08", label:"Medium risk",    note:isFall?"Shortening days, manageable":"Slightly patchy germ or moderate exposure"},
    {level:"high",  color:"#E07830", bg:"#2A1208", label:"High risk",      note:isFall?"Short days — slow growth, stretched maturity":"Cold soil or long bed time"},
    {level:"vhigh", color:"#E05A35", bg:"#2A0808", label:"Very high risk", note:isFall?"Day length + cold — harvest unlikely":"Cold soil, long exposure, high variance"},
  ];
  return levels[combined];
}

export function calcSowWindow(variety, year, soilWorkableDate) {
  if(!variety || !variety.gddToMaturity || !variety.gddBase) return {earliest:null, latest:null};
  var target = variety.gddToMaturity;
  var base = variety.gddBase || 40;
  var workable = soilWorkableDate ? new Date(soilWorkableDate+"T00:00:00") : new Date(year+"-02-01T00:00:00");

  // Find earliest: start from soil workable date, find first sow where harvest completes
  // before bolt threshold (for bolt-sensitive crops) 
  var earliest = null;
  var d = new Date(workable);
  var endOfYear = new Date(year+"-12-31T00:00:00");
  while(d <= endOfYear) {
    var sowDate = new Date(d);
    var acc = 0;
    var days = 0;
    var cur = new Date(sowDate);
    var maxDays = 180;
    var viable = true;
    while(acc < target && days < maxDays) {
      acc += dailyGDD(cur, base);
      days++;
      cur.setDate(cur.getDate()+1);
    }
    if(acc >= target && days < maxDays) {
      // Check day length at sow time - must be growing, not already bolting
      var sowDL = dayLengthHours(sowDate);
      if(sowDL < BOLT_DAY_HOURS) {
        earliest = sowDate;
        break;
      }
    }
    d.setDate(d.getDate()+1);
    if(d > new Date(year+"-07-01T00:00:00")) break; // don't search past July for spring
  }

  // Find latest: work backwards from Oct 31, find last sow where harvest completes
  // before day length drops too low OR before Dec 31
  var latest = null;
  var startSearch = new Date(year+"-10-31T00:00:00");
  d = new Date(startSearch);
  var startOfJul = new Date(year+"-07-01T00:00:00");
  while(d >= startOfJul) {
    var sowDate2 = new Date(d);
    var acc2 = 0;
    var days2 = 0;
    var cur2 = new Date(sowDate2);
    var maxDays2 = 180;
    var complete = false;
    while(acc2 < target && days2 < maxDays2) {
      var dl = dayLengthHours(cur2);
      if(dl < MIN_DAY_HOURS) break; // growth stalls
      acc2 += dailyGDD(cur2, base);
      days2++;
      cur2.setDate(cur2.getDate()+1);
    }
    if(acc2 >= target) {
      latest = sowDate2;
      break;
    }
    d.setDate(d.getDate()-1);
  }

  return {earliest:earliest, latest:latest};
}


