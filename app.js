/* ==========================================================
   Calendrier de l'Avent — coquille publique (aucun contenu ici)
   Le contenu personnel est servi par le Google Sheet privé,
   uniquement avec le code secret et uniquement le bon jour.
   ========================================================== */

// 👉 Coller ici l'URL de l'application web Google Apps Script (se termine par /exec)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-EdcwHm_WlT3ovwPPBjcYWRRPL-3lU8VsftkUE46x4Hr6fpvPngeziQi0aCO1vv5TQw/exec';

const ICONES = { mot:'💌', souvenir:'📷', bon:'🎟️', defi:'⭐', musique:'🎵', quiz:'❓', recette:'🍪' };
const LIBELLES = { mot:'Mot doux', souvenir:'Souvenir', bon:'Bon cadeau', defi:'Défi', musique:'Musique', quiz:'Quiz', recette:'Gourmandise' };

const Avent = (() => {
  const K_OUVERT='avent_ouverts', K_DEMO='avent_demo', K_CODE='avent_code', K_TYPES='avent_types';
  const lire = (k,d) => { try { const v=localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
  const ecrire = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  let ouverts = new Set(lire(K_OUVERT, []));
  let types = lire(K_TYPES, {});            // mémorise l'icône des cases déjà ouvertes
  let jourDemo = lire(K_DEMO, 6);
  let donnees = null;                        // réponse du Google Sheet
  let etat = 'vide';                         // vide | chargement | ok | hors-ligne
  const abonnes = [];

  // Code secret : depuis le lien (#code=XXXX) ou déjà enregistré sur le téléphone
  const m = location.hash.match(/code=([A-Za-z0-9-]+)/);
  let code = m ? m[1] : lire(K_CODE, '');
  if (m) ecrire(K_CODE, code);

  function jourReel(){
    const d = new Date();
    if (d.getMonth()===11) return d.getDate();
    if (d.getMonth()===0) return 24;
    return 0;
  }
  const estDemo = () => !!(donnees && donnees.demo);
  function jourActuel(){
    if (estDemo()) return jourDemo;
    if (donnees) return donnees.jour;       // date contrôlée par Google
    return jourReel();                      // calendrier vide public
  }
  const peutOuvrir = n => n <= jourActuel();
  const estOuvert = n => ouverts.has(n);
  const icone = n => ICONES[types[n]] || '🎁';
  function marquerOuvert(n){ ouverts.add(n); ecrire(K_OUVERT,[...ouverts]); notifier(); }
  function notifier(){ abonnes.forEach(f=>f()); majDemo(); }
  const onChange = f => abonnes.push(f);

  // ---------- Chargement depuis le Google Sheet ----------
  async function charger(){
    if (!SCRIPT_URL || !code) { etat='vide'; notifier(); return; }
    etat='chargement';
    try{
      const r = await fetch(`${SCRIPT_URL}?code=${encodeURIComponent(code)}`);
      const j = await r.json();
      if (!j.ok){
        if (j.erreur==='code'){ code=''; ecrire(K_CODE,''); etat='vide'; demanderCode('Code incorrect, réessaie 🙂'); }
        else { etat='hors-ligne'; toast('Petit souci de connexion…'); }
      } else {
        donnees=j; etat='ok';
        Object.values(j.cases).forEach(c => types[c.jour]=c.type); ecrire(K_TYPES, types);
      }
    }catch(e){ etat='hors-ligne'; toast('Pas de connexion internet 📶'); }
    notifier();
  }

  // ---------- Écran du code secret ----------
  let ecranCode;
  function demanderCode(msg){
    if(!ecranCode){
      ecranCode=document.createElement('div'); ecranCode.className='av-modal';
      ecranCode.innerHTML=`<form class="av-card av-code"><div class="av-cle">🔑</div><h2 class="av-titre">Ton code secret</h2>
        <p class="av-texte">Entre le code qu'on t'a donné pour découvrir tes surprises.</p>
        <input autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXXXXXXX">
        <p class="av-erreur"></p><button type="submit">Ouvrir mon calendrier</button>
        <button type="button" class="av-plus-tard">Plus tard</button></form>`;
      document.body.appendChild(ecranCode);
      ecranCode.querySelector('form').onsubmit = e => { e.preventDefault();
        const v=ecranCode.querySelector('input').value.trim().toUpperCase(); if(!v) return;
        code=v; ecrire(K_CODE,v); ecranCode.classList.remove('on'); charger(); };
      ecranCode.querySelector('.av-plus-tard').onclick = () => ecranCode.classList.remove('on');
    }
    ecranCode.querySelector('.av-erreur').textContent = msg||'';
    requestAnimationFrame(()=>ecranCode.classList.add('on'));
  }

  // ---------- Toast ----------
  let toastEl;
  function toast(msg){
    if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='av-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent=msg; toastEl.classList.add('on');
    clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove('on'),2400);
  }

  // ---------- Contenu d'une case ----------
  function contenuHTML(n, cas){
    const c = cas || (donnees && donnees.cases[n]);
    if(!c) return `<div class="av-tag">🎁 ${n} décembre</div><h2 class="av-titre">Case vide</h2>
      <p class="av-texte">Cette case n'a pas encore de surprise… Reviens plus tard ✨</p>`;
    const t = ICONES[c.type] ? c.type : 'mot';
    const leg = c.legende ? `<small>${esc(c.legende)}</small>` : '';
    // Photo : affichée pour tous les types de case dès qu'un lien photo est renseigné
    let photo = '';
    if (c.photo) photo = `<div class="av-photo av-photo-ok"><img src="${c.photo}" alt="">${leg}</div>`;
    else if (c.aPhoto) photo = `<div class="av-photo" data-photo="${n}"><span class="av-charge">✨</span>${leg}</div>`;
    else if (t==='souvenir') photo = `<div class="av-photo"><span>📷</span>${leg}</div>`;
    let corps = `<p class="av-texte">${esc(c.texte)}</p>`;
    if (t==='bon') corps = `<div class="av-bon"><div class="av-bon-titre">BON CADEAU</div><p>${esc(c.texte)}</p><small>${esc(c.valable||'')}</small></div>`;
    if (t==='musique'){
      if (c.morceau) corps += `<p class="av-morceau">🎵 ${esc(c.morceau)}</p>`;
      if (c.deezer){
        const dz = `${c.deezer.type}/${c.deezer.id}`;
        corps += `<iframe class="av-deezer" title="Lecteur Deezer" src="https://widget.deezer.com/widget/dark/${dz}?autoplay=true&tracklist=false" allow="autoplay; encrypted-media; clipboard-write" frameborder="0"></iframe>
                  <a class="av-musique" href="https://www.deezer.com/${dz}" target="_blank" rel="noopener">▶︎ Écouter en entier dans Deezer</a>`;
      } else if (c.lien && /^https?:/.test(c.lien)) {
        corps += `<a class="av-musique" href="${esc(c.lien)}" target="_blank" rel="noopener">▶︎ Écouter</a>`;
      }
    }
    if (t==='quiz') corps = `<p class="av-texte">${esc(c.question)}</p><div class="av-quiz">` +
      (c.choix||[]).map((x,i)=>`<button data-i="${i}">${esc(x)}</button>`).join('') + `</div><p class="av-quiz-res"></p>`;
    if (!c.texte && t!=='quiz' && t!=='bon') corps = corps.replace(`<p class="av-texte"></p>`, '');
    return `<div class="av-tag">${ICONES[t]} ${LIBELLES[t]} · ${n} décembre</div><h2 class="av-titre">${esc(c.titre)}</h2>${photo}${corps}`;
  }

  async function chargerPhoto(zone, n){
    const el = zone.querySelector(`[data-photo="${n}"]`); if(!el) return;
    try{
      const r = await fetch(`${SCRIPT_URL}?code=${encodeURIComponent(code)}&action=photo&n=${n}`);
      const j = await r.json();
      if (j.ok){ const sm=el.querySelector('small'); const leg=sm ? sm.outerHTML : ''; el.classList.add('av-photo-ok'); el.innerHTML=`<img src="${j.photo}" alt="">${leg}`; }
      else el.querySelector('.av-charge').textContent='📷';
    }catch(e){ el.querySelector('.av-charge').textContent='📷'; }
  }

  function brancherQuiz(zone, c){
    zone.querySelectorAll('.av-quiz button').forEach(b=>b.onclick=()=>{
      const ok = +b.dataset.i===c.bonne; b.classList.add(ok?'bon':'faux');
      zone.querySelector('.av-quiz-res').textContent = ok ? (c.bravo||'Bravo !') : 'Raté… essaie encore 😄';
    });
  }

  // ---------- Cadenas (case verrouillée par une combinaison) ----------
  const K_CADENAS='avent_cadenas';
  function cadenasHTML(){
    const roues = [0,1,2,3,4].map(i=>`<div class="roue" data-i="${i}"><button type="button" data-d="1" aria-label="Plus">▲</button><span>0</span><button type="button" data-d="-1" aria-label="Moins">▼</button></div>`).join('');
    return `<div class="cad">
      <svg class="cad-svg" viewBox="0 0 120 150" aria-hidden="true">
        <path class="cad-anse" d="M32 70 V44 a28 28 0 0 1 56 0 V70" fill="none" stroke="#b9bfc7" stroke-width="12" stroke-linecap="round"/>
        <rect x="14" y="64" width="92" height="76" rx="14" fill="url(#or)"/>
        <defs><linearGradient id="or" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f6d27a"/><stop offset=".55" stop-color="#d9a53a"/><stop offset="1" stop-color="#a87a1f"/></linearGradient></defs>
        <circle cx="60" cy="96" r="10" fill="#5a3b0c"/><path d="M55 100 h10 l-3 22 h-4z" fill="#5a3b0c"/>
        <rect x="22" y="70" width="76" height="6" rx="3" fill="#fff" opacity=".35"/>
      </svg>
      <p class="cad-txt">Un dernier obstacle te sépare de ton trésor…<br><b>Trouve la combinaison secrète.</b></p>
      <div class="cad-roues">${roues}</div>
      <button type="button" class="cad-ok">Ouvrir 🔓</button>
      <p class="cad-msg"></p>
    </div>`;
  }
  async function verifierCadenas(n, combi, premiere){
    const r = await fetch(`${SCRIPT_URL}?code=${encodeURIComponent(code)}&action=cadenas&n=${n}&combi=${encodeURIComponent(combi)}&premiere=${premiere?1:0}`);
    return r.json();
  }
  function afficherCase(zone, n, c){
    zone.innerHTML = contenuHTML(n, c); brancherQuiz(zone, c); chargerPhoto(zone, n);
  }
  function brancherCadenas(zone, n){
    const roues=[...zone.querySelectorAll('.roue')], msg=zone.querySelector('.cad-msg'), svg=zone.querySelector('.cad-svg'), ok=zone.querySelector('.cad-ok');
    roues.forEach(r=>{
      const s=r.querySelector('span');
      const tourner = d => { s.textContent=(+s.textContent+d+10)%10; s.classList.remove('tic'); void s.offsetWidth; s.classList.add('tic'); msg.textContent=''; };
      r.querySelectorAll('button').forEach(b=>b.onclick=()=>tourner(+b.dataset.d));
      s.onclick=()=>tourner(1);
    });
    ok.onclick = async () => {
      const combi = roues.map(r=>r.querySelector('span').textContent).join('');
      ok.disabled=true; msg.textContent='…';
      try{
        const j = await verifierCadenas(n, combi, true);
        if (j.ok){
          const memo=lire(K_CADENAS,{}); memo[n]=combi; ecrire(K_CADENAS,memo);
          msg.textContent=''; zone.querySelector('.cad').classList.add('ouvert');
          setTimeout(()=>{ afficherCase(zone, n, j.case); confettis(); }, 1500);
        } else {
          ok.disabled=false;
          msg.textContent = j.erreur==='essais' ? 'Trop d\'essais… fais une pause et réessaie dans 10 minutes ⏳' : 'Mauvaise combinaison… cherche encore 🔍';
          svg.classList.remove('non'); void svg.getBoundingClientRect(); svg.classList.add('non');
        }
      }catch(e){ ok.disabled=false; msg.textContent='Pas de connexion internet 📶'; }
    };
  }
  function confettis(){
    const c=['#a8192a','#f3c86b','#1f6b45','#ffffff','#7fd1ff'];
    for(let i=0;i<70;i++){ const s=document.createElement('i'); s.className='av-confetti';
      s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%c.length]};animation-duration:${2+Math.random()*1.8}s;animation-delay:${Math.random()*.5}s`;
      document.body.appendChild(s); setTimeout(()=>s.remove(),4500); }
  }

  // ---------- Fenêtre ----------
  let modal;
  function ouvrirModal(n){
    if(!modal){
      modal=document.createElement('div'); modal.className='av-modal';
      modal.innerHTML=`<div class="av-card"><button class="av-fermer" aria-label="Fermer">×</button><div class="av-contenu"></div></div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e=>{ if(e.target===modal||e.target.classList.contains('av-fermer')){
        modal.classList.remove('on');
        setTimeout(()=>{ if(!modal.classList.contains('on')) modal.querySelector('.av-contenu').innerHTML=''; }, 350); // coupe la musique
      } });
    }
    const zone=modal.querySelector('.av-contenu');
    const c = donnees && donnees.cases[n];
    if (c && c.cadenas){
      const deja = lire(K_CADENAS,{})[n];
      if (deja){   // déjà ouvert : on réaffiche directement le contenu
        zone.innerHTML=`<div class="av-tag">🔓 ${n} décembre</div><p class="av-texte"><span class="av-charge">✨</span> Ouverture du coffre…</p>`;
        verifierCadenas(n, deja, false).then(j=>{ if(j.ok) afficherCase(zone, n, j.case); else { zone.innerHTML=cadenasHTML(); brancherCadenas(zone, n); } })
          .catch(()=>{ zone.innerHTML='<p class="av-texte">Pas de connexion internet 📶</p>'; });
      } else { zone.innerHTML=cadenasHTML(); brancherCadenas(zone, n); }
    } else {
      zone.innerHTML=contenuHTML(n); brancherQuiz(zone, c); chargerPhoto(zone, n);
    }
    requestAnimationFrame(()=>modal.classList.add('on'));
  }

  // ---------- Barre de démo (pilotée par « Mode démo » dans le Google Sheet) ----------
  let bar;
  function initDemo(){
    bar=document.createElement('div'); bar.className='av-demo'; bar.hidden=true;
    bar.innerHTML=`<span>Démo · jour simulé</span><button data-d="-1">−</button><b></b><button data-d="1">+</button><button data-r>↺</button>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', e=>{
      const b=e.target.closest('button'); if(!b) return;
      if(b.hasAttribute('data-r')){ ouverts=new Set(); ecrire(K_OUVERT,[]); ecrire('avent_cadenas',{}); toast('Toutes les cases sont refermées'); }
      else { jourDemo=Math.min(25,Math.max(0,jourDemo+ +b.dataset.d)); ecrire(K_DEMO,jourDemo); }
      notifier();
    });
  }
  function majDemo(){ if(!bar) return; bar.hidden=!estDemo(); bar.querySelector('b').textContent=jourDemo+' déc.'; }

  function tenter(n, siOk){
    if (etat==='chargement'){ toast('Un instant, je prépare ta surprise…'); return false; }
    if (!peutOuvrir(n)){ toast(`Patience mon amour… cette case s'ouvre le ${n} décembre 🎄`); return false; }
    const premiere=!estOuvert(n); if(premiere){ marquerOuvert(n); signalerOuverture(n); }
    siOk && siOk(premiere); return true;
  }

  // Prévient le Google Sheet (journal + mail) à la première ouverture d'une case
  function signalerOuverture(n){
    if (!SCRIPT_URL || !code) return;
    try { fetch(`${SCRIPT_URL}?code=${encodeURIComponent(code)}&action=ouvert&n=${n}`).catch(()=>{}); } catch(e){}
  }

  // Toucher une photo l'affiche en plein écran (pratique pour la carte au trésor)
  document.addEventListener('click', e=>{
    const img = e.target.closest && e.target.closest('.av-photo-ok img'); if(!img) return;
    const z=document.createElement('div'); z.className='av-zoom';
    z.innerHTML=`<img src="${img.src}" alt=""><span>Touche pour fermer</span>`;
    z.onclick=()=>z.remove(); document.body.appendChild(z);
  });

  function demarrer(){
    initDemo();
    const appli = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (SCRIPT_URL && !code && appli) demanderCode();   // ouverte depuis l'icône sans code → on le demande
    charger();
    // rafraîchit quand on revient sur l'appli (nouveau jour !)
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && code) charger(); });
  }

  return { jourActuel, peutOuvrir, estOuvert, icone, ouvrirModal, toast, onChange, tenter, demarrer, demanderCode, estDemo };
})();

