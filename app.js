(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)};
var tip=$("#tip");
function showTip(ev,html){tip.innerHTML=html;tip.style.opacity=1;var x=ev.clientX+14,y=ev.clientY+14;if(x+250>innerWidth)x=ev.clientX-250;tip.style.left=x+"px";tip.style.top=y+"px"}
function hideTip(){tip.style.opacity=0}
var fmt=d3.format(",.0f"),fmt1=d3.format(",.1f");
function fmtV(v){return v%1===0?fmt(v):fmt1(v)}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function kpi(el,items){el.innerHTML=items.map(function(i){return '<div class="kpi"><b>'+i[1]+'</b><span>'+i[0]+'</span></div>'}).join("")}

/* tabs */
var rendered={};
function go(tab){
  document.querySelectorAll("#tabs button").forEach(function(b){b.classList.toggle("active",b.dataset.tab===tab)});
  document.querySelectorAll(".panel").forEach(function(p){p.classList.toggle("active",p.id===tab)});
  history.replaceState(null,"","#"+tab);
  if(!rendered[tab]&&inits[tab]){rendered[tab]=true;inits[tab]()}
  else if(redraws[tab])redraws[tab]();
  window.scrollTo(0,0);
}
document.querySelectorAll("#tabs button").forEach(function(b){b.addEventListener("click",function(){go(b.dataset.tab)})});
document.querySelectorAll(".card").forEach(function(c){c.addEventListener("click",function(){go(c.dataset.go)})});

var inits={},redraws={};
var REG={america:"Americas",east_asia_pacific:"East Asia and Pacific",europe_central_asia:"Europe and Central Asia",middle_east_north_africa:"Middle East and North Africa",south_asia:"South Asia",sub_saharan_africa:"Sub-Saharan Africa"};
var REGCOL={america:"#2f6aa3",east_asia_pacific:"#d9822b",europe_central_asia:"#4c9f70",middle_east_north_africa:"#b5546b",south_asia:"#8a6bbf",sub_saharan_africa:"#c9a227"};
var ALIAS={"Bosnia and Herzegovina":"Bosnia and Herz.","Central African Republic":"Central African Rep.","Congo, Dem. Rep.":"Dem. Rep. Congo","Congo, Rep.":"Congo","Cote d'Ivoire":"Côte d'Ivoire","Czech Republic":"Czechia","Dominican Republic":"Dominican Rep.","Equatorial Guinea":"Eq. Guinea","Kyrgyz Republic":"Kyrgyzstan","Lao":"Laos","Macedonia, FYR":"Macedonia","Slovak Republic":"Slovakia","Solomon Islands":"Solomon Is.","South Sudan":"S. Sudan","Swaziland":"eSwatini","United States":"United States of America","West Bank and Gaza":"Palestine"};


