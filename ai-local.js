/**
 * v2.2.7: explicit opt-in AI on the user's device.
 * A: ONNX background removal in browser via Transformers.js (no hosted inference).
 * B: user-installed local VLM (Ollama/LM Studio) returns a subject bounding-box;
 *    local Canvas performs a reversible preview crop, not AI image generation.
 * No model, key, or endpoint is loaded until the user clicks a button.
 */
const $ = id => document.getElementById(id);
const MODELS = Object.freeze({
  browser: {label:'Browser ONNX'},
  ollama: {url:'http://127.0.0.1:11434',list:'/api/tags',chat:'/api/chat'},
  lmstudio: {url:'http://127.0.0.1:1234',list:'/v1/models',chat:'/v1/chat/completions'}
});
const phrases={
  zh:{idle:'上传原图后，点击开始。默认只在本机处理，不连接云端 AI API。',busy:'正在处理，请不要重复点击。',need:'请先上传原图。',loading:'正在从 Hugging Face 下载／加载 ONNX 模型（首次可能需要较久）…',infer:'模型已加载，正在本机进行主体分割…',ready:'预览已准备好。确认后再导入；原图仍可用于重新生成。',crop:'本机视觉模型已返回主体范围，下面展示裁剪预览（非 AI 重新绘图）。',error:'本地 AI 无法完成',import:'导入将覆盖当前候选图及修改，请先保存工程。确认继续？',imported:'已将本地 AI 预览导入并生成三种候选图。',clear:'已清除本次预览；原图和当前图纸未修改。',connected:'本地服务已响应',nomodel:'请先输入已安装的视觉模型名称。',unsupported:'没有得到可用的主体坐标。请确认模型支持图片输入及 JSON 指令。',network:'请检查本机服务已启动、CORS 与浏览器本机网络权限。',empty:'模型结果为空，无法生成预览。'},
  en:{idle:'Upload an original image, then click Run. No cloud API is used.',busy:'Processing. Please do not click again.',need:'Upload an original image first.',loading:'Downloading/loading ONNX model from Hugging Face (first use may take time)…',infer:'Model loaded. Segmenting subject on this device…',ready:'Preview ready. Review it before importing.',crop:'Local vision model returned the subject bounds. Showing a crop preview, not AI image generation.',error:'Local AI failed',import:'Import will replace current candidate variants and edits. Save the project first. Continue?',imported:'Preview imported; three new variants generated.',clear:'Preview cleared. Original and pattern are unchanged.',connected:'Local server responded',nomodel:'Enter the name of your installed vision model.',unsupported:'No usable subject coordinates. Check model vision support and JSON instruction compliance.',network:'Check local server, CORS, and browser local-network permissions.',empty:'Empty model result.'},
  ms:{idle:'Muat naik gambar asal, kemudian tekan Mula. Tiada API awan digunakan.',busy:'Sedang memproses. Jangan klik berulang kali.',need:'Muat naik gambar asal dahulu.',loading:'Memuat turun/memuatkan model ONNX (kali pertama mungkin mengambil masa)…',infer:'Model dimuatkan. Mengasingkan subjek pada peranti…',ready:'Pratonton sedia. Semak sebelum import.',crop:'Model penglihatan setempat memulangkan kawasan subjek; ini cuma pratonton pangkasan.',error:'AI setempat gagal',import:'Import akan menggantikan tiga pilihan dan suntingan. Simpan projek dahulu. Teruskan?',imported:'Pratonton diimport dan tiga pilihan dijana.',clear:'Pratonton dipadam; gambar asal dan corak tidak diubah.',connected:'Pelayan setempat memberi respons',nomodel:'Masukkan nama model penglihatan yang dipasang.',unsupported:'Tiada koordinat subjek yang boleh digunakan. Semak sokongan imej dan JSON.',network:'Semak pelayan setempat, CORS dan kebenaran rangkaian pelayar.',empty:'Hasil model kosong.'}
};
const ui={
 zh:{heading:'🧠 本地 AI · 浏览器 / 电脑',intro:'无需云端 API Key。浏览器首次下载模型；电脑需安装并启动视觉模型。预览确认后才导入。',mode:'AI 模式',browser:'使用 Transformers.js 与 ONNX 去背景模型。首次使用需下载模型并在本机运行；不保证所有照片都能准确分离。',endpoint:'本地服务地址',model:'已安装的视觉模型名称',desktop:'只连接此电脑的 localhost。请设置 CORS，浏览器可能需要本机网络访问权限。不要把服务开放到互联网。',test:'测试本地连接',reset:'清除预览',import:'导入预览，重新生成三种候选',notice:'本地视觉 AI 仅分析主体位置并辅助裁剪，不会重新绘制图片。失败时原有普通转换仍可用。',run:'✨ 开始本地 AI 优化',running:'处理中…'},
 en:{heading:'🧠 Local AI · Browser / Desktop',intro:'No cloud API key needed. Browser downloads a model on first use; desktop requires a local vision model. Import only after reviewing the preview.',mode:'AI mode',browser:'Transformers.js + ONNX background removal. The model downloads on first use and runs locally. Results vary by image.',endpoint:'Local server address',model:'Installed vision model name',desktop:'Localhost only. Enable CORS and allow local network access if your browser asks. Never expose this server to the internet.',test:'Test local connection',reset:'Clear preview',import:'Import preview and regenerate three variants',notice:'Desktop vision AI identifies subject bounds for cropping; it does not redraw the image. The original converter remains available.',run:'✨ Run local AI',running:'Working…'},
 ms:{heading:'🧠 AI Tempatan · Pelayar / Komputer',intro:'Tidak perlu kunci API awan. Pelayar memuat turun model pada penggunaan pertama; komputer memerlukan model visual tempatan. Semak pratonton sebelum import.',mode:'Mod AI',browser:'Transformers.js + ONNX untuk membuang latar belakang. Model dimuat turun sekali dan dijalankan setempat. Hasil berbeza mengikut gambar.',endpoint:'Alamat pelayan tempatan',model:'Nama model visual yang dipasang',desktop:'Localhost sahaja. Aktifkan CORS dan kebenaran rangkaian tempatan jika diperlukan. Jangan dedahkan pelayan ke Internet.',test:'Uji sambungan tempatan',reset:'Kosongkan pratonton',import:'Import pratonton dan jana tiga pilihan',notice:'AI visual komputer hanya mengenal pasti kawasan subjek untuk pangkasan; bukan melukis semula gambar. Penukar biasa masih tersedia.',run:'✨ Mula AI tempatan',running:'Sedang memproses…'}
};
function updateUi(){const language=$('language')?.value||'zh',labels=ui[language]||ui.zh;document.querySelectorAll('[data-local-ai-tr]').forEach(node=>{const key=node.dataset.localAiTr;if(labels[key])node.textContent=labels[key]});$('localAiRun').textContent=busy?labels.running:labels.run}

