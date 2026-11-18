/* Moduł: formularze kwalifikacyjne B.162 (Leczenie pacjentów z kardiomiopatią)
 * Wzory: zał. nr 11 do zarządzenia 110/2026/DGL Prezesa NFZ (nowe brzmienie zał. nr 34 do zarz. 75/2026/DGL), pkt 2 i 2.1.
 * Dane przechowywane wyłącznie lokalnie w przeglądarce (localStorage) + eksport/import JSON + generowanie PDF (pdfmake).
 */
(function () {
  'use strict';
  const STORE = 'b162_docs_v1';
  const ZESPOL = 'Zespół Koordynacyjny ds. Leczenia Kardiomiopatii';
  const PROG = 'Leczenie pacjentów z kardiomiopatią';
  const SRC = 'Wzór wg zał. nr 11 do zarządzenia nr 110/2026/DGL Prezesa NFZ z dnia 6 listopada 2026 r.';
  const LEKI = [['akoramidis', 'akoramidisem'], ['tafamidis', 'tafamidisem'], ['wutrisyran', 'wutrisyranem']];
  const lekInstr = v => (LEKI.find(l => l[0] === v) || [, v])[1];

  const TYPES = {
    kwal: { short: 'Wniosek o kwalifikację', title: `Wniosek o kwalifikację do leczenia w programie ${PROG} – leczenie kardiomiopatii w przebiegu amyloidozy transtyretynowej (ICD-10: E85)`, desc: 'Kwalifikacja do leczenia ATTR-CM (E85): kryteria, badania, konsultacje, opcjonalnie zgoda pacjenta (zał. 2.1).' },
    zmiana: { short: 'Wniosek o zmianę leczenia', title: `Wniosek o zmianę leczenia w programie ${PROG} – leczenie kardiomiopatii w przebiegu amyloidozy transtyretynowej`, desc: 'Zmiana leku (akoramidis / tafamidis / wutrisyran) z uzasadnieniem.' },
    decyzja: { short: 'Decyzja zespołu', title: `Decyzja dotycząca kwalifikacji/zmiany leku w programie lekowym ${PROG} – leczenie kardiomiopatii w przebiegu amyloidozy transtyretynowej`, desc: 'Decyzja Przewodniczącego Zespołu Koordynacyjnego – można wypełnić na podstawie zapisanego wniosku.' },
  };

  const CRIT = [
    'Kardiomiopatia w przebiegu amyloidozy transtyretynowej (ATTR) potwierdzona przez badanie scyntygraficzne serca z radioizotopem (99mTc-DPD lub 99mTc-PYP lub 99mTc-HMDP) lub biopsję tkanki i typowanie amyloidu za pomocą immunohistochemii',
    'Genetyczny ATTR lub typu dzikiego określony poprzez sekwencjonowanie genu transtyretyny',
    'Grubość przegrody międzykomorowej przekraczająca 12 mm w badaniu echokardiografii przezklatkowej',
    'Wykluczenie amyloidozy łańcuchów lekkich',
    'Wynik testu 6-minutowego chodu u pacjentów bez ograniczeń ruchowych powyżej 150 m',
    'Adekwatna wydolność narządowa',
    'Brak przeciwskazań do stosowania leku zgodnie z aktualną Charakterystyką Produktu Leczniczego (ChPL)',
    'Brak zaawansowanej polineuropatii (poziom IIIa-IV w skali PND wyklucza kwalifikację)',
    'Wykonano wszystkie wymagane badania diagnostyczne przed kwalifikacją',
  ];
  const EXAMS = [
    { k: 'scynt', label: 'Scyntygrafia serca', scan: true },
    { k: 'ttr', label: 'Sekwencjonowanie genu transtyretyny (TTR)' },
    { k: 'echo', label: 'Echokardiografia przezklatkowa', scan: true },
    { k: 'ekg', label: 'EKG' },
    { k: 'holter', label: 'Holter 24-godzinne monitorowanie EKG' },
    { k: 'mwt', label: 'Test 6-minutowego chodu u pacjentów bez ograniczeń ruchowych (6MWT)' },
    { k: 'lab', label: 'Badania laboratoryjne', long: true },
  ];
  const KONS = { hemat: 'Konsultacja hematologiczna', neuro: 'Konsultacja neurologiczna' };
  const RODO_DEC = [
    'W związku z realizacją programu lekowego w zakresie danych osobowych, dla których Narodowy Fundusz Zdrowia jest administratorem danych osobowych, przedstawiamy informację dotyczącą przetwarzania danych osobowych:',
    '• Administratorem Pani/Pana danych osobowych jest Narodowy Fundusz Zdrowia z siedzibą w Warszawie, ul. Rakowiecka 26/30, 02-528 Warszawa.',
    '• Pani/Pana dane osobowe będą przetwarzane w celu realizacji zadań statutowych i obowiązków ustawowych Narodowego Funduszu Zdrowia w szczególności wskazanych w ustawie z dnia 27 sierpnia 2004 r. o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych.',
    '• W odniesieniu do danych przetwarzanych przez NFZ, Pani/Panu przysługuje prawo do: dostępu do treści swoich danych osobowych; sprostowania danych osobowych; usunięcia danych osobowych (o ile w danym przypadku przysługuje); ograniczenia przetwarzania danych osobowych; wniesienia sprzeciwu wobec przetwarzania danych osobowych (o ile w danym przypadku przysługuje); cofnięcia zgody w dowolnym momencie bez wpływu na zgodność z prawem przetwarzania (jeżeli przetwarzanie odbywa się na podstawie zgody), którego dokonano na podstawie zgody przed jej cofnięciem; wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.',
    'Każdy wniosek dotyczący realizacji z w/w praw zostanie rozpatrzony zgodnie z RODO.',
    'Informacje dotyczące przetwarzania danych osobowych przez NFZ z związku z realizacją programów lekowych zostały wskazane m. in. w dziale VIII, w tym art. 188c ustawy z dnia 27 sierpnia 2004 r. o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych.',
    'Pozostałe informacje dotyczące przetwarzania danych osobowych przez NFZ, dostępne są na stronie internetowej: www.nfz.gov.pl/bip/informacja-ado-nfz/',
  ];
  const ZGODA = [
    'Oświadczam, że zapoznałem się/zapoznałam się z:',
    '1) informacją dotyczącą zasad przetwarzania danych osobowych przez Narodowy Fundusz Zdrowia (zwany NFZ) w zakresie systemu monitorowania programów lekowych, o którym mowa w art. 188c oraz przetwarzania i ochrony danych, o której mowa w dziale VIII ustawy z dnia 27 sierpnia 2004 r. o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych,',
    '2) poniższą informacją dotyczącą przetwarzania danych osobowych przez NFZ w zakresie realizacji zadań statutowych i obowiązków ustawowych:',
    '• administratorem Pani/Pana danych osobowych jest Narodowy Fundusz Zdrowia z siedzibą w Warszawie, ul. Rakowiecka 26/30, 02-528 Warszawa,',
    '• Pani/Pana dane osobowe będą przetwarzane w celu realizacji zadań statutowych i obowiązków ustawowych Narodowego Funduszu Zdrowia w szczególności wskazanych w ustawie z dnia 27 sierpnia 2004 r. o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych,',
    '• w odniesieniu do danych przetwarzanych przez NFZ, Pani/Panu przysługuje prawo do: dostępu do treści swoich danych osobowych; sprostowania danych osobowych; usunięcia danych osobowych (o ile w danym przypadku przysługuje); ograniczenia przetwarzania danych osobowych; wniesienia sprzeciwu wobec przetwarzania danych osobowych (o ile w danym przypadku przysługuje); cofnięcia zgody w dowolnym momencie bez wpływu na zgodność z prawem przetwarzania (jeżeli przetwarzanie odbywa się na podstawie zgody), którego dokonano na podstawie zgody przed jej cofnięciem; wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.',
    'Każdy wniosek dotyczący realizacji z w/w praw zostanie rozpatrzony zgodnie z RODO.',
    'Pozostałe informacje dotyczące przetwarzania danych osobowych przez NFZ, dostępne są na stronie internetowej: www.nfz.gov.pl/bip/informacja-ado-nfz/',
    'Zostałam(em) poinformowana(y) o istocie choroby, możliwości wystąpienia objawów niepożądanych i powikłań zastosowanej terapii oraz o możliwości zaprzestania terapii.',
  ];
  const ADO_SWD = 'Administrator danych osobowych – Świadczeniodawca, zobowiązuje się do przestrzegania przepisów prawa powszechnie obowiązującego dotyczących zapewnienia zgodnego z prawem przetwarzania i ochrony danych osobowych, w szczególności Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych - RODO), w tym realizacji obowiązku informacyjnego, o którym mowa w art. 13 i 14 (jeśli dotyczy) RODO.';

  // ---------- utils
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fmtDate = s => s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split('-').reverse().join('.') : (s || '');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const set = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k, i) => { if (a[k] == null || typeof a[k] !== 'object') a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; }); a[ks[ks.length - 1]] = v; };

  function peselInfo(p) {
    if (!/^\d{11}$/.test(p || '')) return null;
    const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    const sum = w.reduce((s, x, i) => s + x * +p[i], 0);
    if ((10 - (sum % 10)) % 10 !== +p[10]) return null;
    let y = +p.slice(0, 2), m = +p.slice(2, 4), d = +p.slice(4, 6), c = 1900;
    if (m > 80) { c = 1800; m -= 80; } else if (m > 60) { c = 2200; m -= 60; } else if (m > 40) { c = 2100; m -= 40; } else if (m > 20) { c = 2000; m -= 20; }
    const bd = new Date(c + y, m - 1, d);
    if (bd.getMonth() !== m - 1) return null;
    const n = new Date(); let age = n.getFullYear() - bd.getFullYear();
    if (n.getMonth() < bd.getMonth() || (n.getMonth() === bd.getMonth() && n.getDate() < bd.getDate())) age--;
    return { birth: bd, age, sex: +p[9] % 2 ? 'M' : 'K' };
  }
  function npwzOk(n) {
    if (!/^[1-9]\d{6}$/.test(n || '')) return false;
    const s = [1, 2, 3, 4, 5, 6].reduce((a, w, i) => a + w * +n[i + 1], 0);
    return s % 11 === +n[0];
  }
  const emailOk = e => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // ---------- storage (lokalnie)
  function loadAll() { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { return []; } }
  function saveAll(a) { try { localStorage.setItem(STORE, JSON.stringify(a)); return true; } catch (e) { return false; } }

  function blank(type) {
    const base = { pacjent: '', pesel: '', data_wniosku: today(), swiadczeniodawca: '', kontakty: [{ nazwisko_imie: '', adres: '', email: '', telefon: '' }], lekarz: '', npwz: '', data_podpisu: today() };
    if (type === 'kwal') return { ...base, lek: '', wiek: '', antykoncepcja: '', nyha: '', nac: '', kryteria: CRIT.map(() => ({ v: '', uwagi: '' })), uwagi: '', kontynuacja: '', kontynuacja_opis: '', badania: Object.fromEntries(EXAMS.map(e => [e.k, { data: '', opis: '' }])), flc: false, konsultacje: { hemat: { data: '', opis: '' }, neuro: { data: '', opis: '' } }, zal21: true };
    if (type === 'zmiana') return { ...base, lek_z: '', lek_na: '', uzasadnienie: '', badania_txt: '', konsultacje: { hemat: { data: '', opis: '' } } };
    return { przewodniczacy: '', pacjent: '', pesel: '', swiadczeniodawca: '', rodzaj: 'kwalifikacja', lek: '', decyzja: '', data_decyzji: today(), zrodlo: '' };
  }

  // ---------- validation
  function validate(doc) {
    const d = doc.data, E = [];
    const req = (p, label) => { const v = get(d, p); if (v == null || String(v).trim() === '') E.push({ p, m: `Uzupełnij: ${label}` }); };
    req('pacjent', 'imię i nazwisko pacjenta');
    if (!peselInfo(d.pesel)) E.push({ p: 'pesel', m: d.pesel ? 'PESEL jest nieprawidłowy (suma kontrolna lub data urodzenia)' : 'Uzupełnij: PESEL' });
    req('swiadczeniodawca', doc.type === 'decyzja' ? 'świadczeniodawca wnioskujący' : 'świadczeniodawca wystawiający wniosek');
    if (doc.type !== 'decyzja') {
      req('data_wniosku', 'data wystawienia wniosku');
      if (!d.kontakty.some(k => k.nazwisko_imie.trim())) E.push({ p: 'kontakty.0.nazwisko_imie', m: 'Podaj co najmniej jedną osobę w adresie do korespondencji' });
      d.kontakty.forEach((k, i) => { if (!emailOk(k.email)) E.push({ p: `kontakty.${i}.email`, m: `Nieprawidłowy adres e-mail (wiersz ${i + 1})` }); });
      req('lekarz', 'imię i nazwisko lekarza');
      if (!npwzOk(d.npwz)) E.push({ p: 'npwz', m: d.npwz ? 'Numer prawa wykonywania zawodu jest nieprawidłowy (7 cyfr, suma kontrolna)' : 'Uzupełnij: numer prawa wykonywania zawodu' });
      req('data_podpisu', 'data podpisu');
    }
    if (doc.type === 'kwal') {
      req('lek', 'wnioskowany lek');
      req('wiek', 'wiek pacjenta'); req('antykoncepcja', 'zgoda na prowadzenie antykoncepcji'); req('nyha', 'klasa NYHA'); req('nac', 'stadium NAC');
      d.kryteria.forEach((k, i) => {
        if (!k.v) E.push({ p: `kryteria.${i}.v`, m: `Kryterium ${i + 1}: zaznacz TAK lub NIE` });
        else if (k.v === 'nie' && !k.uwagi.trim()) E.push({ p: `kryteria.${i}.uwagi`, m: `Kryterium ${i + 1}: przy odpowiedzi NIE wymagany jest opis niespełnienia (Uwagi)` });
      });
      req('kontynuacja', 'czy pacjent kontynuuje leczenie z innych źródeł finansowania');
      if (d.kontynuacja === 'tak') req('kontynuacja_opis', 'opis wcześniejszego leczenia');
      EXAMS.forEach(e => { req(`badania.${e.k}.data`, `${e.label} – data badania`); req(`badania.${e.k}.opis`, `${e.label} – opis badania`); });
    }
    if (doc.type === 'zmiana') {
      req('lek_z', 'lek dotychczasowy'); req('lek_na', 'lek docelowy');
      if (d.lek_z && d.lek_z === d.lek_na) E.push({ p: 'lek_na', m: 'Lek docelowy musi być inny niż dotychczasowy' });
      req('uzasadnienie', 'uzasadnienie zmiany leku'); req('badania_txt', 'badania wykonane u pacjenta');
    }
    if (doc.type === 'decyzja') {
      req('przewodniczacy', 'Przewodniczący Zespołu (Pan/Pani)'); req('lek', 'lek'); req('decyzja', 'decyzja (pozytywna/negatywna)'); req('data_decyzji', 'data decyzji');
    }
    return E;
  }

  // ---------- UI
  let root, state = { docs: [], cur: null, errs: [], showErr: false, confirmDel: null, msg: '' }, saveTimer, dl = null, dlChecked = false;

  const CSS = `
  .bf{--bf-acc:var(--acc,#0f5c55);font-family:var(--sans,system-ui)}
  .bf .bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
  .bf .types{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px}
  .bf .type{border:1px solid var(--line,#ddd);border-radius:12px;padding:12px 14px;background:#fff;cursor:pointer;text-align:left}
  .bf .type:hover{border-color:var(--bf-acc)}
  .bf .type.on{border-color:var(--bf-acc);box-shadow:inset 0 0 0 1px var(--bf-acc);background:var(--acc2,#e7f1ef)}
  .bf .type b{display:block;font-size:14.5px;margin-bottom:3px}
  .bf .type span{font-size:12.5px;color:var(--muted,#666)}
  .bf .layout{display:grid;grid-template-columns:260px 1fr;gap:14px;align-items:start}
  .bf .saved{background:#fff;border:1px solid var(--line,#ddd);border-radius:12px;padding:12px;position:sticky;top:56px;max-height:75vh;overflow:auto}
  .bf .saved h4{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#666)}
  .bf .sv{padding:8px 9px;border-radius:8px;cursor:pointer;border:1px solid transparent;margin-bottom:4px}
  .bf .sv:hover{background:#f6f8f6}
  .bf .sv.on{border-color:var(--bf-acc);background:var(--acc2,#e7f1ef)}
  .bf .sv .a{font-size:13px;font-weight:600}
  .bf .sv .b{font-size:11.5px;color:var(--muted,#666)}
  .bf .sv .x{float:right;border:0;background:none;color:#a33;cursor:pointer;font-size:12px;padding:0 2px}
  .bf fieldset{border:1px solid var(--line,#ddd);border-radius:12px;background:#fff;padding:14px 16px 16px;margin:0 0 12px}
  .bf legend{font-weight:600;font-size:14px;padding:0 6px}
  .bf .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px 14px;margin-bottom:10px}
  .bf label.f{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--muted,#555)}
  .bf input[type=text],.bf input[type=date],.bf input[type=email],.bf input[type=tel],.bf select,.bf textarea{font:inherit;font-size:14px;color:var(--ink,#111);padding:7px 9px;border:1px solid #cfd6d2;border-radius:7px;background:#fcfdfc;width:100%}
  .bf textarea{min-height:64px;resize:vertical}
  .bf input:focus,.bf select:focus,.bf textarea:focus{outline:2px solid var(--bf-acc);outline-offset:-1px}
  .bf .err input,.bf .err select,.bf .err textarea,.bf .err.seg{border-color:#c0392b!important;background:#fdf3f2}
  .bf .hint{font-size:11.5px;color:var(--muted,#777)}
  .bf .ok{color:var(--bf-acc)} .bf .bad{color:#c0392b}
  .bf .seg{display:inline-flex;border:1px solid #cfd6d2;border-radius:8px;overflow:hidden}
  .bf .seg label{padding:5px 11px;font-size:13px;cursor:pointer;border-right:1px solid #cfd6d2;color:var(--ink,#111);display:flex;align-items:center;gap:5px}
  .bf .seg label:last-child{border-right:0}
  .bf .seg input{margin:0}
  .bf .seg label.on{background:var(--acc2,#e7f1ef);color:var(--bf-acc);font-weight:600}
  .bf table.kr{width:100%;border-collapse:collapse;font-size:13.5px}
  .bf table.kr td,.bf table.kr th{border-bottom:1px solid var(--line,#e3e3e3);padding:8px 6px;vertical-align:top;text-align:left}
  .bf table.kr th{font-size:11.5px;text-transform:uppercase;color:var(--muted,#666);letter-spacing:.04em}
  .bf table.kr td.n{width:24px;color:var(--bf-acc);font-weight:600}
  .bf table.kr td.v{width:150px}
  .bf .exam{border-top:1px dashed var(--line,#ddd);padding-top:10px;margin-top:10px}
  .bf .exam:first-of-type{border-top:0;margin-top:0;padding-top:0}
  .bf .exam .t{font-weight:600;font-size:13.5px;margin-bottom:6px}
  .bf .tag{font-size:11px;background:var(--warnbg,#fbf1e3);color:var(--warn,#8a4b08);border-radius:999px;padding:1px 7px;margin-left:6px;font-weight:500}
  .bf .contacts .c{display:grid;grid-template-columns:1.2fr 1.5fr 1.2fr .9fr auto;gap:8px;margin-bottom:6px;align-items:end}
  .bf .btn{border:1px solid var(--line,#ccc);background:#fff;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--ink,#111)}
  .bf .btn:hover{border-color:var(--bf-acc)}
  .bf .btn.p{background:var(--bf-acc);border-color:var(--bf-acc);color:#fff;font-weight:600}
  .bf .btn.s{padding:4px 9px;font-size:12px}
  .bf .errs{background:#fdf3f2;border:1px solid #f0c9c4;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px}
  .bf .errs ul{margin:6px 0 0;padding-left:18px;max-height:160px;overflow:auto}
  .bf .errs a{color:#a33;cursor:pointer;text-decoration:underline}
  .bf .info{background:var(--acc2,#e7f1ef);border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:12px;color:#22413d}
  .bf .warnbox{background:var(--warnbg,#fbf1e3);border-radius:10px;padding:10px 14px;font-size:13px;margin:8px 0;color:#6b3a06}
  .bf .status{font-size:12px;color:var(--muted,#666);margin-left:auto}
  .bf .actions{position:sticky;bottom:0;background:var(--bg,#f4f5f2);padding:10px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--line,#ddd);z-index:4}
  .bf .preview{margin-top:12px;border:1px solid var(--line,#ddd);border-radius:10px;overflow:hidden;background:#fff}
  .bf .preview iframe{width:100%;height:80vh;border:0;display:block}
  .bf .toast{font-size:13px;padding:8px 12px;border-radius:8px;background:#22413d;color:#fff}
  @media(max-width:880px){.bf .layout{grid-template-columns:1fr}.bf .saved{position:static;max-height:none}.bf .contacts .c{grid-template-columns:1fr 1fr}}
  `;

  function mount(el) {
    root = el;
    if (!document.getElementById('bf-css')) { const s = document.createElement('style'); s.id = 'bf-css'; s.textContent = CSS; document.head.appendChild(s); }
    state.docs = loadAll();
    if (!state.cur) {
      const last = state.docs.slice().sort((a, b) => b.updated.localeCompare(a.updated))[0];
      state.cur = last ? JSON.parse(JSON.stringify(last)) : null;
    }
    render();
    loadOsr().then(() => { if (root && root.isConnected) render(); });
    if (!dlChecked && window.claude && typeof window.claude.use === 'function') {
      dlChecked = true;
      window.claude.use('downloads').then(x => { dl = x; render(); }).catch(() => { dl = null; });
    }
  }

  function newDoc(type) {
    state.cur = { id: uid(), type, created: new Date().toISOString(), updated: new Date().toISOString(), data: blank(type) };
    state.showErr = false; state.msg = ''; state.osrOther = false; render();
  }

  function persist(silent) {
    const c = state.cur; if (!c) return;
    c.updated = new Date().toISOString();
    const i = state.docs.findIndex(x => x.id === c.id);
    const copy = JSON.parse(JSON.stringify(c));
    if (i >= 0) state.docs[i] = copy; else state.docs.push(copy);
    const ok = saveAll(state.docs);
    state.msg = ok ? 'Zapisano lokalnie ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : 'Nie można zapisać w tej przeglądarce (pamięć lokalna niedostępna) – użyj „Eksport JSON”.';
    if (!silent) render(); else { const s = root.querySelector('.status'); if (s) s.textContent = state.msg; renderSavedList(); }
  }

  function docLabel(x) {
    const p = x.data.pacjent || '(bez nazwiska)';
    return { a: p, b: TYPES[x.type].short + ' · ' + new Date(x.updated).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
  }

  // field helpers
  function errFor(p) { return state.showErr && state.errs.some(e => e.p === p); }
  function inp(p, label, o = {}) {
    const v = get(state.cur.data, p) ?? '';
    const t = o.type || 'text';
    const field = o.area ? `<textarea data-k="${p}" rows="${o.rows || 3}" placeholder="${esc(o.ph || '')}">${esc(v)}</textarea>` : `<input type="${t}" data-k="${p}" value="${esc(v)}" ${o.max ? `maxlength="${o.max}"` : ''} ${o.mode ? `inputmode="${o.mode}"` : ''} placeholder="${esc(o.ph || '')}">`;
    return `<label class="f ${errFor(p) ? 'err' : ''}" ${o.span ? `style="grid-column:span ${o.span}"` : ''} data-wrap="${p}">${esc(label)}${o.req ? ' *' : ''}${field}${o.hint ? `<span class="hint" data-hint="${p}">${o.hint}</span>` : ''}</label>`;
  }
  function seg(p, opts, label) {
    const v = get(state.cur.data, p);
    return `<div class="f" data-wrap="${p}">${label ? `<div class="hint" style="margin-bottom:4px">${esc(label)} *</div>` : ''}<div class="seg ${errFor(p) ? 'err' : ''}">${opts.map(([val, lab]) => `<label class="${v === val ? 'on' : ''}"><input type="radio" name="${p}" data-k="${p}" data-s="1" value="${esc(val)}" ${v === val ? 'checked' : ''}>${esc(lab)}</label>`).join('')}</div></div>`;
  }
  function sel(p, label, opts, o = {}) {
    const v = get(state.cur.data, p) ?? '';
    return `<label class="f ${errFor(p) ? 'err' : ''}" data-wrap="${p}">${esc(label)}${o.req ? ' *' : ''}<select data-k="${p}" data-s="1"><option value="">— wybierz —</option>${opts.map(([val, lab]) => `<option value="${esc(val)}" ${v === val ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select></label>`;
  }

  // lista ośrodków realizujących B.162 (umowy NFZ na produkt 03.0000.462.02)
  let OSR = null, osrSrc = '';
  function loadOsr() {
    if (OSR) return Promise.resolve();
    return fetch('data/osrodki_b162.json').then(r => r.json()).then(j => { OSR = j.osrodki || []; osrSrc = j.zrodlo || ''; }).catch(() => { OSR = []; });
  }
  function osrField(label) {
    const v = state.cur.data.swiadczeniodawca || '';
    const list = OSR || [];
    const known = list.some(o => o.etykieta === v);
    const other = !!v && !known || state.osrOther;
    const groups = {};
    list.forEach(o => (groups[o.woj] = groups[o.woj] || []).push(o));
    const opts = Object.entries(groups).map(([w, os]) => `<optgroup label="${esc(w)}">${os.map(o => `<option value="${esc(o.etykieta)}" ${o.etykieta === v ? 'selected' : ''}>${esc(o.etykieta)}</option>`).join('')}</optgroup>`).join('');
    return `<label class="f ${errFor('swiadczeniodawca') ? 'err' : ''}" style="grid-column:span 2" data-wrap="swiadczeniodawca">${esc(label)} *
      <select data-osr="1"><option value="">— wybierz ośrodek realizujący B.162 —</option>${opts}<option value="__inny" ${other ? 'selected' : ''}>Inny – wpisz ręcznie…</option></select>
      ${other ? `<input type="text" data-k="swiadczeniodawca" value="${esc(v)}" placeholder="Nazwa świadczeniodawcy" style="margin-top:6px">` : ''}
      <span class="hint">${list.length ? `${list.length} ośrodków z umową NFZ na program B.162 (kod 03.0000.462.02) w 2026 r.` : 'Lista ośrodków niedostępna – wpisz nazwę ręcznie.'}</span></label>`;
  }
  function secA(isDec) {
    const d = state.cur.data, pi = peselInfo(d.pesel);
    const peselHint = d.pesel ? (pi ? `<span class="ok">✓ ur. ${pi.birth.toLocaleDateString('pl-PL')}, wiek ${pi.age} l.</span>` : '<span class="bad">nieprawidłowy numer</span>') : '11 cyfr – weryfikowana suma kontrolna';
    if (isDec) return '';
    return `<fieldset><legend>A. Dane personalne pacjenta i nazwa jednostki kierującej</legend>
      <div class="row">${inp('pacjent', 'Imię i nazwisko', { req: 1 })}${inp('pesel', 'PESEL', { req: 1, max: 11, mode: 'numeric', hint: peselHint })}</div>
      <div class="row">${inp('data_wniosku', 'Data wystawienia wniosku', { type: 'date', req: 1 })}${osrField('Świadczeniodawca wystawiający wniosek')}</div>
      <div class="contacts"><div class="hint" style="margin:4px 0 6px">Adres do korespondencji (nazwisko, imię, adres, e-mail, telefon) *</div>
      ${d.kontakty.map((k, i) => `<div class="c">${inp(`kontakty.${i}.nazwisko_imie`, 'Nazwisko i imię')}${inp(`kontakty.${i}.adres`, 'Adres')}${inp(`kontakty.${i}.email`, 'E-mail', { type: 'email' })}${inp(`kontakty.${i}.telefon`, 'Telefon', { type: 'tel' })}
        <button class="btn s" data-act="delc" data-i="${i}" ${d.kontakty.length < 2 ? 'disabled' : ''} title="Usuń wiersz">✕</button></div>`).join('')}
      ${d.kontakty.length < 3 ? '<button class="btn s" data-act="addc">+ Dodaj osobę</button>' : ''}</div>
    </fieldset>`;
  }
  function secLekarz() {
    const d = state.cur.data;
    const h = d.npwz ? (npwzOk(d.npwz) ? '<span class="ok">✓ poprawny</span>' : '<span class="bad">nieprawidłowy numer</span>') : '7 cyfr – weryfikowana suma kontrolna';
    return `<fieldset><legend>Lekarz wystawiający wniosek</legend><div class="row">${inp('lekarz', 'Imię i nazwisko lekarza', { req: 1 })}${inp('npwz', 'Numer prawa wykonywania zawodu', { req: 1, max: 7, mode: 'numeric', hint: h })}${inp('data_podpisu', 'Data', { type: 'date', req: 1 })}</div>
    <div class="hint">W PDF pozostawiane jest miejsce na pieczątkę i podpis lekarza.</div></fieldset>`;
  }
  function examBlock(base, label, o = {}) {
    return `<div class="exam"><div class="t">${esc(label)}${o.scan ? '<span class="tag">dołącz skan wyniku</span>' : ''}</div>
      <div class="row" style="grid-template-columns:180px 1fr">${inp(base + '.data', o.kons ? 'Data konsultacji' : 'Data badania', { type: 'date', req: o.req })}${inp(base + '.opis', o.kons ? 'Opis konsultacji' : 'Opis badania', { area: 1, rows: o.long ? 6 : 2, req: o.req })}</div></div>`;
  }

  function formKwal() {
    const d = state.cur.data;
    return secA() + `
    <fieldset><legend>Wnioskowany lek</legend><div class="row">${sel('lek', 'Lek', LEKI.map(l => [l[0], l[0]]), { req: 1 })}</div></fieldset>
    <fieldset><legend>B.1 Dane do kwalifikacji (kardiomiopatia w przebiegu amyloidozy transtyretynowej, ICD-10: E85)</legend>
      <div class="row">${inp('wiek', 'Wiek pacjenta', { req: 1, mode: 'numeric', hint: 'uzupełniany z numeru PESEL' })}
      ${sel('antykoncepcja', 'Zgoda na prowadzenie antykoncepcji zgodnie z ChPL', [['tak', 'TAK'], ['nie', 'NIE'], ['nd', 'nie dotyczy']], { req: 1 })}
      ${sel('nyha', 'Klasa NYHA', [['I', 'I'], ['II', 'II'], ['III', 'III'], ['IV', 'IV']], { req: 1 })}
      ${sel('nac', 'Stadium zaawansowania wg klasyfikacji NAC', [['1', 'NAC 1'], ['2', 'NAC 2'], ['3', 'NAC 3']], { req: 1 })}</div>
      <table class="kr"><tr><th></th><th>Kryteria kwalifikacji do leczenia</th><th>TAK / NIE*</th></tr>
      ${CRIT.map((c, i) => `<tr><td class="n">${i + 1}.</td><td>${esc(c)}${d.kryteria[i].v === 'nie' ? `<div style="margin-top:6px">${inp(`kryteria.${i}.uwagi`, 'Uwagi – opis niespełnienia kryterium', { area: 1, rows: 2, req: 1 })}</div>` : ''}</td><td class="v">${seg(`kryteria.${i}.v`, [['tak', 'TAK'], ['nie', 'NIE']])}</td></tr>`).join('')}
      </table><div class="hint" style="margin:6px 0 10px">* W przypadku zaznaczenia odpowiedzi NIE należy przedstawić szczegółowy opis niespełnienia danego kryterium w polu Uwagi.</div>
      <div class="row">${inp('uwagi', 'Uwagi (ogólne)', { area: 1, rows: 2, span: 2 })}</div>
      <div style="margin-top:6px">${seg('kontynuacja', [['tak', 'TAK'], ['nie', 'NIE']], 'Czy pacjent kontynuuje leczenie rozpoczęte w ramach innych źródeł finansowania?')}</div>
      ${d.kontynuacja === 'tak' ? `<div class="warnbox">Ważne! Należy opisać i załączyć zaświadczenie od lekarza prowadzącego o wcześniejszym leczeniu pacjenta.</div><div class="row">${inp('kontynuacja_opis', 'Opis wcześniejszego leczenia', { area: 1, rows: 5, req: 1, span: 2 })}</div>` : ''}
    </fieldset>
    <fieldset><legend>C. Badania przy kwalifikacji (ICD-10: E85)</legend>
      ${EXAMS.map(e => examBlock('badania.' + e.k, e.label, { scan: e.scan, long: e.long, req: 1 })).join('')}
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:13px"><input type="checkbox" data-k="flc" data-s="1" ${d.flc ? 'checked' : ''}> Dołączono skan wyników badania: diagnostyka białka monoklonalnego (metodą immunofiksacji) w surowicy i w moczu oraz wolne łańcuchy lekkie Kappa i Lambda w surowicy krwi (FLC)</label>
    </fieldset>
    <fieldset><legend>D. Inne badania i konsultacje</legend>
      ${Object.entries(KONS).map(([k, l]) => examBlock('konsultacje.' + k, l, { scan: 1, kons: 1 })).join('')}
    </fieldset>` + secLekarz() + `
    <fieldset><legend>2.1 Załącznik do wniosku – zgoda pacjenta</legend>
      <label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" data-k="zal21" data-s="1" ${d.zal21 ? 'checked' : ''}> Dołącz do PDF stronę z oświadczeniem i zgodą pacjenta na leczenie (z zaznaczonym wnioskowanym lekiem)</label>
    </fieldset>`;
  }
  function formZmiana() {
    return secA() + `
    <fieldset><legend>B. Zmiana terapii (kardiomiopatia w przebiegu amyloidozy transtyretynowej, ICD-10: E85)</legend>
      <div class="row">${sel('lek_z', 'Wniosek o zmianę terapii z (lek)', LEKI.map(l => [l[0], l[0]]), { req: 1 })}${sel('lek_na', 'na (lek)', LEKI.map(l => [l[0], l[0]]), { req: 1 })}</div>
      <div class="row">${inp('uzasadnienie', 'Uzasadnienie do zmiany leku', { area: 1, rows: 6, req: 1, span: 2 })}</div>
    </fieldset>
    <fieldset><legend>C. Badania wykonane u pacjenta – zmiana terapii (ICD-10: E85)</legend>
      <div class="row">${inp('badania_txt', 'Badania (rodzaj, data, wynik)', { area: 1, rows: 7, req: 1, span: 2 })}</div>
    </fieldset>
    <fieldset><legend>D. Inne badania i konsultacje</legend>${examBlock('konsultacje.hemat', KONS.hemat, { scan: 1, kons: 1 })}</fieldset>` + secLekarz();
  }
  function formDec() {
    const d = state.cur.data, pi = peselInfo(d.pesel);
    const src = state.docs.filter(x => x.type !== 'decyzja');
    return `<div class="info">Możesz wypełnić decyzję na podstawie zapisanego wniosku: <select data-act="prefill" style="max-width:420px;margin-left:6px"><option value="">— wybierz wniosek —</option>${src.map(x => { const l = docLabel(x); return `<option value="${x.id}">${esc(l.a)} – ${esc(l.b)}</option>`; }).join('')}</select></div>
    <fieldset><legend>Przewodniczący ${ZESPOL}</legend><div class="row">${inp('przewodniczacy', 'Pan/Pani', { req: 1 })}</div></fieldset>
    <fieldset><legend>Dotyczy pacjenta</legend><div class="row">${inp('pacjent', 'Imię i nazwisko', { req: 1 })}${inp('pesel', 'PESEL', { req: 1, max: 11, mode: 'numeric', hint: d.pesel ? (pi ? '<span class="ok">✓ poprawny</span>' : '<span class="bad">nieprawidłowy numer</span>') : '' })}</div>
      <div class="row">${osrField('Świadczeniodawca wnioskujący')}</div></fieldset>
    <fieldset><legend>Decyzja</legend>
      <div class="row">${seg('rodzaj', [['kwalifikacja', 'Kwalifikacja'], ['zmiana', 'Zmiana leku']], 'Rodzaj decyzji')}${sel('lek', 'Lek', LEKI.map(l => [l[0], l[0]]), { req: 1 })}</div>
      <div class="row">${seg('decyzja', [['pozytywna', 'Pozytywna'], ['negatywna', 'Negatywna']], 'Decyzja')}${inp('data_decyzji', 'Data decyzji', { type: 'date', req: 1 })}</div>
      <div class="hint">W PDF pozostawiane jest miejsce na podpis Przewodniczącego. Do decyzji dołączana jest informacja NFZ o przetwarzaniu danych osobowych.</div>
    </fieldset>`;
  }

  function renderSavedList() {
    const box = root.querySelector('.saved .lst'); if (!box) return;
    const arr = state.docs.slice().sort((a, b) => b.updated.localeCompare(a.updated));
    box.innerHTML = arr.length ? arr.map(x => { const l = docLabel(x); const on = state.cur && state.cur.id === x.id; const cd = state.confirmDel === x.id;
      return `<div class="sv ${on ? 'on' : ''}" data-open="${x.id}"><button class="x" data-del="${x.id}" title="Usuń">${cd ? 'Usunąć? ✓' : '✕'}</button><div class="a">${esc(l.a)}</div><div class="b">${esc(l.b)}</div></div>`; }).join('')
      : '<div class="hint">Brak zapisanych dokumentów.</div>';
  }

  function render() {
    const c = state.cur;
    if (c) state.errs = validate(c);
    const dlNote = '';
    root.innerHTML = `<div class="bf">
      <div class="info"><b>Dane zostają w Twojej przeglądarce.</b> Formularze zapisują się automatycznie w pamięci lokalnej tego urządzenia – nie są wysyłane na serwer ani widoczne dla innych użytkowników. Aby przenieść dane na inne urządzenie, użyj „Eksport JSON” / „Import JSON”. Źródło wzorów: zał. nr 11 do zarządzenia nr 110/2026/DGL Prezesa NFZ.</div>
      <div class="types">${Object.entries(TYPES).map(([k, t]) => `<button class="type ${c && c.type === k ? 'on' : ''}" data-new="${k}"><b>${esc(t.short)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div>
      <div class="layout">
        <aside class="saved"><h4>Zapisane dokumenty</h4><div class="lst"></div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn s" data-act="export">Eksport JSON</button><label class="btn s" style="cursor:pointer">Import JSON<input type="file" accept=".json,application/json" data-act="import" hidden></label></div>
        </aside>
        <section>${c ? `
          <h3 style="margin:0 0 4px;font-size:16px">${esc(TYPES[c.type].title)}</h3>
          <div class="hint" style="margin-bottom:12px">Pola oznaczone * są wymagane we wzorze. Program B.162: ${esc(PROG)}.</div>
          ${state.showErr && state.errs.length ? `<div class="errs"><b>Do uzupełnienia przed wygenerowaniem PDF (${state.errs.length}):</b><ul>${state.errs.map(e => `<li><a data-goto="${e.p}">${esc(e.m)}</a></li>`).join('')}</ul><div style="margin-top:8px"><button class="btn s" data-act="pdfdraft">Generuj mimo braków (wersja robocza)</button></div></div>` : ''}
          <form onsubmit="return false" autocomplete="off">${c.type === 'kwal' ? formKwal() : c.type === 'zmiana' ? formZmiana() : formDec()}</form>
          <div class="actions"><button class="btn p" data-act="pdf">Generuj PDF</button><button class="btn" data-act="save">Zapisz</button><button class="btn" data-act="dup">Duplikuj</button><button class="btn" data-act="clear">Wyczyść formularz</button>${dlNote}<span class="status">${esc(state.msg)}</span></div>
          <div class="pv"></div>` : `<div class="info" style="background:#fff;border:1px solid var(--line,#ddd)">Wybierz rodzaj dokumentu powyżej, aby utworzyć nowy formularz, albo otwórz zapisany dokument z listy.</div>`}
        </section>
      </div></div>`;
    renderSavedList();
    bind();
  }

  function bind() {
    root.querySelectorAll('[data-new]').forEach(b => b.onclick = () => newDoc(b.dataset.new));
    const list = root.querySelector('.saved .lst');
    list.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); const id = del.dataset.del;
        if (state.confirmDel === id) { state.docs = state.docs.filter(x => x.id !== id); saveAll(state.docs); if (state.cur && state.cur.id === id) state.cur = null; state.confirmDel = null; render(); }
        else { state.confirmDel = id; renderSavedList(); setTimeout(() => { if (state.confirmDel === id) { state.confirmDel = null; renderSavedList(); } }, 4000); }
        return; }
      const o = e.target.closest('[data-open]');
      if (o) { const x = state.docs.find(d => d.id === o.dataset.open); if (x) { state.cur = JSON.parse(JSON.stringify(x)); state.showErr = false; state.msg = ''; state.osrOther = false; render(); } }
    };
    const form = root.querySelector('form');
    if (form) {
      form.addEventListener('input', e => {
        const k = e.target.dataset.k; if (!k || e.target.dataset.s) return;
        let v = e.target.value;
        if (k === 'pesel' || k === 'npwz') { v = v.replace(/\D/g, ''); e.target.value = v; }
        set(state.cur.data, k, v);
        if (k === 'pesel') { const pi = peselInfo(v); if (pi && state.cur.type === 'kwal') { state.cur.data.wiek = String(pi.age); const w = root.querySelector('[data-k="wiek"]'); if (w) w.value = pi.age; } refreshHint(k); }
        if (k === 'npwz') refreshHint(k);
        if (state.showErr) { state.errs = validate(state.cur); const wrap = e.target.closest('[data-wrap]'); if (wrap && !state.errs.some(x => x.p === k)) wrap.classList.remove('err'); refreshErrs(); }
        clearTimeout(saveTimer); saveTimer = setTimeout(() => persist(true), 700);
      });
      form.addEventListener('change', e => {
        const k = e.target.dataset.k; if (!k || !e.target.dataset.s) return;
        set(state.cur.data, k, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
        persist(true); const y = window.scrollY, m = document.getElementById('main'), my = m ? m.scrollTop : 0; render(); window.scrollTo(0, y); if (m) m.scrollTop = my;
      });
    }
    root.querySelectorAll('[data-osr]').forEach(sl => sl.onchange = () => {
      const d = state.cur.data;
      if (sl.value === '__inny') { state.osrOther = true; if (OSR.some(o => o.etykieta === d.swiadczeniodawca)) d.swiadczeniodawca = ''; }
      else {
        state.osrOther = false; d.swiadczeniodawca = sl.value;
        const o = OSR.find(x => x.etykieta === sl.value);
        if (o && o.adres && d.kontakty && d.kontakty[0] && !d.kontakty[0].adres) d.kontakty[0].adres = o.adres;
      }
      persist(true); const m = document.getElementById('main'), my = m ? m.scrollTop : 0, y = window.scrollY; render(); window.scrollTo(0, y); if (m) m.scrollTop = my;
      if (sl.value === '__inny') root.querySelector('[data-k="swiadczeniodawca"]')?.focus();
    });
    root.querySelectorAll('[data-act]').forEach(b => {
      const a = b.dataset.act;
      if (a === 'import') { b.onchange = importJson; return; }
      if (a === 'prefill') { b.onchange = () => prefill(b.value); return; }
      b.onclick = () => act(a, b);
    });
    root.querySelectorAll('[data-goto]').forEach(a => a.onclick = () => gotoField(a.dataset.goto));
  }
  function refreshErrs() {
    const box = root.querySelector('.errs'); if (!box) return;
    if (!state.errs.length) { box.outerHTML = '<div class="info">Wszystkie wymagane pola są uzupełnione – możesz wygenerować PDF.</div>'; return; }
    box.querySelector('b').textContent = `Do uzupełnienia przed wygenerowaniem PDF (${state.errs.length}):`;
    box.querySelector('ul').innerHTML = state.errs.map(e => `<li><a data-goto="${e.p}">${esc(e.m)}</a></li>`).join('');
    box.querySelectorAll('[data-goto]').forEach(a => a.onclick = () => gotoField(a.dataset.goto));
  }
  function gotoField(p) {
    const el = root.querySelector(`[data-k="${p}"]`) || root.querySelector(`[data-wrap="${p}"]`);
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (el.focus) setTimeout(() => el.focus(), 300); }
  }
  function refreshHint(k) {
    const h = root.querySelector(`[data-hint="${k}"]`); if (!h) return;
    const v = state.cur.data[k];
    if (k === 'pesel') { const pi = peselInfo(v); h.innerHTML = v ? (pi ? `<span class="ok">✓ ur. ${pi.birth.toLocaleDateString('pl-PL')}, wiek ${pi.age} l.</span>` : '<span class="bad">nieprawidłowy numer</span>') : '11 cyfr – weryfikowana suma kontrolna'; }
    if (k === 'npwz') h.innerHTML = v ? (npwzOk(v) ? '<span class="ok">✓ poprawny</span>' : '<span class="bad">nieprawidłowy numer</span>') : '7 cyfr – weryfikowana suma kontrolna';
  }

  function act(a, b) {
    const c = state.cur;
    if (a === 'addc') { c.data.kontakty.push({ nazwisko_imie: '', adres: '', email: '', telefon: '' }); persist(); }
    else if (a === 'delc') { const i = +b.dataset.i; c.data.kontakty.splice(i, 1); persist(); }
    else if (a === 'save') persist();
    else if (a === 'dup') { const n = JSON.parse(JSON.stringify(c)); n.id = uid(); n.created = n.updated = new Date().toISOString(); state.cur = n; persist(); state.msg = 'Utworzono kopię dokumentu'; render(); }
    else if (a === 'clear') {
      if (b.dataset.sure) { c.data = blank(c.type); state.showErr = false; persist(); }
      else { b.dataset.sure = 1; b.textContent = 'Na pewno wyczyścić? Kliknij ponownie'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Wyczyść formularz'; } }, 4000); }
    }
    else if (a === 'pdf') { state.errs = validate(c); if (state.errs.length) { state.showErr = true; render(); root.querySelector('.errs')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; } state.showErr = false; render(); makePdf(false); }
    else if (a === 'pdfdraft') makePdf(true);
    else if (a === 'export') exportJson();
  }

  function prefill(id) {
    const x = state.docs.find(d => d.id === id); if (!x) return;
    const d = state.cur.data;
    d.pacjent = x.data.pacjent; d.pesel = x.data.pesel; d.swiadczeniodawca = x.data.swiadczeniodawca;
    d.rodzaj = x.type === 'zmiana' ? 'zmiana' : 'kwalifikacja';
    d.lek = x.type === 'zmiana' ? x.data.lek_na : x.data.lek;
    d.zrodlo = id; persist();
  }

  async function exportJson() {
    const payload = JSON.stringify({ format: 'b162-formularze', version: 1, exported: new Date().toISOString(), docs: state.docs }, null, 2);
    const name = 'B162_formularze_' + today() + '.json';
    if (dl) {
      try { await dl.save({ filename: name, data: payload }); state.msg = 'Wyeksportowano ' + state.docs.length + ' dok.'; }
      catch (e) { state.msg = e && e.code === 'declined' ? 'Eksport anulowany' : 'Eksport niedostępny – skopiuj dane ręcznie'; }
      render(); return;
    }
    try { saveLocal(name, new Blob([payload], { type: 'application/json' })); state.msg = 'Wyeksportowano ' + state.docs.length + ' dok. do pliku ' + name; }
    catch (e) { state.msg = 'Eksport nie powiódł się.'; }
    render();
  }
  function importJson(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const j = JSON.parse(t); const arr = Array.isArray(j) ? j : j.docs;
      if (!Array.isArray(arr)) throw new Error('format');
      let n = 0;
      for (const x of arr) {
        if (!x || !TYPES[x.type] || !x.data) continue;
        const i = state.docs.findIndex(d => d.id === x.id);
        if (i >= 0) { if ((x.updated || '') > (state.docs[i].updated || '')) state.docs[i] = x; }
        else state.docs.push({ ...x, id: x.id || uid() });
        n++;
      }
      saveAll(state.docs); state.msg = `Zaimportowano ${n} dok.`; render();
    }).catch(() => { state.msg = 'Nie udało się wczytać pliku – oczekiwany plik JSON z eksportu formularzy B.162.'; render(); });
  }

  // zwykłe pobieranie pliku (strona poza claude.ai)
  function saveLocal(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // ---------- PDF
  let pdfReady = null;
  function loadPdfLib() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
    if (pdfReady) return pdfReady;
    const add = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    pdfReady = add('vendor/pdfmake.min.js').then(() => add('vendor/vfs_fonts.js'));
    return pdfReady;
  }
  const dots = '……………………………………………';
  const val = v => (v == null || String(v).trim() === '') ? { text: dots, color: '#999' } : { text: String(v) };
  const kv = (k, v) => ({ text: [{ text: k + ': ', bold: true }, val(v)], margin: [0, 2, 0, 2] });
  const h = t => ({ text: t, style: 'h', margin: [0, 12, 0, 6] });
  const box = (rows, widths) => ({ table: { widths, body: rows }, layout: { hLineColor: '#888', vLineColor: '#888', hLineWidth: () => .6, vLineWidth: () => .6, paddingTop: () => 4, paddingBottom: () => 4 }, margin: [0, 2, 0, 6] });
  function signature(label, date) {
    return { columns: [{ width: '40%', text: [{ text: 'Data: ', bold: true }, val(fmtDate(date))], margin: [0, 28, 0, 0] }, { width: '*', stack: [{ text: '……………………………………………………………', alignment: 'center', margin: [0, 26, 0, 2] }, { text: label, fontSize: 8, alignment: 'center', color: '#444' }] }], unbreakable: true, margin: [0, 10, 0, 0] };
  }
  function partA(d) {
    return [h('A. Dane personalne pacjenta i nazwa jednostki kierującej:'),
      box([[{ text: 'Imię i nazwisko', bold: true, fillColor: '#eee' }, { text: 'PESEL', bold: true, fillColor: '#eee' }], [val(d.pacjent), val(d.pesel)]], ['*', 150]),
      kv('Data wystawienia wniosku', fmtDate(d.data_wniosku)), kv('Świadczeniodawca wystawiający wniosek', d.swiadczeniodawca),
      { text: 'Adres do korespondencji (nazwisko, imię, adres e-mail, telefon):', bold: true, margin: [0, 4, 0, 2] },
      box([['Nazwisko i imię', 'Adres', 'E-mail', 'Telefon'].map(t => ({ text: t, bold: true, fillColor: '#eee', fontSize: 8.5 })), ...d.kontakty.map(k => [k.nazwisko_imie, k.adres, k.email, k.telefon].map(x => ({ text: x || ' ', fontSize: 9 })))], ['*', '*', '*', 90])];
  }
  function exam(label, o, scan, kons) {
    return { stack: [{ text: label + (scan ? ' – proszę dołączyć skan wyniku ' + (kons ? 'konsultacji' : 'badania') : ''), bold: true }, kv(kons ? 'Data konsultacji' : 'Data badania', fmtDate(o.data)), kv(kons ? 'Opis konsultacji' : 'Opis badania', o.opis)], margin: [0, 4, 0, 4], unbreakable: !!(o.opis && o.opis.length < 600) };
  }
  function buildDoc(doc, draft) {
    const d = doc.data, c = [];
    c.push({ text: SRC, fontSize: 7.5, color: '#555', alignment: 'right', margin: [0, 0, 0, 6] });
    if (doc.type === 'kwal') {
      c.push({ text: `Wniosek o kwalifikację do leczenia w programie ${PROG} - leczenie kardiomiopatii w przebiegu amyloidozy transtyretynowej – ${d.lek ? lekInstr(d.lek) : '…………………'} (ICD-10: E85)`, style: 't' });
      c.push(...partA(d));
      c.push(h('B. 1 Dane do kwalifikacji (kardiomiopatia w przebiegu amyloidozy transtyretynowej, ICD-10: E85):'));
      c.push(kv('Wiek pacjenta', d.wiek), kv('Zgoda na prowadzenie antykoncepcji zgodnie z ChPL', { tak: 'TAK', nie: 'NIE', nd: 'nie dotyczy' }[d.antykoncepcja]), kv('Określenie klasy NYHA', d.nyha), kv('Stadium zaawansowania choroby zgodnie z klasyfikacją NAC', d.nac ? 'NAC ' + d.nac : ''));
      const mark = (k, w) => ({ text: k.v === w ? 'X' : '', alignment: 'center', bold: true });
      c.push(box([[{ text: 'Kryteria kwalifikacji do leczenia', bold: true, fillColor: '#eee' }, { text: 'TAK', bold: true, fillColor: '#eee', alignment: 'center' }, { text: 'NIE*', bold: true, fillColor: '#eee', alignment: 'center' }],
        ...CRIT.map((t, i) => [{ stack: [{ text: (i + 1) + '. ' + t }, ...(d.kryteria[i].v === 'nie' && d.kryteria[i].uwagi ? [{ text: 'Uwagi: ' + d.kryteria[i].uwagi, italics: true, fontSize: 8.5, margin: [0, 3, 0, 0] }] : [])] }, mark(d.kryteria[i], 'tak'), mark(d.kryteria[i], 'nie')])], ['*', 32, 32]));
      c.push({ text: '* W przypadku zaznaczenia odpowiedzi NIE należy przedstawić szczegółowy opis niespełnienia danego kryterium w polu Uwagi', fontSize: 8, italics: true });
      if (d.uwagi) c.push(kv('Uwagi', d.uwagi));
      c.push(kv('Czy pacjent kontynuuje leczenie rozpoczęte w ramach innych źródeł finansowania?', { tak: 'TAK', nie: 'NIE' }[d.kontynuacja]));
      c.push({ text: 'Ważne! W przypadku odpowiedzi „TAK” na powyższe zapytanie należy opisać i załączyć zaświadczenie od lekarza prowadzącego o wcześniejszym leczeniu pacjenta.', fontSize: 8.5, italics: true, margin: [0, 2, 0, 2] });
      if (d.kontynuacja === 'tak') c.push({ text: d.kontynuacja_opis || ' ', margin: [0, 2, 0, 4] });
      c.push(h('C. Badania przy kwalifikacji (kardiomiopatia w przebiegu amyloidozy transtyretynowej, ICD-10: E85):'));
      EXAMS.forEach(e => c.push(exam(e.label, d.badania[e.k], e.scan)));
      c.push({ text: [{ text: d.flc ? '[X] ' : '[  ] ', font: 'Roboto' }, 'Proszę dołączyć skan wyników badania: diagnostyka białka monoklonalnego (metodą immunofiksacji) w surowicy i w moczu oraz wolne łańcuchy lekkie Kappa i Lambda w surowicy krwi (FLC)' + (d.flc ? ' – dołączono' : '')], margin: [0, 4, 0, 0] });
      c.push(h('D. Inne badania i konsultacje'));
      Object.entries(KONS).forEach(([k, l]) => c.push(exam(l, d.konsultacje[k], true, true)));
      c.push({ text: [{ text: 'Lekarz: ', bold: true }, val(d.lekarz), { text: '   NPWZ: ', bold: true }, val(d.npwz)], margin: [0, 10, 0, 0] });
      c.push(signature('nadruk lub pieczątka zawierające imię i nazwisko lekarza,\nnumer prawa wykonywania zawodu oraz jego podpis', d.data_podpisu));
      if (d.zal21) {
        c.push({ text: `2.1 Załącznik do wniosku o zakwalifikowanie pacjenta do leczenia w programie lekowym ${PROG} (ICD-10: E85, I42.1)`, style: 't', pageBreak: 'before' });
        c.push(kv('Pacjent', d.pacjent), kv('PESEL', d.pesel));
        ZGODA.forEach(t => c.push({ text: t, fontSize: 9, margin: [t.startsWith('•') ? 10 : 0, 2, 0, 2] }));
        c.push({ text: [ 'Mając powyższe na uwadze, wyrażam zgodę na leczenie ', ...LEKI.flatMap((l, i) => [...(i ? [' / '] : []), { text: l[1], bold: d.lek === l[0], decoration: d.lek && d.lek !== l[0] ? 'lineThrough' : undefined }]), '* oraz zobowiązuję się do przyjmowania tego leku zgodnie z zaleceniami lekarskimi, oraz stawienia się na badania kontrolne w wyznaczonych terminach.'], margin: [0, 6, 0, 2] });
        c.push({ text: '*proszę zaznaczyć właściwe', fontSize: 8, italics: true });
        c.push(signature('Podpis pacjenta', ''), signature('Podpis lekarza', ''));
        c.push({ text: ADO_SWD, fontSize: 8, color: '#333', margin: [0, 18, 0, 0] });
      }
    } else if (doc.type === 'zmiana') {
      c.push({ text: `Wniosek o zmianę leczenia w programie ${PROG} - leczenie kardiomiopatii w przebiegu amyloidozy transtyretynowej`, style: 't' });
      c.push(...partA(d));
      c.push(h('B. Zmiana terapii (kardiomiopatia w przebiegu amyloidozy transtyretynowej, ICD-10: E85):'));
      c.push({ text: ['[X] Wniosek o zmianę terapii z ', { ...val(d.lek_z), bold: true }, ' na ', { ...val(d.lek_na), bold: true }], margin: [0, 2, 0, 6] });
      c.push({ text: 'Uzasadnienie do zmiany leku:', bold: true }, { text: d.uzasadnienie || dots, margin: [0, 2, 0, 6] });
      c.push(h('C. Badania wykonane u pacjenta – zmiana terapii - kardiomiopatia w przebiegu amyloidozy transtyretynowej, ICD-10: E85):'));
      c.push({ text: d.badania_txt || dots });
      c.push(h('D. Inne badania i konsultacje'));
      c.push(exam(KONS.hemat, d.konsultacje.hemat, true, true));
      c.push({ text: [{ text: 'Lekarz: ', bold: true }, val(d.lekarz), { text: '   NPWZ: ', bold: true }, val(d.npwz)], margin: [0, 10, 0, 0] });
      c.push(signature('nadruk lub pieczątka zawierające imię i nazwisko lekarza,\nnumer prawa wykonywania zawodu oraz jego podpis', d.data_podpisu));
    } else {
      c.push({ text: `Decyzja dotycząca kwalifikacji/zmiany leku w programie lekowym ${PROG} - leczenie kardiomiopatii w przebiegu amyloidozy transtyretynowej`, style: 't' });
      c.push({ text: 'Przewodniczący ' + ZESPOL, bold: true, margin: [0, 6, 0, 2] }, kv('Pan/Pani', d.przewodniczacy));
      c.push({ text: 'Dotyczy pacjenta:', bold: true, margin: [0, 10, 0, 2] }, kv('Imię i nazwisko', d.pacjent), kv('PESEL', d.pesel));
      c.push(kv('Świadczeniodawca wnioskujący', d.swiadczeniodawca));
      c.push(kv('Rodzaj', d.rodzaj === 'zmiana' ? 'zmiana leku' : 'kwalifikacja'));
      c.push({ text: ['Lek: ', ...LEKI.flatMap((l, i) => [...(i ? [' / '] : []), { text: l[0], bold: d.lek === l[0], decoration: d.lek && d.lek !== l[0] ? 'lineThrough' : undefined }])], margin: [0, 6, 0, 2], bold: false });
      c.push({ text: ['Decyzja: ', { text: 'Pozytywna', bold: d.decyzja === 'pozytywna', decoration: d.decyzja === 'negatywna' ? 'lineThrough' : undefined }, '/', { text: 'Negatywna', bold: d.decyzja === 'negatywna', decoration: d.decyzja === 'pozytywna' ? 'lineThrough' : undefined }], fontSize: 12, margin: [0, 6, 0, 2] });
      c.push(signature('Podpis Przewodniczącego Zespołu Koordynacyjnego ds. Leczenia Kardiomiopatii', d.data_decyzji));
      c.push({ stack: RODO_DEC.map(t => ({ text: t, fontSize: 8, margin: [t.startsWith('•') ? 8 : 0, 2, 0, 2] })), margin: [0, 24, 0, 0] });
    }
    return {
      pageSize: 'A4', pageMargins: [48, 46, 48, 50], content: c,
      info: { title: TYPES[doc.type].short + ' – B.162 – ' + (d.pacjent || ''), author: 'Przeglądarka programów lekowych', subject: TYPES[doc.type].title },
      defaultStyle: { fontSize: 9.5, lineHeight: 1.2 },
      styles: { t: { fontSize: 12, bold: true, margin: [0, 0, 0, 8] }, h: { fontSize: 10.5, bold: true, color: '#0f5c55' } },
      watermark: draft ? { text: 'WERSJA ROBOCZA', color: '#c0392b', opacity: 0.12, bold: true } : undefined,
      footer: (cp, pc) => ({ columns: [{ text: 'B.162 · ' + TYPES[doc.type].short + (draft ? ' · wersja robocza' : ''), fontSize: 7, color: '#777' }, { text: `Strona ${cp} z ${pc}`, alignment: 'right', fontSize: 7, color: '#777' }], margin: [48, 16, 48, 0] }),
    };
  }
  async function makePdf(draft) {
    const c = state.cur; persist(true);
    const pv = root.querySelector('.pv');
    const st = root.querySelector('.status'); if (st) st.textContent = 'Generowanie PDF…';
    try { await loadPdfLib(); } catch (e) { if (st) st.textContent = 'Nie udało się wczytać generatora PDF.'; return; }
    const dd = buildDoc(c, draft);
    const pdf = window.pdfMake.createPdf(dd);
    const blob = await new Promise(res => pdf.getBlob(res));
    const safe = (c.data.pacjent || 'pacjent').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/[^A-Za-z0-9]+/g, '_');
    const name = `B162_${{ kwal: 'wniosek_kwalifikacja', zmiana: 'wniosek_zmiana_leczenia', decyzja: 'decyzja_zespolu' }[c.type]}_${safe}_${today()}${draft ? '_robocza' : ''}.pdf`;
    let saved = false;
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); saved = true; state.msg = 'PDF zapisany: ' + name; }
      catch (e) { state.msg = e && e.code === 'declined' ? 'Zapis PDF anulowany – poniżej podgląd.' : 'Zapis niedostępny – poniżej podgląd PDF.'; }
    } else { try { saveLocal(name, blob); saved = true; state.msg = 'PDF pobrany: ' + name; } catch (e) { state.msg = 'Podgląd PDF poniżej.'; } }
    if (st) st.textContent = state.msg;
    if (pv) {
      const url = URL.createObjectURL(blob);
      pv.innerHTML = `<div class="preview"><div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line,#ddd)"><b style="font-size:13px">Podgląd: ${esc(name)}</b><button class="btn s" data-act-close>Zamknij podgląd</button></div><iframe src="${url}" title="Podgląd PDF"></iframe></div>`;
      pv.querySelector('[data-act-close]').onclick = () => { pv.innerHTML = ''; URL.revokeObjectURL(url); };
      if (!saved) pv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  window.B162Form = { mount, _test: { peselInfo, npwzOk, validate, buildDoc, blank }, _spec: { CRIT, EXAMS, KONS, LEKI, RODO_DEC, ZGODA, ADO_SWD, TYPES, PROG, ZESPOL, SRC } };
})();