/* ---------- chart helpers ---------- */
var DUR=(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)?0:650;
var NAVY="#1f4e79",ORANGE="#d9822b";
function wrapLabel(t,n){var words=t.split(" "),lines=[],cur="";words.forEach(function(w){if((cur+" "+w).trim().length>n&&cur){lines.push(cur);cur=w}else cur=(cur+" "+w).trim()});if(cur)lines.push(cur);return lines}
function hbar(sel,items,o){
  o=o||{};var el=$(sel);el.innerHTML="";var w=el.clientWidth||500;
  var l=o.l||Math.min(170,Math.max(84,d3.max(items,function(d){return Math.min(d.label.length,24)})*6.6+10));
  var mg={t:6,r:58,b:8,l:l},rh=o.rh||36,h=mg.t+items.length*rh+mg.b;
  var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label",o.aria||"Bar chart");
  var x=d3.scaleLinear().domain([0,o.max||d3.max(items,function(d){return d.v})*1.1]).range([mg.l,w-mg.r]);
  var n=Math.floor((l-12)/6.1);
  items.forEach(function(d,i){
    var y=mg.t+i*rh,g=svg.append("g").style("opacity",d.dim?.28:1);
    var lines=wrapLabel(d.label,n),t=g.append("text").attr("x",mg.l-10).attr("text-anchor","end").attr("font-size",12).attr("y",y+rh/2-(lines.length-1)*6+4);
    lines.forEach(function(s,k){t.append("tspan").attr("x",mg.l-10).attr("dy",k?13:0).text(s)});
    g.append("rect").attr("x",mg.l).attr("y",y+7).attr("width",w-mg.r-mg.l).attr("height",rh-14).attr("rx",5).attr("fill",css("--chip")).attr("opacity",.55);
    var bar=g.append("rect").attr("x",mg.l).attr("y",y+7).attr("height",rh-14).attr("rx",5).attr("fill",d.color||(d.eu?ORANGE:NAVY)).attr("width",0).style("cursor","pointer");
    bar.transition().duration(DUR).delay(i*45).attr("width",x(d.v)-mg.l);
    g.append("text").attr("x",x(d.v)+7).attr("y",y+rh/2+4).attr("font-size",12).attr("font-weight",700).text((o.fmt||fmtV)(d.v)+(o.unit||""));
    bar.on("mousemove",function(ev){showTip(ev,"<b>"+d.label+"</b><br>"+(o.fmt||fmtV)(d.v)+(o.unit||"")+(d.note?"<br>"+d.note:""))}).on("mouseleave",hideTip);
  });
}
function vbar(sel,items,o){
  o=o||{};var el=$(sel);el.innerHTML="";var w=el.clientWidth||500,h=o.h||300,mg={t:24,r:12,b:54,l:40};
  var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label",o.aria||"Bar chart");
  var x=d3.scaleBand().domain(items.map(function(d){return d.label})).range([mg.l,w-mg.r]).padding(.32);
  var y=d3.scaleLinear().domain([0,o.max||d3.max(items,function(d){return d.v})*1.15]).nice().range([h-mg.b,mg.t]);
  svg.append("g").attr("class","gridline").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(5).tickSize(-(w-mg.l-mg.r)).tickFormat(""));
  svg.append("g").attr("class","axis").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(5).tickFormat(function(d){return d+(o.unit||"")}));
  var gx=svg.append("g").attr("transform","translate(0,"+(h-mg.b+16)+")");
  items.forEach(function(d,i){var lines=wrapLabel(d.label,Math.max(8,Math.floor(x.bandwidth()/6.4))),t=gx.append("text").attr("x",x(d.label)+x.bandwidth()/2).attr("text-anchor","middle").attr("font-size",12);
    lines.forEach(function(s,k){t.append("tspan").attr("x",x(d.label)+x.bandwidth()/2).attr("dy",k?13:0).text(s)})});
  svg.selectAll(".b").data(items).join("rect").attr("x",function(d){return x(d.label)}).attr("width",x.bandwidth()).attr("rx",6).attr("y",h-mg.b).attr("height",0)
    .attr("fill",function(d,i){return d.color||PALS[i%PALS.length]}).style("cursor","pointer")
    .on("mousemove",function(ev,d){showTip(ev,"<b>"+d.label+"</b><br>"+fmtV(d.v)+(o.unit||""))}).on("mouseleave",hideTip)
    .transition().duration(DUR).delay(function(d,i){return i*80}).attr("y",function(d){return y(d.v)}).attr("height",function(d){return h-mg.b-y(d.v)});
  svg.selectAll(".v").data(items).join("text").attr("x",function(d){return x(d.label)+x.bandwidth()/2}).attr("y",function(d){return y(d.v)-7}).attr("text-anchor","middle").attr("font-size",13).attr("font-weight",700).text(function(d){return fmtV(d.v)+(o.unit||"")});
}
function donut(sel,items,o){
  o=o||{};var el=$(sel);el.innerHTML="";var w=el.clientWidth||400,h=Math.min(300,Math.max(240,w*.6)),R=Math.min(h/2-8,w/2-8),ri=R*.6;
  var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label",o.aria||"Donut chart");
  var g=svg.append("g").attr("transform","translate("+w/2+","+h/2+")");
  var cols=items.map(function(d,i){return d.color||PALS[i%PALS.length]});
  var pie=d3.pie().sort(null).value(function(d){return d.v}).padAngle(.012)(items);
  var arc=d3.arc().innerRadius(ri).outerRadius(R),arcH=d3.arc().innerRadius(ri).outerRadius(R+7);
  var total=d3.sum(items,function(d){return d.v});
  var c1=g.append("text").attr("text-anchor","middle").attr("y",-2).attr("font-size",26).attr("font-weight",700).style("fill",NAVY).text(o.centre||"");
  var c2=g.append("text").attr("text-anchor","middle").attr("y",18).attr("font-size",12).style("fill",css("--muted")).text(o.centreSub||"");
  g.selectAll("path").data(pie).join("path").attr("fill",function(d,i){return cols[i]}).attr("stroke",css("--panel")).attr("stroke-width",2).style("opacity",function(d){return d.data.dim?.25:1}).style("cursor","pointer")
    .transition().duration(DUR).attrTween("d",function(d){var i=d3.interpolate({startAngle:d.startAngle,endAngle:d.startAngle},d);return function(t){return arc(i(t))}}).selection()
    .on("mouseover",function(ev,d){d3.select(this).transition().duration(120).attr("d",arcH(d));c1.text(fmt1(d.data.v)+(o.unit||""));c2.text(d.data.label.length>26?d.data.label.slice(0,24)+"...":d.data.label)})
    .on("mousemove",function(ev,d){showTip(ev,"<b>"+d.data.label+"</b><br>"+fmt1(d.data.v)+(o.unit||"")+(o.share?" ("+d3.format(".0%")(d.data.v/total)+")":""))})
    .on("mouseout",function(ev,d){d3.select(this).transition().duration(120).attr("d",arc(d));c1.text(o.centre||"");c2.text(o.centreSub||"");hideTip()});
  var lg=document.createElement("div");lg.className="dlegend";lg.innerHTML=items.map(function(d,i){return '<span><i style="background:'+cols[i]+'"></i>'+d.label+'</span>'}).join("");el.appendChild(lg);
}

