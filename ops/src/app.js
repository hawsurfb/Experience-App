/* Hawaii Soul Surfer Ops — renders one hss-ops/1 report. Layout cloned from Surf Report Live (mockup v5). */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=a=>Array.isArray(a)?a:[];
const chev='<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const STAR=s=>`<svg class="star" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.5l1.3-6.5L2.5 9.4l6.6-.8z"/></svg>`;

/* ---------- data ---------- */
const EMBED=__SEED__;
let R=EMBED, MODE='embedded', dbNote='';
const STALE_H=14;

/* ---------- formatting ---------- */
const t2h=s=>{if(!s||typeof s!=='string')return null;const m=s.match(/^(\d{1,2}):(\d{2})/);return m?+m[1]+(+m[2])/60:null};
function fmtT(t){let tt=((t%24)+24)%24,h=Math.floor(tt),m=Math.round((tt-h)*60);if(m===60){h=(h+1)%24;m=0}return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`}
const fmtH=h=>`${h%12||12} ${h<12?'AM':'PM'}`;
function short(t){let h=Math.floor(t),m=Math.round((t-h)*60);if(m===60){h++;m=0}return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''}`}
function range(a,b){const x=t2h(a),y=t2h(b);if(x==null||y==null)return '–';const ax=x<12?'AM':'PM',ay=y<12?'AM':'PM';return ax===ay?`${short(x)}–${short(y)} ${ay}`:`${short(x)} ${ax}–${short(y)} ${ay}`}
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtD(ds){const m=String(ds||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return '';const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return `${DOW[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`}
function dayDiff(a,b){const p=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):NaN};return Math.round((p(b)-p(a))/864e5)}
function isoParts(iso){const d=new Date(iso);if(isNaN(d))return null;const h=new Date(d.getTime()-10*36e5);return {date:h.toISOString().slice(0,10),hour:h.getUTCHours()+h.getUTCMinutes()/60,ms:d.getTime()}}
const hstToday=()=>new Date(Date.now()-10*36e5).toISOString().slice(0,10);
const mph=kt=>kt==null||isNaN(kt)?null:Math.round(kt*1.15078);
function dirAbbrOf(deg){return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round((((deg%360)+360)%360)/22.5)%16]}
const DIRNAME={N:'north',NNE:'north-northeast',NE:'northeast',ENE:'east-northeast',E:'east',ESE:'east-southeast',SE:'southeast',SSE:'south-southeast',S:'south',SSW:'south-southwest',SW:'southwest',WSW:'west-southwest',W:'west',WNW:'west-northwest',NW:'northwest',NNW:'north-northwest'};
const STAT={VERIFIED:['Verified','s-ver'],OBSERVED:['Observed','s-ver'],FORECAST:['Forecast',''],REPORTED:['From brief',''],INFERRED:['Inferred','s-inf'],NOT_VERIFIED:['Not verified','s-no'],UNAVAILABLE:['Unavailable','s-no']};
const stat=s=>STAT[s]||[s?String(s).replace(/_/g,' ').toLowerCase().replace(/^./,c=>c.toUpperCase()):'Unknown','s-no'];
const CALL={GO:['GO','c-go'],CONDITIONAL:['CONDITIONAL',''],NO_GO:['NO-GO','c-no']};
const RATE={EXCELLENT:'c-go',GOOD:'c-go',FAIR:'',POOR:'c-mute',FLAT:'c-mute'};
const RT={BEST:['Best window','best','r-best'],CONDITIONAL:['Conditional','cond','r-cond'],AVOID:['Avoid','avoid','r-avoid']};
const nn=(v,d='–')=>v==null||v===''?d:v;

/* ---------- report-level facts ---------- */
const rel=()=>{const d=dayDiff(R.report_date,R.target_date);return d===0?'Today':d===1?'Tomorrow':fmtD(R.target_date)};
const genInfo=()=>isoParts(R.generated_at);
function ageHours(){const g=genInfo();return g?(Date.now()-g.ms)/36e5:Infinity}
const runName=()=>R.run==='EVENING'?'Evening brief':'Morning brief';

/* ---------- data bar / banner ---------- */
function renderDataBar(){
  const g=genInfo(),when=g?`${fmtD(g.date)}, ${fmtT(g.hour)} HST`:'unknown time';
  const nx=isoParts(R.next_update),nxs=nx?` Next update ${fmtT(nx.hour)}${nx.date!==(g&&g.date)?' '+fmtD(nx.date):''}.`:'';
  let html,warn=false;
  if(MODE==='embedded'){warn=true;html=`<span class="pip"></span><span>Built-in copy of the ${runName().toLowerCase()} from ${esc(when)}. ${dbNote?esc(dbNote)+' ':''}Open the app from its link to get live updates.</span>`}
  else if(ageHours()>STALE_H){warn=true;html=`<span class="pip"></span><span><b>Out of date.</b> This is the ${runName().toLowerCase()} from ${esc(when)}, ${Math.round(ageHours())} hours ago. The next update didn't arrive. Check the water and the sources yourself.</span>`}
  else html=`<span class="pip"></span><span>${runName()} · ${esc(when)}.${esc(nxs)}</span>`;
  document.querySelectorAll('[data-databar]').forEach(el=>{el.className='databar'+(warn?' warn':'');el.innerHTML=html});
  $('liveTag').classList.toggle('off',warn);
}

/* ---------- alerts ---------- */
const WARNI='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>';
function alertHTML(a){const det=[['What it means',a.details],['Issued by',a.issuer],['In effect',a.in_effect],['Area',a.scope],['For lessons','Look at the water, talk to the lifeguard, and make the call on the beach.']].filter(d=>d[1]);
  return `<div class="adv" role="alert"><div class="adv-main" tabindex="0" role="button" aria-expanded="false"><div class="k">${WARNI}${esc(a.kind||'Advisory')}<span class="more">Details ${chev}</span></div><div class="h">${esc(a.head)}</div><div class="s">${esc([a.issuer,a.in_effect].filter(Boolean).join(' · '))}</div></div><div class="adv-body">${det.map(d=>`<div><b>${esc(d[0])}</b>${esc(d[1])}</div>`).join('')}<div><a href="#/references">Sources</a></div></div></div>`}