let busy=false, resultURL='', cachePipeline=null;
const lang=()=>phrases[$('language')?.value]||phrases.zh;
const show=(txt,bad=false)=>{const e=$('localAiStatus');e.textContent=txt;e.classList.toggle('localAiError',bad);};
const mode=()=>$('localAiMode').value;
const update=()=>{const desk=mode()!=='browser';$('localAiBrowserBox').hidden=desk;$('localAiDesktopBox').hidden=!desk;$('localAiRun').disabled=busy;$('localAiTest').disabled=busy;$('localAiImport').disabled=busy||!resultURL;updateUi();const saved=loadPrefs();if(desk&&saved.mode!==mode()){$('localAiEndpoint').value=MODELS[mode()].url;}
  try{localStorage.setItem('mard-local-ai-prefs-v1',JSON.stringify({mode:mode(),endpoint:$('localAiEndpoint').value,model:$('localAiModel').value}));}catch{}
};
function loadPrefs(){try{return JSON.parse(localStorage.getItem('mard-local-ai-prefs-v1')||'{}')}catch{return {}}}
function localRoot(input){
  const u=new URL(input);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Local endpoint must be a clean http(s) URL without credentials.');
  if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname.toLowerCase()))throw Error('Only localhost / 127.0.0.1 / [::1] endpoints are permitted.');
  if(!u.port)throw Error('Specify the local service port (11434 or 1234).');
  if(u.pathname!=='/'&&u.pathname!=='')throw Error('Enter the base URL, without /api or /v1 paths.');
  return u.origin;
}
async function request(url, init={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),50000);
  try{const res=await fetch(url,{...init,mode:'cors',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
    if(!res.ok)throw Error('HTTP '+res.status);
    return await res.json();
  }finally{clearTimeout(timer)}
}
function baseCanvas(src,max=1024){const width=src.naturalWidth||src.width,height=src.naturalHeight||src.height;if(!width||!height)throw Error('Invalid input image');const s=Math.min(1,max/Math.max(width,height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(width*s));c.height=Math.max(1,Math.round(height*s));c.getContext('2d',{willReadFrequently:true}).drawImage(src,0,0,c.width,c.height);return c}
async function loadImage(url){return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Cannot decode image'));img.src=url})}
function setResult(canvas){if(!canvas.width||!canvas.height)throw Error(lang().empty);if(resultURL)URL.revokeObjectURL(resultURL);resultURL=canvas.toDataURL('image/png');$('localAiPreview').src=resultURL;$('localAiPreview').hidden=false;update()}
async function browserRemoveBackground(src){
  if(!globalThis.WebAssembly)throw Error('WebAssembly is not supported by this browser.');
  show(lang().loading);
  // Import only after the user opts in; the library and model download from trusted CDNs.
  const {pipeline}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
  if(!cachePipeline)cachePipeline=await pipeline('background-removal','onnx-community/ormbg-ONNX',{device:'wasm'});
  show(lang().infer);
  const input=baseCanvas(src,1024);
  const output=await cachePipeline(input.toDataURL('image/png'));
  const mask=Array.isArray(output)?output[0]:output;
  if(!mask||typeof mask.toCanvas!=='function')throw Error('Unexpected ONNX model output');
  const maskCanvas=mask.toCanvas();
  const m=document.createElement('canvas');m.width=input.width;m.height=input.height;
  const mctx=m.getContext('2d',{willReadFrequently:true});mctx.drawImage(maskCanvas,0,0,m.width,m.height);
  const pix=mctx.getImageData(0,0,m.width,m.height).data;
  const target=input.getContext('2d',{willReadFrequently:true});const result=target.getImageData(0,0,input.width,input.height);
  // The model returns grayscale masks in several implementations. Prefer alpha
  // only when it has nontrivial variation; otherwise use luminance.
  let amin=255,amax=0,lmin=255,lmax=0;
  for(let i=0;i<pix.length;i+=4){const a=pix[i+3],l=(pix[i]+pix[i+1]+pix[i+2])/3;amin=Math.min(amin,a);amax=Math.max(amax,a);lmin=Math.min(lmin,l);lmax=Math.max(lmax,l)}
  const useAlpha=amax-amin>30&&lmax-lmin<15;
  let foreground=0;
  for(let i=0;i<pix.length;i+=4){const alpha=useAlpha?pix[i+3]:Math.round(.2126*pix[i]+.7152*pix[i+1]+.0722*pix[i+2]);result.data[i+3]=Math.round(result.data[i+3]*alpha/255);if(alpha>90)foreground++}
  if(foreground<result.data.length/4*.015||foreground>result.data.length/4*.99)throw Error('Segmentation mask was empty or covered entire image. Try manual editing.');
  target.putImageData(result,0,0);
  setResult(input);show(lang().ready)
}
function normalizeJson(text){const cleaned=String(text||'').replace(/```(?:json)?/gi,'').trim();let obj;try{obj=JSON.parse(cleaned)}catch{const p=cleaned.indexOf('{'),q=cleaned.lastIndexOf('}');if(p<0||q<=p)throw Error(lang().unsupported);obj=JSON.parse(cleaned.slice(p,q+1))}return obj}
function parseBounds(answer){const box=normalizeJson(answer).bbox;if(!Array.isArray(box)||box.length!==4||!box.every(n=>typeof n==='number'&&Number.isFinite(n)))throw Error(lang().unsupported);
  const [x1,y1,x2,y2]=box;
  if(x1<0||y1<0||x2>1||y2>1||x2-x1<.08||y2-y1<.08)throw Error(lang().unsupported);
  return box;
}
function cropByBounds(src,box,settings){const original=baseCanvas(src,1024);const [x1,y1,x2,y2]=box;const margin=.065;const cx=(x1+x2)/2,cy=(y1+y2)/2;let cw=Math.min(1,(x2-x1)*(1+margin*2)),ch=Math.min(1,(y2-y1)*(1+margin*2));
  const targetRatio=(Number(settings.w)||24)/(Number(settings.h)||24);if(cw/ch<targetRatio)cw=Math.min(1,ch*targetRatio);else ch=Math.min(1,cw/targetRatio);
  const sx=Math.max(0,Math.min(1-cw,cx-cw/2))*original.width,sy=Math.max(0,Math.min(1-ch,cy-ch/2))*original.height;
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(cw*original.width));c.height=Math.max(1,Math.round(ch*original.height));c.getContext('2d').drawImage(original,sx,sy,cw*original.width,ch*original.height,0,0,c.width,c.height);return c
}
async function testConnection(){const root=localRoot($('localAiEndpoint').value.trim());const path=MODELS[mode()].list;const json=await request(root+path);
  const names=(mode()==='ollama'?json.models:json.data)||[];
  if(!Array.isArray(names))throw Error('Unexpected model list');show(`${lang().connected} · ${names.length} models`);
}
async function desktopAnalyze(src,settings){const root=localRoot($('localAiEndpoint').value.trim()),model=$('localAiModel').value.trim();if(!model)throw Error(lang().nomodel);
  const input=baseCanvas(src,768),b64=input.toDataURL('image/jpeg',.83).split(',')[1];
  const task=`Analyze the image composition for a small ${settings.w}x${settings.h} fuse bead pattern. Identify the single primary illustrated/photographed subject. Respond ONLY with compact JSON {"bbox":[x1,y1,x2,y2]} using normalized coordinates from 0 to 1, ordered left,top,right,bottom. Preserve ALL of the primary subject (including ears, hands, feet, tails). Include a small margin. If you cannot locate a subject return {"bbox":[0,0,1,1]}. Do not add other fields, prose, or markdown.`;
  let text;
  if(mode()==='ollama'){
    const json=await request(root+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,messages:[{role:'user',content:task,images:[b64]}],options:{temperature:0}})});
    text=json.message?.content;
  }else{
    const json=await request(root+'/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,temperature:0,messages:[{role:'user',content:[{type:'text',text:task},{type:'image_url',image_url:{url:'data:image/jpeg;base64,'+b64}}]}]})});
    text=json.choices?.[0]?.message?.content;
  }
  const bounds=parseBounds(text);setResult(cropByBounds(src,bounds,settings));show(lang().crop)
}
export function initLocalAI({getOriginal,getSettings,importImage}){
  const prefs=loadPrefs();if(MODELS[prefs.mode])$('localAiMode').value=prefs.mode;
  const m=mode();$('localAiEndpoint').value=prefs.mode===m&&prefs.endpoint?prefs.endpoint:(MODELS[m].url||MODELS.ollama.url);$('localAiModel').value=prefs.model||'';
  $('localAiMode').addEventListener('change',()=>{const item=MODELS[mode()];if(item.url)$('localAiEndpoint').value=item.url;update();show(lang().idle)});
  $('localAiEndpoint').addEventListener('change',update);$('localAiModel').addEventListener('change',update);
  $('localAiTest').addEventListener('click',async()=>{if(busy)return;busy=true;update();try{await testConnection()}catch(e){show(lang().network+' '+String(e.message||e).slice(0,180),true)}finally{busy=false;update()}});
  $('localAiRun').addEventListener('click',async()=>{if(busy)return;const original=getOriginal();if(!original){show(lang().need,true);return}busy=true;update();try{if(mode()==='browser')await browserRemoveBackground(original);else await desktopAnalyze(original,getSettings())}catch(e){show(lang().error+': '+String(e.message||e).slice(0,220),true)}finally{busy=false;update()}});
  $('localAiImport').addEventListener('click',async()=>{if(busy||!resultURL)return;if(!confirm(lang().import))return;busy=true;update();try{const image=await loadImage(resultURL);await importImage(image);show(lang().imported)}catch(e){show(lang().error+': '+String(e.message||e).slice(0,220),true)}finally{busy=false;update()}});
  $('localAiReset').addEventListener('click',()=>{if(resultURL)URL.revokeObjectURL(resultURL);resultURL='';$('localAiPreview').src='';$('localAiPreview').hidden=true;update();show(lang().clear)});
  $('language').addEventListener('change',()=>{updateUi();show(lang().idle)});update();show(lang().idle);
}