/* Styles communs */
document.head.insertAdjacentHTML('beforeend', `<style>
.av-modal{position:fixed;inset:0;background:rgba(5,10,20,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .3s;z-index:50}
.av-modal.on{opacity:1;pointer-events:auto}
.av-card{position:relative;width:100%;max-width:380px;max-height:85vh;overflow:auto;background:var(--carte-bg,#fff);color:var(--carte-txt,#222);border-radius:var(--carte-radius,20px);padding:28px 22px 24px;box-shadow:0 20px 60px rgba(0,0,0,.4);transform:translateY(30px) scale(.95);transition:transform .4s cubic-bezier(.2,1.4,.4,1)}
.av-modal.on .av-card{transform:none}
.av-fermer{position:absolute;top:8px;right:12px;border:0;background:none;font-size:28px;color:inherit;opacity:.5;cursor:pointer}
.av-tag{font-size:12px;letter-spacing:.05em;text-transform:uppercase;opacity:.65;margin-bottom:8px}
.av-titre{font-family:var(--font-titre,serif);font-size:26px;margin:0 0 14px;line-height:1.15;color:var(--accent,#b3202a)}
.av-texte{font-size:17px;line-height:1.5;margin:0 0 12px;white-space:pre-line}
.av-photo{aspect-ratio:4/3;border-radius:12px;background:repeating-linear-gradient(45deg,rgba(0,0,0,.04) 0 10px,rgba(0,0,0,.08) 10px 20px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;margin-bottom:14px;border:2px dashed rgba(0,0,0,.15);overflow:hidden}
.av-photo span{font-size:36px}.av-photo small{opacity:.6}
.av-charge{animation:av-tourne 1.2s linear infinite}
@keyframes av-tourne{to{transform:rotate(360deg)}}
.av-photo-ok{aspect-ratio:auto;border:0;background:none;display:block}
.av-photo-ok img{width:100%;border-radius:12px;display:block}
.av-photo-ok small{display:block;text-align:center;margin-top:6px}
.av-bon{border:2px dashed var(--accent,#b3202a);border-radius:14px;padding:18px;text-align:center}
.av-bon-titre{font-weight:800;letter-spacing:.2em;color:var(--accent,#b3202a);margin-bottom:8px}
.av-bon p{font-size:18px;margin:0 0 10px}.av-bon small{opacity:.6}
.av-morceau{font-weight:700;margin:0 0 10px}
.av-deezer{display:block;width:100%;height:170px;border:0;border-radius:12px;margin:0 0 12px;background:#121216}
.av-musique{display:block;text-align:center;background:rgba(0,0,0,.06);border-radius:30px;padding:12px 18px;font-weight:600;color:inherit;text-decoration:none}
.av-quiz{display:grid;gap:8px}
.av-quiz button{padding:13px;border-radius:12px;border:1.5px solid rgba(0,0,0,.15);background:transparent;font:inherit;font-size:16px;color:inherit;cursor:pointer}
.av-quiz button.bon{background:#2e7d4f;color:#fff;border-color:#2e7d4f}
.av-quiz button.faux{background:#b3202a22;border-color:#b3202a;animation:av-shake .4s}
.av-quiz-res{min-height:1.4em;font-weight:600;margin:12px 0 0}
.av-code{text-align:center}
.av-cle{font-size:40px}
.av-code input{width:100%;font:600 22px system-ui,sans-serif;letter-spacing:.15em;text-align:center;padding:12px;border-radius:12px;border:1.5px solid rgba(0,0,0,.2);background:#fff;color:#222;text-transform:uppercase}
.av-erreur{color:var(--accent,#b3202a);min-height:1.2em;font-weight:600}
.av-code button[type=submit]{width:100%;padding:14px;border:0;border-radius:12px;background:var(--accent,#b3202a);color:#fff;font:700 17px system-ui,sans-serif;cursor:pointer}
.av-plus-tard{margin-top:10px;border:0;background:none;color:inherit;opacity:.6;font:15px system-ui,sans-serif;cursor:pointer}
.av-toast{position:fixed;left:50%;bottom:84px;transform:translate(-50%,20px);background:rgba(20,20,30,.92);color:#fff;padding:12px 18px;border-radius:30px;font-size:15px;opacity:0;transition:.3s;z-index:60;white-space:nowrap;max-width:92vw}
.av-toast.on{opacity:1;transform:translate(-50%,0)}
.av-demo{white-space:nowrap;position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.92);color:#222;padding:6px 8px 6px 14px;border-radius:30px;font:13px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:40}
.av-demo[hidden]{display:none}
.av-demo b{min-width:52px;text-align:center}
.av-demo button{width:30px;height:30px;border-radius:50%;border:0;background:#eee;font-size:16px;cursor:pointer}
.cad{text-align:center}
.cad-svg{width:120px;height:150px;display:block;margin:0 auto 6px;animation:cad-tombe .9s cubic-bezier(.3,1.6,.5,1) both;filter:drop-shadow(0 8px 10px rgba(0,0,0,.25))}
@keyframes cad-tombe{0%{transform:translateY(-140px) rotate(-12deg) scale(.6);opacity:0}100%{transform:none;opacity:1}}
.cad-svg.non{animation:av-shake .45s}
.cad-anse{transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
.cad.ouvert .cad-anse{transform:translateY(-16px)}
.cad.ouvert .cad-svg{animation:cad-libere 1.4s .45s forwards}
@keyframes cad-libere{40%{transform:scale(1.15) rotate(8deg)}100%{transform:translateY(60px) scale(.2) rotate(30deg);opacity:0}}
.cad.ouvert .cad-roues,.cad.ouvert .cad-ok,.cad.ouvert .cad-txt{transition:opacity .4s;opacity:0}
.cad-txt{font-size:16px;line-height:1.45;margin:4px 0 14px}
.cad-roues{display:flex;justify-content:center;gap:7px;margin-bottom:16px}
.roue{display:flex;flex-direction:column;align-items:center;background:#2a1d16;border-radius:12px;padding:2px 0;width:50px;box-shadow:inset 0 3px 8px rgba(0,0,0,.5)}
.roue button{border:0;background:none;color:#f3c86b;font-size:16px;padding:6px 0;width:100%;cursor:pointer}
.roue span{font:700 30px system-ui,sans-serif;color:#fff;line-height:1.1;cursor:pointer;user-select:none}
.roue span.tic{animation:cad-tic .18s}
@keyframes cad-tic{0%{transform:translateY(-6px);opacity:.3}100%{transform:none;opacity:1}}
.cad-ok{width:100%;padding:14px;border:0;border-radius:12px;background:var(--accent,#b3202a);color:#fff;font:700 17px system-ui,sans-serif;cursor:pointer}
.cad-ok:disabled{opacity:.6}
.cad-msg{min-height:1.3em;font-weight:600;color:var(--accent,#b3202a);margin:12px 0 0}
.av-confetti{position:fixed;top:-12px;width:8px;height:12px;z-index:70;pointer-events:none;animation:av-tombe linear forwards}
@keyframes av-tombe{to{transform:translateY(105vh) rotate(720deg)}}
.av-photo-ok img{cursor:zoom-in}
.av-zoom{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;animation:av-fondu .25s}
.av-zoom img{max-width:100%;max-height:88vh;object-fit:contain;border-radius:6px}
.av-zoom span{color:#fff;opacity:.6;font:14px system-ui,sans-serif;margin-top:12px}
@keyframes av-fondu{from{opacity:0}}
@keyframes av-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.shake{animation:av-shake .4s}
</style>`);