const watchHTML=w=>`<div class="watchbox"><span class="k">Heads-up · not an advisory</span><span class="h">${esc(w.head)}</span><span class="s">${esc(w.body)}</span></div>`;
function bindAdv(el){el.querySelectorAll('.adv').forEach(box=>{const head=box.querySelector('.adv-main');const tog=()=>{const o=box.classList.toggle('open');head.setAttribute('aria-expanded',o)};head.onclick=tog;head.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog()}}})}
function hazState(s){return s==='ACTIVE'?['Active','on']:s==='NOT_ACTIVE'?['Not active','off']:s==='NONE_VERIFIED'?['None verified','']:['Unavailable','']}
const hazHTML=list=>arr(list).length?arr(list).map(h=>{const [t,c]=hazState(h.state);return `<div class="hazrow"><span class="hn">${esc(h.name)}${h.note?`<small>${esc(h.note)}</small>`:''}</span><span class="hz ${c}">${t}</span></div>`}).join(''):'<div class="empty">No hazard inventory in this report.</div>';
function renderAlerts(){
  const al=arr(R.alerts),wt=arr(R.watch);
  $('alerts').innerHTML=al.map(alertHTML).join('')+wt.map(watchHTML).join('');bindAdv($('alerts'));
  $('alerts2').innerHTML=al.length?al.map(alertHTML).join(''):`<div class="empty">No active official advisory was verified for this area in the ${runName().toLowerCase()}.</div>`;bindAdv($('alerts2'));
  $('watch2').innerHTML=wt.length?wt.map(watchHTML).join('<div style="height:.6rem"></div>'):'<div class="empty">Nothing flagged.</div>';
  $('haz2').innerHTML=hazHTML(R.hazards);$('hazList').innerHTML=hazHTML(R.hazards);
}

/* ---------- hero cards ---------- */
function heroes(){
  const b=R.beginner||{},g=R.general||{},c=R.canoes||{},rg=R.regional||{},g0=genInfo();
  const [cl,cc]=CALL[b.call]||[b.call||'NO CALL','c-mute'];
  $('hero0').innerHTML=`<div><div class="eyebrow">Beginner lesson call · ${esc(rel())}${rel()!=='Today'?'':''}</div><div class="call ${cc}"><span class="dot"></span>${esc(cl)}</div><p style="font-size:1.05rem;margin:.5rem 0 0">${esc(b.headline)}</p></div><hr>
  <div><div style="display:flex;gap:.6rem;align-items:center"><span class="tag">HAW</span><span class="eyebrow">Canoes · break estimate</span></div><div class="big">${esc(nn(c.size_ft))} <small>ft</small></div><div style="font-size:.85rem;color:var(--mute)">${esc([c.face,c.quality&&('surf quality '+c.quality.toLowerCase())].filter(Boolean).join(' · '))}. Regional ${esc(nn(rg.am_ft))} / ${esc(nn(rg.pm_ft))} ft does not apply to Canoes.</div></div>
  <div class="hfoot"><span>${g0?`Updated ${fmtT(g0.hour)} HST`:''}</span><span>Confidence: ${esc(nn(b.confidence))}</span></div>`;
  const rc=RATE[g.rating]??'';
  $('hero1').innerHTML=`<div><div class="eyebrow">General surfer outlook · ${esc(rel())}</div><div class="call ${rc}"><span class="dot"></span>${esc(nn(g.rating,'NO RATING'))}</div><p style="font-size:1.05rem;margin:.5rem 0 0">${esc(g.headline)}</p></div><hr>
  <div><div style="display:flex;gap:.6rem;align-items:center"><span class="tag">HAW</span><span class="eyebrow">Regional South Shore</span></div><div class="big">${esc(nn(g.size_ft))} <small>ft</small></div><div style="font-size:.85rem;color:var(--mute)">${esc(g.size_note)}</div></div>
  <div class="hfoot"><span>${esc(g.trend)}</span><span>${esc(arr(g.favored).slice(0,2).join(', '))}</span></div>`;
}

/* ---------- conditions row ---------- */
const IC={"period":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12q2.5-7 5 0t5 0t5 0t5 0\"/><path d=\"M2 19h20\"/></svg>","dir":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"M12 6.5l3 8-3-1.6-3 1.6z\"/></svg>","tide":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 9q2.5-3 5 0t5 0t5 0t5 0\"/><path d=\"M2 16q2.5-3 5 0t5 0t5 0t5 0\"/><path d=\"M12 21V12M9 15l3-3 3 3\" stroke-width=\"1.5\"/></svg>","wind":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 9h10a2.8 2.8 0 1 0-2.8-2.8\"/><path d=\"M3 14h14a3 3 0 1 1-3 3\"/><path d=\"M3 19h6\"/></svg>","surface":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 8q2.5-3 5 0t5 0t5 0t5 0\"/><path d=\"M2 13q2.5-3 5 0t5 0t5 0t5 0\" opacity=\".7\"/><path d=\"M2 18q2.5-3 5 0t5 0t5 0t5 0\" opacity=\".45\"/></svg>","current":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8h13l-3-3M3 8\"/><path d=\"M21 16H8l3 3\"/><path d=\"M16 8l-3 3\"/><path d=\"M8 16l3-3\"/></svg>","water":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3C8 8.5 5.5 11.5 5.5 15a6.5 6.5 0 0 0 13 0C18.5 11.5 16 8.5 12 3z\"/></svg>"};
function tidePhaseAt(h){const ev=tideEvents().filter(e=>e.real);const nx=ev.find(e=>e.t>h);if(!nx)return null;return nx.type==='H'?'Rising':'Falling'}
function conds(){
  const sw=R.swell||{},p=arr(sw.components)[0]||{},off=sw.offshore||{},w=R.wind||{},s=R.surface||{},t=R.tide||{},c=R.current||{},q=R.water||{};
  const g=genInfo(),refH=dayDiff(R.report_date,R.target_date)===0&&g?g.hour:7;
  const ph=tidePhaseAt(refH)||t.phase||'–';
  const tev=tideEvents().filter(e=>e.real&&e.t>=0&&e.t<24).map(e=>`<b>${e.type==='H'?'High':'Low'} ${fmtT(e.t)}</b> at ${e.ft} ft`).join('. ');
  const others=arr(sw.components).slice(1).map(x=>`${x.s} s ${x.dir}`).join(' and ');
  const wm=mph(w.kt),gm=mph(w.gust_kt);
  const C=[
   ['period','Swell period',[nn(p.s),'sec'],sw.status,`<b>${esc(nn(sw.trend))}.</b> ${esc(p.dir||'')} groundswell${off.ft!=null?`, ${esc(off.ft)} ft at ${esc(off.s)} s offshore`:''}. ${esc(sw.warning||'')}`],
   ['dir','Swell direction',[nn(p.dir),p.deg!=null?p.deg+'°':''],sw.status,`From the ${esc(DIRNAME[p.dir]||p.dir||'–')}.${others?` Also <b>${esc(others)}</b>.`:''}`],
   ['tide','Tide',[ph,''],t.status,`${tev||'No highs or lows listed.'}${t.phase?` ${esc(t.phase)}.`:''}`],
   ['wind','Wind',[nn(wm),`mph ${w.dir||''}`],w.status,`${gm!=null?`Gusts to <b>${gm} mph</b>.`:'Gusts unavailable.'} ${esc(w.effect||'')}${w.effect?'.':''} ${esc(w.forecast||'')}${w.trend?`, ${esc(w.trend.toLowerCase())}`:''}.`],
   ['surface','Surface',[nn(s.state),''],s.status,`Board drift <b>${esc(nn(s.drift).toLowerCase())}</b>. Main limit: ${esc(nn(s.limiting).toLowerCase())}.`],
   ['current','Current',[nn(c.state),''],c.status,`Between sets: ${esc(nn(c.between_sets).toLowerCase())}. <b>During sets: ${esc(nn(c.during_sets).toLowerCase())}.</b> After sets: ${esc(nn(c.post_set).toLowerCase())}.`],
   ['water','Water quality',[nn(q.headline),''],q.status,`${esc(q.statement||'')} <b>If it looks brown or cloudy, stay out.</b>`]];
  $('tiles').innerHTML=C.map(x=>{const [sl,sc]=stat(x[3]);return `<div class="cond"><div class="ch">${IC[x[0]]}<span class="eyebrow">${esc(x[1])}</span></div><div class="val">${esc(x[2][0])}${x[2][1]?`<small>${esc(x[2][1])}</small>`:''}</div><span class="src ${sc}">${esc(sl)}</span><p>${x[4]}</p></div>`}).join('');
  $('condHint').textContent=`Slide sideways for all ${C.length}.`;
}

