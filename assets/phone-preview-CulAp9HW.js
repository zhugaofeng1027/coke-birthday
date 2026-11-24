import{d as h,c as d,S as p,A as u}from"./lucide-BoqD-r2u.js";const w=["svg",h,[["path",{d:"M15 3h6v6"}],["path",{d:"M10 14 21 3"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}]]],v={standard:{width:844,height:390},small:{width:740,height:320},compact:{width:568,height:320},tablet:{width:1180,height:820}},r=new URL(window.location.href);r.searchParams.delete("preview");r.searchParams.delete("layout");const a=new URL(r);a.searchParams.set("layout","landscape");const m=a.searchParams.get("kitchen-polish");r.searchParams.delete("score-fx");const f=document.querySelector("#app");f.innerHTML=`
  <header class="preview-toolbar">
    <a class="preview-icon" id="preview-back" aria-label="返回电脑试玩" title="返回电脑试玩"><i data-lucide="arrow-left"></i></a>
    <span class="preview-title"><i data-lucide="smartphone"></i>手机横屏预览</span>
    
    <select id="preview-size" aria-label="预览设备尺寸">
      <option value="standard">手机 · 844 × 390</option>
      <option value="small">小屏 · 740 × 320</option>
      <option value="compact">紧凑 · 568 × 320</option>
      <option value="tablet">平板 · 1180 × 820</option>
    </select>
    <output id="preview-scale" aria-label="预览缩放比例"></output>
    <a class="preview-icon" id="preview-open" target="_blank" rel="noopener" aria-label="独立打开游戏" title="独立打开游戏"><i data-lucide="external-link"></i></a>
  </header>
  <main class="preview-workspace">
    <div class="preview-frame"><iframe title="手机横屏游戏" allow="fullscreen; microphone"></iframe></div>
  </main>`;document.querySelector("#preview-back").href=r.href;document.querySelector("#preview-open").href=a.href;d({icons:{ArrowLeft:u,Smartphone:p,ExternalLink:w},attrs:{"stroke-width":1.7}});const s=document.querySelector(".preview-workspace"),n=document.querySelector(".preview-frame"),t=n.querySelector("iframe"),l=document.querySelector("#preview-size"),o=document.querySelector("#bento-version");o&&(o.value=m,o.addEventListener("change",()=>{const e=new URL(location.href);for(const i of[e,r,a])i.searchParams.set("kitchen-polish",o.value);history.replaceState(null,"",e.href),document.querySelector("#preview-back").href=r.href,document.querySelector("#preview-open").href=a.href,t.src=a.href}));window.addEventListener("message",e=>{});function c(){const e=v[l.value],i=Math.min(1,(s.clientWidth-28)/e.width,(s.clientHeight-28)/e.height);n.style.width=`${e.width*i}px`,n.style.height=`${e.height*i}px`,t.style.width=`${e.width}px`,t.style.height=`${e.height}px`,t.style.transform=`scale(${i})`,document.querySelector("#preview-scale").textContent=`${Math.round(i*100)}%`}l.addEventListener("change",()=>{c(),t.focus()});new ResizeObserver(c).observe(s);t.addEventListener("load",()=>t.focus());c();t.src=a.href;
