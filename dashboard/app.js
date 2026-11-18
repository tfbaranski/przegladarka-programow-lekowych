(function(){
'use strict';
const D = window.NFZ_DATA;
const $ = s => document.querySelector(s);
const SLOTS = ['--s1','--s2','--s3','--s4','--s5','--s6','--s7','--s8'];
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const OTHER = '--other';
const WIN_SHORT = ['2024','II kw.24–I kw.25','III kw.24–II kw.25','IV kw.24–III kw.25','2025','II kw.25–I kw.26','III kw.25–II kw.26'];
const WIN_TICK = ['2024','IIQ24–IQ25','IIIQ24–IIQ25','IVQ24–IIIQ25','2025','IIQ25–IQ26','IIIQ25–IIQ26'];
const HALF_LBL = D.half.map(h => h.replace(/(\d{4})H(\d)/, (m,y,s)=> (s==='1'?'I':'II')+' '+y));
const nf0 = new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0});
const nf1 = new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1});
const fmtN = v => v==null||isNaN(v) ? '–' : nf0.format(Math.round(v));
const fmtPLN = v => {
  if (v==null||isNaN(v)) return '–';
  const a = Math.abs(v);
  if (a >= 1e9) return nf1.format(v/1e9)+' mld zł';
  if (a >= 1e6) return nf1.format(v/1e6)+' mln zł';
  if (a >= 1e3) return nf0.format(v/1e3)+' tys. zł';
  return nf0.format(v)+' zł';
};
const shortName = s => s.replace(/Spółka z Ograniczoną Odpowiedzialnością/gi,'sp. z o.o.').replace(/Samodzielny Publiczny Zakład Opieki Zdrowotnej/gi,'SPZOZ').replace(/Spółka Akcyjna/gi,'S.A.');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---------- state ----------
const S = { prog: 0, sub: -1, ow: -1, city: '', centre: -1, q: 9, mapMode: 'centres', sort: {k:'w', d:-1} };
try { const h = location.hash.replace('#',''); const m = /^p(\d+)$/.exec(h); if (m && D.programs[+m[1]]) S.prog = +m[1]; } catch(e) {}

// ---------- indices ----------
const P = () => D.programs[S.prog];
const TLI_T='Technologia lekowa o wysokim poziomie innowacyjności (lista TLI, finansowanie z Funduszu Medycznego)';
const isR = () => P().code==='RDTL';
const isL = () => !!P().limited;
function plQ9(){ const t=new Array(P().subs.length).fill(0); for(const r of QR) if(r[3]===9) t[r[2]]+=r[4]; return t; }
function rdtlCon(){ let a=0,b=0; for(let ci=0;ci<D.centres.length;ci++){ if(!centreInScope(ci)) continue; const c=D.centres[ci].con.RDTL; if(c){a+=c['2025']||0;b+=c['2026']||0;} } return [a,b]; }
// rec: [centre, prog, sub, win, pat, raw, method]
function recsFor(progIdx){ return D.rec.filter(r => r[1]===progIdx); }
let R = recsFor(S.prog), QR = D.qrec.filter(r=>r[1]===S.prog);

function centreInScope(ci){
  const c = D.centres[ci];
  if (S.ow >= 0 && c.ow !== S.ow) return false;
  if (S.city && c.city !== S.city) return false;
  if (S.centre >= 0 && ci !== S.centre) return false;
  return true;
}
const level = () => S.centre>=0 ? 'centre' : S.city ? 'city' : S.ow>=0 ? 'ow' : 'pl';
const subsIdx = () => S.sub>=0 ? [S.sub] : P().subs.map((_,i)=>i);

// patients by window x sub for current scope
function patGrid(){
  const ns = P().subs.length, g = Array.from({length:7},()=>new Array(ns).fill(0));
  for (const r of R) if (centreInScope(r[0])) g[r[3]][r[2]] += r[4];
  return g;
}
// OW totals per window/sub (for spend shares)
function owTotals(){
  const ns=P().subs.length, t={};
  for (const r of R){ const ow=D.centres[r[0]].ow; (t[ow] ||= Array.from({length:7},()=>new Array(ns).fill(0)))[r[3]][r[2]] += r[4]; }
  return t;
}
// ---------- quarters from rolling 4-quarter windows ----------
const QL=['I kw. 2024','II kw. 2024','III kw. 2024','IV kw. 2024','I kw. 2025','II kw. 2025','III kw. 2025','IV kw. 2025','I kw. 2026','II kw. 2026'];
const QT=['I kw.24','II kw.24','III kw.24','IV kw.24','I kw.25','II kw.25','III kw.25','IV kw.25','I kw.26','II kw.26'];
const NQ=10, qwin=q=>q-3;
const MC={};
function qSys(f){
  const key=f.toFixed(3); if(MC[key]) return MC[key];
  const A=[]; for(let w=0;w<7;w++){ const r=new Array(NQ).fill(0); for(let q=w;q<w+4;q++) r[q]=f/4; A.push(r); }
  const Dm=[]; for(let i=0;i<NQ-2;i++){ const r=new Array(NQ).fill(0); r[i]=1; r[i+1]=-2; r[i+2]=1; Dm.push(r); }
  const lam=0.5*(f/4)*(f/4);   // wygładzenie: okna odtwarzane z dokładnością ~1-2%
  const N=[...Array(NQ)].map((_,i)=>[...Array(NQ)].map((_,j)=>A.reduce((s,r)=>s+r[i]*r[j],0)+lam*Dm.reduce((s,r)=>s+r[i]*r[j],0)));
  return MC[key]={N,A};
}
function solveSym(N,b){ const n=b.length, M=N.map((r,i)=>r.concat([b[i]]));
  for(let c=0;c<n;c++){ let p=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r; [M[c],M[p]]=[M[p],M[c]];
    const d=M[c][c]||1e-12; for(let k=c;k<=n;k++) M[c][k]/=d;
    for(let r=0;r<n;r++) if(r!==c){ const m=M[r][c]; if(m) for(let k=c;k<=n;k++) M[r][k]-=m*M[c][k]; } }
  return M.map(r=>r[n]); }
// nieujemne najmniejsze kwadraty (zbiór aktywny)
function toQ(U,f){
  if(!U.some(v=>v>0)) return new Array(NQ).fill(0);
  const {N,A}=qSys(f); const rhs=[...Array(NQ)].map((_,q)=>A.reduce((s,r,w)=>s+r[q]*(U[w]||0),0));
  const free=[...Array(NQ).keys()]; let x=new Array(NQ).fill(0);
  for(let it=0;it<NQ;it++){
    const sol=solveSym(free.map(i=>free.map(j=>N[i][j])), free.map(i=>rhs[i]));
    let worst=-1, wv=0; sol.forEach((v,k)=>{ if(v<wv){ wv=v; worst=k; } });
    if(worst<0){ x=new Array(NQ).fill(0); free.forEach((q,k)=>x[q]=sol[k]); break; }
    free.splice(worst,1);
  }
  return x;
}
// quarterly grid (10 x nsubs): skalibrowane kwartały (qrec: [centre, prog, sub, q, pat])
function qGrid(){ const ns=P().subs.length, g=Array.from({length:NQ},()=>new Array(ns).fill(0));
  for(const r of QR) if(centreInScope(r[0])) g[r[3]][r[2]]+=r[4]; return g; }