var PALS=["#1f4e79","#d9822b","#4c9f70","#b5546b","#8a6bbf","#c9a227"];
/* ---------- Dashboard 1 ---------- */
inits.map=function(){
  Promise.all([d3.csv("https://cdn.jsdelivr.net/npm/vega-datasets@3.3.1/data/gapminder-health-income.csv",function(d){return {country:d.country,income:+d.income,health:+d.health,pop:+d.population,region:d.region}}),d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json")]).then(function(r){
    var data=r[0],world=r[1];
    var byMapName={};data.forEach(function(d){byMapName[ALIAS[d.country]||d.country]=d});
    var features=topojson.feature(world,world.objects.countries).features.filter(function(f){return f.properties.name!=="Antarctica"});
    var state={metric:"health",regions:new Set(Object.keys(REG)),sel:null};
    var regBox=$("#regions");
    Object.keys(REG).forEach(function(k){
      var b=document.createElement("button");b.className="chip";b.type="button";b.dataset.k=k;
      b.innerHTML='<i style="background:'+REGCOL[k]+'"></i>'+REG[k];
      b.addEventListener("click",function(){
        if(state.regions.has(k)){if(state.regions.size>1)state.regions.delete(k)}else state.regions.add(k);
        draw()});
      regBox.appendChild(b)});
    document.querySelectorAll("#metric button").forEach(function(b){b.addEventListener("click",function(){
      document.querySelectorAll("#metric button").forEach(function(x){x.classList.toggle("active",x===b)});
      state.metric=b.dataset.m;draw()})});
    function visible(d){return state.regions.has(d.region)}
    function draw(){
      regBox.querySelectorAll(".chip").forEach(function(c){c.classList.toggle("off",!state.regions.has(c.dataset.k))});
      var vis=data.filter(visible);
      kpi($("#kpis1"),[["Countries shown",vis.length],["Median life expectancy",fmt1(d3.median(vis,function(d){return d.health}))+" years"],["Median income per person","$"+fmt(d3.median(vis,function(d){return d.income}))],["Total population",fmt1(d3.sum(vis,function(d){return d.pop})/1e9)+" billion"]]);
      drawMap();drawScatter();drawRegions();
    }
    function drawRegions(){
      var keys=Object.keys(REG),tot=d3.sum(data,function(d){return d.pop});
      donut("#regDonut",keys.map(function(k){return {label:REG[k],v:d3.sum(data.filter(function(d){return d.region===k}),function(d){return d.pop})/1e6,color:REGCOL[k],dim:!state.regions.has(k)}}),{unit:" million",share:true,centre:fmt1(tot/1e9)+" bn",centreSub:"people in dataset",aria:"Population by region"});
      hbar("#regBar",keys.map(function(k){return {label:REG[k],v:d3.median(data.filter(function(d){return d.region===k}),function(d){return d.health}),color:REGCOL[k],dim:!state.regions.has(k)}}).sort(function(a,b){return b.v-a.v}),{unit:" yrs",max:90,aria:"Median life expectancy by region"});
    }
    function drawMap(){
      var el=$("#mapchart");el.innerHTML="";
      var w=el.clientWidth||500,h=Math.round(w*0.56);
      var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label","World map coloured by "+(state.metric==="health"?"life expectancy":"income per person"));
      var proj=d3.geoNaturalEarth1().fitSize([w,h],{type:"Sphere"});
      var path=d3.geoPath(proj);
      var m=state.metric;
      var ext=d3.extent(data,function(d){return d[m]});
      var color=m==="health"?d3.scaleSequential(d3.interpolateYlGnBu).domain(ext):d3.scaleSequentialLog(d3.interpolateYlGnBu).domain(ext);
      svg.selectAll("path").data(features).join("path").attr("d",path)
        .attr("fill",function(f){var d=byMapName[f.properties.name];return d&&visible(d)?color(d[m]):css("--nodata")})
        .attr("stroke",css("--panel")).attr("stroke-width",.4)
        .style("cursor","pointer")
        .on("mousemove",function(ev,f){var d=byMapName[f.properties.name];showTip(ev,d?"<b>"+d.country+"</b><br>Life expectancy: "+fmt1(d.health)+" years<br>Income: $"+fmt(d.income)+"<br>Population: "+fmt1(d.pop/1e6)+" million":f.properties.name+"<br>No data")})
        .on("mouseleave",hideTip)
        .on("click",function(ev,f){var d=byMapName[f.properties.name];state.sel=d?d.country:null;drawScatter()});
      // legend
      var lw=Math.min(220,w*0.5),lg=svg.append("g").attr("transform","translate(12,"+(h-26)+")");
      var defs=svg.append("defs"),gid="lg"+Math.random().toString(36).slice(2);
      var grad=defs.append("linearGradient").attr("id",gid);
      d3.range(0,1.01,.1).forEach(function(t){grad.append("stop").attr("offset",t*100+"%").attr("stop-color",d3.interpolateYlGnBu(t))});
      lg.append("rect").attr("width",lw).attr("height",9).attr("fill","url(#"+gid+")").attr("rx",2);
      lg.append("text").attr("y",22).attr("font-size",11).text(m==="health"?fmt1(ext[0])+" yrs":"$"+fmt(ext[0]));
      lg.append("text").attr("x",lw).attr("y",22).attr("text-anchor","end").attr("font-size",11).text(m==="health"?fmt1(ext[1])+" yrs":"$"+fmt(ext[1]));
    }
    function drawScatter(){
      var el=$("#scatter");el.innerHTML="";
      var w=el.clientWidth||500,h=Math.max(320,Math.round(w*0.75));
      var mg={t:12,r:14,b:44,l:48};
      var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label","Scatter plot of income against life expectancy");
      var x=d3.scaleLog().domain([500,d3.max(data,function(d){return d.income})*1.1]).range([mg.l,w-mg.r]);
      var y=d3.scaleLinear().domain([40,85]).range([h-mg.b,mg.t]);
      var r=d3.scaleSqrt().domain([0,d3.max(data,function(d){return d.pop})]).range([2.5,30]);
      svg.append("g").attr("class","gridline").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(6).tickSize(-(w-mg.l-mg.r)).tickFormat(""));
      svg.append("g").attr("class","axis").attr("transform","translate(0,"+(h-mg.b)+")").call(d3.axisBottom(x).tickValues(w<480?[1000,5000,20000,50000]:[1000,2000,5000,10000,20000,50000]).tickFormat(function(d){return "$"+d3.format(",")(d)}));
      svg.append("g").attr("class","axis").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(6));
      svg.append("text").attr("x",(w+mg.l)/2).attr("y",h-6).attr("text-anchor","middle").attr("font-size",12).text("Income per person (log scale)");
      svg.append("text").attr("transform","rotate(-90)").attr("x",-(h-mg.b+mg.t)/2).attr("y",13).attr("text-anchor","middle").attr("font-size",12).text("Life expectancy (years)");
      svg.selectAll("circle").data(data.slice().sort(function(a,b){return b.pop-a.pop})).join("circle")
        .attr("cx",function(d){return x(d.income)}).attr("cy",function(d){return y(d.health)}).attr("r",function(d){return r(d.pop)})
        .attr("fill",function(d){return REGCOL[d.region]}).attr("fill-opacity",function(d){return visible(d)?.72:.06})
        .attr("stroke",function(d){return d.country===state.sel?css("--ink"):REGCOL[d.region]}).attr("stroke-width",function(d){return d.country===state.sel?2.5:.8})
        .style("cursor","pointer")
        .on("mousemove",function(ev,d){showTip(ev,"<b>"+d.country+"</b><br>"+REG[d.region]+"<br>Life expectancy: "+fmt1(d.health)+" years<br>Income: $"+fmt(d.income)+"<br>Population: "+fmt1(d.pop/1e6)+" million")})
        .on("mouseleave",hideTip)
        .on("click",function(ev,d){state.sel=state.sel===d.country?null:d.country;drawScatter()});
    }
    redraws.map=draw;
    draw();
    var t;addEventListener("resize",function(){clearTimeout(t);t=setTimeout(function(){if($("#map").classList.contains("active"))draw()},150)});
  });
};

