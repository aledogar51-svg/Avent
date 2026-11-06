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
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

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
  function contenuHTML(n){
    const c = donnees && donnees.cases[n];
    if(!c) return `<div class="av-tag">🎁 ${n} décembre</div><h2 class="av-titre">Case vide</h2>
      <p class="av-texte">Cette case n'a pas encore de surprise… Reviens plus tard ✨</p>`;
    const t = ICONES[c.type] ? c.type : 'mot';
    let corps = `<p class="av-texte">${esc(c.texte)}</p>`;
    if (t==='souvenir') corps = (c.aPhoto ? `<div class="av-photo" data-photo="${n}"><span class="av-charge">✨</span><small>${esc(c.legende||'')}</small></div>`
                                          : `<div class="av-photo"><span>📷</span><small>${esc(c.legende||'')}</small></div>`) + corps;
    if (t==='bon') corps = `<div class="av-bon"><div class="av-bon-titre">BON CADEAU</div><p>${esc(c.texte)}</p><small>${esc(c.valable||'')}</small></div>`;
    if (t==='musique') corps += c.lien ? `<a class="av-musique" href="${esc(c.lien)}" target="_blank" rel="noopener">▶︎ ${esc(c.morceau||'Écouter')}</a>`
                                       : `<div class="av-musique">▶︎ ${esc(c.morceau||'')}</div>`;
    if (t==='quiz') corps = `<p class="av-texte">${esc(c.question)}</p><div class="av-quiz">` +
      (c.choix||[]).map((x,i)=>`<button data-i="${i}">${esc(x)}</button>`).join('') + `</div><p class="av-quiz-res"></p>`;
    return `<div class="av-tag">${ICONES[t]} ${LIBELLES[t]} · ${n} décembre</div><h2 class="av-titre">${esc(c.titre)}</h2>${corps}`;
  }

  async function chargerPhoto(zone, n){
    const el = zone.querySelector(`[data-photo="${n}"]`); if(!el) return;
    try{
      const r = await fetch(`${SCRIPT_URL}?code=${encodeURIComponent(code)}&action=photo&n=${n}`);
      const j = await r.json();
      if (j.ok){ const leg=el.querySelector('small')?.outerHTML||''; el.classList.add('av-photo-ok'); el.innerHTML=`<img src="${j.photo}" alt="">${leg}`; }
      else el.querySelector('.av-charge').textContent='📷';
    }catch(e){ el.querySelector('.av-charge').textContent='📷'; }
  }

  // ---------- Fenêtre ----------
  let modal;
  function ouvrirModal(n){
    if(!modal){
      modal=document.createElement('div'); modal.className='av-modal';
      modal.innerHTML=`<div class="av-card"><button class="av-fermer" aria-label="Fermer">×</button><div class="av-contenu"></div></div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e=>{ if(e.target===modal||e.target.classList.contains('av-fermer')) modal.classList.remove('on'); });
    }
    const zone=modal.querySelector('.av-contenu'); zone.innerHTML=contenuHTML(n);
    const c = donnees && donnees.cases[n];
    zone.querySelectorAll('.av-quiz button').forEach(b=>b.onclick=()=>{
      const ok = +b.dataset.i===c.bonne; b.classList.add(ok?'bon':'faux');
      zone.querySelector('.av-quiz-res').textContent = ok ? (c.bravo||'Bravo !') : 'Raté… essaie encore 😄';
    });
    chargerPhoto(zone, n);
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
      if(b.hasAttribute('data-r')){ ouverts=new Set(); ecrire(K_OUVERT,[]); toast('Toutes les cases sont refermées'); }
      else { jourDemo=Math.min(25,Math.max(0,jourDemo+ +b.dataset.d)); ecrire(K_DEMO,jourDemo); }
      notifier();
    });
  }
  function majDemo(){ if(!bar) return; bar.hidden=!estDemo(); bar.querySelector('b').textContent=jourDemo+' déc.'; }

  function tenter(n, siOk){
    if (etat==='chargement'){ toast('Un instant, je prépare ta surprise…'); return false; }
    if (!peutOuvrir(n)){ toast(`Patience… cette case s'ouvre le ${n} décembre 🎄`); return false; }
    const premiere=!estOuvert(n); if(premiere) marquerOuvert(n);
    siOk && siOk(premiere); return true;
  }

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
.av-musique{display:block;background:rgba(0,0,0,.06);border-radius:30px;padding:12px 18px;font-weight:600;color:inherit;text-decoration:none}
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
@keyframes av-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.shake{animation:av-shake .4s}
</style>`);