// per-centre: quarterly totals for selected subs + window data (spend, raw)
function centreQ(filterScope){
  const ns=P().subs.length, out=new Map();
  const get=ci=>{ let o=out.get(ci); if(!o){ o={q:new Array(NQ).fill(0),w:Array.from({length:ns},()=>new Array(7).fill(0)),raw:new Array(7).fill(0),k:new Array(7).fill(0)}; out.set(ci,o);} return o; };
  for(const r of QR){ if(S.sub>=0&&r[2]!==S.sub) continue; if(filterScope&&!filterScope(r[0])) continue; const _o=get(r[0]); _o.q[r[3]]+=r[4]; if(r[3]===9) (_o.q9 ||= new Array(ns).fill(0))[r[2]]+=r[4]; }
  for(const r of R){ if(S.sub>=0&&r[2]!==S.sub) continue; if(filterScope&&!filterScope(r[0])) continue; const o=get(r[0]); o.w[r[2]][r[3]]+=r[4]; o.raw[r[3]]+=r[5]; if(r[6]===1) o.k[r[3]]+=r[4]; }
  return out;
}
// spend per half-year for OW/PL, per sub
function spendHalf(owKey, sub){
  const sv = P().subs[sub].svc, s = (D.spend[P().code]||{})[sv];
  return s ? s[owKey] : new Array(D.half.length).fill(0);
}
function winFromHalf(arr){
  const ix = h => D.half.indexOf(h);
  const v = h => arr[ix(h)]||0;
  const w1=v('2024H1')+v('2024H2'), w3=v('2024H2')+v('2025H1'), w5=v('2025H1')+v('2025H2'), w7=v('2025H2')+v('2026H1');
  return [w1,(w1+w3)/2,w3,(w3+w5)/2,w5,(w5+w7)/2,w7];
}
// spend by window x sub for current scope (centre/city = allocation by patient share within OW)
function spendWinGrid(){
  if (isL()){ const ns=P().subs.length, pl=plQ9(), sc=new Array(ns).fill(0); for(const r of QR) if(r[3]===9&&centreInScope(r[0])) sc[r[2]]+=r[4]; const row=P().subs.map((s,i)=> pl[i]>0?(P().spend12[s.svc]||0)*sc[i]/pl[i]:0); return Array.from({length:7},()=>row.slice()); }
  const ns=P().subs.length, g=Array.from({length:7},()=>new Array(ns).fill(0));
  const lv = level();
  if (lv==='pl' || lv==='ow'){
    const key = lv==='pl' ? 17 : S.ow+1;
    for (let s=0;s<ns;s++){ const w=winFromHalf(spendHalf(key,s)); for(let i=0;i<7;i++) g[i][s]=w[i]; }
    return g;
  }
  const tot = owTotals(); const cache={};
  for (const r of R){
    if (!centreInScope(r[0])) continue;
    const ow = D.centres[r[0]].ow, s=r[2], w=r[3];
    const k=ow+'|'+s; const ws = cache[k] ||= winFromHalf(spendHalf(ow+1,s));
    const T = tot[ow][w][s]; if (T>0) g[w][s] += ws[w]*r[4]/T;
  }
  return g;
}

// ---------- tooltip ----------
const tip = $('#tip');
function showTip(html, ev){
  tip.innerHTML = html; tip.hidden = false;
  const pad=14, r=tip.getBoundingClientRect();
  let x=ev.clientX+pad, y=ev.clientY+pad;
  if (x+r.width>innerWidth-8) x=ev.clientX-r.width-pad;
  if (y+r.height>innerHeight-8) y=ev.clientY-r.height-pad;
  tip.style.left=x+'px'; tip.style.top=y+'px';
}
const hideTip = () => { tip.hidden = true; };

// ---------- colour assignment (fixed per entity: by order of substance in programme) ----------
function seriesDefs(){
  const subs = P().subs;
  if (S.sub>=0) return [{name:subs[S.sub].inn, color:css('--s1'), idx:[S.sub]}];
  const top = subs.slice(0,7).map((s,i)=>({name:s.inn, color:css(SLOTS[i]), idx:[i]}));
  if (subs.length>7) top.push({name:'Pozostałe ('+(subs.length-7)+')', color:css(OTHER), idx:subs.map((_,i)=>i).slice(7)});
  return top;
}

