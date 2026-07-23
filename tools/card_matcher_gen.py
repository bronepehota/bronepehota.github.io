#!/usr/bin/env python3
"""Reusable card↔photo matcher. Usage: python3 tmp/card_matcher_gen.py [manifest.json] [out.html]
Manifest shape = extracted_stats.json (works for any batch/faction/source)."""
import json, os, sys
MANIFEST = sys.argv[1] if len(sys.argv)>1 else "tmp/rutenia/extracted_stats.json"
OUT = sys.argv[2] if len(sys.argv)>2 else "tmp/rutenia/verifier.html"
DATA = json.load(open(MANIFEST))
RAW = json.dumps(DATA, ensure_ascii=False)
BASE = os.path.dirname(os.path.abspath(OUT))  # images resolve relative to the HTML

HTML = r"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Сопоставление карточек и фото</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Oswald:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#0f1216;--panel:#161a20;--panel2:#1d222a;--panel3:#252b34;--border:#2a313a;--border2:#3b434e;--bone:#e8e3d6;--muted:#8c949f;--dim:#5b636f;--ru:#ea580c;--ru2:#fb923c;--ru-dim:#7c2d12;--green:#4ade80;--red:#f43f5e}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--bone);font-family:'Oswald',sans-serif;min-height:100vh;background-image:radial-gradient(900px circle at 12% -5%,rgba(234,88,12,.06),transparent 45%),radial-gradient(700px circle at 95% 110%,rgba(56,189,248,.03),transparent 45%)}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.035;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.wrap{position:relative;z-index:2;max-width:1640px;margin:0 auto;padding:18px}
.hazard{height:5px;background:repeating-linear-gradient(135deg,var(--ru) 0 13px,#0b0d10 13px 26px);border-radius:2px;margin-bottom:12px;opacity:.85}
.topbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--border)}
.brand{font-family:'Black Ops One',cursive;font-size:20px;letter-spacing:1.5px;display:flex;align-items:center;gap:9px}
.brand .star{color:var(--ru);filter:drop-shadow(0 0 5px rgba(234,88,12,.6))}
.brand small{font-family:'Oswald';font-size:11px;letter-spacing:2px;color:var(--muted);font-weight:400}
.spacer{flex:1}
.navbtn{background:var(--panel2);color:var(--bone);border:1px solid var(--border2);padding:7px 13px;border-radius:3px;cursor:pointer;font-family:'Oswald';font-weight:500;letter-spacing:1px;font-size:12px;text-transform:uppercase;transition:.15s}
.navbtn:hover{background:var(--panel3);border-color:var(--ru)}
.counter{font-family:'JetBrains Mono';font-size:12px;color:var(--muted);min-width:50px;text-align:center}
.verified-wrap{display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;padding:5px 11px;border:1px solid var(--border2);border-radius:3px;background:var(--panel)}
.verified-wrap input{display:none}
.verified-wrap .box{width:15px;height:15px;border:2px solid var(--dim);border-radius:2px;display:grid;place-items:center}
.verified-wrap input:checked + .box{background:var(--green);border-color:var(--green)}
.verified-wrap input:checked + .box::after{content:"✓";color:#06210f;font-size:12px;font-weight:700}
.verified-wrap span{font-size:12px;letter-spacing:1px;text-transform:uppercase}
.squadhead{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:14px 0 8px}
.fbadge{padding:4px 12px;border-radius:3px;font-weight:600;letter-spacing:2px;font-size:11px;text-transform:uppercase;color:#fff}
.squadname{background:transparent;border:none;color:var(--bone);font-family:'Oswald';font-weight:600;font-size:22px;padding:5px 0;border-bottom:1px dashed var(--border2);min-width:260px}
.squadname:focus{outline:none;border-bottom-color:var(--ru)}
.costwrap{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono'}
.costwrap label{font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase}
.costwrap input{background:#0b0d10;border:1px solid var(--border2);color:var(--ru2);font-family:'JetBrains Mono';font-weight:700;font-size:17px;width:64px;padding:4px 7px;border-radius:3px;text-align:center}
.slug{font-family:'JetBrains Mono';font-size:11px;color:var(--dim)}
.mapstatus{font-family:'JetBrains Mono';font-size:11px;padding:3px 9px;border-radius:3px;border:1px solid}
.mapstatus.ok{color:var(--green);border-color:rgba(74,222,128,.4);background:rgba(74,222,128,.07)}
.mapstatus.bad{color:var(--red);border-color:rgba(244,63,94,.4);background:rgba(244,63,94,.08)}
/* main split: card viewer | soldiers */
.main{display:grid;grid-template-columns:minmax(460px,52%) 1fr;gap:16px;align-items:start}
@media(max-width:900px){.main{grid-template-columns:1fr}}
.cardview{position:sticky;top:12px;background:var(--panel);border:1px solid var(--border);border-radius:5px;padding:10px}
.cv-title{font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:8px}
.cv-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;font-family:'JetBrains Mono';font-size:11px;color:var(--muted)}
.cv-controls input[type=range]{width:90px;accent-color:var(--ru)}
.cv-controls b{color:var(--ru2);font-family:'JetBrains Mono';min-width:30px}
.cv-hint{font-size:10px;color:var(--dim);font-family:'JetBrains Mono';margin-top:6px;line-height:1.4}
.lorebox{margin-top:10px;border-top:1px solid var(--border);padding-top:8px}
.lorebox label{display:block;font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;font-family:'Oswald'}
.lorebox textarea{width:100%;min-height:72px;background:#0b0d10;border:1px solid var(--border2);color:var(--bone);font-family:'JetBrains Mono';font-size:12px;padding:7px;border-radius:3px;resize:vertical;line-height:1.4}
.lorebox textarea:focus{outline:none;border-color:var(--ru)}
.cardpane{overflow:auto;max-height:78vh;border:1px solid var(--border2);border-radius:4px;background:#0b0d10;position:relative}
.cardpane img{display:block;width:var(--cw,100%);transition:width .12s}
.cardcursor{position:absolute;left:0;right:0;height:0;border-top:2px solid var(--ru2);box-shadow:0 0 12px rgba(251,146,60,.7);pointer-events:none;transition:top .15s}
.nocard{background:rgba(244,63,94,.08);border:2px dashed var(--red);color:#fda4af;padding:18px;border-radius:4px;text-align:center;font-size:13px}
/* soldier rows */
.row-grid{display:grid;grid-template-columns:38px 116px repeat(7,minmax(58px,1fr));gap:8px 9px;align-items:center}
.thead{padding:0 10px 5px;border-bottom:1px solid var(--border);margin-bottom:3px}
.thead .h{font-family:'Oswald';font-size:12px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;text-align:center}
.thead .h.l{text-align:left}
.soldiers{display:flex;flex-direction:column;gap:5px}
.soldier{padding:7px 10px;background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--border2);border-radius:4px;transition:.1s;cursor:default}
.soldier:hover{background:var(--panel2);border-left-color:var(--ru2)}
.soldier.active{border-left-color:var(--ru);background:var(--panel3);box-shadow:0 0 0 1px rgba(234,88,12,.3)}
.soldier.conflict{border-left-color:var(--red);background:rgba(244,63,94,.06)}
.soldier.dragging{opacity:.35}
.soldier.drag-over{outline:2px dashed var(--ru2);outline-offset:-3px;background:rgba(234,88,12,.12)}
.s-num{font-family:'Black Ops One';font-size:20px;color:var(--ru2);text-align:center;height:38px;display:grid;place-items:center;background:#0b0d10;border:1px solid var(--border2);border-radius:3px}
.s-photo{position:relative;cursor:grab}
.s-photo:active{cursor:grabbing}
.s-photo img{width:116px;height:155px;object-fit:cover;object-position:center;background:#0b0d10;border:1px solid var(--border2);border-radius:3px;cursor:zoom-in;display:block}
.soldier.conflict .s-photo img{border-color:var(--red)}
.dup{position:absolute;top:2px;left:2px;background:var(--red);color:#fff;font-family:'JetBrains Mono';font-size:9px;padding:1px 4px;border-radius:2px;font-weight:700}
.cell input,.cell select{background:#0b0d10;border:1px solid var(--border2);color:var(--bone);font-family:'JetBrains Mono';font-weight:600;font-size:18px;padding:8px 4px;border-radius:3px;width:100%;text-align:center}
.cell input:focus,.cell select:focus{outline:none;border-color:var(--ru)}
.cell input.empty{border-color:var(--red);background:rgba(244,63,94,.14);box-shadow:0 0 0 1px rgba(244,63,94,.6) inset;animation:emptypulse 1.6s ease-in-out infinite}
@keyframes emptypulse{0%,100%{box-shadow:0 0 0 1px rgba(244,63,94,.55) inset}50%{box-shadow:0 0 0 2px rgba(244,63,94,.95) inset}}
.legend{font-family:'JetBrains Mono';font-size:10px;color:var(--dim);margin:6px 2px 4px;line-height:1.4}
.footer{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)}
.btn{font-family:'Oswald';font-weight:600;letter-spacing:1.5px;text-transform:uppercase;font-size:12px;padding:9px 16px;border-radius:3px;cursor:pointer;border:1px solid;transition:.15s}
.btn.primary{background:linear-gradient(180deg,var(--ru),var(--ru-dim));color:#fff;border-color:var(--ru2);box-shadow:0 2px 10px rgba(234,88,12,.3)}
.btn.primary:hover{filter:brightness(1.1)}
.btn.ghost{background:var(--panel);color:var(--bone);border-color:var(--border2)}
.btn.ghost:hover{background:var(--panel3)}
.footer .hint{font-family:'JetBrains Mono';font-size:11px;color:var(--dim);margin-left:auto}
.zoom{position:fixed;inset:0;background:rgba(5,7,9,.94);display:none;align-items:center;justify-content:center;z-index:50;cursor:zoom-out;backdrop-filter:blur(3px)}
.zoom img{max-width:96vw;max-height:96vh;border:2px solid var(--ru);border-radius:4px;box-shadow:0 30px 80px rgba(0,0,0,.7)}
.zoom .cap{position:fixed;bottom:16px;left:0;right:0;text-align:center;font-family:'JetBrains Mono';font-size:12px;color:var(--muted)}
</style></head>
<body>
<div class="wrap">
  <div class="hazard"></div>
  <div class="topbar">
    <div class="brand"><span class="star">★</span> CARD ↔ PHOTO<small>matcher</small></div>
    <span class="spacer"></span>
    <button class="navbtn" onclick="nav(-1)">◀</button>
    <span class="counter" id="counter">—</span>
    <button class="navbtn" onclick="nav(1)">▶</button>
    <label class="verified-wrap"><input type="checkbox" id="verified" onchange="saveCurrent()"><span class="box"></span><span id="vcount">✓</span></label>
  </div>
  <div id="view"></div>
  <div class="footer">
    <button class="btn primary" onclick="exportJSON()">📋 Экспорт в буфер</button>
    <button class="btn ghost" onclick="downloadJSON()">💾 Скачать JSON</button>
    <button class="btn ghost" onclick="resetToRaw()">🔄 Сброс</button>
    <span class="hint">наведи на бойца → карточка подъедет к его ряду · клик по фото = зум</span>
  </div>
</div>
<div class="zoom" id="zoom" onclick="this.style.display='none'"><img id="zoomimg"><div class="cap" id="zoomcap"></div></div>
<script>
const RAW_DATA = __RAW__;
let DATA = JSON.parse(JSON.stringify(RAW_DATA));
let idx = 0;
const LS = 'card_matcher_v2';
const MODS = [['','—'],['jump_boost_3','Пр3'],['jump_boost_4','Пр4'],['jump_boost_5','Пр5'],['mechanic','Рм']];
let zoom = 1, header = 0.16;
function restore(){
  try{
    const s=JSON.parse(localStorage.getItem(LS)||'{}'); const bySlug={};
    if(Array.isArray(s.data)) s.data.forEach(d=>{if(d&&d.slug)bySlug[d.slug]=d;});
    DATA.forEach(d=>{const sv=bySlug[d.slug]; if(!sv)return;
      ['name','cost','verified'].forEach(k=>{if(k in sv)d[k]=sv[k];});
      if(Array.isArray(sv.soldiers)&&sv.soldiers.length===d.soldiers.length){const bn={};sv.soldiers.forEach(x=>bn[x.num]=x);d.soldiers.forEach(s=>{const v=bn[s.num];if(v)Object.assign(s,v);});}
    });
    if(s.zoom)zoom=s.zoom; if(s.header)header=s.header;
  }catch(e){}
}
function persist(){ localStorage.setItem(LS, JSON.stringify({data:DATA,zoom,header})); }
function cur(){ return DATA[idx]; }
function imgN(s){ return s.imgIndex||s.num; }
function focusSoldier(n){
  const d=cur(); const pane=document.getElementById('cardpane'); const img=document.getElementById('cardimg'); const cur2=document.getElementById('cardcursor');
  if(!pane||!img) return;
  const ih=img.clientHeight;
  const band=(header+(n-1)/d.soldiers.length)*ih;
  pane.scrollTop=Math.max(0,band-pane.clientHeight*0.32);
  if(cur2){cur2.style.top=(band-pane.scrollTop)+'px';cur2.style.display='block';}
}
function render(){
  const d=cur();
  const counts={}; d.soldiers.forEach(s=>{const n=imgN(s);counts[n]=(counts[n]||0)+1;});
  const dupFree=Object.values(counts).every(c=>c===1);
  const mapping=d.soldiers.map(s=>`${s.num}→${imgN(s)}`).join('·');
  const fac=d.faction||'rutenia';
  const card=d.card?`<div class="cv-controls">
      <label>зум <input type="range" min="0.6" max="2.6" step="0.1" value="${zoom}" oninput="zoom=+this.value;document.getElementById('cardimg').style.setProperty('--cw',(zoom*100)+'%');persist()"></label><b>${zoom.toFixed(1)}×</b>
      <label>отступ шапки <input type="range" min="0" max="0.4" step="0.01" value="${header}" oninput="header=+this.value;persist();focusSoldier(activeN)"></label><b>${Math.round(header*100)}%</b>
    </div>
    <div class="cardpane" id="cardpane"><img id="cardimg" src="${d.card}" style="--cw:${zoom*100}%" onload="focusSoldier(activeN)"><div class="cardcursor" id="cardcursor" style="display:none"></div></div>
    <div class="cv-hint">▲ наведи на ряд бойца — карточка подъедет к его миниатюре. Зум ↑ чтобы рассмотреть детали. Клик по карточке — во весь экран.</div>`
    : `<div class="nocard"><b>⚠ НЕТ КАРТОЧКИ</b><br><br>Заполни статы вручную по армлисту.</div>`;
  // wrap card click to zoom
  const rows=d.soldiers.map((s,i)=>{
    const n=imgN(s); const conflict=counts[n]>1;
    const src=`${d.imgDir}/${d.imgPrefix||''}${n}.png`;
    const modOpts=MODS.map(m=>`<option value="${m[0]}" ${s.modifier===m[0]?'selected':''}>${m[1]}</option>`).join('');
    return `<div class="row-grid soldier ${conflict?'conflict':''}" onmouseenter="activeN=${s.num};focusSoldier(${s.num});document.querySelectorAll('.soldier').forEach(e=>e.classList.remove('active'));this.classList.add('active')" ondragover="dragOver(event,${i})" ondrop="dropSwap(event,${i})">
      <div class="s-num">${s.num}</div>
      <div class="s-photo" draggable="true" ondragstart="dragStart(${i})" ondragend="dragEnd()" title="Перетащи на другого бойца — фото поменяются местами"><img src="${src}" onclick="zoomImg('${src}','боец ${s.num} · фото ${n}')">${conflict?`<span class="dup">dup ${n}</span>`:''}</div>
      <div class="cell"><input class="${s.rank==null?'empty':''}" value="${s.rank??''}" onchange="setSoldier(${i},'rank',this.value)"></div>
      <div class="cell"><input class="${s.speed==null?'empty':''}" value="${s.speed??''}" onchange="setSoldier(${i},'speed',this.value)"></div>
      <div class="cell"><input value="${s.range??''}" onchange="setSoldier(${i},'range',this.value)" title="пусто = нет стрелкового оружия"></div>
      <div class="cell"><input value="${s.power??''}" onchange="setSoldier(${i},'power',this.value)" title="пусто = нет стрелкового оружия"></div>
      <div class="cell"><input class="${s.melee==null?'empty':''}" value="${s.melee??''}" onchange="setSoldier(${i},'melee',this.value)"></div>
      <div class="cell"><select onchange="setSoldier(${i},'modifier',this.value)">${modOpts}</select></div>
      <div class="cell"><input class="${s.armor==null?'empty':''}" value="${s.armor??''}" onchange="setSoldier(${i},'armor',this.value)"></div>
    </div>`;
  }).join('');
  document.getElementById('view').innerHTML=`
    <div class="squadhead">
      <span class="fbadge">${fac.toUpperCase()}</span>
      <input class="squadname" value="${d.name??''}" onchange="cur().name=this.value;saveCurrent()">
      <div class="costwrap"><label>Стоим.</label><input type="number" value="${d.cost??''}" onchange="cur().cost=this.value===''?null:+this.value;saveCurrent()"></div>
      <span class="slug">${d.slug}</span>
      <span class="mapstatus ${dupFree?'ok':'bad'}">${dupFree?'✓':'⚠'} ${mapping}</span>
      <button class="navbtn" onclick="resetPhotos()" title="Сбросить порядок фото (боец N → фото N)">↺ сброс фото</button>
    </div>
    <div class="main">
      <div class="cardview"><div class="cv-title">карточка армлиста</div>${card}<div class="lorebox"><label>Лор — URL или текст</label><textarea placeholder="https://vk.com/wall… или текст лора отряда" oninput="cur().lore=this.value;saveCurrent()">${d.lore??''}</textarea></div></div>
      <div>
        <div class="row-grid thead"><div class="h">#</div><div class="h l">📷 фото</div><div class="h">А</div><div class="h">Ск</div><div class="h">Дальн</div><div class="h">Мощн</div><div class="h">ББ</div><div class="h">Св</div><div class="h">Бр</div></div>
        <div class="legend">красная пульсирующая ячейка = vision не распознал — заполни по карточке · пустые Дальн/Мощн = нет стрелкового · тащи фото на другого бойца для смены местами</div>
        <div class="soldiers">${rows}</div>
      </div>
    </div>`;
  if(d.card) document.getElementById('cardimg').onclick=()=>zoomImg(d.card,'карточка · '+d.name);
  document.getElementById('verified').checked=!!d.verified;
  document.getElementById('counter').textContent=`${idx+1}/${DATA.length}`;
  document.getElementById('vcount').textContent=`✓ ${DATA.filter(x=>x.verified).length}/${DATA.length}`;
  persist();
}
let activeN=1;
let dragSrcIdx=null;
function resetPhotos(){if(!confirm('Сбросить порядок фото у этого отряда? (боец N → фото N)'))return;cur().soldiers.forEach(s=>s.imgIndex=s.num);saveCurrent();render();flash('↺ порядок фото сброшен');}
function dragStart(i){dragSrcIdx=i;const el=document.querySelectorAll('.soldier')[i];if(el)el.classList.add('dragging');}
function dragOver(e,i){e.preventDefault();document.querySelectorAll('.soldier').forEach((el,k)=>el.classList.toggle('drag-over',k===i));}
function dropSwap(e,i){e.preventDefault();if(dragSrcIdx==null||dragSrcIdx===i){dragSrcIdx=null;clearDragMarks();return;}const s=cur().soldiers,a=s[dragSrcIdx],b=s[i];const av=a.imgIndex||a.num,bv=b.imgIndex||b.num;a.imgIndex=bv;b.imgIndex=av;dragSrcIdx=null;clearDragMarks();saveCurrent();render();flash('⇄ фото поменяли местами');}
function dragEnd(){dragSrcIdx=null;clearDragMarks();}
function clearDragMarks(){document.querySelectorAll('.soldier').forEach(el=>{el.classList.remove('dragging');el.classList.remove('drag-over');});}
function setSoldier(i,k,v){const s=cur().soldiers[i];if(['rank','speed','melee','armor'].includes(k))s[k]=v===''?null:+v;else s[k]=v;saveCurrent();}
function saveCurrent(){cur().verified=document.getElementById('verified').checked;persist();}
function nav(dir){saveCurrent();idx=(idx+dir+DATA.length)%DATA.length;activeN=1;render();}
function zoomImg(src,cap){document.getElementById('zoomimg').src=src;document.getElementById('zoomcap').textContent=cap||'';document.getElementById('zoom').style.display='flex';}
function cleanExport(){return DATA.map(d=>({name:d.name,slug:d.slug,faction:d.faction||'rutenia',source:d.source||'star_system',cost:d.cost,imgDir:d.imgDir,imgPrefix:d.imgPrefix||'',card:d.card,lore:d.lore||'',soldiers:d.soldiers.map(s=>({num:s.num,rank:s.rank,speed:s.speed,range:s.range||'',power:s.power||'',melee:s.melee,modifier:s.modifier||'',armor:s.armor,imgIndex:imgN(s)}))}));}
function exportJSON(){const t=JSON.stringify(cleanExport(),null,2);navigator.clipboard.writeText(t).then(()=>flash('Скопировано ✓')).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();flash('Скопирово ✓');});}
function downloadJSON(){const b=new Blob([JSON.stringify(cleanExport(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='verified.json';a.click();flash('Скачивается…');}
function resetToRaw(){if(!confirm('Сбросить к исходным данным?'))return;DATA=JSON.parse(JSON.stringify(RAW_DATA));persist();render();}
function flash(m){const f=document.createElement('div');f.textContent=m;f.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%);background:var(--ru);color:#fff;padding:9px 18px;border-radius:4px;font-family:Oswald;letter-spacing:1px;z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.5)';document.body.appendChild(f);setTimeout(()=>f.remove(),1500);}
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='ArrowLeft')nav(-1);if(e.key==='ArrowRight')nav(1);});
restore();render();
</script>
</body></html>"""
HTML = HTML.replace("__RAW__", RAW)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT,"w").write(HTML)
print(f"wrote {OUT} ({len(HTML)} bytes, {len(DATA)} squads). manifest={MANIFEST}")