/* ---------- lesson windows ---------- */
function windowsSorted(){return arr(R.windows).slice().sort((a,b)=>{const o={BEST:0,CONDITIONAL:1,AVOID:2};return (o[a.rating]??3)-(o[b.rating]??3)})}
function winHTML(w){const [nm,cls]=RT[w.rating]||['Window',''];
  const icon=w.rating==='BEST'?STAR(16):`<span class="wdot" style="background:var(${w.rating==='AVOID'?'--adv':'--call'})"></span>`;
  const rows=[];
  if(arr(w.reasons).length)rows.push(`<div class="wl">${esc(w.reasons.join(' · '))}</div>`);
  if(w.effort)rows.push(`<div class="wl"><b>Effort</b> student ${esc(nn(w.effort.student).toLowerCase())}, you ${esc(nn(w.effort.coach).toLowerCase())}</div>`);
  if(arr(w.notes).length)rows.push(`<div class="wl">${esc(w.notes.join(' · '))}</div>`);
  if(arr(w.workable_for).length)rows.push(`<div class="wl"><b>Maybe workable for</b> ${esc(w.workable_for.join(', ').toLowerCase())}</div>`);
  if(arr(w.avoid_for).length)rows.push(`<div class="wl"><b>Reschedule for</b> ${esc(w.avoid_for.join(', ').toLowerCase())}</div>`);
  if(arr(w.precheck).length)rows.push(`<div class="lowconf">Check first: ${esc(w.precheck.join(', ').toLowerCase())}.</div>`);
  return `<div class="win ${w.rating==='BEST'?'winbest':w.rating==='AVOID'?'wavoid':'wcond'}"><div class="starline">${icon}<div class="eyebrow" style="color:#E6D9F2">${esc(nm)} · ${esc(rel().toLowerCase())}</div></div><div class="t">${esc(range(w.start,w.end))}</div><div style="font-size:1.1rem">${esc(w.label||'')}${w.go?` · ${esc(w.go)}`:''}</div>${rows.join('')}</div>`}
function renderWindows(){const ws=windowsSorted();
  $('winPager').innerHTML=ws.length?ws.map(winHTML).join(''):`<div class="win"><div class="eyebrow">Lesson windows</div><div class="t" style="color:var(--mute)">Not rated</div><div class="wl">This report has no lesson windows.</div></div>`;
  $('winPager').scrollTo({left:0});syncSA()}

/* ---------- hours ---------- */
function hourWin(h){let best=null,ov=0;arr(R.windows).forEach(w=>{const a=t2h(w.start),b=t2h(w.end);if(a==null||b==null)return;const o=Math.min(b,h+1)-Math.max(a,h);if(o>ov+1e-9){ov=o;best=w}});return ov>=.5?best:null}
let HOURS=[],sel=9;
function tideNote(h){const ev=tideEvents().filter(e=>e.real),mid=h+.5,e=ev.find(x=>x.t>h);if(!e)return '';const w=e.type==='H'?'high':'low';
  return Math.abs(e.t-mid)<=.75?`Tide near ${w} (${fmtT(e.t)}).`:`Tide ${e.type==='H'?'rising toward':'falling toward'} the ${fmtT(e.t)} ${w}.`}
function clock(h){const a=(h%12)*30*Math.PI/180;
  return `<svg class="clk" width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="15" cy="15" r="12.5"/><path d="M15 3.5v1.6M26.5 15h-1.6M15 26.5v-1.6M3.5 15h1.6" stroke-width="1.2"/><line x1="15" y1="15" x2="15" y2="7"/><line x1="15" y1="15" x2="${(15+6*Math.sin(a)).toFixed(2)}" y2="${(15-6*Math.cos(a)).toFixed(2)}" stroke-width="2.6"/></svg>`}
function buildHours(){HOURS=[];for(let h=6;h<=18;h++){const w=hourWin(h),rt=w&&RT[w.rating];
  HOURS.push({h,w,label:rt?rt[0]:'Not rated',cls:rt?'r-'+rt[1]:'r-none',lc:rt?rt[2]:'',best:w&&w.rating==='BEST'})}
  const fb=HOURS.find(x=>x.best);sel=fb?fb.h:9;
  $('timingSub').textContent=`6 AM to 6 PM, ${rel().toLowerCase()}. Slide sideways, tap an hour to see why.`}
function renderHours(){
  $('hours').innerHTML=HOURS.map(r=>`<button class="hr ${r.cls} ${r.best?'isbest':''}" data-h="${r.h}" aria-pressed="${r.h===sel}" aria-label="${fmtH(r.h)}, ${r.label}">${r.best?`<span class="bstar">${STAR(12)}</span>`:''}${clock(r.h)}<span class="tm">${fmtH(r.h)}</span><span class="lb ${r.lc}">${r.label}</span></button>`).join('');
  $('hours').querySelectorAll('.hr').forEach(b=>b.onclick=()=>{sel=+b.dataset.h;renderHours();centerSel(true)});
  const r=HOURS.find(x=>x.h===sel);if(!r){$('hdetail').innerHTML='';return}
  const w=r.w;
  $('hdetail').innerHTML=`<b>${fmtH(r.h)} · ${esc(r.label)}${w?` · ${esc(range(w.start,w.end))}`:''}</b><br>${w?`${esc(w.label||'')}${w.go?'. '+esc(w.go):''}. ${esc(arr(w.reasons).join(', '))}.`:'Outside the lesson windows in this report.'} ${esc(tideNote(r.h))}`}
function centerSel(smooth){const hs=$('hours'),b=hs.querySelector('[aria-pressed="true"]');if(b)hs.scrollTo({left:b.offsetLeft-hs.clientWidth/2+b.offsetWidth/2,behavior:smooth?'smooth':'auto'})}