// ---------- generic SVG bar chart ----------
function niceMax(v){ if(v<=0) return 1; const e=Math.pow(10,Math.floor(Math.log10(v))); const f=v/e; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e; }
function barChart(el, cfg){
  // cfg: labels, ticks, series:[{name,color,values}], line:[{name,color,values,dash}], fmt, note
  const W = el.clientWidth || 640, H = cfg.height || 280;
  const m = {l:58, r:12, t:12, b:44};
  const iw = W-m.l-m.r, ih = H-m.t-m.b, n = cfg.labels.length;
  const totals = cfg.labels.map((_,i)=>cfg.series.reduce((a,s)=>a+(s.values[i]||0),0));
  const lineMax = Math.max(0,...(cfg.line||[]).flatMap(l=>l.values.filter(v=>v!=null)));
  const ymax = niceMax(Math.max(...totals, lineMax, cfg.minMax||0)*1.05);
  const bw = iw/n, barW = Math.max(4, Math.min(44, bw*0.62));
  const y = v => m.t + ih - (v/ymax)*ih;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(cfg.aria||'')}">`;
  for (let k=0;k<=4;k++){ const v=ymax*k/4, yy=y(v);
    s += `<line x1="${m.l}" x2="${W-m.r}" y1="${yy}" y2="${yy}" class="${k?'grid':'axis'}"/>`;
    s += `<text x="${m.l-8}" y="${yy+4}" class="tick" text-anchor="end">${esc(cfg.fmtAxis?cfg.fmtAxis(v):(ymax<20?nf1.format(v):fmtN(v)))}</text>`; }
  const every = Math.ceil(n / Math.max(1, Math.floor(iw/62)));
  cfg.labels.forEach((lb,i)=>{ if (i%every && i!==n-1) return;
    const cx = m.l+bw*i+bw/2; const t=(cfg.ticks||cfg.labels)[i];
    s += `<text x="${cx}" y="${H-m.b+16}" class="tick" text-anchor="middle">${esc(t)}</text>`; });
  // bars (stacked, 2px surface gap, rounded top)
  cfg.labels.forEach((_,i)=>{
    const cx = m.l+bw*i+bw/2; let acc=0; const segs=cfg.series.filter(sr=>(sr.values[i]||0)>0);
    segs.forEach((sr,j)=>{ const v=sr.values[i]; const y0=y(acc), y1=y(acc+v); acc+=v;
      const h=Math.max(0,y0-y1-(j<segs.length-1?0:0));
      const top = j===segs.length-1;
      const hh = Math.max(0.5, h - (j>0?2:0));
      const yy = y1 + (0);
      if (top && hh>4){ const r=Math.min(4,barW/2);
        s += `<path d="M${cx-barW/2},${yy+hh} V${yy+r} Q${cx-barW/2},${yy} ${cx-barW/2+r},${yy} H${cx+barW/2-r} Q${cx+barW/2},${yy} ${cx+barW/2},${yy+r} V${yy+hh} Z" fill="${sr.color}" ${sr.hatch&&sr.hatch[i]?'fill-opacity=".45"':''}/>`;
      } else s += `<rect x="${cx-barW/2}" y="${yy}" width="${barW}" height="${hh}" fill="${sr.color}" ${sr.hatch&&sr.hatch[i]?'fill-opacity=".45"':''}/>`;
    });
  });
  // lines
  (cfg.line||[]).forEach(l=>{
    let d=''; l.values.forEach((v,i)=>{ if(v==null) return; const cx=m.l+bw*i+bw/2; d += (d?'L':'M')+cx+','+y(v); });
    s += `<path d="${d}" fill="none" stroke="${l.color}" stroke-width="2" ${l.dash?'stroke-dasharray="5 4"':''}/>`;
    l.values.forEach((v,i)=>{ if(v==null) return; s += `<circle cx="${m.l+bw*i+bw/2}" cy="${y(v)}" r="4" fill="${l.color}" stroke="var(--surface)" stroke-width="2"/>`; });
  });
  // hover columns
  cfg.labels.forEach((_,i)=>{ s += `<rect class="hit" data-i="${i}" x="${m.l+bw*i}" y="${m.t}" width="${bw}" height="${ih}" fill="transparent"/>`; });
  s += `<line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${m.t+ih}" visibility="hidden"/>`;
  s += '</svg>';
  el.innerHTML = s;
  const svg = el.querySelector('svg'), xh = svg.querySelector('.xhair');
  svg.querySelectorAll('.hit').forEach(h=>{
    h.addEventListener('mousemove', ev=>{
      const i=+h.dataset.i; const cx=m.l+bw*i+bw/2; xh.setAttribute('x1',cx); xh.setAttribute('x2',cx); xh.setAttribute('visibility','visible');
      let html = `<div class="tt-h">${esc(cfg.tipTitle?cfg.tipTitle(i):cfg.labels[i])}</div>`;
      const rows = cfg.series.filter(sr=>(sr.values[i]||0)>0).slice().reverse();
      rows.forEach(sr=> html += `<div class="tt-r"><span class="sw" style="background:${sr.color}"></span><span>${esc(sr.name)}</span><b>${cfg.fmt(sr.values[i])}</b></div>`);
      if (cfg.series.length>1) html += `<div class="tt-r tt-t"><span></span><span>Razem</span><b>${cfg.fmt(totals[i])}</b></div>`;
      (cfg.line||[]).forEach(l=>{ if(l.values[i]!=null) html += `<div class="tt-r"><span class="sw ln" style="border-color:${l.color}"></span><span>${esc(l.name)}</span><b>${cfg.fmt(l.values[i])}</b></div>`; });
      if (cfg.tipNote && cfg.tipNote(i)) html += `<div class="tt-n">${esc(cfg.tipNote(i))}</div>`;
      showTip(html, ev);
    });
    h.addEventListener('mouseleave', ()=>{ xh.setAttribute('visibility','hidden'); hideTip(); });
  });
}
function legend(el, items){
  el.innerHTML = items.map(it=>`<span class="lg"><span class="sw ${it.line?'ln':''} ${it.dash?'dash':''}" style="${it.line?'border-color':'background'}:${it.color}"></span>${esc(it.name)}</span>`).join('');
}

// ---------- filters ----------
function fillSelect(sel, opts, val){ sel.innerHTML = opts.map(o=>`<option value="${esc(o.v)}"${String(o.v)===String(val)?' selected':''}>${esc(o.t)}</option>`).join(''); }
function centresWithData(){ const set=new Set(); for(const r of R) if(S.sub<0||r[2]===S.sub) set.add(r[0]); return set; }
function renderFilters(){
  fillSelect($('#f-prog'), D.programs.map((p,i)=>({v:i,t:`${p.code} ${p.name}`})), S.prog);
  fillSelect($('#f-sub'), [{v:-1,t:'Wszystkie substancje'}].concat(P().subs.map((s,i)=>({v:i,t:s.inn+(s.tli?' [TLI]':'')+(s.brands.length?' ('+s.brands.join(', ')+')':'')}))), S.sub);
  const has = centresWithData();
  const owsWith = new Set([...has].map(ci=>D.centres[ci].ow));
  fillSelect($('#f-ow'), [{v:-1,t:'Cała Polska'}].concat(D.ow.map((o,i)=>({v:i,t:o+(owsWith.has(i)?'':' (brak ośrodków)')}))), S.ow);
  const cities = [...new Set([...has].filter(ci=>S.ow<0||D.centres[ci].ow===S.ow).map(ci=>D.centres[ci].city))].sort((a,b)=>a.localeCompare(b,'pl'));
  fillSelect($('#f-city'), [{v:'',t:'Wszystkie miasta'}].concat(cities.map(c=>({v:c,t:c}))), S.city);
  const cs = [...has].filter(ci=>(S.ow<0||D.centres[ci].ow===S.ow)&&(!S.city||D.centres[ci].city===S.city)).sort((a,b)=>D.centres[a].name.localeCompare(D.centres[b].name,'pl'));
  fillSelect($('#f-centre'), [{v:-1,t:'Wszystkie ośrodki'}].concat(cs.map(ci=>({v:ci,t:shortName(D.centres[ci].name)+' — '+D.centres[ci].city}))), S.centre);
  fillSelect($('#f-win'), QL.map((w,i)=>({v:i,t:w})), S.q);
}
function bind(){
  $('#f-prog').onchange = e=>{ S.prog=+e.target.value; S.sub=-1; S.centre=-1; R=recsFor(S.prog); QR=D.qrec.filter(r=>r[1]===S.prog); try{history.replaceState(null,'','#p'+S.prog);}catch(_){} render(); };
  $('#f-sub').onchange = e=>{ S.sub=+e.target.value; render(); };
  $('#f-ow').onchange = e=>{ S.ow=+e.target.value; S.city=''; S.centre=-1; render(); };
  $('#f-city').onchange = e=>{ S.city=e.target.value; S.centre=-1; if(S.city&&S.ow<0){ const c=D.centres.find(c=>c.city===S.city); if(c) S.ow=c.ow; } render(); };
  $('#f-centre').onchange = e=>{ S.centre=+e.target.value; if(S.centre>=0){ const c=D.centres[S.centre]; S.ow=c.ow; S.city=c.city; } render(); };
  $('#f-win').onchange = e=>{ S.q=+e.target.value; render(); };
  $('#reset').onclick = ()=>{ S.sub=-1; S.ow=-1; S.city=''; S.centre=-1; S.q=9; render(); };
  document.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>{ S.mapMode=b.dataset.map; render(); });
  let t; addEventListener('resize', ()=>{ clearTimeout(t); t=setTimeout(render,150); });
}