/* ---------- Dashboard 2 ---------- */
inits.trends=function(){
  d3.json("https://cdn.jsdelivr.net/npm/vega-datasets@3.3.1/data/gapminder.json").then(function(rows){
    var countries=Array.from(new Set(rows.map(function(d){return d.country}))).sort();
    var PAL=["#1f4e79","#d9822b","#4c9f70","#b5546b","#8a6bbf","#c9a227"];
    var chosen=["Kenya","Germany","Japan","Brazil"];
    var metric="life_expect";
    var sel=$("#countrySel");
    function fillSel(){sel.innerHTML='<option value="">Choose...</option>'+countries.filter(function(c){return chosen.indexOf(c)<0}).map(function(c){return '<option>'+c+'</option>'}).join("")}
    sel.addEventListener("change",function(){if(sel.value&&chosen.length<6){chosen.push(sel.value)}fillSel();draw()});
    document.querySelectorAll("#metric2 button").forEach(function(b){b.addEventListener("click",function(){
      document.querySelectorAll("#metric2 button").forEach(function(x){x.classList.toggle("active",x===b)});metric=b.dataset.m;draw()})});
    function draw(){
      var box=$("#selected");box.innerHTML="";
      chosen.forEach(function(c,i){var b=document.createElement("button");b.className="chip";b.type="button";b.title="Remove "+c;
        b.innerHTML='<i style="background:'+PAL[i]+'"></i>'+c+' &times;';
        b.addEventListener("click",function(){if(chosen.length>1){chosen.splice(chosen.indexOf(c),1);fillSel();draw()}});box.appendChild(b)});
      var series=chosen.map(function(c,i){return {c:c,col:PAL[i],v:rows.filter(function(d){return d.country===c}).sort(function(a,b){return a.year-b.year})}});
      var lab=metric==="life_expect"?"Life expectancy (years)":"Children per woman";
      var first=series[0],f0=first.v[0][metric],f1=first.v[first.v.length-1][metric];
      var best=series.slice().sort(function(a,b){return (b.v[b.v.length-1][metric]-b.v[0][metric])-(a.v[a.v.length-1][metric]-a.v[0][metric])});
      kpi($("#kpis2"),[[first.c+" in 1955",fmt1(f0)],[first.c+" in 2005",fmt1(f1)],["Change for "+first.c,(f1-f0>=0?"+":"")+fmt1(f1-f0)],["Biggest rise among selected",best[0].c]]);
      var el=$("#lines");el.innerHTML="";
      var w=el.clientWidth||600,h=380,mg={t:14,r:92,b:36,l:46};
      var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label","Line chart of "+lab);
      var x=d3.scaleLinear().domain([1955,2005]).range([mg.l,w-mg.r]);
      var all=d3.merge(series.map(function(s){return s.v.map(function(d){return d[metric]})}));
      var y=d3.scaleLinear().domain([Math.max(0,Math.floor(d3.min(all)-2)),Math.ceil(d3.max(all)+1)]).nice().range([h-mg.b,mg.t]);
      svg.append("g").attr("class","gridline").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(6).tickSize(-(w-mg.l-mg.r)).tickFormat(""));
      svg.append("g").attr("class","axis").attr("transform","translate(0,"+(h-mg.b)+")").call(d3.axisBottom(x).tickValues(d3.range(1955,2006,10)).tickFormat(d3.format("d")));
      svg.append("g").attr("class","axis").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(6));
      svg.append("text").attr("transform","rotate(-90)").attr("x",-(h-mg.b+mg.t)/2).attr("y",12).attr("text-anchor","middle").attr("font-size",12).text(lab);
      var line=d3.line().x(function(d){return x(d.year)}).y(function(d){return y(d[metric])});
      series.forEach(function(s){
        svg.append("path").datum(s.v).attr("d",line).attr("fill","none").attr("stroke",s.col).attr("stroke-width",2.6).attr("stroke-linejoin","round");
        svg.selectAll(null).data(s.v).join("circle").attr("cx",function(d){return x(d.year)}).attr("cy",function(d){return y(d[metric])}).attr("r",4).attr("fill",s.col).attr("fill-opacity",.0001)
          .on("mousemove",function(ev,d){d3.select(this).attr("fill-opacity",1);showTip(ev,"<b>"+s.c+"</b>, "+d.year+"<br>"+lab+": "+fmt1(d[metric]))}).on("mouseleave",function(){d3.select(this).attr("fill-opacity",.0001);hideTip()});
        var last=s.v[s.v.length-1];
        svg.append("text").attr("x",x(2005)+8).attr("y",y(last[metric])+4).attr("font-size",12).attr("font-weight",700).attr("fill",s.col).style("fill",s.col).text(s.c);
      });
    }
    redraws.trends=draw;fillSel();draw();
    var t;addEventListener("resize",function(){clearTimeout(t);t=setTimeout(function(){if($("#trends").classList.contains("active"))draw()},150)});
  });
};