/* ---------- before you start ---------- */
const li=a=>arr(a).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>None listed.</li>';
function renderChecks(){const b=R.beginner||{},c=R.current||{};
  $('precheck').innerHTML=li(b.precheck);$('nogo').innerHTML=li(arr(b.no_go).length?b.no_go:R.avoid_triggers);$('decisive').innerHTML=li(b.decisive);
  $('fieldTest').innerHTML=`<div class="eyebrow">Field test</div><p>${esc(nn(c.field_test))}</p>${b.recommendation?`<p class="fine" style="margin-top:.35rem">${esc(b.recommendation)}</p>`:''}`}

/* ---------- tide (from the report's real highs and lows) ---------- */
function tideEvents(){
  const t=R.tide||{},base=R.target_date;let ev=arr(t.events).map(e=>{const h=t2h(e.time);if(h==null||e.ft==null)return null;return {t:dayDiff(base,e.date||base)*24+h,type:e.type==='H'?'H':'L',ft:+e.ft,real:true}}).filter(Boolean).sort((a,b)=>a.t-b.t);
  if(!ev.length)return [];
  const HALF=6.21,hi=ev.filter(e=>e.type==='H').map(e=>e.ft),lo=ev.filter(e=>e.type==='L').map(e=>e.ft);
  const hv=hi.length?hi.reduce((a,b)=>a+b)/hi.length:ev[0].ft+1,lv=lo.length?lo.reduce((a,b)=>a+b)/lo.length:ev[0].ft-1;
  while(ev[0].t>-2){const f=ev[0],ty=f.type==='H'?'L':'H';ev.unshift({t:f.t-HALF,type:ty,ft:ty==='H'?hv:lv,real:false})}
  while(ev[ev.length-1].t<26){const l=ev[ev.length-1],ty=l.type==='H'?'L':'H';ev.push({t:l.t+HALF,type:ty,ft:ty==='H'?hv:lv,real:false})}
  return ev}
function tideAt(ev,h){for(let i=0;i<ev.length-1;i++){const a=ev[i],b=ev[i+1];if(h>=a.t&&h<=b.t){const k=(1-Math.cos(Math.PI*(h-a.t)/(b.t-a.t)))/2;return a.ft+(b.ft-a.ft)*k}}return null}
function tideSVG(opt){
  const ev=tideEvents();if(!ev.length)return '<div class="empty">Tide times unavailable in this report.</div>';
  const W=350,X0=34,X1=340,Y0=150,Y1=40,x=h=>X0+h/24*(X1-X0);
  let mn=Infinity,mx=-Infinity;for(let h=0;h<=24;h+=.25){const v=tideAt(ev,h);mn=Math.min(mn,v);mx=Math.max(mx,v)}
  const lo=Math.min(0,Math.floor(mn)),hi=Math.max(2,Math.ceil(mx+.15)),y=f=>Y0-(f-lo)/(hi-lo)*(Y0-Y1);
  let p='';for(let h=0;h<=24.001;h+=.25)p+=(p?'L':'M')+x(h).toFixed(1)+' '+y(tideAt(ev,h)).toFixed(1);
  let s='';
  const bw=arr(R.windows).find(w=>w.rating==='BEST');
  if(bw&&opt.window){const a=t2h(bw.start),b=t2h(bw.end);if(a!=null&&b!=null)s+=`<rect x="${x(a)}" y="${Y1-22}" width="${x(b)-x(a)}" height="${Y0-Y1+22}" style="fill:var(--best)" opacity=".10"/><text class="t11" x="${(x(a)+x(b))/2}" y="${Y0+30}" text-anchor="middle" style="fill:var(--best)" font-weight="600">Best window</text>`}
  s+=`<path d="${p}L${x(24)} ${Y0}L${x(0)} ${Y0}Z" style="fill:var(--area)"/><path d="${p}" fill="none" style="stroke:var(${opt.stroke||'--link'})" stroke-width="3"/>`;
  for(let v=lo;v<=hi;v++)s+=`<line x1="${X0}" y1="${y(v)}" x2="${X1}" y2="${y(v)}" style="stroke:var(--line2)" stroke-width="1"/><text class="t11" x="${X0-6}" y="${y(v)+4}" style="fill:var(--mute)" text-anchor="end">${v} ft</text>`;
  [[0,'12 AM'],[6,'6 AM'],[12,'12 PM'],[18,'6 PM']].forEach(a=>s+=`<text class="t11" x="${x(a[0])}" y="${Y0+14}" style="fill:var(--mute)" text-anchor="${a[0]===0?'start':'middle'}">${a[1]}</text>`);
  const g=genInfo();
  if(g&&g.date===R.target_date){const n=g.hour,v=tideAt(ev,n);s+=`<line x1="${x(n)}" y1="${Y1-30}" x2="${x(n)}" y2="${Y0}" style="stroke:var(--now)" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="${x(n)}" cy="${y(v)}" r="5" style="fill:var(--now)"/><text class="t11" x="${x(n)+(n>18?-6:6)}" y="${Y1-32}" style="fill:var(--now)" font-weight="600" text-anchor="${n>18?'end':'start'}">Report time</text>`}
  ev.filter(e=>e.real&&e.t>=0&&e.t<24).forEach(e=>{const hi2=e.type==='H',col=hi2?'--best':'--lo',ex=x(e.t),anc=ex<110?'start':ex>270?'end':'middle',tx=anc==='start'?Math.max(ex-6,X0):anc==='end'?Math.min(ex+6,X1):ex,low2=!hi2&&y(e.ft)+30>Y0,ty=hi2||low2?y(e.ft)-24:y(e.ft)+17;
    s+=`<circle cx="${ex}" cy="${y(e.ft)}" r="5" style="fill:var(${col})"/><text class="t12" x="${tx}" y="${ty}" style="fill:var(${col})" font-weight="600" text-anchor="${anc}">${fmtT(e.t)}</text><text class="t11" x="${tx}" y="${ty+13}" style="fill:var(${col})" text-anchor="${anc}">${hi2?'High':'Low'} ${e.ft} ft</text>`});
  return `<svg viewBox="0 0 ${W} ${opt.window?190:175}" width="100%" role="img" aria-label="Tide chart, ${esc(fmtD(R.target_date))}">${s}</svg>`}
function renderTide(){const t=R.tide||{};
  $('tideTitle').textContent=rel()==='Today'?"Today's tide":`Tide · ${rel()}`;
  $('tideChart').innerHTML=`<div class="tidepanel"><div class="dl">${esc(rel())} <span>${esc(fmtD(R.target_date))} · ${esc(t.station||'')}</span></div>${tideSVG({window:true})}</div>`;
  const ev=tideEvents().filter(e=>e.real);
  $('tideNote').textContent=`${t.conflict?t.conflict+' ':''}The line is drawn between the listed NOAA highs and lows${ev.length<4?'; outside them its shape is estimated':''}.`;
  $('wxTide').innerHTML=tideSVG({window:false,stroke:'--call'});$('wxTideStation').textContent=`${t.station||''} · Feet MLLW`;
  $('tidePos').innerHTML=li(t.positives);$('tideRule').textContent=t.rule||''}