// ---------- KPI ----------
function scopeLabel(){
  const lv=level();
  if (lv==='pl') return 'Polska';
  if (lv==='ow') return 'woj. '+D.ow[S.ow];
  if (lv==='city') return S.city+' (woj. '+D.ow[S.ow]+')';
  return shortName(D.centres[S.centre].name);
}
function renderKPI(qg, sg){
  const sum = row => subsIdx().reduce((a,i)=>a+row[i],0);
  const q=S.q, cur=sum(qg[q]), qq=q>0?sum(qg[q-1]):null, yy=q>=4?sum(qg[q-4]):null;
  const pct=(a,b)=> b? (a/b-1)*100 : null;
  const dTxt = d => d==null?'':`<span class="delta ${d>=0?'up':'down'}">${d>=0?'▲':'▼'} ${nf1.format(Math.abs(d))}%</span>`;
  const w=qwin(q), lv=level();
  const sp = isL() ? sum(sg[6]) : (w>=0 ? sum(sg[w]) : null);
  const nC=[...centreQ(ci=>centreInScope(ci))].filter(([,o])=>o.q[q]>=0.5).length;
  const dq = qq==null?null:cur-qq;
  $('#kpi').innerHTML = `
    <div class="tile"><div class="tl">Pacjenci · ${esc(QL[q])}</div><div class="tv">${fmtN(cur)}</div><div class="ts">${yy?dTxt(pct(cur,yy))+' r/r (vs '+esc(QL[q-4])+')':'szacunek kwartalny'}</div></div>
    <div class="tile"><div class="tl">Zmiana kw/kw</div><div class="tv">${dq==null?'<span class="na">n/d</span>':(dq>=0?'+':'−')+fmtN(Math.abs(dq))}</div><div class="ts">${dq==null?'brak poprzedniego kwartału':dTxt(pct(cur,qq))+' vs '+esc(QL[q-1])}</div></div>
    ${isL()?`<div class="tile"><div class="tl">Szac. refundacja leków · IX 2025–VIII 2026</div><div class="tv">${fmtPLN(sp)}</div><div class="ts">udział programu w refundacji EAN wg pacjentów (raport NFZ)</div></div>`:isR()?`<div class="tile"><div class="tl">Umowy RDTL · 2026</div><div class="tv">${fmtPLN(rdtlCon()[1])}</div><div class="ts">wartość umów RDTL ośrodków (wszystkie leki RDTL)</div></div>`:`<div class="tile"><div class="tl">Wydatki NFZ na leki · 12 mies. do ${esc(QL[q])}</div><div class="tv">${sp==null?'<span class="na">n/d</span>':fmtPLN(sp)}</div><div class="ts">${sp==null?'dane od IV kw. 2024':(lv==='pl'||lv==='ow'?'realizacja NFZ':'szacunek: udział ośrodka w pacjentach województwa')}</div></div>`}
    <div class="tile"><div class="tl">Ośrodki z pacjentami</div><div class="tv">${fmtN(nC)}</div><div class="ts">${esc(scopeLabel())}</div></div>`;
}