/* ---------- Dashboard 3 ---------- */
inits.heat=function(){
  d3.csv("https://cdn.jsdelivr.net/npm/vega-datasets@3.3.1/data/seattle-weather.csv",function(d){return {date:new Date(d.date+"T00:00:00"),precipitation:+d.precipitation,temp_max:+d.temp_max,temp_min:+d.temp_min,weather:d.weather}}).then(function(rows){
    var years=Array.from(new Set(rows.map(function(d){return d.date.getFullYear()}))).sort();
    var ys=$("#yearSel");ys.innerHTML=years.map(function(y){return "<option>"+y+"</option>"}).join("");ys.value=years[years.length-1];
    var metric="temp_max";
    ys.addEventListener("change",draw);
    document.querySelectorAll("#metric3 button").forEach(function(b){b.addEventListener("click",function(){
      document.querySelectorAll("#metric3 button").forEach(function(x){x.classList.toggle("active",x===b)});metric=b.dataset.m;draw()})});
    var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    function interp(){return metric==="temp_max"?d3.interpolateYlOrRd:d3.interpolateBlues}
    function unit(){return metric==="temp_max"?"°C":" mm"}
    function draw(){
      var yr=+ys.value,yd=rows.filter(function(d){return d.date.getFullYear()===yr});
      var hot=d3.greatest(yd,function(d){return d.temp_max}),wet=d3.greatest(yd,function(d){return d.precipitation});
      kpi($("#kpis3"),[["Average high in "+yr,fmt1(d3.mean(yd,function(d){return d.temp_max}))+" °C"],["Hottest day",fmt1(hot.temp_max)+" °C ("+d3.timeFormat("%d %b")(hot.date)+")"],["Total rainfall",fmt(d3.sum(yd,function(d){return d.precipitation}))+" mm"],["Wettest day",fmt1(wet.precipitation)+" mm ("+d3.timeFormat("%d %b")(wet.date)+")"]]);
      var el=$("#calendar");el.innerHTML="";
      var w=el.clientWidth||700,mg={t:24,r:10,b:52,l:34};
      var cs=Math.max(8,Math.floor((w-mg.l-mg.r)/54)),h=mg.t+7*cs+mg.b;
      var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label","Calendar heat map for "+yr);
      var ext=d3.extent(rows,function(d){return d[metric]});
      var color=d3.scaleSequential(interp()).domain(metric==="temp_max"?[ext[0],ext[1]]:[0,Math.min(ext[1],30)]).clamp(true);
      var jan1=new Date(yr,0,1),wk=function(d){return d3.timeMonday.count(d3.timeMonday.floor(jan1),d3.timeMonday.floor(d))},wd=function(d){return (d.getDay()+6)%7};
      ["Mon","","Wed","","Fri","","Sun"].forEach(function(t,i){svg.append("text").attr("x",mg.l-6).attr("y",mg.t+i*cs+cs*.72).attr("text-anchor","end").attr("font-size",10).style("fill",css("--muted")).text(t)});
      svg.selectAll("rect").data(yd).join("rect").attr("x",function(d){return mg.l+wk(d.date)*cs}).attr("y",function(d){return mg.t+wd(d.date)*cs}).attr("width",cs-2).attr("height",cs-2).attr("rx",2)
        .attr("fill",function(d){return color(d[metric])})
        .on("mousemove",function(ev,d){showTip(ev,"<b>"+d3.timeFormat("%A %d %B %Y")(d.date)+"</b><br>High: "+fmt1(d.temp_max)+" °C, Low: "+fmt1(d.temp_min)+" °C<br>Rain: "+fmt1(d.precipitation)+" mm<br>Weather: "+d.weather)}).on("mouseleave",hideTip);
      d3.range(12).forEach(function(m){var d=new Date(yr,m,1);svg.append("text").attr("x",mg.l+wk(d)*cs).attr("y",mg.t-8).attr("font-size",11).style("fill",css("--muted")).text(MON[m])});
      var lw=Math.min(200,w*.4),ly=mg.t+7*cs+16,lg=svg.append("g").attr("transform","translate("+mg.l+","+ly+")"),gid="g"+Math.random().toString(36).slice(2);
      var gr=svg.append("defs").append("linearGradient").attr("id",gid);d3.range(0,1.01,.1).forEach(function(t){gr.append("stop").attr("offset",t*100+"%").attr("stop-color",interp()(t))});
      lg.append("rect").attr("width",lw).attr("height",8).attr("rx",2).attr("fill","url(#"+gid+")");
      lg.append("text").attr("y",20).attr("font-size",10).style("fill",css("--muted")).text(fmt1(color.domain()[0])+unit());
      lg.append("text").attr("x",lw).attr("y",20).attr("text-anchor","end").attr("font-size",10).style("fill",css("--muted")).text(fmt1(color.domain()[1])+unit()+(metric==="precipitation"?" or more":""));
      // month x year
      var el2=$("#monthyear");el2.innerHTML="";
      var w2=el2.clientWidth||700,mg2={t:10,r:10,b:26,l:44},ch=(w2-mg2.l-mg2.r)/12,rh=34,h2=mg2.t+years.length*rh+mg2.b;
      var s2=d3.select(el2).append("svg").attr("viewBox","0 0 "+w2+" "+h2).attr("width","100%").attr("role","img").attr("aria-label","Monthly averages by year");
      var agg=d3.rollup(rows,function(v){return metric==="temp_max"?d3.mean(v,function(d){return d.temp_max}):d3.sum(v,function(d){return d.precipitation})},function(d){return d.date.getFullYear()},function(d){return d.date.getMonth()});
      var vals=[];agg.forEach(function(m){m.forEach(function(v){vals.push(v)})});
      var c2=d3.scaleSequential(interp()).domain(d3.extent(vals));
      years.forEach(function(y,i){
        s2.append("text").attr("x",mg2.l-8).attr("y",mg2.t+i*rh+rh*.62).attr("text-anchor","end").attr("font-size",12).text(y);
        d3.range(12).forEach(function(m){var v=agg.get(y).get(m);
          s2.append("rect").attr("x",mg2.l+m*ch).attr("y",mg2.t+i*rh).attr("width",ch-2).attr("height",rh-2).attr("rx",3).attr("fill",c2(v))
            .on("mousemove",function(ev){showTip(ev,"<b>"+MON[m]+" "+y+"</b><br>"+(metric==="temp_max"?"Average high: "+fmt1(v)+" °C":"Total rain: "+fmt1(v)+" mm"))}).on("mouseleave",hideTip);
          s2.append("text").attr("x",mg2.l+m*ch+(ch-2)/2).attr("y",mg2.t+i*rh+rh*.62).attr("text-anchor","middle").attr("font-size",10).attr("pointer-events","none").attr("fill",d3.hsl(c2(v)).l>.6?"#1c2733":"#fff").style("fill",d3.hsl(c2(v)).l>.6?"#1c2733":"#fff").text(Math.round(v))});
      });
      MON.forEach(function(mn,m){s2.append("text").attr("x",mg2.l+m*ch+(ch-2)/2).attr("y",h2-8).attr("text-anchor","middle").attr("font-size",11).style("fill",css("--muted")).text(mn)});
    }
    redraws.heat=draw;draw();
    var t;addEventListener("resize",function(){clearTimeout(t);t=setTimeout(function(){if($("#heat").classList.contains("active"))draw()},150)});
  });
};