/* ---------- wave energy (from swell components) ---------- */
function renderEnergy(){
  const comps=arr((R.swell||{}).components).filter(c=>c&&c.s>0&&c.ft>0);const off=(R.swell||{}).offshore||{};
  if(!comps.length){$('energy').innerHTML='';$('energyCap').textContent='Swell components unavailable.';$('energySub').textContent='';return}
  const A=comps.map(c=>c.ft*c.ft*c.s),mxA=Math.max(...A),cols=['--link','--lo','--call'];
  const X0=40,X1=336,Y0=214,Y1=84,x=p=>X0+(Math.min(20,Math.max(4,p))-4)/16*(X1-X0),y=a=>Y0-a*(Y0-Y1)/1.1;
  const g=(p,c,sg,a)=>a*Math.exp(-((p-c)**2)/(2*sg*sg));
  const f=p=>Math.min(1.08,comps.reduce((s,c,i)=>s+g(p,c.s,.7+.05*c.s,A[i]/mxA),0)+.02);
  let path='';for(let p=4;p<=20.001;p+=.2)path+=(path?'L':'M')+x(p).toFixed(1)+' '+y(f(p)).toFixed(1);
  const F='font-family:\'Instrument Sans\',sans-serif';
  let s=`<defs><linearGradient id="enG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--link)" stop-opacity=".75"/><stop offset="1" style="stop-color:var(--link)" stop-opacity=".05"/></linearGradient></defs>`;
  s+=`<rect x="${x(4)}" y="6" width="${x(10)-x(4)}" height="${Y0-6}" style="fill:var(--lo)" opacity=".07"/><rect x="${x(10)}" y="6" width="${x(20)-x(10)}" height="${Y0-6}" style="fill:var(--link)" opacity=".08"/>`;
  s+=`<text x="${(x(4)+x(10))/2}" y="22" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="1.2" style="fill:var(--lo);${F}">WIND CHOP</text><text x="${(x(10)+x(20))/2}" y="22" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="1.2" style="fill:var(--link);${F}">GROUNDSWELL</text>`;
  [['High',1],['Mid',.55],['Low',.1]].forEach(a=>{const yy=y(a[1]);s+=`<line x1="${X0}" y1="${yy}" x2="${X1}" y2="${yy}" style="stroke:var(--line2)" stroke-width="1" stroke-dasharray="3 5"/><text x="${X0-7}" y="${yy+4}" text-anchor="end" font-size="11.5" style="fill:var(--mute);${F}">${a[0]}</text>`});
  s+=`<path d="${path}L${x(20)} ${Y0}L${x(4)} ${Y0}Z" fill="url(#enG)"/><path d="${path}" fill="none" style="stroke:var(--best)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  s+=`<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" style="stroke:var(--mute)" stroke-width="1.5"/>`;
  for(let p=4;p<=20;p+=2)s+=`<line x1="${x(p)}" y1="${Y0}" x2="${x(p)}" y2="${Y0+5}" style="stroke:var(--mute)" stroke-width="1.5"/><text x="${x(p)}" y="${Y0+20}" text-anchor="middle" font-size="12.5" style="fill:var(--mute);${F}">${p}</text>`;
  s+=`<text x="${(X0+X1)/2}" y="${Y0+40}" text-anchor="middle" font-size="12" letter-spacing="1.4" style="fill:var(--mute);${F}">PERIOD · SECONDS</text>`;
  const order=comps.map((c,i)=>({c,i})).sort((a,b)=>a.c.s-b.c.s);let lastX=-999,lastY=999;
  order.forEach(({c,i})=>{const px=x(c.s),py=y(f(c.s)),w=64,tx=Math.min(Math.max(px,X0+w/2),X1-w/2);let ly=py-40;if(tx-lastX<w+4)ly=Math.min(ly,lastY-38);ly=Math.max(26,ly);lastX=tx;lastY=ly;const col=cols[i%3];
    s+=`<line x1="${px}" y1="${py}" x2="${px}" y2="${Y0}" style="stroke:var(${col})" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="${px}" cy="${py}" r="5.5" style="fill:var(${col});stroke:var(--bg)" stroke-width="2"/><g transform="translate(${tx} ${ly})"><rect x="${-w/2}" y="0" width="${w}" height="32" rx="9" style="fill:var(--bg);stroke:var(${col})" stroke-width="1.5"/><text y="14" text-anchor="middle" font-size="14" font-weight="800" style="fill:var(${col});${F}">${esc(c.s)} s</text><text y="26" text-anchor="middle" font-size="9.5" style="fill:var(--mute);${F}">${esc(c.dir)} · ${esc(c.ft)} ft</text></g>`});
  $('energy').innerHTML=s;
  const words=['One swell','Two swells','Three swells','Four swells'][comps.length-1]||comps.length+' swells';
  $('energyCap').innerHTML=`${words}: `+comps.map((c,i)=>`<span style="color:var(${cols[i%3]})">${esc(c.s)} s ${esc(c.dir)}</span>`).join(', ');
  const di=A.indexOf(mxA);$('energySub').textContent=`${comps[di].role||'Main'} ${comps[di].dir} swell carries the most energy.`;
  $('domPer').textContent=comps[di].s+' s';$('swH').textContent=off.ft!=null?`${off.ft} ft`:'–';$('swH').nextElementSibling.textContent=off.ft!=null?`${off.s} s ${off.dir||''} offshore. Not Canoes.`:'Not surf size, not Canoes'}

/* ---------- compasses ---------- */
function compass(id,deg,colorVar){
  let t=`<circle cx="80" cy="80" r="62" fill="none" style="stroke:var(--line2)" stroke-width="2"/>`;
  for(let a=0;a<360;a+=22.5){const major=a%90===0,r1=major?52:57,r2=62,rad=a*Math.PI/180;t+=`<line x1="${80+r1*Math.sin(rad)}" y1="${80-r1*Math.cos(rad)}" x2="${80+r2*Math.sin(rad)}" y2="${80-r2*Math.cos(rad)}" style="stroke:var(--mute)" stroke-width="${major?2:1}"/>`}
  t+=`<g class="t13" style="fill:var(--fg)" font-weight="600" text-anchor="middle"><text x="80" y="30">N</text><text x="132" y="85">E</text><text x="80" y="140">S</text><text x="28" y="85">W</text></g>`;
  if(deg!=null&&!isNaN(deg))t+=`<g transform="rotate(${(deg+180)%360} 80 80)"><line x1="80" y1="108" x2="80" y2="58" style="stroke:var(${colorVar})" stroke-width="5" stroke-linecap="round"/><path d="M80 44 L68 64 L92 64 Z" style="fill:var(${colorVar})"/></g><circle cx="80" cy="80" r="4" style="fill:var(${colorVar})"/>`;
  $(id).innerHTML=t}
