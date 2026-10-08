/* ===== Fleet Master lookup + autofill (shared by site + admin) ===== */
async function fleetFind(text){
  const k=plateKey(text); if(!k) return {match:null,multi:0};
  const col=db.collection('fleet'); const out=[];
  let s=await col.where('key','==',k).limit(2).get(); s.forEach(d=>out.push(d.data()));
  if(!out.length){ s=await col.where('plateKey','==',k).limit(3).get(); s.forEach(d=>out.push(d.data())); }
  return {match:out.length===1?out[0]:null, multi:out.length};
}
async function fleetSuggest(text){
  const k=plateKey(text); if(k.length<2) return [];
  const col=db.collection('fleet'); const out={};
  const [a,b]=await Promise.all([
    col.where('key','>=',k).where('key','<=',k+'\uf8ff').limit(6).get(),
    col.where('plateKey','>=',k).where('plateKey','<=',k+'\uf8ff').limit(6).get()]);
  a.forEach(d=>out[d.id]=d.data()); b.forEach(d=>out[d.id]=d.data());
  return Object.values(out).slice(0,8);
}
function fleetAttach(){
  const inp=document.getElementById('fEqptNo'); if(!inp||inp.dataset.fleet) return;
  inp.dataset.fleet='1';
  const hint=document.createElement('div'); hint.className='fleet-hint'; hint.id='fEqptHint';
  inp.parentNode.insertBefore(hint,document.getElementById('fEqptNoErr'));
  const dl=document.createElement('datalist'); dl.id='fleetDL'; inp.parentNode.appendChild(dl); inp.setAttribute('list','fleetDL');
  const ids=['fEqptCode','fMake','fModel','fEngMake','fEngModel']; let locked=[], token=0, t, lastV=inp.value.trim();
  const unlock=()=>{ locked.forEach(id=>{const e=document.getElementById(id); if(e){e.readOnly=false;e.classList.remove('locked');e.value='';validateOneField(id);}}); locked=[]; };
  const say=(msg,warn)=>{ hint.textContent=msg; hint.className='fleet-hint'+(warn?' warn':''); };
  const fail=e=>say('Fleet lookup failed ('+((e&&(e.code||e.message))||'error')+') — check internet / Firestore rules for "fleet"',true);
  if(!lastV) say('Type plate no. or asset code — details auto-fill from fleet master');
  inp.addEventListener('input',()=>{
    lastV=''; if(locked.length){ unlock(); say(''); }
    clearTimeout(t);
    t=setTimeout(async()=>{ try{
      const rows=await fleetSuggest(inp.value);
      dl.innerHTML=rows.map(r=>`<option value="${escHtml(r.assetCode)}">${escHtml(r.plate+' · '+(r.description||''))}</option>`).join('');
    }catch(e){ fail(e); } },250);
  });
  async function apply(){
    const v=inp.value.trim(); if(v===lastV) return; lastV=v;
    const my=++token; unlock(); say('');
    if(!v) return;
    say('Checking fleet list…');
    let res; try{ res=await fleetFind(v); }catch(e){ console.error('fleetFind failed',e); if(my===token) fail(e); return; }
    if(my!==token) return;
    console.info('fleet lookup',v,res);
    if(res.multi>1){ say('Several assets share this plate — enter the Asset Code instead',true); return; }
    if(!res.match){ inp.value=v.toUpperCase(); lastV=inp.value; say('Not in fleet master — enter the details manually',true); return; }
    const m=res.match; inp.value=m.assetCode; lastV=m.assetCode;
    const map={fEqptCode:m.assetCode,fMake:m.make,fModel:m.model,fEngMake:m.engMake,fEngModel:m.engModel};
    ids.forEach(id=>{ const val=map[id], e=document.getElementById(id);
      if(e&&val){ e.value=val; e.readOnly=true; e.classList.add('locked'); locked.push(id); validateOneField(id); } });
    validateOneField('fEqptNo');
    const info=[m.description, m.plate&&('Plate '+m.plate), m.capacity, m.project].filter(Boolean).join(' · ');
    const missing=(!m.engMake||!m.engModel)?' — enter Engine Make/Model manually':'';
    say('✓ '+info+missing);
  }
  inp.addEventListener('change',apply);
  inp.addEventListener('blur',apply);
}
