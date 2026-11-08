import {PALETTE} from './palette.js';
const $=id=>document.getElementById(id);let palette=PALETTE, byCode=new Map(palette.map(c=>[c.code,c])); let brand='mard',customPalettes={};
let w=24,h=24,cells=Array(w*h).fill(null),active='F11',tool='pen',zoom=1,lastImage=null,history=[],future=[],drawing=false,enabled=new Set(palette.map(c=>c.code));
const canvas=$('beadCanvas'),ctx=canvas.getContext('2d'),limit=50,base=24;
const toast=msg=>{const el=$('toast');el.textContent=msg;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',2800)};
const clone=()=>({w,h,cells:[...cells]});
function checkpoint(){history.push(clone());if(history.length>limit)history.shift();future=[]}
function restore(s){w=s.w;h=s.h;cells=[...s.cells];$('widthInput').value=w;$('heightInput').value=h;refresh()}
function count(){const map=new Map();for(const code of cells)if(code&&byCode.has(code))map.set(code,(map.get(code)||0)+1);return [...map.entries()].sort((a,b)=>b[1]-a[1])}
function refresh(){draw();renderStats();measure();$('status').textContent=`${w} × ${h} ${t('cells')} · ${count().reduce((s,x)=>s+x[1],0)} ${t('beads')}`;$('autosave').textContent=t('autosaved');store()}
function store(){try{localStorage.setItem('mard-studio-v1',JSON.stringify({version:2,...clone(),name:$('projectName').value,bead:$('beadSize').value,enabled:[...enabled],brand}))}catch(e){$('autosave').textContent=t('saveFail')}}
function measure(){const p=Number($('beadSize').value)/10;$('measure').textContent=`${t('estimated')}: ${(w*p).toFixed(1)} × ${(h*p).toFixed(1)} cm`}
function draw(){let sz=Math.min(44,Math.max(5,base*zoom));canvas.width=w*sz;canvas.height=h*sz;canvas.style.width=canvas.width+'px';canvas.style.height=canvas.height+'px';ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);const grid=$('showGrid').checked,codes=$('showCodes').checked,circle=$('circleMode').checked;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let code=cells[y*w+x],color=byCode.get(code);let px=x*sz,py=y*sz;if(color){ctx.fillStyle=color.hex;if(circle){ctx.beginPath();ctx.arc(px+sz/2,py+sz/2,sz*.44,0,Math.PI*2);ctx.fill()}else ctx.fillRect(px,py,sz,sz)}if(grid){ctx.strokeStyle='rgba(95,68,78,.18)';ctx.lineWidth=.6;ctx.strokeRect(px+.3,py+.3,sz-.6,sz-.6)}if(codes&&color&&sz>=14){let lum=(color.rgb[0]*.299+color.rgb[1]*.587+color.rgb[2]*.114);ctx.fillStyle=lum<135?'#fff':'#29252a';ctx.font=`${Math.max(7,Math.min(11,sz*.34))}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(code,px+sz/2,py+sz/2)}}}
function renderStats(){const stats=count();$('totalCount').textContent=stats.reduce((s,x)=>s+x[1],0).toLocaleString();$('usedColors').textContent=stats.length;$('statsList').replaceChildren();if(!stats.length){const el=document.createElement('p');el.className='hint';el.textContent=t('statsEmpty');$('statsList').append(el)}for(const [code,n] of stats){const el=document.createElement('div');el.className='stat';const chip=document.createElement('i');chip.className='chip';chip.style.background=byCode.get(code).hex;const name=document.createElement('span');name.textContent=code;const num=document.createElement('b');num.textContent=n.toLocaleString()+' '+t('beads');el.append(chip,name,num);$('statsList').append(el)}}
function selectColor(code){if(!byCode.has(code))return;active=code;$('selectedColorLabel').textContent=code;$('selectedColorLabel').style.background=byCode.get(code).hex;renderPalette()}
function renderPalette(){let search=$('colorSearch').value.trim().toUpperCase(),el=$('paletteGrid');el.replaceChildren();for(const c of palette.filter(c=>enabled.has(c.code)&&c.code.includes(search))){const b=document.createElement('button');b.type='button';b.className='swatch'+(c.code===active?' active':'');b.style.setProperty('--swatch',c.hex);b.textContent=c.code;b.title=c.code+' '+c.hex;b.onclick=()=>selectColor(c.code);el.append(b)}}
function renderManager(){const el=$('paletteManageGrid');el.replaceChildren();const search=$('paletteSearchManage').value.toUpperCase().trim();for(const c of palette.filter(c=>c.code.includes(search))){const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=enabled.has(c.code);input.onchange=()=>{input.checked?enabled.add(c.code):enabled.delete(c.code);renderPalette();store()};const tag=document.createElement('span');tag.textContent=c.code;tag.style.borderBottom='3px solid '+c.hex;l.append(input,tag);el.append(l)}}
function setTool(v){tool=v;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===v))}
function paint(x,y){if(x<0||y<0||x>=w||y>=h)return;const i=y*w+x,old=cells[i];if(tool==='pick'){if(old)selectColor(old);setTool('pen');return}if(tool==='fill'){let replacement=active;if(!enabled.has(replacement))return;if(old===replacement)return;const q=[i],visited=new Uint8Array(cells.length);visited[i]=1;while(q.length){const index=q.pop();cells[index]=replacement;const X=index%w,Y=Math.floor(index/w);for(const n of [X>0?index-1:-1,X<w-1?index+1:-1,Y>0?index-w:-1,Y<h-1?index+w:-1])if(n>=0&&!visited[n]&&cells[n]===old){visited[n]=1;q.push(n)}}}else cells[i]=tool==='erase'?null:active;if(cells[i]!==old||tool==='fill')refresh()}
function pos(e){const r=canvas.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*w),Math.floor((e.clientY-r.top)/r.height*h)]}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();checkpoint();drawing=true;canvas.setPointerCapture(e.pointerId);paint(...pos(e));if(tool==='fill'||tool==='pick')drawing=false});canvas.addEventListener('pointermove',e=>{if(drawing)paint(...pos(e))});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drawing=false);
function resize(nw,nh,keep=true){nw=Math.max(1,Math.min(200,Math.floor(nw)));nh=Math.max(1,Math.min(200,Math.floor(nh)));if(nw===w&&nh===h)return;checkpoint();const next=Array(nw*nh).fill(null);if(keep)for(let y=0;y<Math.min(h,nh);y++)for(let x=0;x<Math.min(w,nw);x++)next[y*nw+x]=cells[y*w+x];w=nw;h=nh;cells=next;$('widthInput').value=w;$('heightInput').value=h;refresh()}
function rgbToLab([r,g,b]){const convert=v=>{v/=255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92};[r,g,b]=[r,g,b].map(convert);let x=(.4124564*r+.3575761*g+.1804375*b)/.95047,y=.2126729*r+.7151522*g+.072175*b,z=(.0193339*r+.119192*g+.9503041*b)/1.08883;const f=t=>t>.008856?t**(1/3):7.787037*t+16/116;let fx=f(x),fy=f(y),fz=f(z);return [116*fy-16,500*(fx-fy),200*(fy-fz)]}
let labs=new Map(palette.map(c=>[c.code,rgbToLab(c.rgb)]));function distance(a,b){return (a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2}
async function generate(image){let source=image;lastImage=image;checkpoint();const off=document.createElement('canvas');off.width=w;off.height=h;const c=off.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,w,h);let iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;let dw=w,dh=h,dx=0,dy=0;const mode=$('imageMode').value;if(mode==='contain'){let scale=Math.min(w/iw,h/ih);dw=iw*scale;dh=ih*scale;dx=(w-dw)/2;dy=(h-dh)/2}else if(mode==='cover'){let scale=Math.max(w/iw,h/ih);dw=iw*scale;dh=ih*scale;dx=(w-dw)/2;dy=(h-dh)/2}c.drawImage(source,dx,dy,dw,dh);const data=c.getImageData(0,0,w,h).data;const allowed=palette.filter(x=>enabled.has(x.code));if(!allowed.length){toast(t('noColor'));return}const pixels=[],sample=new Map();for(let i=0;i<w*h;i++){let v=[...data.slice(i*4,i*4+4)];if((mode==='contain'&&v[3]<100)||(mode==='contain'&&$('removeBg').checked&&Math.min(v[0],v[1],v[2])>239)){pixels.push(null);continue}if(v[3]<100)v=[255,255,255,255];const lab=rgbToLab(v);pixels.push(lab);const key=v.slice(0,3).map(x=>Math.round(x/16)).join('-');if(!sample.has(key))sample.set(key,{lab,count:0});sample.get(key).count++}
 const scored=allowed.map(c=>({code:c.code,lab:labs.get(c.code),score:0}));for(const s of sample.values()){let best=scored[0],d=Infinity;for(const c of scored){const curr=distance(s.lab,c.lab);if(curr<d){d=curr;best=c}}best.score+=s.count}scored.sort((a,b)=>b.score-a.score);const chosen=scored.slice(0,Math.min(+ $('maxColors').value,scored.length));cells=pixels.map(lab=>{if(!lab)return null;let best=chosen[0],d=Infinity;for(const c of chosen){const curr=distance(lab,c.lab);if(curr<d){best=c;d=curr}}return best.code});refresh();toast(currentLang==='zh'?'生成完成，可以直接点格子修改颜色':currentLang==='en'?'Pattern ready. Tap cells to edit colors.':'Corak siap. Ketik petak untuk ubah warna.')}
$('imageInput').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file);const img=new Image();img.onload=async()=>{currentProjectId=null;await generate(img);URL.revokeObjectURL(url)};img.onerror=()=>{toast('图片无法读取');URL.revokeObjectURL(url)};img.src=url;$('regenerateBtn').disabled=false;e.target.value=''};
$('newBtn').onclick=()=>{if(count().length&&!confirm(t('confirmOpen')))return;checkpoint();currentProjectId=null;cells=Array(w*h).fill(null);lastImage=null;$('regenerateBtn').disabled=true;refresh()};
$('regenerateBtn').onclick=()=>lastImage&&generate(lastImage);
$('resizeBtn').onclick=()=>{const nw=+$('widthInput').value,nh=+$('heightInput').value;if(!Number.isInteger(nw)||!Number.isInteger(nh)||nw<1||nh<1||nw>200||nh>200){toast('格数需要在 1 至 200 之间');return}resize(nw,nh)};
const presets=[16,24,36,48,52,68,72,78,96,104,108,128,156,200];for(const n of presets){const b=document.createElement('button');b.textContent=n+'×'+n;b.onclick=()=>{document.querySelectorAll('.preset button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('widthInput').value=n;$('heightInput').value=n;resize(n,n)};$('presets').append(b)}
$('resetSettingsBtn').onclick=()=>{if(!confirm(({zh:'重置图纸设置为默认值？目前画布内容会保留。',en:'Reset pattern settings to defaults? Artwork will be kept.',ms:'Tetapkan semula tetapan? Lukisan akan dikekalkan.'})[currentLang]))return;$('widthInput').value=w;$('heightInput').value=h;$('beadSize').value='5';$('maxColors').value='12';$('maxColorLabel').textContent='12';$('removeBg').checked=true;$('imageMode').value='contain';$('showGrid').checked=true;$('showCodes').checked=false;$('circleMode').checked=false;setZoom(1);refresh();toast(({zh:'图纸设置已重置',en:'Pattern settings reset',ms:'Tetapan corak telah ditetapkan semula'})[currentLang])};$('beadSize').onchange=refresh;$('projectName').oninput=store;$('maxColors').oninput=e=>$('maxColorLabel').textContent=e.target.value;for(const id of ['showGrid','showCodes','circleMode'])$(id).onchange=draw;
$('paletteMode').onchange=e=>{if(brand!=='mard')return;const value=e.target.value;enabled=new Set(palette.slice(0,value==='144'?144:221).map(c=>c.code));renderPalette();renderManager();store();toast(currentLang==='zh'?'已切换参考色库，可在更多选项中调整可用颜色':currentLang==='en'?'Palette changed. Adjust colors under More options.':'Palet ditukar. Ubah warna dalam Pilihan lanjut.')};
$('togglePaletteBtn').onclick=()=>{$('paletteManage').hidden=!$('paletteManage').hidden;renderManager()};$('paletteSearchManage').oninput=renderManager;
$('selectAllBtn').onclick=()=>{enabled=new Set(palette.map(c=>c.code));renderPalette();renderManager();store()};$('selectNoneBtn').onclick=()=>{enabled.clear();renderPalette();renderManager();store()};$('colorSearch').oninput=renderPalette;document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('undoBtn').onclick=()=>{if(!history.length)return;future.push(clone());restore(history.pop())};$('redoBtn').onclick=()=>{if(!future.length)return;history.push(clone());restore(future.pop())};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?$('redoBtn').click():$('undoBtn').click()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();$('redoBtn').click()}});
$('clearBtn').onclick=()=>{if(!confirm(currentLang==='zh'?'确定清空整个画布吗？可以使用撤销恢复。':currentLang==='en'?'Clear the canvas? You can undo this action.':'Kosongkan kanvas? Tindakan ini boleh dibuat asal.'))return;checkpoint();cells.fill(null);refresh()};
function setZoom(n){zoom=Math.max(.25,Math.min(2,n));$('zoomLabel').textContent=Math.round(zoom*100)+'%';draw()}$('zoomIn').onclick=()=>setZoom(zoom+.25);$('zoomOut').onclick=()=>setZoom(zoom-.25);$('canvasArea').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom+(e.deltaY<0?.15:-.15))}},{passive:false});$('zoomFit').onclick=()=>{let area=$('canvasArea').clientWidth-40;setZoom(Math.max(.25,Math.min(1.5,area/(w*base))))};
function safeName(){return ($('projectName').value||'bead-project').replace(/[\\/:*?"<>|]/g,'_').slice(0,70)}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function jsonData(){return {format:'mard-bead-studio',version:2,brand,palette:brand==='mard'?undefined:palette,name:$('projectName').value,w,h,beadSize:+$('beadSize').value,cells,enabled:[...enabled],savedAt:new Date().toISOString()}}
function exportJson(){download(new Blob([JSON.stringify(jsonData(),null,2)],{type:'application/json'}),safeName()+'.json')}
$('exportJson').onclick=exportJson;$('saveBtn').onclick=()=>{exportJson();toast('已下载可编辑工程文件')};
$('openBtn').onclick=()=>$('projectInput').click();$('projectInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Number.isInteger(data.w)||!Number.isInteger(data.h)||data.w<1||data.h<1||data.w>200||data.h>200||!Array.isArray(data.cells)||data.cells.length!==data.w*data.h||!data.cells.every(c=>c===null||typeof c==='string'))throw Error('格式错误');if(data.brand&&data.brand!=='mard'&&Array.isArray(data.palette)){registerPalette(data.brand,data.palette)}else if(data.brand==='mard'||!data.brand){activateBrand('mard',false)}if(!data.cells.every(c=>c===null||byCode.has(c)))throw Error('色号未在该品牌色卡中');checkpoint();w=data.w;h=data.h;cells=[...data.cells];$('projectName').value=String(data.name||'我的拼豆图').slice(0,100);$('beadSize').value=String(data.beadSize) ==='2.6'?'2.6':'5';if(Array.isArray(data.enabled))enabled=new Set(data.enabled.filter(x=>byCode.has(x)));$('widthInput').value=w;$('heightInput').value=h;lastImage=null;$('regenerateBtn').disabled=true;renderPalette();refresh();toast('工程打开成功')}catch(err){toast('无法打开工程：文件不符合格式')}e.target.value=''};
function exportCanvas(options={}){
 const chart=!!options.chart;
 const size=chart?Math.max(12,Math.min(38,Math.floor(2900/Math.max(w,h)))):Math.max(12,Math.min(32,Math.floor(2400/Math.max(w,h))));
 const stats=count();const margin=chart?Math.max(30,size*1.5):0;
 const chartWidth=w*size,chartHeight=h*size;
 const legendCols=Math.max(1,Math.min(stats.length||1,Math.floor((chartWidth+2*margin)/100)));
 const legendRows=Math.ceil(stats.length/legendCols);
 const legendHeight=chart?Math.max(105,65+legendRows*64):0;
 const out=document.createElement('canvas');out.width=chartWidth+margin*2;out.height=chartHeight+margin*2+legendHeight;
 const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);
 if(chart){c.fillStyle='#fcf5e9';c.fillRect(0,0,out.width,margin);c.fillRect(0,margin,margin,chartHeight);c.fillRect(margin+chartWidth,margin,margin,chartHeight);c.fillRect(0,margin+chartHeight,out.width,margin);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const code=cells[y*w+x],color=byCode.get(code),px=margin+x*size,py=margin+y*size;
  if(color){c.fillStyle=color.hex;c.fillRect(px,py,size,size)}
  if(chart){c.lineWidth=.5;c.strokeStyle='#d7d4d4';c.strokeRect(px+.25,py+.25,size-.5,size-.5);
   if(color&&size>=13){const lum=color.rgb[0]*.299+color.rgb[1]*.587+color.rgb[2]*.114;c.fillStyle=lum<135?'#fff':'#262126';c.font=`bold ${Math.max(6,Math.round(size*.28))}px sans-serif`;c.textBaseline='middle';c.textAlign='center';c.fillText(code,px+size/2,py+size/2)}
  }
 }
 if(chart){
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#4a3f37';c.font=`${Math.max(10,Math.min(15,size*.45))}px sans-serif`;
  for(let x=0;x<w;x++){const label=String(x+1),cx=margin+(x+.5)*size;c.fillText(label,cx,margin/2);c.fillText(label,cx,margin+chartHeight+margin/2)}
  for(let y=0;y<h;y++){const label=String(y+1),cy=margin+(y+.5)*size;c.fillText(label,margin/2,cy);c.fillText(label,margin+chartWidth+margin/2,cy)}
  c.strokeStyle='#333';c.lineWidth=Math.max(1,size*.055);for(let x=10;x<w;x+=10){const cx=margin+x*size;c.beginPath();c.moveTo(cx,margin);c.lineTo(cx,margin+chartHeight);c.stroke()}
  for(let y=10;y<h;y+=10){const cy=margin+y*size;c.beginPath();c.moveTo(margin,cy);c.lineTo(margin+chartWidth,cy);c.stroke()}
  const top=margin*2+chartHeight;const pad=22;
  c.fillStyle='#51444b';c.font='bold 18px sans-serif';c.textAlign='left';c.fillText(`${$('projectName').value}  ·  ${brand.toUpperCase()}  ·  ${w}×${h}`,pad,top+25);
  const tileWidth=out.width/legendCols;
  stats.forEach(([code,n],i)=>{const col=i%legendCols,row=Math.floor(i/legendCols),x=col*tileWidth+10,y=top+42+row*64;
   const item=byCode.get(code);c.fillStyle=item.hex;c.fillRect(x,y,Math.min(tileWidth-19,66),30);c.strokeStyle='#b5aeb0';c.lineWidth=1;c.strokeRect(x+.5,y+.5,Math.min(tileWidth-19,66),30);
   c.fillStyle=item.rgb.reduce((sum,z)=>sum+z,0)<365?'#fff':'#2b2829';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText(code,x+Math.min(tileWidth-19,66)/2,y+16);
   c.fillStyle='#4c4247';c.font='13px sans-serif';c.fillText('× '+n,x+Math.min(tileWidth-19,66)/2,y+44);
  });
 }
 return out;
}
function png(type){const out=exportCanvas({chart:type==='chart'});out.toBlob(blob=>{if(blob)download(blob,safeName()+(type==='chart'?'-图纸':'-预览')+'.png');else toast('图片导出失败，请使用较小画布')},'image/png')}

// Quick preview: same rendered output as downloaded chart, including counts.
let previewClean=false;
function showPreview(clean=false){previewClean=clean;const out=exportCanvas({chart:!clean});$('previewImage').src=out.toDataURL('image/png');$('previewClean').textContent=clean?({zh:'查看带色号图纸',en:'Show numbered chart',ms:'Lihat carta berkod'})[currentLang]:({zh:'切换纯色预览',en:'Show clean preview',ms:'Lihat pratonton warna'})[currentLang];if(!$('previewDialog').open)$('previewDialog').showModal()}
$('previewBtn').onclick=()=>showPreview(false);
$('closePreview').onclick=()=>$('previewDialog').close();
$('previewDialog').onclick=e=>{if(e.target===$('previewDialog'))$('previewDialog').close()};
$('previewClean').onclick=()=>showPreview(!previewClean);
$('previewDownload').onclick=()=>png(previewClean?'preview':'chart');
$('exportChart').onclick=()=>png('chart');$('exportPreview').onclick=()=>png('preview');
$('exportCsv').onclick=()=>{const rows=[[t('colorCode'),'HEX',t('quantity')],...count().map(([code,n])=>[code,byCode.get(code).hex,n]),[t('total'),' ',count().reduce((s,x)=>s+x[1],0)]];const csv='\ufeff'+rows.map(row=>row.join(',')).join('\r\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),safeName()+'-色号统计.csv')};
$('exportPdf').onclick=()=>{const out=exportCanvas({chart:true});const pngUrl=out.toDataURL('image/png');const s=count();const wnd=window.open('','_blank');if(!wnd){toast('请允许此网站打开弹出窗口，以保存 PDF');return}const doc=wnd.document;doc.title='拼豆图纸 - '+safeName();doc.body.style.cssText='font-family:Arial,sans-serif;margin:20px;color:#333';const title=doc.createElement('h2');title.textContent=$('projectName').value;doc.body.append(title);const info=doc.createElement('p');info.textContent=`${w} × ${h} 格 · ${$('measure').textContent} · ${s.reduce((a,x)=>a+x[1],0)} 颗`;doc.body.append(info);const img=doc.createElement('img');img.src=pngUrl;img.style.cssText='display:block;max-width:100%;max-height:70vh;object-fit:contain';doc.body.append(img);const stats=doc.createElement('p');stats.textContent=s.map(([code,n])=>code+' × '+n).join('　');doc.body.append(stats);const foot=doc.createElement('p');foot.textContent='MARD Bead Studio';doc.body.append(foot);img.onload=()=>setTimeout(()=>wnd.print(),300)};
// GitHub Pages edition: language, user palettes, local project library and sharing.
const translations={
 '↺ 重置图纸设置':['↺ Reset settings','↺ Tetap semula tetapan'], '◎ 预览':['◎ Preview','◎ Pratonton'], '图片放置方式':['Image fitting','Cara memuat gambar'], '完整图片 · 保持比例（可能留白）':['Contain · keep entire image (may have gaps)','Muat sepenuhnya · mungkin ada ruang kosong'], '填满画布 · 保持比例（裁剪边缘）':['Fill · crop edges to fit','Penuhkan · potong bahagian tepi'], '铺满画布 · 允许拉伸':['Stretch · fill all cells','Regangkan · penuhi semua petak'], '「填满画布」会覆盖所有格子；如照片比例不同，边缘会被裁剪。':['Fill mode covers the grid but may crop image edges.','Mod penuh meliputi semua petak tetapi tepi gambar mungkin dipotong.'], '支持 Ctrl＋滚轮缩放':['Ctrl + wheel to zoom','Ctrl + roda untuk zum'], '图纸预览':['Pattern preview','Pratonton corak'], '↓ 下载此图纸':['↓ Download this chart','↓ Muat turun carta ini'], '切换纯色预览':['Show clean preview','Pratonton tanpa kod'],

 '简单好用的拼豆工作室':['Simple bead pattern studio','Studio corak manik yang mudah'],
 '打开工程':['Open file','Buka fail'], '保存工程':['Save file','Simpan fail'], '语言':['Language','Bahasa'],
 '我的作品':['My projects','Projek saya'], '把喜欢的图片，变成拼豆图纸。':['Turn your pictures into bead patterns.','Tukar gambar anda menjadi corak manik.'],
 '上传图片或从空白画布开始，自由画、自由改，自动计算色号与拼豆用量。':['Upload a picture or start from scratch. Draw, edit, and count beads automatically.','Muat naik gambar atau mula dari kosong. Lukis, edit dan kira jumlah manik secara automatik.'],
 '＋ 上传图片':['＋ Upload image','＋ Muat naik gambar'], '✎ 新建空白图纸':['✎ New blank pattern','✎ Corak kosong baharu'],
 '① 图纸设置':['① Pattern setup','① Tetapan corak'], '图纸名称':['Pattern name','Nama corak'], '宽度 · 颗':['Width · beads','Lebar · manik'], '高度 · 颗':['Height · beads','Tinggi · manik'],
 '常用尺寸':['Common sizes','Saiz biasa'], '应用画布格数':['Apply grid size','Guna saiz grid'], '拼豆规格':['Bead size','Saiz manik'],
 '2.6 mm 小豆':['2.6 mm mini beads','Manik kecil 2.6 mm'], '5 mm 大豆':['5 mm standard beads','Manik besar 5 mm'],
 '尺寸以豆子标称规格估算；实际以豆板孔距和熨烫效果为准。':['Size is an estimate; peg spacing and ironing may affect final measurements.','Saiz ialah anggaran; jarak papan dan seterika boleh mengubah ukuran sebenar.'],
 '图片转换设置':['Image conversion','Penukaran gambar'], '最多使用颜色 ':['Maximum colors ','Warna maksimum '], ' 种':[' colors',' warna'],
 '去除接近白色的背景':['Remove near-white background','Buang latar hampir putih'], '保持图片比例，不拉伸':['Keep aspect ratio','Kekalkan nisbah gambar'],
 '重新生成图片':['Regenerate image','Jana semula gambar'], '更多选项':['More options','Pilihan lanjut'], '拼豆品牌':['Bead brand','Jenama manik'],
 'COCO 等其他品牌可导入经过核实的色卡；不会自动假设跨品牌色号相同。':['For COCO or other brands, import a verified palette. Cross-brand color codes are not assumed equivalent.','Untuk COCO atau jenama lain, import palet yang disahkan. Kod warna berlainan jenama tidak dianggap sama.'],
 '导入品牌色卡（CSV / JSON）':['Import brand palette (CSV / JSON)','Import palet jenama (CSV / JSON)'],
 '色库':['Palette','Palet warna'], 'MARD 221 色（完整）':['MARD 221 colors (full)','MARD 221 warna (penuh)'], 'MARD 144 色（可编辑子集）':['MARD 144 (editable subset)','MARD 144 (subset boleh sunting)'],
 '144 色为可自行调整的参考子集，不代表所有厂商套装的官方清单。':['The 144-color preset is an editable reference subset, not an official set list.','Pratetap 144 warna ialah subset rujukan yang boleh diubah, bukan senarai rasmi set.'],
 '管理可用色号':['Manage available colors','Urus warna tersedia'], '全选':['Select all','Pilih semua'], '清空':['Select none','Kosongkan pilihan'],
 '② 图纸编辑':['② Edit pattern','② Sunting corak'], '↶ 撤销':['↶ Undo','↶ Buat asal'], '↷ 重做':['↷ Redo','↷ Buat semula'],
 '✎ 画笔':['✎ Pen','✎ Pen'], '◇ 橡皮擦':['◇ Eraser','◇ Pemadam'], '▧ 填色':['▧ Fill','▧ Isi warna'], '◉ 吸色':['◉ Pick color','◉ Pilih warna'],
 '色号':['Codes','Kod warna'], '网格':['Grid','Grid'], '圆豆':['Round beads','Manik bulat'], '适合':['Fit','Muat'],
 '选择 MARD 颜色':['Choose bead color','Pilih warna manik'], '清空画布':['Clear canvas','Kosongkan kanvas'],
 '③ 统计与下载':['③ Count & export','③ Kiraan & eksport'], '实际拼豆':['Beads used','Manik digunakan'], '已用颜色':['Colors used','Warna digunakan'],
 '颗':['beads','manik'], '种':['colors','warna'], '所需色号':['Color list','Senarai warna'], '导出图纸':['Export pattern','Eksport corak'],
 '可以选择带格线、色号的图纸或纯色预览。':['Export a numbered grid or a clean preview.','Eksport grid berkod atau pratonton bersih.'],
 '↓ 下载拼豆图纸 PNG':['↓ Download chart PNG','↓ Muat turun carta PNG'], '↓ 下载纯色预览 PNG':['↓ Download preview PNG','↓ Muat turun pratonton PNG'],
 '↓ 打印／保存 PDF':['↓ Print / save PDF','↓ Cetak / simpan PDF'], '↓ 下载色号数量 CSV':['↓ Download color list CSV','↓ Muat turun senarai CSV'],
 '↓ 下载可编辑工程 JSON':['↓ Download editable project JSON','↓ Muat turun projek JSON'],
 '↗ 分享图纸 PNG':['↗ Share pattern PNG','↗ Kongsi corak PNG'], '↗ 分享可编辑工程':['↗ Share editable project','↗ Kongsi projek boleh sunting'],
 '♡ 保存到我的作品':['♡ Save to my projects','♡ Simpan ke projek saya'],
 '浏览器本地处理，不上传你的图片。工程也可以随时保存为 JSON，换设备继续编辑。':['Images stay on your device. Export a JSON project to continue on another device.','Gambar diproses pada peranti. Eksport projek JSON untuk sambung pada peranti lain.'],
 '我的作品 · 仅此设备':['My projects · This device only','Projek saya · Peranti ini sahaja'],
 '作品保存在当前浏览器，不会上传到 GitHub。请定期下载 JSON 备份。':['Projects remain in this browser, not on GitHub. Download JSON backups regularly.','Projek kekal dalam pelayar ini, bukan di GitHub. Muat turun sandaran JSON secara berkala.'],
 '下载全部作品备份':['Download all projects','Muat turun semua projek'], '导入作品备份':['Import project backup','Import sandaran projek'],
 'Made for bead lovers · MARD 色彩为第三方参考数据，屏幕颜色可能与实物略有差异。':['Made for bead lovers · MARD colors are third-party references; actual bead colors may differ.','Dibuat untuk peminat manik · Warna MARD ialah rujukan pihak ketiga; warna sebenar mungkin berbeza.']
};
const messages={
 zh:{cells:'格',beads:'颗',estimated:'预计尺寸',autosaved:'已自动保存在此浏览器',statsEmpty:'开始绘制后显示色号统计',noColor:'请至少启用一种颜色',colorCode:'色号',quantity:'数量',total:'合计',saved:'已保存到我的作品',empty:'还没有保存的作品',open:'打开',remove:'删除',updated:'更新于',name:'我的拼豆图',badPalette:'色卡文件无效。需要 code 与 hex 两列',imported:'已导入品牌色卡',selectBrand:'更换品牌会按相近颜色重新映射图纸，可能出现色差。继续？',confirmDelete:'确定删除这份本机作品？',backupDone:'已生成备份文件',badFile:'文件格式不正确',shareFallback:'当前设备不支持直接分享，已下载文件供发送',shareDone:'已打开系统分享',saveFail:'保存失败：请检查浏览器是否允许本地储存',localOnly:'此设备',restoreDone:'备份导入完成',confirmOpen:'打开作品会替换当前画布。建议先保存当前作品。继续？',paletteCount:'参考色',custom:'自定义色卡',paletteLimited:'此色号未包含在当前色卡中'},
 en:{cells:'cells',beads:'beads',estimated:'Estimated size',autosaved:'Autosaved in this browser',statsEmpty:'Draw to see color counts',noColor:'Enable at least one color',colorCode:'Color code',quantity:'Quantity',total:'Total',saved:'Saved to My Projects',empty:'No saved projects yet',open:'Open',remove:'Delete',updated:'Updated',name:'My bead pattern',badPalette:'Invalid palette: code and hex columns required',imported:'Brand palette imported',selectBrand:'Changing brands will remap the drawing to nearest colors and may change its appearance. Continue?',confirmDelete:'Delete this local project?',backupDone:'Backup file created',badFile:'Invalid file format',shareFallback:'Sharing is unavailable here; the file has been downloaded instead',shareDone:'System share opened',saveFail:'Save failed; check browser storage permissions',localOnly:'This device',restoreDone:'Backup imported',confirmOpen:'Opening replaces the current canvas. Save your current project first. Continue?',paletteCount:'reference colors',custom:'Custom palette',paletteLimited:'Color code not in this palette'},
 ms:{cells:'petak',beads:'manik',estimated:'Anggaran saiz',autosaved:'Disimpan automatik dalam pelayar',statsEmpty:'Mula melukis untuk melihat kiraan warna',noColor:'Aktifkan sekurang-kurangnya satu warna',colorCode:'Kod warna',quantity:'Kuantiti',total:'Jumlah',saved:'Disimpan ke Projek Saya',empty:'Belum ada projek disimpan',open:'Buka',remove:'Padam',updated:'Dikemas kini',name:'Corak manik saya',badPalette:'Palet tidak sah: lajur code dan hex diperlukan',imported:'Palet jenama berjaya diimport',selectBrand:'Menukar jenama akan memadankan warna terdekat dan mungkin mengubah rupa corak. Teruskan?',confirmDelete:'Padam projek setempat ini?',backupDone:'Fail sandaran berjaya dibuat',badFile:'Format fail tidak sah',shareFallback:'Perkongsian tidak tersedia; fail dimuat turun untuk dihantar',shareDone:'Perkongsian sistem dibuka',saveFail:'Gagal menyimpan; semak kebenaran storan pelayar',localOnly:'Peranti ini',restoreDone:'Sandaran berjaya diimport',confirmOpen:'Membuka projek akan menggantikan kanvas semasa. Simpan projek dahulu. Teruskan?',paletteCount:'warna rujukan',custom:'Palet tersuai',paletteLimited:'Kod warna tiada dalam palet ini'}
};
let currentLang='zh';
const t=(key)=>messages[currentLang][key]||messages.zh[key]||key;
const sourceNodes=[];
function initTranslations(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let n;while((n=walker.nextNode())){const raw=n.nodeValue,trim=raw.trim();if(translations[trim])sourceNodes.push({node:n,raw,trim})}
 for(const el of document.querySelectorAll('input[placeholder]')){
   const originals={'查找色号，如 F11':['Search code, e.g. F11','Cari kod, cth. F11'],'🔎 搜索颜色编号，如 G13':['🔎 Search color code, e.g. G13','🔎 Cari kod warna, cth. G13']};
   if(originals[el.placeholder])el.dataset.placeholderKey=el.placeholder;
 }
 $('language').value=localStorage.getItem('mard-studio-lang')||'zh';
 setLang($('language').value);
 $('language').onchange=e=>setLang(e.target.value);
}
function setLang(lang){currentLang=['zh','en','ms'].includes(lang)?lang:'zh';document.documentElement.lang={zh:'zh-CN',en:'en',ms:'ms'}[currentLang];
 for(const {node,raw,trim} of sourceNodes){const trans=currentLang==='zh'?trim:translations[trim][currentLang==='en'?0:1];node.nodeValue=raw.replace(trim,trans)}
 for(const el of document.querySelectorAll('[data-placeholder-key]')){const map={'查找色号，如 F11':['Search code, e.g. F11','Cari kod, cth. F11'],'🔎 搜索颜色编号，如 G13':['🔎 Search code, e.g. G13','🔎 Cari kod warna, cth. G13']};el.placeholder=currentLang==='zh'?el.dataset.placeholderKey:map[el.dataset.placeholderKey][currentLang==='en'?0:1]}
 localStorage.setItem('mard-studio-lang',currentLang);refresh();renderProjects();
}
function validatePalette(raw){
 if(!Array.isArray(raw)||raw.length<1||raw.length>1000)throw Error(t('badPalette'));
 const seen=new Set();return raw.map(row=>{const code=String(row.code??row.Code??'').trim().toUpperCase(),hex=String(row.hex??row.HEX??'').trim().toUpperCase();
 if(!/^[A-Z0-9_-]{1,20}$/.test(code)||!/^#?[A-F0-9]{6}$/.test(hex)||seen.has(code))throw Error(t('badPalette'));
 seen.add(code);const value=hex.startsWith('#')?hex:'#'+hex;return {code,hex:value,rgb:[1,3,5].map(i=>parseInt(value.slice(i,i+2),16))}
 })
}
function loadCustomPalettes(){try{const v=JSON.parse(localStorage.getItem('mard-custom-palettes')||'{}');for(const [name,values] of Object.entries(v))if(name!=='mard')customPalettes[name]=validatePalette(values)}catch(e){}renderBrandOptions()}
function renderBrandOptions(){const el=$('brandSelect');el.replaceChildren();for(const [id,label] of [['mard','MARD · 221'],...Object.keys(customPalettes).map(x=>[x,x])]){const option=new Option(label,id);el.append(option)}el.value=brand}
function activateBrand(id,remap=true){const next=id==='mard'?PALETTE:customPalettes[id];if(!next)return false;
 if(remap&&cells.some(Boolean)&&!confirm(t('selectBrand'))){$('brandSelect').value=brand;return false}
 if(remap)checkpoint();const previous=byCode;
 brand=id;palette=next;byCode=new Map(palette.map(c=>[c.code,c]));labs=new Map(palette.map(c=>[c.code,rgbToLab(c.rgb)]));
 if(remap){const choices=palette.map(c=>({code:c.code,lab:labs.get(c.code)}));const memo=new Map();cells=cells.map(code=>{if(!code)return null;if(memo.has(code))return memo.get(code);const rgb=previous.get(code)?.rgb;if(!rgb)return null;const l=rgbToLab(rgb);let best=choices[0],d=Infinity;for(const c of choices){let v=distance(l,c.lab);if(v<d){best=c;d=v}}memo.set(code,best.code);return best.code})}
 else cells=cells.map(code=>byCode.has(code)?code:null);
 enabled=new Set(palette.map(c=>c.code));active=byCode.has(active)?active:palette[0].code;
 $('paletteMode').disabled=id!=='mard';$('paletteMode').value='221';
 $('selectedColorLabel').textContent=active;$('selectedColorLabel').style.background=byCode.get(active).hex;
 $('brandSelect').value=id;renderPalette();renderManager();refresh();return true
}
function registerPalette(name,raw,activate=true){const id=String(name).trim().replace(/[<>]/g,'').slice(0,55);if(!id||id.toLowerCase()==='mard')throw Error(t('badPalette'));customPalettes[id]=validatePalette(raw);localStorage.setItem('mard-custom-palettes',JSON.stringify(customPalettes));renderBrandOptions();if(activate)activateBrand(id,true)}
$('brandSelect').onchange=e=>activateBrand(e.target.value);
$('paletteFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const content=await file.text();let data,name=file.name.replace(/\.(csv|json)$/i,'');if(file.name.toLowerCase().endsWith('.json')){const doc=JSON.parse(content);data=Array.isArray(doc)?doc:doc.colors;name=doc.brand||doc.name||name}else{const lines=content.replace(/^\uFEFF/,'').trim().split(/\r?\n/);const header=lines.shift().split(/[,;\t]/).map(x=>x.trim().toLowerCase());let a=header.indexOf('code'),b=header.indexOf('hex');if(a<0||b<0)throw Error(t('badPalette'));data=lines.filter(Boolean).map(line=>{const cols=line.split(/[,;\t]/);return {code:cols[a]?.trim(),hex:cols[b]?.trim()}})}registerPalette(name,data);toast(t('imported'))}catch(err){toast(err.message||t('badPalette'))}e.target.value=''};
// IndexedDB is local to the browser/origin, never exposed through GitHub Pages.
function dbOpen(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));const req=indexedDB.open('mard-bead-studio-v2',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function dbAction(mode,fn){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('projects',mode),store=tx.objectStore('projects');let result;try{result=fn(store)}catch(err){db.close();reject(err);return}tx.oncomplete=()=>{db.close();resolve(result?.result)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
async function allProjects(){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readonly');const req=tx.objectStore('projects').getAll();req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close()})}
function validProject(data){return data&&Number.isInteger(data.w)&&Number.isInteger(data.h)&&data.w>=1&&data.h>=1&&data.w<=200&&data.h<=200&&Array.isArray(data.cells)&&data.cells.length===data.w*data.h&&data.cells.every(c=>c===null||typeof c==='string'&&c.length<=20)}
let currentProjectId=null;
async function saveLocal(){try{const data=jsonData();data.id=currentProjectId||crypto.randomUUID();data.updatedAt=new Date().toISOString();await dbAction('readwrite',store=>store.put(data));currentProjectId=data.id;toast(t('saved'));await renderProjects()}catch(err){toast(t('saveFail'))}}
$('saveLocalBtn').onclick=saveLocal;
$('projectsBtn').onclick=async()=>{$('projectsDialog').showModal();await renderProjects()};$('closeProjects').onclick=()=>$('projectsDialog').close();
$('projectsDialog').onclick=e=>{if(e.target===$('projectsDialog'))$('projectsDialog').close()};
async function loadProject(data){if(!validProject(data))throw Error(t('badFile'));if(data.brand&&data.brand!=='mard'){
 if(!customPalettes[data.brand]&&Array.isArray(data.palette))registerPalette(data.brand,data.palette,false);
 if(!customPalettes[data.brand])throw Error(t('badPalette'));activateBrand(data.brand,false)
 }else activateBrand('mard',false);
 if(!data.cells.every(c=>c===null||byCode.has(c)))throw Error(t('paletteLimited'));
 checkpoint();w=data.w;h=data.h;cells=[...data.cells];$('widthInput').value=w;$('heightInput').value=h;$('projectName').value=String(data.name||t('name')).slice(0,100);$('beadSize').value=String(data.beadSize??data.bead)==='2.6'?'2.6':'5';
 enabled=new Set(Array.isArray(data.enabled)?data.enabled.filter(code=>byCode.has(code)):palette.map(c=>c.code));if(enabled.size===0)enabled.add(palette[0].code);
 currentProjectId=data.id||null;lastImage=null;$('regenerateBtn').disabled=true;active=enabled.has(active)?active:[...enabled][0];selectColor(active);refresh();setTimeout(()=>$('zoomFit').click(),50);
}
async function renderProjects(){const list=$('projectList');if(!list)return;list.replaceChildren();try{const projects=await allProjects();if(!projects.length){const el=document.createElement('p');el.textContent=t('empty');el.className='hint';list.append(el)}for(const data of projects){const row=document.createElement('div');row.className='savedProject';const body=document.createElement('div');const title=document.createElement('b');title.textContent=data.name||t('name');const details=document.createElement('small');details.textContent=`${data.w}×${data.h} · ${data.brand||'MARD'} · ${new Date(data.updatedAt).toLocaleDateString(currentLang==='zh'?'zh-CN':currentLang==='ms'?'ms-MY':'en-US')}`;body.append(title,details);const open=document.createElement('button');open.textContent=t('open');open.onclick=async()=>{if(!confirm(t('confirmOpen')))return;try{await loadProject(data);$('projectsDialog').close()}catch(e){toast(e.message||t('badFile'))}};const del=document.createElement('button');del.textContent=t('remove');del.className='dangerText';del.onclick=async()=>{if(!confirm(t('confirmDelete')))return;await dbAction('readwrite',store=>store.delete(data.id));if(currentProjectId===data.id)currentProjectId=null;renderProjects()};row.append(body,open,del);list.append(row)}}catch(e){const el=document.createElement('p');el.textContent=t('saveFail');list.append(el)}}
$('backupAll').onclick=async()=>{try{const projects=await allProjects();download(new Blob([JSON.stringify({format:'mard-studio-backup',version:2,palettes:customPalettes,projects},null,2)],{type:'application/json'}),'mard-studio-backup.json');toast(t('backupDone'))}catch(e){toast(t('saveFail'))}};
$('backupFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.format!=='mard-studio-backup'||!Array.isArray(data.projects)||data.projects.length>1000||!data.projects.every(validProject))throw Error(t('badFile'));
 for(const [name,colors] of Object.entries(data.palettes||{}))registerPalette(name,colors,false);
 for(const item of data.projects){const record={...item,id:crypto.randomUUID(),updatedAt:new Date().toISOString()};await dbAction('readwrite',store=>store.put(record))}await renderProjects();toast(t('restoreDone'))}catch(err){toast(err.message||t('badFile'))}e.target.value=''};
async function shareFile(file){try{if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:$('projectName').value});return}download(file,file.name);toast(t('shareFallback'))}catch(err){if(err.name!=='AbortError')toast(t('shareFallback'))}}
$('sharePng').onclick=()=>{const out=exportCanvas({chart:true});out.toBlob(blob=>{if(blob)shareFile(new File([blob],safeName()+'-pattern.png',{type:'image/png'}))},'image/png')};
$('shareProject').onclick=()=>shareFile(new File([JSON.stringify(jsonData(),null,2)],safeName()+'.json',{type:'application/json'}));
// Upgrade the original JSON import handler: it now uses the same validated project loader.
$('projectInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());await loadProject(data);toast(t('saved'))}catch(err){toast(err.message||t('badFile'))}e.target.value=''};

loadCustomPalettes();try{const stored=JSON.parse(localStorage.getItem('mard-studio-v1'));if(stored?.brand&&stored.brand!=='mard'&&customPalettes[stored.brand])activateBrand(stored.brand,false);if(stored&&stored.w>=1&&stored.w<=200&&stored.h>=1&&stored.h<=200&&stored.cells?.length===stored.w*stored.h&&stored.cells.every(c=>c===null||byCode.has(c))){w=stored.w;h=stored.h;cells=stored.cells;$('widthInput').value=w;$('heightInput').value=h;$('projectName').value=stored.name||'我的拼豆图';$('beadSize').value=stored.bead==='2.6'?'2.6':'5';if(stored.enabled)enabled=new Set(stored.enabled.filter(x=>byCode.has(x)))}}catch(e){}
renderPalette();refresh();initTranslations();setTimeout(()=>$('zoomFit').click(),100);