function renderCompasses(){const p=arr((R.swell||{}).components)[0]||{},w=R.wind||{};
  compass('swellC',p.deg,'--link');compass('windC',w.deg,'--best');
  $('swellCap').innerHTML=`<b>From ${esc(nn(p.dir))}</b> · ${esc(nn(p.s))} sec<span>Arrow shows where it travels</span>`;
  $('windCap').innerHTML=`<b>From ${esc(nn(w.dir))}</b> · ${esc(nn(mph(w.kt)))} mph<span>Arrow shows where it blows</span>`}

/* ---------- swell map ---------- */
const MAPIMG='__MAPIMG__';
const BREAKS=[{x:524,y:570},{x:636,y:664}];
const ICON_WAVE='<path d="M-11 -6q2.75-4 5.5 0t5.5 0t5.5 0t5.5 0M-11 0q2.75-4 5.5 0t5.5 0t5.5 0t5.5 0M-11 6q2.75-4 5.5 0t5.5 0t5.5 0t5.5 0" fill="none"/>';
const ICON_WIND='<path d="M-11 -5H3a3 3 0 1 0-3-3M-11 0H9a3.2 3.2 0 1 1-3.2 3.2M-11 5H-2" fill="none"/>';
function windy(deg,fill,ink,icon,parts){
  const r0=28,r1=170,hw=22,tip=16,L=r1-r0,rm=(r0+r1)/2;
  let a=(((deg-90)%360)+360)%360;if(a>180)a-=360;
  const flip=(a>=90||a<-90),ang=flip?(a>0?a-180:a+180):a,sg=flip?-1:1;
  const rad=deg*Math.PI/180,cx=rm*Math.sin(rad),cy=-rm*Math.cos(rad);
  const body=`<g transform="rotate(${deg})"><path d="M${-hw} ${-r0}L${hw} ${-r0}L${hw} ${-(r1-tip)}L0 ${-r1}L${-hw} ${-(r1-tip)}Z" fill="${fill}" stroke="#14303f" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/></g>`;
  const txt=parts.map(p=>p[1]?`<tspan font-size="14" font-weight="700" dx="2">${esc(p[0])}</tspan>`:`<tspan font-size="24" font-weight="800" dx="${p[2]||0}">${esc(p[0])}</tspan>`).join('');
  return body+`<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang})"><g transform="translate(${sg*(L/2-20)} 0)" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${icon}</g><text x="${-sg*14}" y="1" text-anchor="middle" dominant-baseline="central" fill="${ink}" style="font-family:'Instrument Sans',sans-serif">${txt}</text></g>`}
function ring(r,w,col){return `<circle r="${r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${w+5}"/><circle r="${r}" fill="none" stroke="${col}" stroke-width="${w}"/>`}
function mapRing(b){
  const p=arr((R.swell||{}).components)[0]||{},w=R.wind||{};
  const Ro=172,Rm=136,Rc=40,sl='#566878',halo='stroke="#fff" stroke-opacity=".85" stroke-width="6" paint-order="stroke"';
  let g=`<g transform="translate(${b.x} ${b.y})"><circle r="${Ro}" fill="#fff" fill-opacity=".07"/>${ring(Ro,7,'#F6A800')}${ring(Rm,5,sl)}`;
  g+=`<path d="M0 ${-Rm}V${-Rc}M0 ${Rm}V${Rc}M${-Rm} 0H${-Rc}M${Rm} 0H${Rc}" stroke="#fff" stroke-opacity=".75" stroke-width="2.5"/>`+ring(Rc,5,sl);
  g+=`<g font-size="38" font-weight="800" text-anchor="middle" dominant-baseline="central" style="font-family:'Instrument Sans',sans-serif"><text y="${-Rm*.76}" fill="#FF1F1F" ${halo}>N</text><text x="${Rm*.76}" fill="${sl}" ${halo}>E</text><text x="${-Rm*.76}" fill="${sl}" ${halo}>W</text></g>`;
  if(w.deg!=null&&mph(w.kt)!=null)g+=windy(w.deg,'#63D45B','#1d4620',ICON_WIND,[[mph(w.kt),0],['mph',1]]);
  if(p.deg!=null)g+=windy(p.deg,'#58AEEF','#17415f',ICON_WAVE,[[p.ft,0],['ft',1],[p.s,0,5],['s',1]]);
  return g+'</g>'}
function renderMap(){
  const slides=[...$('mapPager').children],Z=2.1;
  slides.forEach((sl,i)=>{const b=BREAKS[i],stage=sl.querySelector('.stage'),cw=sl.clientWidth||340,sw=cw*Z,k=sw/1000;
    stage.style.width=sw+'px';stage.style.height=sw+'px';stage.style.backgroundImage=`url(${MAPIMG})`;
    const tx=Math.min(0,Math.max(cw-sw,cw/2-b.x*k)),ty=Math.min(0,Math.max(cw-sw,cw/2-b.y*k));
    stage.style.transform=`translate(${tx}px,${ty}px)`;sl.querySelector('svg').innerHTML=mapRing(b)});
  const p=arr((R.swell||{}).components)[0]||{},w=R.wind||{};
  $('mapLegend').innerHTML=`<span><i style="background:#58AEEF"></i><b>Swell ${esc(nn(p.ft))} ft</b> · ${esc(nn(p.s))} s · from ${esc(nn(p.dir))} (offshore, primary)</span><span><i style="background:#63D45B"></i><b>Wind ${esc(nn(mph(w.kt)))} mph</b> · from ${esc(nn(w.dir))}</span>`}

/* ---------- effort, boards, changes ---------- */
function fitClass(f){f=String(f||'').toLowerCase();return f.includes('strongly')?'f1':f.includes('favor')||f==='good'?'f2':f.includes('under')||f.includes('avoid')||f.includes('poor')?'f3':''}
function renderEffort(){
  $('effort').innerHTML=`<div class="erow head"><span></span><span>Student</span><span>You</span></div>`+arr(R.effort).map(e=>`<div class="erow"><b>${esc(e.when)}</b><span>${esc(nn(e.student))}</span><span>${esc(nn(e.coach))}</span></div>`).join('');
  $('effortRule').textContent=R.effort_rule||'';
  const bd=R.boards||{};
  $('boards').innerHTML=arr(bd.canoes).map(b=>`<div class="boardrow"><span>${esc(b.board)}</span><span class="fit ${fitClass(b.fit)}">${esc(b.fit)}</span></div>`).join('')||'<div class="empty">No board notes.</div>';
  $('townBoards').textContent=bd.town?`Town: ${bd.town}`:''}
function renderChanges(){const ch=R.changes||{},pv=ch.previous||{},sw=R.swell||{},p=arr(sw.components)[0]||{},c=R.canoes||{};
  $('cmp').innerHTML=`<div><span class="eyebrow">Before · ${esc(fmtD(pv.date))}</span><b>${esc(nn(pv.swell))}</b><span>Canoes ${esc(nn(pv.canoes_ft))} ft · ${esc(nn(pv.period_s))} s primary</span></div><div><span class="eyebrow">This report</span><b>${esc(nn(sw.trend))}</b><span>Canoes ${esc(nn(c.size_ft))} ft · ${esc(nn(p.s))} s primary</span></div>`;
  $('changes').innerHTML=li(ch.items);$('changeNext').textContent=ch.next?`Next: ${ch.next}.`:''}