// ---------- charts ----------
function renderPatients(qg){
  const defs = seriesDefs();
  const series = defs.map(d=>({name:d.name,color:d.color,values:qg.map(row=>d.idx.reduce((a,i)=>a+row[i],0))}));
  barChart($('#c-pat'), {minMax:4, labels:QL, ticks:QT, series, fmt:fmtN, aria:'Pacjenci w kwartałach',
    tipNote: i => isL() ? 'Kalibracja: suma kwartałów do liczby pacjentów NFZ w I półroczu 2026 (raport „Programy lekowe”) — brak pliku realizacji.' : (i<3 ? 'Kwartał brzegowy – wyznaczony z jednego okna 4-kwartalnego (niższa precyzja). ' : '') + (isR() ? 'RDTL: dane surowe, bez kalibracji.' : 'Skalibrowane do realizacji NFZ.')});
  legend($('#l-pat'), series.length>1 ? series.filter(s=>s.values.some(v=>v>0)).map(s=>({name:s.name,color:s.color})) : []);
}
function renderDelta(qg){
  const box=$('#c-hist'), defs=seriesDefs();
  const tot = qg.map(row=>subsIdx().reduce((a,i)=>a+row[i],0));
  const d = tot.map((v,i)=> i? v-tot[i-1] : null).slice(1);
  const labels = QL.slice(1), ticks=QT.slice(1);
  const W=box.clientWidth||640, H=260, m={l:58,r:12,t:14,b:44}, iw=W-m.l-m.r, ih=H-m.t-m.b, n=d.length;
  const mx = niceMax(Math.max(1,...d.map(Math.abs))*1.1);
  const y=v=>m.t+ih/2-(v/mx)*(ih/2), bw=iw/n, barW=Math.min(40,bw*.6);
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Zmiana liczby pacjentów kwartał do kwartału">`;
  [-1,-.5,0,.5,1].forEach(k=>{ const v=mx*k, yy=y(v); s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${yy}" y2="${yy}" class="${k?'grid':'axis'}"/><text x="${m.l-8}" y="${yy+4}" class="tick" text-anchor="end">${v>0?'+':''}${fmtN(v)}</text>`; });
  d.forEach((v,i)=>{ const cx=m.l+bw*i+bw/2; const y0=y(0), y1=y(v); const top=Math.min(y0,y1), h=Math.max(1,Math.abs(y1-y0));
    s+=`<rect x="${cx-barW/2}" y="${top}" width="${barW}" height="${h}" rx="3" fill="${v>=0?css('--s1'):css('--s8')}"/>`;
    s+=`<text x="${cx}" y="${H-m.b+16}" class="tick" text-anchor="middle">${esc(ticks[i])}</text>`;
    if (n<=12) s+=`<text x="${cx}" y="${v>=0?top-5:top+h+13}" class="tick" text-anchor="middle">${v>=0?'+':'−'}${fmtN(Math.abs(v))}</text>`; });
  d.forEach((_,i)=> s+=`<rect class="hit" data-i="${i}" x="${m.l+bw*i}" y="${m.t}" width="${bw}" height="${ih}" fill="transparent"/>`);
  s+='</svg>'; box.innerHTML=s;
  box.querySelectorAll('.hit').forEach(h=>{ h.addEventListener('mousemove',ev=>{ const i=+h.dataset.i, q=i+1;
    let html=`<div class="tt-h">${esc(QL[q])} vs ${esc(QL[q-1])}</div>`;
    defs.forEach(df=>{ const a=df.idx.reduce((s,k)=>s+qg[q][k],0), b=df.idx.reduce((s,k)=>s+qg[q-1][k],0); if(a||b) html+=`<div class="tt-r"><span class="sw" style="background:${df.color}"></span><span>${esc(df.name)}</span><b>${a-b>=0?'+':'−'}${fmtN(Math.abs(a-b))}</b></div>`; });
    html+=`<div class="tt-r tt-t"><span></span><span>Razem</span><b>${d[i]>=0?'+':'−'}${fmtN(Math.abs(d[i]))} (${fmtN(tot[q-1])} → ${fmtN(tot[q])})</b></div>`;
    showTip(html,ev); }); h.addEventListener('mouseleave',hideTip); });
  legend($('#l-hist'), [{name:'Wzrost',color:css('--s1')},{name:'Spadek',color:css('--s8')}]);
}
function renderQTable(qg){
  const subs=P().subs, idx=subsIdx(); const tot=qg.map(r=>idx.reduce((a,i)=>a+r[i],0));
  const sw=i=> i<7?css(SLOTS[i]):css(OTHER);
  const cell=(v,p)=>`<td class="n">${fmtN(v)}${p!=null&&(v||p)?`<div class="dlt ${v-p>=0?'up':'down'}">${v-p>=0?'+':'−'}${fmtN(Math.abs(v-p))}</div>`:''}</td>`;
  const rows=idx.filter(i=>qg.some(r=>r[i]>0.05)).sort((a,b)=>qg[S.q][b]-qg[S.q][a]);
  $('#t-q').innerHTML=`<table class="qt"><thead><tr><th>Substancja</th>${QL.map((l,q)=>`<th class="n ${q===S.q?'qsel':''}">${esc(QT[q])}</th>`).join('')}</tr></thead><tbody>${
    rows.map(i=>`<tr data-sub="${i}" class="${S.sub===i?'sel':''}"><td><span class="sw" style="background:${sw(i)}"></span>${esc(subs[i].inn)}${subs[i].tli?' <span class="flag" title="'+TLI_T+'">TLI</span>':''}</td>${qg.map((r,q)=>cell(r[i],q?qg[q-1][i]:null)).join('')}</tr>`).join('')
  }</tbody><tfoot><tr><td>Razem</td>${tot.map((v,q)=>cell(v,q?tot[q-1]:null)).join('')}</tr></tfoot></table>`;
  document.querySelectorAll('#t-q tbody tr').forEach(tr=>tr.onclick=()=>{ const i=+tr.dataset.sub; S.sub=S.sub===i?-1:i; render(); });
  document.querySelectorAll('#t-q th.n').forEach((th,q)=>{ th.style.cursor='pointer'; th.onclick=()=>{ S.q=q; render(); }; });
}
function renderSpend(sg){
  const lv=level(), defs=seriesDefs();
  if (isL()){
    const MON=['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'], lbl=[], tk=[], d=[], pr=[];
    ['2025','2026'].forEach(y=>{ for(let m=0;m<12;m++){ lbl.push(MON[m]+' '+y); tk.push(m%3===0?MON[m]+' '+y.slice(2):''); let a=0,b=0;
      D.centres.forEach((c,ci)=>{ if(!centreInScope(ci)) return; const x=c.conm&&c.conm[P().code]; if(x&&x[y]){ a+=x[y].d[m]||0; b+=x[y].p[m]||0; } }); d.push(a); pr.push(b); } });
    barChart($('#c-spend'), {labels:lbl, ticks:tk, series:[{name:'Umowy – leki',color:css('--s1'),values:d},{name:'Umowy – procedury',color:css('--s3'),values:pr}], fmt:fmtPLN, fmtAxis:v=>fmtPLN(v).replace('PLN ','').replace(' zł',''), aria:'Miesięczna wartość umów NFZ'});
    $('#spend-sub').textContent = 'Miesięczne wartości umów NFZ ośrodków na program (leki i procedury), 2025–2026 · brak pliku realizacji programu, więc brak półrocznych kwot refundacji';
    legend($('#l-spend'), [{name:'Umowy – leki',color:css('--s1')},{name:'Umowy – procedury',color:css('--s3')}]); return;
  }
  if (isR()){
    const [a,b]=rdtlCon();
    barChart($('#c-spend'), {labels:['2025','2026'], series:[{name:'Umowy RDTL',color:css('--s7'),values:[a,b]}], fmt:fmtPLN, fmtAxis:v=>fmtPLN(v).replace(' zł',''), height:240, aria:'Wartość umów RDTL'});
    $('#spend-sub').textContent = 'Pacjenci RDTL są finansowani poza budżetem programów lekowych — nie wliczono ich do kalibracji ani wydatków programów. Pokazano roczną wartość umów RDTL ośrodków w wybranym zakresie (wszystkie leki RDTL, nie tylko te substancje).';
    $('#l-spend').innerHTML=''; return;
  }
  if (lv==='pl'||lv==='ow'){
    const key = lv==='pl'?17:S.ow+1;
    const series = defs.map(d=>({name:d.name,color:d.color,values:D.half.map((_,hi)=>d.idx.reduce((a,i)=>a+(spendHalf(key,i)[hi]||0),0))}));
    const first = D.half.findIndex((_,hi)=>series.some(s=>s.values[hi]>0));
    const sl = a => a.slice(Math.max(0,first));
    barChart($('#c-spend'), {labels:sl(HALF_LBL), series:series.map(s=>({...s,values:sl(s.values)})), fmt:fmtPLN, fmtAxis:v=>fmtPLN(v).replace(' zł',''), aria:'Wydatki NFZ na leki w programie',
      tipNote:()=> 'Kwota refundacji przypisana do programu proporcjonalnie do rozliczonych jednostek'});
    $('#spend-sub').textContent = 'Półrocza · kwota refundacji leków przypisana do programu (realizacja NFZ)';
    legend($('#l-spend'), series.length>1?series.filter(s=>s.values.some(v=>v>0)).map(s=>({name:s.name,color:s.color})):[]);
  } else {
    const series = defs.map(d=>({name:d.name,color:d.color,values:sg.map(row=>d.idx.reduce((a,i)=>a+row[i],0))}));
    barChart($('#c-spend'), {labels:D.windows.map((_,i)=>'12 mies. do '+QL[i+3]), ticks:QT.slice(3), series, fmt:fmtPLN, fmtAxis:v=>fmtPLN(v).replace(' zł',''), aria:'Szacowane wydatki NFZ w ośrodku'});
    $('#spend-sub').textContent = '12 mies. kończące się w danym kwartale · szacunek: wydatki województwa × udział ośrodka w pacjentach danej substancji';
    legend($('#l-spend'), series.length>1?series.filter(s=>s.values.some(v=>v>0)).map(s=>({name:s.name,color:s.color})):[]);
  }
}
function renderProducts(qg, sg){
  const q=S.q, w=qwin(q), subs=P().subs, tot=qg[q].reduce((a,b)=>a+b,0), stot=w>=0?sg[w].reduce((a,b)=>a+b,0):null;
  const rows = subs.map((s,i)=>({i,s,p:qg[q][i],pq:q?qg[q-1][i]:null,py:q>=4?qg[q-4][i]:null,sp:w>=0?sg[w][i]:null})).filter(r=>r.p>0.05||(r.sp||0)>0).sort((a,b)=>b.p-a.p);
  const sw = i => i<7 ? css(SLOTS[i]) : css(OTHER);
  const pc=(a,b)=> b>0.5?((a/b-1)*100>=0?'+':'')+nf1.format((a/b-1)*100)+'%':'–';
  $('#t-prod').innerHTML = `<table><thead><tr><th>Substancja (produkt)</th><th class="n">Pacjenci</th><th class="n">Udział</th><th class="n">kw/kw</th><th class="n">r/r</th><th class="n">Wydatki 12 mies.</th></tr></thead><tbody>${
    rows.map(r=>`<tr class="${S.sub===r.i?'sel':''}" data-sub="${r.i}"><td><span class="sw" style="background:${sw(r.i)}"></span>${esc(r.s.inn)}${r.s.tli?' <span class="flag" title="'+TLI_T+'">TLI</span>':''} <span class="muted">${esc(r.s.brands.join(', '))}</span></td><td class="n">${fmtN(r.p)}</td><td class="n">${tot?nf1.format(r.p/tot*100)+'%':'–'}</td><td class="n">${r.pq==null?'–':pc(r.p,r.pq)}</td><td class="n">${r.py==null?'–':pc(r.p,r.py)}</td><td class="n">${isR()||r.sp==null?'–':fmtPLN(r.sp)}</td></tr>`).join('')
  }</tbody><tfoot><tr><td>Razem</td><td class="n">${fmtN(tot)}</td><td class="n">100%</td><td></td><td></td><td class="n">${isR()||stot==null?'–':fmtPLN(stot)}</td></tr></tfoot></table>`;
  document.querySelectorAll('#t-prod tbody tr').forEach(tr=>tr.onclick=()=>{ const i=+tr.dataset.sub; S.sub = S.sub===i?-1:i; render(); });
}

// ---------- map ----------
const PL_OUT=[[53.92,14.22],[53.93,14.45],[54.03,14.76],[54.08,15.0],[54.18,15.58],[54.26,16.06],[54.43,16.41],[54.58,16.86],[54.76,17.55],[54.835,18.31],[54.79,18.42],[54.64,18.70],[54.60,18.81],[54.66,18.62],[54.72,18.41],[54.52,18.55],[54.44,18.57],[54.40,18.66],[54.35,18.95],[54.38,19.44],[54.45,19.63],[54.36,19.65],[54.40,20.3],[54.43,21.0],[54.37,21.8],[54.33,22.5],[54.36,22.79],[54.25,23.05],[54.12,23.35],[53.95,23.52],[53.89,23.51],[53.6,23.9],[53.4,23.95],[53.15,23.92],[52.95,23.93],[52.7,23.93],[52.55,23.75],[52.45,23.4],[52.38,23.12],[52.30,23.35],[52.20,23.55],[52.07,23.66],[51.85,23.65],[51.65,23.55],[51.52,23.62],[51.30,23.70],[51.17,23.82],[51.05,23.95],[50.87,24.14],[50.65,24.08],[50.43,24.0],[50.25,23.55],[50.05,23.3],[49.80,22.95],[49.55,22.68],[49.35,22.75],[49.25,22.8],[49.0,22.86],[49.08,22.57],[49.25,22.05],[49.43,21.6],[49.42,21.2],[49.38,20.95],[49.42,20.65],[49.36,20.35],[49.18,20.08],[49.25,19.85],[49.40,19.48],[49.52,19.25],[49.52,18.85],[49.68,18.80],[49.90,18.60],[49.97,18.25],[50.05,18.0],[50.17,17.62],[50.30,17.25],[50.42,16.92],[50.40,16.95],[50.20,16.85],[50.10,16.70],[50.20,16.48],[50.38,16.32],[50.45,16.21],[50.62,16.32],[50.65,16.05],[50.68,15.82],[50.75,15.6],[50.82,15.37],[50.92,15.25],[51.00,15.05],[50.87,14.83],[51.05,14.95],[51.15,15.0],[51.40,14.95],[51.60,14.73],[51.80,14.65],[52.0,14.73],[52.10,14.70],[52.35,14.55],[52.55,14.63],[52.75,14.20],[52.85,14.13],[53.1,14.35],[53.25,14.42],[53.40,14.35],[53.6,14.27],[53.75,14.27],[53.86,14.20]];
const OW_C=[[51.08,16.4],[53.07,18.5],[51.22,22.9],[52.2,15.3],[51.6,19.4],[49.85,20.25],[52.35,21.1],[50.65,17.85],[49.95,22.2],[53.3,22.9],[54.2,17.9],[50.35,19.0],[50.75,20.8],[53.85,20.8],[52.3,17.2],[53.6,15.6]];
const OW_ABBR=['DŚ','KP','LU','LB','ŁD','MP','MZ','OP','PK','PD','PM','ŚL','ŚK','WM','WP','ZP'];
const proj = (lat,lon) => [(lon-14)*0.6157*100, (55-lat)*100];
function renderMap(){
  const el=$('#map'), q=S.q;
  const val=new Map(); for(const [ci,o] of centreQ(null)) if(o.q[q]>0.05) val.set(ci,o.q[q]);
  const outline = 'M'+PL_OUT.map(p=>proj(p[0],p[1]).map(v=>v.toFixed(1)).join(',')).join('L')+'Z';
  // viewBox
  let vb=[-30,-40,700,660];
  if (S.ow>=0){
    const pts=[...val.keys()].filter(ci=>D.centres[ci].ow===S.ow).map(ci=>proj(D.centres[ci].lat,D.centres[ci].lon));
    pts.push(proj(OW_C[S.ow][0],OW_C[S.ow][1]));
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const cx=(x0+x1)/2, cy=(y0+y1)/2; let span=Math.max((x1-x0)*1.6,(y1-y0)*700/660*1.6,280);
    vb=[cx-span/2, cy-span*660/700/2, span, span*660/700];
  }
  const k = vb[2]/700;
  let s=`<svg viewBox="${vb.join(' ')}" width="100%" role="img" aria-label="Mapa ośrodków"><path d="${outline}" class="pl"/>`;
  OW_C.forEach((c,i)=>{ const p=proj(c[0],c[1]); s+=`<text x="${p[0]}" y="${p[1]}" class="owlbl ${S.ow===i?'on':''}" font-size="${11*k}" text-anchor="middle">${OW_ABBR[i]}</text>`; });
  if (S.mapMode==='ow' && S.ow<0){
    const owv=new Array(16).fill(0); for(const [ci,v] of val) owv[D.centres[ci].ow]+=v;
    const mx=Math.max(...owv,1);
    owv.forEach((v,i)=>{ if(v<=0) return; const p=proj(OW_C[i][0],OW_C[i][1]); const r=6+Math.sqrt(v/mx)*34;
      s+=`<circle class="bub ow" data-ow="${i}" cx="${p[0]}" cy="${p[1]}" r="${r}"/><text x="${p[0]}" y="${p[1]+4}" class="bublbl" text-anchor="middle">${fmtN(v)}</text>`; });
  } else {
    const arr=[...val].sort((a,b)=>b[1]-a[1]); const mx=Math.max(...arr.map(a=>a[1]),1);
    arr.forEach(([ci,v])=>{ const c=D.centres[ci]; const p=proj(c.lat,c.lon); const r=(2.5+Math.sqrt(v/mx)*22)*Math.max(k,0.35);
      const dim = (S.ow>=0&&c.ow!==S.ow)||(S.city&&c.city!==S.city&&S.ow===c.ow&&false);
      const sel = ci===S.centre || (S.city && c.city===S.city && S.centre<0);
      s+=`<circle class="bub ${sel?'sel':''} ${dim?'dim':''}" data-ci="${ci}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.toFixed(1)}" stroke-width="${1.5*k}"/>`; });
  }
  s+='</svg>'; el.innerHTML=s;
  el.querySelectorAll('.bub').forEach(b=>{
    b.addEventListener('mousemove',ev=>{
      if (b.dataset.ow){ const i=+b.dataset.ow; let v=0; for(const [ci,x] of val) if(D.centres[ci].ow===i) v+=x;
        showTip(`<div class="tt-h">woj. ${esc(D.ow[i])}</div><div class="tt-r"><span></span><span>Pacjenci</span><b>${fmtN(v)}</b></div><div class="tt-n">${esc(QL[q])} · kliknij, aby przybliżyć</div>`,ev); return; }
      const ci=+b.dataset.ci, c=D.centres[ci];
      showTip(`<div class="tt-h">${esc(shortName(c.name))}</div><div class="tt-n">${esc(c.addr)}, ${esc(c.city)} · woj. ${esc(D.ow[c.ow])}</div><div class="tt-r"><span></span><span>Pacjenci</span><b>${fmtN(val.get(ci))}</b></div><div class="tt-n">${esc(QL[q])} · kliknij, aby wybrać</div>`,ev);
    });
    b.addEventListener('mouseleave',hideTip);
    b.addEventListener('click',()=>{ hideTip(); if(b.dataset.ow){ S.ow=+b.dataset.ow; S.mapMode='centres'; } else { const ci=+b.dataset.ci; if(S.centre===ci){S.centre=-1;} else { S.centre=ci; S.ow=D.centres[ci].ow; S.city=D.centres[ci].city; } } render(); });
  });
  document.querySelectorAll('[data-map]').forEach(b=>b.classList.toggle('on',b.dataset.map===S.mapMode));
  $('#map-sub').textContent = `${QL[q]} · wielkość koła = liczba pacjentów${S.sub>=0?' ('+P().subs[S.sub].inn+')':''} · lokalizacja na poziomie miasta`;
}

// ---------- centre table ----------
function renderTable(){
  const q=S.q, w=qwin(q), owT=owTotals(), sc={};
  const cq=centreQ(ci=>{ const c=D.centres[ci]; return (S.ow<0||c.ow===S.ow)&&(!S.city||c.city===S.city); });
  let arr=[];
  for(const [ci,o] of cq){
    const c=D.centres[ci]; let sp=0;
    if(isL()){ const pl=plQ9(); (o.q9||[]).forEach((v,s)=>{ if(pl[s]>0) sp+=(P().spend12[P().subs[s].svc]||0)*v/pl[s]; }); }
    else if(w>=0 && !isR()) o.w.forEach((U,s)=>{ if(!U[w]) return; const key=c.ow+'|'+s; const ws=sc[key] ||= winFromHalf(spendHalf(c.ow+1,s)); const T=owT[c.ow][w][s]; if(T>0) sp+=ws[w]*U[w]/T; });
    const wk = w>=0 ? w : 0;
    arr.push({ci, v:o.q[q], pq:q?o.q[q-1]:null, py:q>=4?o.q[q-4]:null, sp:(w>=0||isL())?sp:null, raw:o.raw[wk], kk:o.k[wk]>0.5*(o.w.reduce((a,U)=>a+U[wk],0))&&o.k[wk]>0});
  }
  arr=arr.filter(o=>o.v>=0.05||(o.pq||0)>=0.05);
  const key=S.sort.k, d=S.sort.d;
  const getter={name:o=>D.centres[o.ci].name, city:o=>D.centres[o.ci].city, w:o=>o.v, p:o=>o.pq==null?-1e9:o.v-o.pq, ch:o=>o.py>0.5?o.v/o.py:-1, sp:o=>o.sp||0, con:o=>conVal(o.ci)};
  arr.sort((a,b)=>{ const x=getter[key](a), y=getter[key](b); return (typeof x==='string'?x.localeCompare(y,'pl'):x-y)*d; });
  const tot=arr.reduce((a,o)=>a+o.v,0);
  const th=(k,t,n)=>`<th class="${n?'n':''} sortable ${S.sort.k===k?'s'+S.sort.d:''}" data-k="${k}">${t}</th>`;
  const sgn=v=>(v>=0?'+':'−')+fmtN(Math.abs(v));
  $('#t-centres').innerHTML = `<table><thead><tr><th>#</th>${th('name','Ośrodek')}${th('city','Miasto')}${th('w','Pacjenci',1)}<th class="n">Udział</th>${th('p','Zmiana kw/kw',1)}${th('ch','r/r',1)}${th('sp','Wydatki 12 mies. (szac.)',1)}${th('con',isR()?'Umowa RDTL 2026':'Umowa 2026',1)}<th class="n" title="Surowa liczba z zestawienia ICD-10×EAN dla okna 4 kwartałów kończącego się w wybranym kwartale (przed kalibracją)">Surowe*</th></tr></thead><tbody>${
    arr.map((o,i)=>{ const c=D.centres[o.ci];
      return `<tr data-ci="${o.ci}" class="${o.ci===S.centre?'sel':''}"><td class="muted">${i+1}</td><td>${esc(shortName(c.name))}${o.kk?' <span class="flag" title="Przypisanie wg wartości umowy">umowa</span>':''}</td><td>${esc(c.city)}</td><td class="n">${fmtN(o.v)}</td><td class="n">${tot?nf1.format(o.v/tot*100)+'%':''}</td><td class="n">${o.pq==null?'–':sgn(o.v-o.pq)}</td><td class="n">${o.py>0.5?((o.v/o.py-1)*100>=0?'+':'')+nf1.format((o.v/o.py-1)*100)+'%':'–'}</td><td class="n">${isR()||o.sp==null?'–':fmtPLN(o.sp)}</td><td class="n">${conVal(o.ci)?fmtPLN(conVal(o.ci)):'<span class="muted">brak</span>'}</td><td class="n muted">${w>=0?fmtN(o.raw):'–'}</td></tr>`; }).join('')
  }</tbody></table>`;
  document.querySelectorAll('#t-centres th.sortable').forEach(t=>t.onclick=()=>{ const k=t.dataset.k; S.sort = {k, d: S.sort.k===k ? -S.sort.d : (k==='name'||k==='city'?1:-1)}; renderTable(); });
  document.querySelectorAll('#t-centres tbody tr').forEach(tr=>tr.onclick=()=>{ const ci=+tr.dataset.ci; if(S.centre===ci) S.centre=-1; else { S.centre=ci; S.ow=D.centres[ci].ow; S.city=D.centres[ci].city; } render(); });
  $('#tbl-sub').textContent = `${QL[q]} · ${arr.length} ośrodków · ${S.ow>=0?'woj. '+D.ow[S.ow]:'Polska'}${S.city?' · '+S.city:''}`;
}
function conVal(ci){ const c=D.centres[ci].con[P().code]; return c?(c['2026']||0):0; }

// ---------- QA ----------
function renderQA(){
  const q=D.qa[P().code];
  const qc=D.qcheck[P().code];
  const lbl={'2024':'rok 2024','2025':'rok 2025','2024H1':'I półr. 2024','2025H1':'I półr. 2025','2026H1':'I półr. 2026'};
  $('#qa-q').innerHTML = qc ? `<table class="qt" style="max-width:560px"><thead><tr><th>Okres (realizacja NFZ)</th><th class="n">Pacjenci NFZ</th><th class="n">Z kwartałów</th><th class="n">Różnica</th></tr></thead><tbody>${
    ['2024H1','2024','2025H1','2025','2026H1'].map(k=>qc.find(x=>x[0]===k)).filter(Boolean).map(([k,r,m])=>`<tr><td>${lbl[k]}</td><td class="n">${fmtN(r)}</td><td class="n">${fmtN(m)}</td><td class="n">${r?((m/r-1)*100>=0?'+':'')+nf1.format((m/r-1)*100)+'%':'–'}</td></tr>`).join('')}</tbody></table>` : '';
  if (q && q.limited){ $('#qa-prog').innerHTML = `<b>${esc(P().code)}</b>: kalibracja ograniczona — brak pliku „Realizacja programów lekowych”. Dane ośrodków (ICD-10×EAN, maks. po EAN, „<5” = 1,5) dopasowano do liczby pacjentów w programie w I półroczu 2026 z raportu NFZ „Programy lekowe” (${fmtN(q.h1)}). Relacja okna 12-mies. do półrocza: ${nf1.format(q.e_raw)} (przyjęto ${nf1.format(q.e)}, współczynnik skalowania ${nf1.format(q.k)}). ${q.n_centres} ośrodków z pacjentami. Brak podziału na województwa i lata w danych NFZ — rozkład regionalny pochodzi wyłącznie z zestawień ośrodków. Wydatki: refundacja EAN (IX 2025–VIII 2026, wszystkie programy) × udział programu w pacjentach EAN.`; return; }
  if (!q){ $('#qa-prog').innerHTML = `<b>RDTL / poza zakresem</b>: wiersze zestawień ICD-10×EAN, w których kod ICD-10 nie pasuje do żadnego programu lekowego, w którym refundowany jest dany EAN (inne nowotwory pierwotne, kody nienowotworowe; Z51.x i przerzuty C77–C79 dzielone proporcjonalnie do pewnych rozpoznań ośrodka). Liczby surowe — bez kalibracji i bez przypisanych wydatków programów.`; return; }
  $('#qa-prog').innerHTML = `<b>${esc(P().code)}</b>: ${q.n_centres} ośrodków z pacjentami · mediana współczynnika kalibracji ${nf1.format(q.scale_med)} (10–90 percentyl: ${nf1.format(q.scale_p10)}–${nf1.format(q.scale_p90)}) · udział pacjentów przypisanych wg umowy: ${nf1.format(q.share_contract*100)}% · źródło: ${esc(P().file)}`;
}

function render(){
  renderFilters();
  const sg=spendWinGrid(), qg=qGrid();
  $('#scope').textContent = `${P().code} ${P().name} · ICD-10: ${P().icd} · ${scopeLabel()}${S.sub>=0?' · '+P().subs[S.sub].inn:''}`;
  $('#pat-sub').textContent = isL() ? 'Pacjenci na terapii w kwartale — dane ośrodków (ICD-10×EAN) dopasowane do liczby pacjentów NFZ w I półroczu 2026; bez pliku realizacji (brak kalibracji wg województw i lat)' : isR() ? 'Pacjenci z kodami ICD-10 spoza zakresu programów danego leku na terapii w kwartale; z surowych okien ICD-10×EAN (bez kalibracji)' : 'Pacjenci na terapii w danym kwartale — skalibrowani do realizacji NFZ (lata i I półrocza), zmiany kw/kw z różnic okien 4-kwartalnych';
  renderKPI(qg,sg); renderPatients(qg); renderDelta(qg); renderQTable(qg); renderSpend(sg); renderProducts(qg,sg); renderMap(); renderTable(); renderQA();
}
bind(); render();
})();