/* ---------- Dashboard 0: AI adoption ---------- */
inits.ai=function(){
  d3.json("ai-europe.json").then(function(D){
    var state={bar:"ent",grp:"Age"};
    var last=D.enterprise_trend[D.enterprise_trend.length-1],prev=D.enterprise_trend[D.enterprise_trend.length-2],first=D.enterprise_trend[0];
    var eu=D.individuals_2025.filter(function(d){return d.eu})[0];
    kpi($("#kpisAI"),[["EU businesses using AI, 2025",fmt1(last.v)+"%"],["Rise since 2024",(last.v-prev.v>=0?"+":"")+fmt1(last.v-prev.v)+" points"],["EU people using generative AI, 2025",eu.v+"%"],["Highest business adoption: Denmark",fmt1(D.enterprise_2025[0].v)+"%"]]);
    var ul=$("#aiInsights");
    var ratio=D.enterprise_2025[0].v/D.enterprise_2025[D.enterprise_2025.length-1].v;
    var ins=[
      "EU business use of AI rose from "+fmt1(first.v)+"% in 2021 to "+fmt1(last.v)+"% in 2025, more than 2.5 times higher, with most of the jump in the last two survey years.",
      "The gap between countries is large: Denmark ("+fmt1(D.enterprise_2025[0].v)+"%) is about "+Math.round(ratio)+" times Romania ("+fmt1(D.enterprise_2025[D.enterprise_2025.length-1].v)+"%).",
      "Younger people lead on generative AI: "+D.groups.Age[0].v+"% of 16 to 24 year olds use it, against "+D.groups.Age[1].v+"% of 65 to 74 year olds.",
      "Education matters: "+D.groups.Education[0].v+"% of people with high formal education use generative AI, more than double the "+D.groups.Education[2].v+"% with little or no formal education.",
      "Among people who do not use generative AI, most simply do not feel the need ("+D.reasons[0].v+"%), while one in seven is not sure how to use the tools ("+D.reasons[1].v+"%), which points to a role for training."
    ];
    ul.innerHTML=ins.map(function(s){return "<li>"+s+"</li>"}).join("");

    function drawTrend(){
      var el=$("#aiTrend");el.innerHTML="";var w=el.clientWidth||500,h=300,mg={t:26,r:22,b:34,l:40};
      var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label","Line chart of EU business AI use");
      var x=d3.scalePoint().domain(D.enterprise_trend.map(function(d){return d.label})).range([mg.l+16,w-mg.r-16]).padding(.2);
      var y=d3.scaleLinear().domain([0,24]).range([h-mg.b,mg.t]);
      var gid="a"+Math.random().toString(36).slice(2);
      var gr=svg.append("defs").append("linearGradient").attr("id",gid).attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",1);
      gr.append("stop").attr("offset","0%").attr("stop-color",NAVY).attr("stop-opacity",.35);gr.append("stop").attr("offset","100%").attr("stop-color",NAVY).attr("stop-opacity",.02);
      svg.append("g").attr("class","gridline").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(5).tickSize(-(w-mg.l-mg.r)).tickFormat(""));
      svg.append("g").attr("class","axis").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(5).tickFormat(function(d){return d+"%"}));
      svg.append("g").attr("class","axis").attr("transform","translate(0,"+(h-mg.b)+")").call(d3.axisBottom(x).tickSize(0));
      var area=d3.area().x(function(d){return x(d.label)}).y0(h-mg.b).y1(function(d){return y(d.v)}).curve(d3.curveMonotoneX);
      var line=d3.line().x(function(d){return x(d.label)}).y(function(d){return y(d.v)}).curve(d3.curveMonotoneX);
      svg.append("path").datum(D.enterprise_trend).attr("d",area).attr("fill","url(#"+gid+")").attr("opacity",0).transition().duration(DUR).attr("opacity",1);
      var p=svg.append("path").datum(D.enterprise_trend).attr("d",line).attr("fill","none").attr("stroke",NAVY).attr("stroke-width",3.2);
      var L=p.node().getTotalLength();p.attr("stroke-dasharray",L+" "+L).attr("stroke-dashoffset",L).transition().duration(DUR*1.4).ease(d3.easeCubicOut).attr("stroke-dashoffset",0);
      svg.selectAll("circle").data(D.enterprise_trend).join("circle").attr("cx",function(d){return x(d.label)}).attr("cy",function(d){return y(d.v)}).attr("r",5.5).attr("fill",css("--panel")).attr("stroke",NAVY).attr("stroke-width",3)
        .on("mousemove",function(ev,d){showTip(ev,"<b>"+d.label+"</b><br>"+fmt1(d.v)+"% of EU enterprises use AI")}).on("mouseleave",hideTip);
      svg.selectAll(".t").data(D.enterprise_trend).join("text").attr("x",function(d){return x(d.label)}).attr("y",function(d){return y(d.v)-12}).attr("text-anchor","middle").attr("font-size",13).attr("font-weight",700).text(function(d){return fmt1(d.v)+"%"});
    }
    function drawBar(){
      var cap=$("#aiBarCap"),items,unit,o={aria:"Country comparison"};
      if(state.bar==="ent"){items=D.enterprise_2025;unit="%";cap.textContent="Share of enterprises (10+ employees) using AI, 2025. Selected countries: top three, bottom three and the EU average (orange).";}
      else if(state.bar==="grow"){items=D.enterprise_growth;unit=" pts";cap.textContent="Largest increases in business AI use between 2024 and 2025, in percentage points.";}
      else{items=D.individuals_2025;unit="%";cap.textContent="Share of people aged 16 to 74 using generative AI, 2025. Selected countries; Norway and Switzerland are not EU members.";}
      hbar("#aiBar",items.map(function(d){return {label:d.label,v:d.v,eu:d.eu}}),{unit:unit,max:state.bar==="grow"?20:(state.bar==="ind"?70:55),aria:"Country comparison bar chart"});
    }
    function drawTech(){hbar("#aiTech",D.enterprise_tech.map(function(d,i){return {label:d.label,v:d.v,color:PALS[i]}}),{unit:"%",max:16,rh:44,aria:"AI technologies used by EU enterprises"})}
    function drawDonut(){
      var rem=100-d3.sum(D.reasons,function(d){return d.v});
      var items=D.reasons.map(function(d,i){return {label:d.label,v:d.v,color:PALS[i]}});
      if(rem>0)items.push({label:"Other or not stated",v:rem,color:"#9aa7b4"});
      donut("#aiDonut",items,{unit:"%",centre:D.reasons[0].v+"%",centreSub:"did not feel the need",aria:"Reasons for not using generative AI"});
    }
    function drawGroup(){vbar("#aiGroup",D.groups[state.grp].map(function(d,i){return {label:d.label,v:d.v,color:PALS[i]}}),{unit:"%",max:80,aria:"Generative AI use by group"})}
    function drawCompare(){
      var el=$("#aiCompare");el.innerHTML="";var w=el.clientWidth||500,h=320,mg={t:34,r:12,b:34,l:40};
      var svg=d3.select(el).append("svg").attr("viewBox","0 0 "+w+" "+h).attr("width","100%").attr("role","img").attr("aria-label","Businesses versus people AI use");
      var x0=d3.scaleBand().domain(D.compare.map(function(d){return d.label})).range([mg.l,w-mg.r]).padding(.25);
      var keys=[["ent","Businesses",NAVY],["ind","People (generative AI)",ORANGE]];
      var x1=d3.scaleBand().domain(["ent","ind"]).range([0,x0.bandwidth()]).padding(.08);
      var y=d3.scaleLinear().domain([0,60]).range([h-mg.b,mg.t]);
      svg.append("g").attr("class","gridline").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(5).tickSize(-(w-mg.l-mg.r)).tickFormat(""));
      svg.append("g").attr("class","axis").attr("transform","translate("+mg.l+",0)").call(d3.axisLeft(y).ticks(5).tickFormat(function(d){return d+"%"}));
      svg.append("g").attr("class","axis").attr("transform","translate(0,"+(h-mg.b)+")").call(d3.axisBottom(x0).tickSize(0));
      var lg=svg.append("g").attr("transform","translate("+mg.l+",10)");
      keys.forEach(function(k,i){lg.append("rect").attr("x",i*110).attr("width",11).attr("height",11).attr("rx",3).attr("fill",k[2]);lg.append("text").attr("x",i*110+16).attr("y",10).attr("font-size",12).text(k[1])});
      D.compare.forEach(function(c){keys.forEach(function(k){
        var r=svg.append("rect").attr("x",x0(c.label)+x1(k[0])).attr("width",x1.bandwidth()).attr("rx",5).attr("fill",k[2]).attr("y",h-mg.b).attr("height",0).style("cursor","pointer")
          .on("mousemove",function(ev){showTip(ev,"<b>"+c.label+"</b><br>"+k[1]+": "+fmt1(c[k[0]])+"%")}).on("mouseleave",hideTip);
        r.transition().duration(DUR).attr("y",y(c[k[0]])).attr("height",h-mg.b-y(c[k[0]]));
        svg.append("text").attr("x",x0(c.label)+x1(k[0])+x1.bandwidth()/2).attr("y",y(c[k[0]])-6).attr("text-anchor","middle").attr("font-size",11).attr("font-weight",700).text(fmtV(c[k[0]]));
      })});
    }
    document.querySelectorAll("#aiBarSeg button").forEach(function(b){b.addEventListener("click",function(){document.querySelectorAll("#aiBarSeg button").forEach(function(x){x.classList.toggle("active",x===b)});state.bar=b.dataset.v;drawBar()})});
    document.querySelectorAll("#aiGrpSeg button").forEach(function(b){b.addEventListener("click",function(){document.querySelectorAll("#aiGrpSeg button").forEach(function(x){x.classList.toggle("active",x===b)});state.grp=b.dataset.g;drawGroup()})});
    function all(){drawTrend();drawBar();drawTech();drawDonut();drawGroup();drawCompare()}
    redraws.ai=all;all();
    var t;addEventListener("resize",function(){clearTimeout(t);t=setTimeout(function(){if($("#ai").classList.contains("active"))all()},150)});
  });
};

var start=location.hash.replace("#","");go(["about","ai","map","trends","heat"].indexOf(start)>-1?start:"about");
})();