/* ---------- breaks page ---------- */
const dirIcon=(deg,sz=14)=>`<svg width="${sz}" height="${sz}" viewBox="-8 -8 16 16" aria-hidden="true"><g transform="rotate(${(deg+180)%360})"><path d="M0 -7 L5 5 L0 2 L-5 5Z" fill="currentColor"/></g></svg>`;
let ZONES=[],zday=0;
function zoneRange(list){const n=[];list.forEach(b=>String(b.ft).split(/[–-]/).forEach(v=>{const f=parseFloat(v);if(!isNaN(f))n.push(f)}));if(!n.length)return '–';const a=Math.min(...n),b=Math.max(...n);return a===b?`${a}`:`${a}–${b}`}
function renderBreaks(){
  const br=arr(R.breaks),rg=R.regional||{},wk=br.filter(b=>b.zone!=='Town'),tw=br.filter(b=>b.zone==='Town');
  ZONES=[{name:'Waikīkī',sub:'Protected',size:zoneRange(wk),chips:wk,note:'Canoes and the inside breaks. Much smaller than the exposed South Shore.'},
         {name:'Town',sub:'Exposed',size:zoneRange(tw),chips:tw,note:'Exposed reefs pick up far more of the swell.'},
         {name:'South Shore',sub:'Regional forecast',size:`${nn(rg.am_ft)} / ${nn(rg.pm_ft)}`,chips:[{name:'Morning',ft:rg.am_ft},{name:'Afternoon',ft:rg.pm_ft}],note:rg.scope||''}];
  $('zPager').innerHTML=ZONES.map(z=>`<div class="surfcard zonecard"><div class="eyebrow">${esc(z.sub)}</div><div style="display:flex;align-items:center;gap:.7rem"><div class="bigsz">${esc(z.size)} <small>ft</small></div><span class="tag">HAW</span></div><div class="cps">${z.chips.map((c,i)=>`<span class="cp ${i%3===1?'per':i%3===2?'dir':''}">${esc(nn(c.ft))} ft<small>${esc(c.name)}</small></span>`).join('')}</div><div class="fine" style="margin-top:1rem">${esc(z.note)}</div></div>`).join('');
  zLabel();
  $('btable').innerHTML=br.map(b=>`<div class="brow ${b.name==='Canoes'?'canoes':''}"><span class="nm">${esc(b.name)}</span><span class="fbox">${esc(b.ft)}</span><span class="zn">${esc(b.zone)}</span></div>`).join('')||'<div class="empty">No break list in this report.</div>';
  const sw=R.swell||{},off=sw.offshore||{};
  $('stable').innerHTML=arr(sw.components).map(c=>`<div class="srow"><span class="rl">${esc(c.role)}</span><div class="sw"><b>${esc(c.ft)}</b> ft <small>${esc(c.s)}s</small></div><span class="sd">${c.deg!=null?dirIcon(c.deg,14):''} ${esc(c.dir)} ${c.deg!=null?esc(c.deg)+'°':''}</span></div>`).join('')||'<div class="empty">Swell components unavailable.</div>';
  $('offshoreNote').textContent=off.ft!=null?`Offshore ${off.dir||''} swell ${off.ft} ft at ${off.s} s (${off.source||'buoy'}, ${stat(off.status)[0].toLowerCase()}). That is energy out at sea; Canoes is not ${off.ft} ft.`:'';
  $('trend').innerHTML=`<div><span class="eyebrow">Before</span><b>${esc(nn(sw.trend_prev))}</b></div><div class="now"><span class="eyebrow">Now</span><b>${esc(nn(sw.trend))}</b></div><div><span class="eyebrow">Next</span><b>${esc(nn(sw.trend_next))}</b></div>`;
  $('swEffects').innerHTML=li(sw.effects);$('lpWarn').textContent=sw.warning||'';
  const g=R.general||{};
  $('genOut').innerHTML=`<div class="kv"><span>Rating</span><span><b>${esc(nn(g.rating))}</b></span></div><div class="kv"><span>Size</span><span>${esc(nn(g.size_ft))} ft regional</span></div><div class="kv"><span>Surface</span><span>${esc(nn(g.surface))}</span></div><div class="kv"><span>Favored</span><span>${esc(arr(g.favored).join(', ')||'–')}</span></div><div class="kv"><span>Waikīkī</span><span>${esc(nn(g.waikiki_note))}</span></div><div class="kv"><span>Trend</span><span>${esc(nn(g.trend))}</span></div>`}
function zLabel(){const z=ZONES[zday]||{};$('zName').innerHTML=`${esc(z.name||'')}<span>${esc(z.sub||'')}</span>`;$('saZ').classList.toggle('l',zday===ZONES.length-1)}

/* ---------- weather page ---------- */
function renderWeather(){
  const w=R.weather||{},up=w.upcoming;
  $('wcards').innerHTML=`<div class="wcard"><span class="lbl">${esc(rel())}</span><p>${esc([w.sky,w.showers].filter(Boolean).join('. '))}.${w.rain_pct!=null?` Rain ${esc(w.rain_pct)}%.`:''}</p></div><div class="wcard"><span class="lbl">Wind</span><p>${esc(nn(w.wind))}</p></div>`+(up?`<div class="wcard"><span class="lbl">Coming up · ${esc(up.when)}</span><p>${esc(arr(up.items).join('. '))}.</p>${up.note?`<span class="fine">${esc(up.note)}</span>`:''}</div>`:'');
  const tr=R.tropical||{};$('tropical').textContent=`Active cyclones: ${tr.active||'unknown'}. ${tr.note||''}`;
  const q=R.water||{},[ql,qc]=stat(q.status);
  $('wqBadge').textContent=ql;$('wqBadge').className='badge '+(qc==='s-ver'?'ok':qc==='s-no'?'no':'');
  $('wqHead').textContent=q.headline||'';$('wqStatement').textContent=q.statement||'';$('wqWhy').textContent=q.why||'';
  $('wqNotices').innerHTML=arr(q.notices).map(n=>`<div class="hazrow"><span class="hn">${esc(n.head)}<small>${esc(n.issued||'')}</small></span><span class="hz ${n.scope==='Waikīkī'?'on':''}">${esc(n.scope)}</span></div>`).join('');
  $('wqRunoff').textContent=q.runoff||'Brown, gray or cloudy water: do not go in, advisory or not.';
  const c=R.current||{};
  $('curState').textContent=`${nn(c.state)} · confidence ${String(nn(c.confidence)).toLowerCase()}`;
  $('curRows').innerHTML=[['Between sets',c.between_sets],['During sets',c.during_sets],['After sets',c.post_set],['One student',c.one_student],['Several',c.multi_student]].filter(r=>r[1]).map(r=>`<div class="kv"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}

/* ---------- sources, settings info ---------- */
function renderSources(){
  $('srcList').innerHTML=arr(R.sources).map(s=>{const ok=/checked|verified|ok/i.test(s.status||'');return `<div class="hazrow"><span class="hn">${esc(s.name)}</span><span class="hz ${ok?'off':'on'}">${esc(s.status)}</span></div>`}).join('')||'<div class="empty">This report lists no sources.</div>';
  $('gapList').innerHTML=li(R.gaps);
  const g=genInfo(),nx=isoParts(R.next_update);
  $('dataInfo').innerHTML=[['Report',runName()],['Lessons for',`${rel()}, ${fmtD(R.target_date)}`],['Refreshed',g?`${fmtD(g.date)}, ${fmtT(g.hour)} HST`:'unknown'],['Next update',nx?`${fmtD(nx.date)}, ${fmtT(nx.hour)} HST`:'unknown'],['Loaded from',MODE==='live'?'Live report store':'Built-in copy'+(dbNote?` (${dbNote})`:'')]].map(r=>`<div class="kv"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}

/* ---------- render all ---------- */
function renderAll(){
  try{
    renderDataBar();renderAlerts();heroes();conds();renderWindows();buildHours();renderHours();renderChecks();
    renderTide();renderEnergy();renderCompasses();renderEffort();renderChanges();renderBreaks();renderWeather();renderSources();
    if(!$('v-home').classList.contains('hide'))requestAnimationFrame(()=>{centerSel(false);renderMap()});
  }catch(e){console.error(e);document.querySelectorAll('[data-databar]').forEach(el=>{el.className='databar warn';el.textContent='This report could not be displayed in full. Some fields are missing or malformed. Check the water and the sources yourself.'})}
}

/* ---------- swipe state ---------- */
const idxOf=p=>Math.round(p.scrollLeft/Math.max(1,p.clientWidth));
function syncSA(){const hp=$('heroPager'),wp=$('winPager');$('saHero').classList.toggle('l',idxOf(hp)>=hp.children.length-1);$('saWin').classList.toggle('l',idxOf(wp)>=wp.children.length-1);$('saWin').hidden=wp.children.length<2}
['heroPager','winPager'].forEach(id=>{let t;$(id).addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(syncSA,110)},{passive:true})});
(function(){const p=$('zPager');let t;p.addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(()=>{const i=idxOf(p);if(i!==zday){zday=i;zLabel()}},100)},{passive:true})})();
window.addEventListener('resize',()=>{if(!$('v-home').classList.contains('hide'))renderMap()});

/* ---------- copy buttons ---------- */
const COPY='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
let toastT;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1600)}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);return true}catch(e){}
  try{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch(e){return false}}
document.querySelectorAll('.copybtn').forEach(b=>{b.innerHTML=COPY;b.onclick=async()=>toast(await copyText(b.dataset.copy)?`Copied ${b.dataset.copy}`:'Could not copy. Press and hold the number instead.')});

/* ---------- settings ---------- */
const root=document.documentElement;
const load1=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}},save=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function applySize(v){root.dataset.size=v;document.querySelectorAll('#sizeSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v))}
function applyPal(v){root.dataset.palette=v;document.querySelectorAll('#palSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v))}
applySize(load1('hssops-size','m'));applyPal(load1('hssops-palette','violet'));
document.querySelectorAll('#sizeSeg button').forEach(b=>b.onclick=()=>{applySize(b.dataset.v);save('hssops-size',b.dataset.v)});
document.querySelectorAll('#palSeg button').forEach(b=>b.onclick=()=>{applyPal(b.dataset.v);save('hssops-palette',b.dataset.v)});

/* ---------- pages ---------- */
const TABS=[['#/','Report','home'],['#/breaks','Breaks','breaks'],['#/weather','Weather','weather']];
document.querySelectorAll('[data-tabs]').forEach(el=>el.innerHTML=TABS.map(t=>`<a href="${t[0]}" data-r="${t[2]}">${t[1]}</a>`).join(''));
function setTab(name){document.querySelectorAll('.tabbar a').forEach(a=>{if(a.dataset.r===name)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
function route(){const name=(location.hash.replace(/^#\/?/,'')||'home');const id='v-'+(document.getElementById('v-'+name)?name:'home');document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hide',v.id!==id));window.scrollTo(0,0);setTab(id==='v-home'?'home':id==='v-breaks'?'breaks':id==='v-weather'?'weather':'');if(id==='v-home')requestAnimationFrame(()=>{centerSel(false);renderMap();syncSA()});if(id==='v-breaks')zLabel()}

/* ---------- swipe chevrons, swipe back ---------- */
const CHEVR='<svg viewBox="0 0 16 28" aria-hidden="true"><path d="M3 2.5 13 14 3 25.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
document.querySelectorAll('.sa').forEach(e=>e.innerHTML=CHEVR);
const stk=[location.hash||'#/'];
window.addEventListener('hashchange',()=>{const h=location.hash||'#/';if(stk.length>1&&stk[stk.length-2]===h)stk.pop();else if(stk[stk.length-1]!==h)stk.push(h)});
function goBack(){if(stk.length>1)history.back();else location.hash='#/'}
document.querySelectorAll('[data-back]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goBack()}));
let sx=0,sy=0,sOk=false;
document.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;sOk=!e.target.closest('.hscroll,.pager,.conds,.hours,.mappager,.wxscroll,.fpager,input')},{passive:true});
document.addEventListener('touchend',e=>{if(!sOk)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(dx>80&&Math.abs(dy)<70&&dx>Math.abs(dy)*2&&stk.length>1)goBack()},{passive:true});
window.addEventListener('hashchange',route);

/* ---------- opening screen ---------- */
$('spOpen').onclick=()=>{const s=$('splash');s.classList.add('gone');setTimeout(()=>s.hidden=true,500);requestAnimationFrame(()=>{renderMap();centerSel(false);syncSA()})};

/* ---------- boot: render the built-in copy, then load the newest report ---------- */
renderAll();route();
const newer=d=>{const a=isoParts(d&&d.generated_at),b=isoParts(R.generated_at);return a&&(!b||a.ms>b.ms||MODE!=='live')};
function useReport(d,src){if(!d||d.schema!=='hss-ops/1'){dbNote=`${src} has an unknown format.`;renderDataBar();renderSources();return false}
  if(!newer(d))return false;R=d;MODE='live';dbNote='';renderAll();return true}
async function loadFile(){
  try{const r=await fetch('data/latest.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;useReport(await r.json(),'The report file')}
  catch(e){if(MODE!=='live'){dbNote='Live report not reachable here.';renderDataBar();renderSources()}}}
(async()=>{
  if(location.protocol.startsWith('http'))await loadFile();
  try{
    const db=window.claude&&window.claude.use?await window.claude.use('db'):null;
    if(!db)return;
    db.doc('reports/latest').onSnapshot(snap=>{if(snap.exists)useReport(snap.data(),'The stored report')},()=>{});
  }catch(e){}
})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&location.protocol.startsWith('http'))loadFile()});
