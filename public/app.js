const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
const now=()=>Date.now();

const RARITIES=[
  {id:'common',name:'Обычный',color:'#9ba0ae',chance:62,m:1},
  {id:'rare',name:'Редкий',color:'#4da3ff',chance:25,m:1.18},
  {id:'epic',name:'Эпический',color:'#ad72ff',chance:9,m:1.45},
  {id:'legendary',name:'Легендарный',color:'#ffc95f',chance:3.5,m:1.85},
  {id:'secret',name:'Секретный',color:'#ff557b',chance:.5,m:2.5}
];

const PHONES=[
  {id:'iphone5',brand:'Starter',name:'iPhone 5',cam:24,perf:18,value:28000,rarity:0,color:'#a8a9ad',body:['#d8d8db','#7c7d84'],logo:'●',camType:'rowcam',starter:true},
  {id:'poco_m5',brand:'POCO',name:'POCO M5',cam:42,perf:45,value:38000,rarity:0,color:'#f5d72a',body:['#35363a','#101115'],logo:'POCO',camType:'rowcam'},
  {id:'poco_x5',brand:'POCO',name:'POCO X5 Pro',cam:57,perf:62,value:62000,rarity:1,color:'#f5d72a',body:['#73a0d0','#1f3750'],logo:'POCO',camType:'rowcam'},
  {id:'poco_f5',brand:'POCO',name:'POCO F5 Pro',cam:65,perf:76,value:88000,rarity:2,color:'#f5d72a',body:['#55585d','#121316'],logo:'POCO',camType:'ultra'},
  {id:'poco_f6pro',brand:'POCO',name:'POCO F6 Pro',cam:75,perf:89,value:125000,rarity:3,color:'#f5d72a',body:['#4c5259','#111317'],logo:'POCO',camType:'ultra',flagship:true},
  {id:'poco_f7ultra',brand:'POCO',name:'POCO F7 Ultra',cam:84,perf:96,value:175000,rarity:4,color:'#f5d72a',body:['#f2d76d','#8b6b20'],logo:'POCO',camType:'ultra',flagship:true},
  {id:'xiaomi_12t',brand:'Xiaomi',name:'Xiaomi 12T',cam:58,perf:65,value:68000,rarity:0,color:'#ff7a2f',body:['#8ec7c4','#385b5b'],logo:'mi',camType:'ultra'},
  {id:'xiaomi_13t',brand:'Xiaomi',name:'Xiaomi 13T Pro',cam:68,perf:77,value:105000,rarity:1,color:'#ff7a2f',body:['#435c78','#172637'],logo:'mi',camType:'ultra'},
  {id:'xiaomi_14t',brand:'Xiaomi',name:'Xiaomi 14T Pro',cam:78,perf:86,value:145000,rarity:2,color:'#ff7a2f',body:['#45464d','#16171b'],logo:'mi',camType:'ultra'},
  {id:'xiaomi_13u',brand:'Xiaomi',name:'Xiaomi 13 Ultra',cam:88,perf:84,value:185000,rarity:3,color:'#ff7a2f',body:['#31543d','#12291c'],logo:'mi',camType:'ultra',flagship:true},
  {id:'xiaomi_14u',brand:'Xiaomi',name:'Xiaomi 14 Ultra',cam:94,perf:91,value:245000,rarity:4,color:'#ff7a2f',body:['#ece5d7','#877f70'],logo:'mi',camType:'ultra',flagship:true},
  {id:'xiaomi_15u',brand:'Xiaomi',name:'Xiaomi 15 Ultra',cam:98,perf:97,value:310000,rarity:4,color:'#ff7a2f',body:['#27282b','#090a0b'],logo:'mi',camType:'ultra',flagship:true},
  {id:'pixel_7a',brand:'Pixel',name:'Google Pixel 7a',cam:63,perf:55,value:75000,rarity:0,color:'#70d0a1',body:['#9fd7cc','#3e6f68'],logo:'G',camType:'pixel'},
  {id:'pixel_8a',brand:'Pixel',name:'Google Pixel 8a',cam:70,perf:64,value:98000,rarity:1,color:'#70d0a1',body:['#87a9d1','#314661'],logo:'G',camType:'pixel'},
  {id:'pixel_9',brand:'Pixel',name:'Google Pixel 9',cam:79,perf:76,value:145000,rarity:2,color:'#70d0a1',body:['#d9cdb8','#766d60'],logo:'G',camType:'pixel'},
  {id:'pixel_7pro',brand:'Pixel',name:'Google Pixel 7 Pro',cam:86,perf:74,value:165000,rarity:3,color:'#70d0a1',body:['#747578','#242528'],logo:'G',camType:'pixel',flagship:true},
  {id:'pixel_8pro',brand:'Pixel',name:'Google Pixel 8 Pro',cam:92,perf:83,value:225000,rarity:3,color:'#70d0a1',body:['#9eacc2','#404957'],logo:'G',camType:'pixel',flagship:true},
  {id:'pixel_9pro',brand:'Pixel',name:'Google Pixel 9 Pro XL',cam:97,perf:91,value:285000,rarity:4,color:'#70d0a1',body:['#ebe5d8','#827b6d'],logo:'G',camType:'pixel',flagship:true},
  {id:'samsung_a15',brand:'Samsung',name:'Galaxy A15',cam:41,perf:38,value:42000,rarity:0,color:'#5c94ff',body:['#8aa4c4','#35485f'],logo:'SAMSUNG',camType:''},
  {id:'samsung_a35',brand:'Samsung',name:'Galaxy A35',cam:58,perf:54,value:68000,rarity:1,color:'#5c94ff',body:['#beb4d9','#5e5571'],logo:'SAMSUNG',camType:''},
  {id:'samsung_a55',brand:'Samsung',name:'Galaxy A55',cam:66,perf:63,value:92000,rarity:2,color:'#5c94ff',body:['#b4d7d1','#51736d'],logo:'SAMSUNG',camType:''},
  {id:'samsung_s21u',brand:'Samsung',name:'Galaxy S21 Ultra',cam:84,perf:77,value:145000,rarity:3,color:'#5c94ff',body:['#2b2c31','#090a0c'],logo:'SAMSUNG',camType:'ultra',flagship:true},
  {id:'samsung_s22u',brand:'Samsung',name:'Galaxy S22 Ultra',cam:89,perf:84,value:185000,rarity:3,color:'#5c94ff',body:['#6e2443','#250b16'],logo:'SAMSUNG',camType:'ultra',flagship:true},
  {id:'samsung_s23u',brand:'Samsung',name:'Galaxy S23 Ultra',cam:94,perf:91,value:245000,rarity:4,color:'#5c94ff',body:['#7c846a','#30362a'],logo:'SAMSUNG',camType:'ultra',flagship:true},
  {id:'samsung_s24u',brand:'Samsung',name:'Galaxy S24 Ultra',cam:98,perf:97,value:315000,rarity:4,color:'#5c94ff',body:['#9d9387','#49423b'],logo:'SAMSUNG',camType:'ultra',flagship:true},
  {id:'iphone_11',brand:'iPhone',name:'iPhone 11',cam:58,perf:58,value:82000,rarity:0,color:'#d4b7ff',body:['#a8d5c5','#466f63'],logo:'●',camType:''},
  {id:'iphone_13',brand:'iPhone',name:'iPhone 13',cam:72,perf:74,value:135000,rarity:1,color:'#d4b7ff',body:['#dcbbc5','#744a58'],logo:'●',camType:''},
  {id:'iphone_14plus',brand:'iPhone',name:'iPhone 14 Plus',cam:79,perf:81,value:175000,rarity:2,color:'#d4b7ff',body:['#aab9df','#45516e'],logo:'●',camType:''},
  {id:'iphone_11pm',brand:'iPhone',name:'iPhone 11 Pro Max',cam:76,perf:72,value:155000,rarity:3,color:'#d4b7ff',body:['#77877a','#26342b'],logo:'●',camType:'ultra',flagship:true},
  {id:'iphone_12pm',brand:'iPhone',name:'iPhone 12 Pro Max',cam:82,perf:80,value:195000,rarity:3,color:'#d4b7ff',body:['#52758d','#1b3446'],logo:'●',camType:'ultra',flagship:true},
  {id:'iphone_13pm',brand:'iPhone',name:'iPhone 13 Pro Max',cam:88,perf:87,value:245000,rarity:3,color:'#d4b7ff',body:['#c8c4b4','#696557'],logo:'●',camType:'ultra',flagship:true},
  {id:'iphone_14pm',brand:'iPhone',name:'iPhone 14 Pro Max',cam:94,perf:92,value:310000,rarity:4,color:'#d4b7ff',body:['#5b526d','#211b2c'],logo:'●',camType:'ultra',flagship:true},
  {id:'iphone_15pm',brand:'iPhone',name:'iPhone 15 Pro Max',cam:99,perf:99,value:390000,rarity:4,color:'#d4b7ff',body:['#948d83','#423d37'],logo:'●',camType:'ultra',flagship:true}
];

const CASES={
  POCO:{price:65000,color:'#f5d72a'},Xiaomi:{price:105000,color:'#ff7a2f'},Pixel:{price:145000,color:'#70d0a1'},Samsung:{price:210000,color:'#5c94ff'},iPhone:{price:295000,color:'#d4b7ff'}
};
const NUMBER_CASES={simple:{name:'Простой',price:15000,boost:[1,3],color:'#4da3ff'},pretty:{name:'Красивый',price:75000,boost:[3,8],color:'#ad72ff'},business:{name:'Бизнес',price:350000,boost:[8,18],color:'#ffc95f'}};
const TOPICS=[['Юмор',1.08],['Технологии',1.16],['Игры',1.12],['Лайфстайл',1],['Обзор телефона',1.22]];

function fresh(){return{version:2,cash:50000,name:'',subs:0,likes:0,pool:0,videos:[],phones:[],activePhone:null,numbers:[],activeNumber:null,topic:0,tutorial:0,caseBrand:'POCO',numberCase:'simple',phoneCaseOpen:false,numberTab:'gen',logs:['Добро пожаловать в Viral Life']}}
let S=(()=>{try{const x=JSON.parse(localStorage.getItem('viral-life-v2'));return x&&x.version===2?x:fresh()}catch(e){return fresh()}})();
let tab='home', busy=false, toastTimer, switchTimer;
const save=()=>localStorage.setItem('viral-life-v2',JSON.stringify(S));
const phone=id=>PHONES.find(p=>p.id===id);
const ownedPhone=id=>S.phones.find(p=>p.id===id);
const rarity=i=>RARITIES[Math.max(0,Math.min(4,i))];
const haptic=t=>{try{Telegram.WebApp.HapticFeedback.impactOccurred(t||'light')}catch(e){try{navigator.vibrate(15)}catch(_){}}};
function toast(text){const e=$('#toast');e.textContent=text;e.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('on'),2100)}
function head(){return`<header class="top"><div class="avatar">${(S.name||'?')[0].toUpperCase()}</div><div class="brand">VIRAL <b>LIFE</b></div><div class="top-balance"><i>₽</i><span>${Math.round(S.cash).toLocaleString('ru-RU')}</span></div></header>`}
function title(eye,h,side=''){return`<div class="eyebrow">${eye}</div><div class="title-row"><h1>${h}</h1>${side}</div>`}
function icon(n){const p={home:'<path d="M3 10.5 10 4l7 6.5v7H5v-7"/><path d="M8 18v-5h4v5"/>',studio:'<circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/><path d="M10 1v2m0 14v2M1 10h2m14 0h2"/>',phones:'<rect x="5" y="2" width="10" height="16" rx="2"/><path d="M8 5h4m-3 10h2"/>',numbers:'<path d="M5 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="m7 8 2 4 4-4"/>',profile:'<circle cx="10" cy="7" r="3"/><path d="M4 18c.5-4 2.5-6 6-6s5.5 2 6 6"/>'}[n];return`<svg viewBox="0 0 20 20">${p}</svg>`}
function nav(){const items=[['home','Главная'],['studio','Студия'],['phones','Телефоны'],['numbers','Номера'],['profile','Профиль']];$('#nav').innerHTML='<i class="nav-slider"></i>'+items.map(([k,t])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${icon(k)}${t}</button>`).join('');requestAnimationFrame(moveNav)}
function moveNav(){const b=$(`#nav [data-tab="${tab}"]`),s=$('.nav-slider');if(!b||!s)return;s.style.width=b.offsetWidth+'px';s.style.transform=`translateX(${b.offsetLeft-7}px)`;$$('#nav button').forEach(x=>x.classList.toggle('on',x===b))}

function phoneArt(p){return`<div class="phone-render" style="--body1:${p.body[0]};--body2:${p.body[1]}"><div class="camera-island ${p.camType||''}"><i></i><i></i><i></i><i></i></div><div class="phone-logo">${p.logo}</div></div>`}
function phoneMetrics(p){return`<div class="metrics"><div class="metric"><span>Камера ${p.cam}%</span><div class="meter"><i style="width:${p.cam}%"></i></div></div><div class="metric"><span>Мощность ${p.perf}%</span><div class="meter"><i style="width:${p.perf}%"></i></div></div></div>`}
function remaining(op){const cutoff=now()-30*60*1000;op.uses=(op.uses||[]).filter(t=>t>cutoff);return Math.max(0,3-op.uses.length)}
function nextReady(op){remaining(op);if(op.uses.length<3)return'';const ms=op.uses[0]+30*60*1000-now();const m=Math.max(0,Math.ceil(ms/60000));return` • слот через ${m} мин`}
function activeNumber(){return S.numbers.find(x=>x.phoneId===S.activePhone)}
function activeBonus(){return activeNumber()?.boost||0}

const Views={
  home(){const rate=S.videos.reduce((a,v)=>a+v.income,0);return head()+title('ТВОЙ ПУТЬ','Главная',`<p>${S.subs.toLocaleString('ru-RU')}<br>подписчиков</p>`)+`
    <div class="hero"><span class="muted tiny">Накоплено с роликов</span><div class="income">${money(S.pool)} <small>к выдаче</small></div><button class="btn green full" data-action="claim-income">Забрать прибыль</button></div>
    ${!S.phones.length?`<div class="card" id="starterCard"><div class="row"><div><b>Первый телефон</b><p class="sub">Старый iPhone 5 — бесплатно. С него начнётся твоя история.</p></div>${phoneArt(PHONES[0])}</div><button class="btn full" data-action="claim-starter">Забрать телефон</button></div>`:''}
    <div class="section-label">СТАТИСТИКА</div><div class="stat-grid"><div class="glass stat"><span>Лайки</span><b>${S.likes.toLocaleString('ru-RU')}</b><small>за всё время</small></div><div class="glass stat"><span>Видео</span><b>${S.videos.length}</b><small>${money(rate)}/ч</small></div></div>
    <div class="section-label">ПОСЛЕДНИЕ РОЛИКИ</div>${S.videos.length?S.videos.slice(-4).reverse().map(videoCard).join(''):`<div class="card empty"><b>Пока тихо</b>Сними первое видео в студии</div>`}`},
  studio(){const owned=S.phones.map(op=>({...phone(op.id),op}));const ap=phone(S.activePhone);const aop=ownedPhone(S.activePhone);return head()+title('СОЗДАНИЕ','Студия',`<p>3 видео<br>за 30 минут</p>`)+`
    <div class="section-label">1. ВЫБЕРИ ТЕЛЕФОН</div><div class="studio-select" id="studioPhones">${owned.length?owned.map(p=>`<button class="studio-tile ${S.activePhone===p.id?'on':''}" data-action="select-phone" data-id="${p.id}"><b>${p.name}</b><span>Камера ${p.cam}% • доступно ${remaining(p.op)}/3</span></button>`).join(''):'<div class="empty">Сначала получи телефон</div>'}</div>
    ${ap?`<div class="phone-card" style="--phone:${ap.color}"><div class="phone-info"><div class="brand-name">${ap.brand}</div><h3>${ap.name}</h3>${phoneMetrics(ap)}${activeNumber()?numberBadge(activeNumber()):'<span class="tiny muted">Номер не установлен</span>'}<div class="usage">Доступно: ${remaining(aop)}/3${nextReady(aop)}</div></div>${phoneArt(ap)}</div>`:''}
    <div class="section-label">2. ТЕМА РОЛИКА</div><div class="tabs">${TOPICS.slice(0,2).map((x,i)=>`<button data-action="topic" data-i="${i}" class="${S.topic===i?'on':''}">${x[0]}</button>`).join('')}</div><div class="studio-select">${TOPICS.slice(2).map((x,j)=>{const i=j+2;return`<button class="studio-tile ${S.topic===i?'on':''}" data-action="topic" data-i="${i}"><b>${x[0]}</b><span>охват ×${x[1]}</span></button>`}).join('')}</div>
    <div class="record" id="record">●</div><button class="btn red full" id="shootButton" data-action="shoot" ${!ap||!aop||remaining(aop)<1||busy?'disabled':''}>${aop&&remaining(aop)<1?'Лимит телефона исчерпан':'Записать и опубликовать'}</button>`},
  phones(){return head()+title('КОЛЛЕКЦИЯ','Телефоны',`<p>${S.phones.length}/3<br>слота</p>`)+`<div class="slotbar">${[0,1,2].map(i=>`<i class="slot ${S.phones[i]?'on':''}"></i>`).join('')}</div>
    <div class="tabs"><button class="on">Мои телефоны</button><button data-action="go-cases">Кейсы</button></div>
    <div class="phone-list">${S.phones.length?S.phones.map(op=>phoneOwnedCard(op)).join(''):`<div class="card empty"><b>Коллекция пуста</b>Забери первый телефон или открой кейс</div>`}</div>
    <div class="section-label">БРЕНДОВЫЕ КЕЙСЫ</div>${phoneCases()}`},
  numbers(){return head()+title('УНИКАЛЬНЫЕ SIM','Номера',`<p>${S.numbers.length}/5<br>слотов</p>`)+`<div class="tabs"><button data-action="number-tab" data-v="gen" class="${S.numberTab==='gen'?'on':''}">Генерация</button><button data-action="number-tab" data-v="mine" class="${S.numberTab==='mine'?'on':''}">Мои номера</button></div>${S.numberTab==='gen'?numberGenerator():numberList()}`},
  profile(){return head()+title('АККАУНТ','Профиль')+`<div class="card"><label class="tiny muted">Никнейм автора</label><input id="nickname" value="${escapeHtml(S.name)}" maxlength="18" placeholder="Придумай никнейм" style="width:100%;margin-top:9px;padding:14px;border-radius:16px;border:1px solid var(--line);background:#ffffff0a;outline:none"><button class="btn full" data-action="save-name">Сохранить никнейм</button></div>
    <div class="stat-grid" style="margin-top:12px"><div class="glass stat"><span>Подписчики</span><b>${S.subs.toLocaleString('ru-RU')}</b></div><div class="glass stat"><span>Лайки</span><b>${S.likes.toLocaleString('ru-RU')}</b></div><div class="glass stat"><span>Телефоны</span><b>${S.phones.length}/3</b></div><div class="glass stat"><span>Номера</span><b>${S.numbers.length}/5</b></div></div>
    <button class="btn ghost full" data-action="reset">Начать заново</button>`}
};

function videoCard(v){return`<div class="card video-card"><div><h3>${v.title}</h3><div class="video-stats"><span>♥ ${v.likes.toLocaleString('ru-RU')}</span><span>+${v.subs} подписчиков</span><span>${money(v.income)}/ч</span></div></div>${v.viral?'<span class="viral">ВИРУСНОЕ</span>':''}</div>`}
function numberBadge(n){if(!n)return'';const r=rarity(n.rarity);return`<span class="number-chip" style="--rare:${r.color}"><i></i>${formatNum(n.digits)} • +${n.boost}%</span>`}
function phoneOwnedCard(op){const p=phone(op.id),active=S.activePhone===p.id,attached=S.numbers.find(n=>n.phoneId===p.id);return`<article class="phone-card ${active?'active':''}" style="--phone:${p.color}"><div class="phone-info"><div class="brand-name">${p.brand}</div><h3>${p.name}</h3>${p.flagship?'<span class="flag">ФЛАГМАН</span>':''}${phoneMetrics(p)}${attached?numberBadge(attached):'<span class="tiny muted">Без номера</span>'}<div class="usage">Съёмка: ${remaining(op)}/3${nextReady(op)}</div><div style="display:flex;gap:7px;margin-top:10px"><button class="btn sm" data-action="select-phone" data-id="${p.id}">${active?'Выбран':'Выбрать'}</button><button class="btn ghost sm" data-action="manage-phone" data-id="${p.id}">Настроить</button></div>${op.broken?`<button class="btn red sm" id="repairPhone" style="margin-top:8px" data-action="repair" data-id="${p.id}">Починить • ${money(20000)}</button>`:''}</div>${phoneArt(p)}</article>`}
function phoneCases(){return`<div class="brand-cases">${Object.entries(CASES).map(([k,c])=>`<button class="case-card ${S.caseBrand===k?'on':''}" style="--case:${c.color}" data-action="case-brand" data-brand="${k}"><b>${k}</b><span>${money(c.price)}</span><small>${PHONES.filter(p=>p.brand===k&&p.flagship).length} флагмана</small></button>`).join('')}</div>${caseStage()}`}
function caseStage(){const c=CASES[S.caseBrand];return`<div class="case-stage" id="caseStage" style="--case:${c.color}"><div class="case-box" id="caseBox"><b>${S.caseBrand.toUpperCase()}</b></div><div class="drop-phone" id="dropPhone"></div><div class="drop-info" id="dropInfo"></div></div><button class="btn full" data-action="open-phone-case">Открыть за ${money(c.price)}</button><p class="sub" style="text-align:center">Телефон сразу займёт один из 3 слотов</p>`}
function numberGenerator(){return`<div class="brand-cases">${Object.entries(NUMBER_CASES).map(([k,c])=>`<button class="case-card ${S.numberCase===k?'on':''}" style="--case:${c.color}" data-action="number-case" data-key="${k}"><b>${c.name}</b><span>${money(c.price)}</span><small>до +${c.boost[1]}% к охвату</small></button>`).join('')}</div><div class="case-stage" style="--case:${NUMBER_CASES[S.numberCase].color};height:235px"><div style="text-align:center"><div class="muted tiny">VIRAL MOBILE</div><div class="result-number" id="numDisplay" style="margin:20px 0">+7 ••• ••• •• ••</div><div class="rarity" id="numRarity" style="--rare:#8f8b9f"><i></i>Редкость скрыта</div></div></div><button class="btn full" data-action="generate-number">Сгенерировать за ${money(NUMBER_CASES[S.numberCase].price)}</button>`}
function numberList(){return S.numbers.length?S.numbers.map((n,i)=>{const r=rarity(n.rarity),p=n.phoneId&&phone(n.phoneId);return`<div class="card"><div class="row"><div><div class="rarity" style="--rare:${r.color}"><i></i>${r.name}</div><div class="result-number" style="font-size:20px;margin-top:5px">${formatNum(n.digits)}</div><p class="sub">${p?'Установлен: '+p.name:'Не установлен'} • бонус +${n.boost}%</p></div><button class="btn ghost sm" data-action="number-info" data-id="${n.id}">•••</button></div></div>`}).join(''):`<div class="card empty"><b>Номеров пока нет</b>Сгенерируй первый уникальный номер</div>`}

function render(immediate=false){const v=$('#view');const go=()=>{v.innerHTML=Views[tab]();v.scrollTop=0;v.classList.remove('switching');nav();save();requestAnimationFrame(showTutorial)};if(immediate)go();else{v.classList.add('switching');clearTimeout(switchTimer);switchTimer=setTimeout(go,170)}}
function escapeHtml(s=''){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

function weightedPhone(brand){const list=PHONES.filter(p=>p.brand===brand&&!S.phones.some(op=>op.id===p.id));let r=Math.random()*100,ri=r<54?0:r<79?1:r<93?2:r<99?3:4;let pool=list.filter(p=>p.rarity===ri);if(!pool.length){const sorted=[...list].sort((a,b)=>Math.abs(a.rarity-ri)-Math.abs(b.rarity-ri));pool=[sorted[0]]}return pool[Math.floor(Math.random()*pool.length)]}
function openPhoneCase(){if(busy)return;const c=CASES[S.caseBrand];if(S.phones.length>=3)return toast('Все 3 слота заняты');if(S.cash<c.price)return toast('Не хватает рублей');busy=true;S.cash-=c.price;save();const p=weightedPhone(S.caseBrand),box=$('#caseBox'),drop=$('#dropPhone'),info=$('#dropInfo');box.classList.add('opening');haptic('medium');setTimeout(()=>{drop.innerHTML=phoneArt(p);drop.classList.add('reveal');info.innerHTML=`<b>${p.name}</b><span>${rarity(p.rarity).name} • камера ${p.cam}% • мощность ${p.perf}%</span>`;info.classList.add('reveal');S.phones.push({id:p.id,uses:[],broken:false});S.activePhone=p.id;save();haptic(p.rarity>=3?'heavy':'medium');busy=false;setTimeout(()=>render(true),2100)},2400)}

function shoot(){const p=phone(S.activePhone),op=ownedPhone(S.activePhone);if(!p||!op||busy)return;if(remaining(op)<1)return toast('На этом телефоне лимит 3/3');if(op.broken)return toast('Сначала почини телефон');busy=true;op.uses.push(now());const rec=$('#record'),btn=$('#shootButton');rec.classList.add('shooting');btn.disabled=true;btn.textContent='Снимаем и монтируем…';haptic('medium');setTimeout(()=>{const topic=TOPICS[S.topic],numberBonus=activeBonus();const quality=(p.cam*.62+p.perf*.38)/100;const base=45+S.subs*.045;const random=.72+Math.random()*.7;const viral=Math.random()<(.035+quality*.07+numberBonus/800);let views=Math.round(base*(.65+quality*1.8)*topic[1]*random*(1+numberBonus/100)*(viral?6.5:1));const likes=Math.max(1,Math.round(views*(.075+quality*.07)));const subs=Math.max(0,Math.round(views*(.008+quality*.018)));const income=Math.max(5,Math.round(likes*(.6+quality*.9)));S.likes+=likes;S.subs+=subs;S.pool+=income;S.videos.push({title:topic[0]+' • '+p.name,likes,subs,income,viral,at:now()});S.logs.unshift(`Видео на ${p.name}: ${likes} лайков`);if(S.tutorial===4)S.tutorial=5;save();busy=false;openResult('Видео опубликовано',`<div class="stat-grid"><div class="glass stat"><span>Лайки</span><b>${likes.toLocaleString('ru-RU')}</b></div><div class="glass stat"><span>Подписчики</span><b>+${subs}</b></div></div><p class="sub" style="text-align:center">${viral?'🔥 Ролик залетел в рекомендации!':'Доход: '+money(income)+' в час'}</p>`,`<button class="btn full" data-action="close-modal">Отлично</button>`);haptic(viral?'heavy':'medium')},2400)}

function generateNumber(){if(busy)return;const c=NUMBER_CASES[S.numberCase];if(S.numbers.length>=5)return toast('Лимит: 5 номеров');if(S.cash<c.price)return toast('Не хватает рублей');busy=true;S.cash-=c.price;save();const d=Array.from({length:10},()=>Math.floor(Math.random()*10));let ri=S.numberCase==='business'?(Math.random()<.18?4:3):S.numberCase==='pretty'?(Math.random()<.18?3:Math.random()<.65?2:1):(Math.random()<.02?3:Math.random()<.12?2:Math.random()<.42?1:0);if(ri>=2){const digit=Math.floor(Math.random()*10);const count=ri===4?6:ri===3?5:3;for(let i=10-count;i<10;i++)d[i]=digit}const boost=Math.round((c.boost[0]+Math.random()*(c.boost[1]-c.boost[0]))*10)/10;const n={id:'n'+now()+Math.random(),digits:d.join(''),rarity:ri,boost,phoneId:null,value:Math.round(c.price*(.25+rarity(ri).m*.35))};const e=$('#numDisplay'),r=$('#numRarity');e.textContent='+7 ••• ••• •• ••';let i=0;const timer=setInterval(()=>{const mask=d.map((x,j)=>j<=i?x:'•').join('');e.textContent=formatNum(mask);haptic('light');i++;if(i===10){clearInterval(timer);setTimeout(()=>{const rr=rarity(ri);r.style.setProperty('--rare',rr.color);r.innerHTML=`<i></i>${rr.name} • +${boost}% к охвату`;S.numbers.push(n);save();busy=false;openResult('Номер получен',`<div class="result-number" style="margin:18px 0;text-align:center">${formatNum(n.digits)}</div><p class="sub">Редкость: ${rr.name}. Бонус номера повышает шанс ролика попасть в рекомендации.</p>`,`<button class="btn green full" data-action="close-modal">Оставить номер</button>`);haptic(ri>=3?'heavy':'medium')},500)}},170)}
function formatNum(d){const x=String(d).padEnd(10,'•');return`+7 ${x.slice(0,3)} ${x.slice(3,6)} ${x.slice(6,8)} ${x.slice(8,10)}`}

function openResult(h,body,actions){const m=$('#modal');m.innerHTML=`<div class="sheet"><div class="sheet-handle"></div><h2>${h}</h2>${body}${actions||''}</div>`;m.classList.add('on')}
function closeModal(){const m=$('#modal');m.classList.remove('on');setTimeout(()=>m.innerHTML='',250);render(true)}
function managePhone(id){const p=phone(id),op=ownedPhone(id),attached=S.numbers.find(n=>n.phoneId===id),free=S.numbers.filter(n=>!n.phoneId||n.phoneId===id);openResult(p.name,`${phoneMetrics(p)}<p class="sub">Выбери номер для этого телефона. Чем выше редкость, тем больше шанс залететь в рекомендации.</p><div style="margin-top:12px">${free.length?free.map(n=>`<button class="card row" style="width:100%;color:#fff" data-action="attach-number" data-phone="${id}" data-number="${n.id}"><span>${formatNum(n.digits)}</span>${numberBadge(n)}</button>`).join(''):'<div class="empty">Свободных номеров нет</div>'}</div>`,`<div class="actions"><button class="btn ghost" data-action="sell-phone" data-id="${id}">Продать ${money(p.value*.42)}</button><button class="btn" data-action="close-modal">Закрыть</button></div>`)}
function numberInfo(id){const n=S.numbers.find(x=>x.id===id),r=rarity(n.rarity),p=n.phoneId&&phone(n.phoneId);openResult(formatNum(n.digits),`<div class="rarity" style="--rare:${r.color};margin-top:10px"><i></i>${r.name}</div><p class="sub">Бонус +${n.boost}% к охвату. ${p?'Сейчас установлен в '+p.name:'Номер свободен.'}</p>`,`<div class="actions"><button class="btn red" data-action="sell-number" data-id="${id}">Продать ${money(n.value*.4)}</button><button class="btn" data-action="close-modal">Закрыть</button></div>`)}

const tutorialSteps=[
  {tab:'home',sel:'[data-action="claim-starter"]',title:'Забери первый телефон',text:'Начнём со старого iPhone 5. Он бесплатный, но его нужно починить.'},
  {tab:'phones',sel:'[data-action="repair"]',title:'Почини телефон',text:'Ремонт стоит 20 000 ₽. После этого телефон будет готов к съёмке.'},
  {tab:'profile',sel:'[data-action="save-name"]',title:'Создай никнейм',text:'Так тебя будут видеть будущие подписчики.'},
  {tab:'studio',sel:'[data-action="select-phone"]',title:'Выбери телефон',text:'Камера и производительность напрямую влияют на охват ролика.'},
  {tab:'studio',sel:'[data-action="shoot"]',title:'Сними первое видео',text:'На одном телефоне можно снять 3 ролика за 30 минут.'},
  {tab:'home',sel:null,title:'Обучение завершено',text:'Открывай кейсы, собирай флагманы, устанавливай редкие номера и развивай канал.'}
];
function showTutorial(){const layer=$('#tutorial');if(S.tutorial<0||S.tutorial>=tutorialSteps.length){layer.classList.remove('on');return}const st=tutorialSteps[S.tutorial];if(tab!==st.tab){tab=st.tab;render();return}layer.classList.add('on');const target=st.sel&&$(st.sel);const focus=$('#tutorialFocus'),coach=$('#coach'),shade=$('.tutorial-shade');if(target){shade.style.background='transparent';shade.style.backdropFilter='none';const ar=$('#app').getBoundingClientRect(),r=target.getBoundingClientRect(),pad=7;Object.assign(focus.style,{left:r.left-ar.left-pad+'px',top:r.top-ar.top-pad+'px',width:r.width+pad*2+'px',height:r.height+pad*2+'px',display:'block'});const below=r.bottom-ar.top+18;const top=below+155<ar.height?below:Math.max(20,r.top-ar.top-165);coach.style.top=top+'px'}else{shade.style.background='rgba(0,0,0,.82)';shade.style.backdropFilter='blur(4px)';focus.style.display='none';coach.style.top='38%'}coach.innerHTML=`<div class="coach-top"><div class="coach-avatar">V</div><div><b>${st.title}</b><p>${st.text}</p></div></div>${!target?'<button data-action="finish-tutorial">Начать играть</button>':''}`}

document.addEventListener('click',e=>{const navBtn=e.target.closest('[data-tab]');if(navBtn&&!busy){tab=navBtn.dataset.tab;render();return}const a=e.target.closest('[data-action]');if(!a)return;const act=a.dataset.action;
  if(act==='claim-starter'){if(S.phones.length)return;S.phones.push({id:'iphone5',uses:[],broken:true});S.activePhone='iphone5';S.tutorial=1;tab='phones';save();render();toast('iPhone 5 получен');return}
  if(act==='repair'){if(S.cash<20000)return toast('Не хватает рублей');const op=ownedPhone(a.dataset.id);if(op&&!op.broken)return;S.cash-=20000;op.broken=false;S.tutorial=2;tab='profile';save();render();toast('Телефон отремонтирован');return}
  if(act==='save-name'){const v=$('#nickname').value.trim();if(v.length<3)return toast('Минимум 3 символа');S.name=v;if(S.tutorial===2){S.tutorial=3;tab='studio'}save();render();toast('Никнейм сохранён');return}
  if(act==='select-phone'){S.activePhone=a.dataset.id;if(S.tutorial===3)S.tutorial=4;save();render(true);haptic('light');return}
  if(act==='shoot'){shoot();return}
  if(act==='topic'){S.topic=+a.dataset.i;render(true);return}
  if(act==='claim-income'){if(S.pool<1)return toast('Пока нечего забирать');S.cash+=S.pool;const x=S.pool;S.pool=0;save();render(true);toast('Получено '+money(x));return}
  if(act==='go-cases'){document.querySelector('.section-label:last-of-type')?.scrollIntoView({behavior:'smooth'});return}
  if(act==='case-brand'){if(busy)return;S.caseBrand=a.dataset.brand;save();render(true);return}
  if(act==='open-phone-case'){openPhoneCase();return}
  if(act==='manage-phone'){managePhone(a.dataset.id);return}
  if(act==='attach-number'){S.numbers.forEach(n=>{if(n.phoneId===a.dataset.phone)n.phoneId=null});const n=S.numbers.find(n=>n.id===a.dataset.number);n.phoneId=a.dataset.phone;S.activeNumber=n.id;S.activePhone=a.dataset.phone;save();closeModal();toast('Номер установлен');return}
  if(act==='sell-phone'){const id=a.dataset.id,p=phone(id);S.phones=S.phones.filter(x=>x.id!==id);S.numbers.forEach(n=>{if(n.phoneId===id)n.phoneId=null});S.cash+=Math.round(p.value*.42);S.activePhone=S.phones[0]?.id||null;closeModal();toast('Телефон продан');return}
  if(act==='number-tab'){S.numberTab=a.dataset.v;render(true);return}
  if(act==='number-case'){S.numberCase=a.dataset.key;render(true);return}
  if(act==='generate-number'){generateNumber();return}
  if(act==='number-info'){numberInfo(a.dataset.id);return}
  if(act==='sell-number'){const n=S.numbers.find(x=>x.id===a.dataset.id);S.cash+=Math.round(n.value*.4);S.numbers=S.numbers.filter(x=>x.id!==n.id);if(S.activeNumber===n.id)S.activeNumber=null;closeModal();toast('Номер продан игре');return}
  if(act==='close-modal'){closeModal();return}
  if(act==='finish-tutorial'){S.tutorial=-1;tab='home';save();render();return}
  if(act==='reset'){if(confirm('Удалить весь прогресс и начать заново?')){localStorage.removeItem('viral-life-v2');location.reload()}return}
});

setInterval(()=>{if(S.videos.length){S.pool+=S.videos.reduce((a,v)=>a+v.income,0)/3600;save()}if(tab==='studio'&&ownedPhone(S.activePhone)){const label=$('.usage');if(label){const op=ownedPhone(S.activePhone);label.textContent=`Доступно: ${remaining(op)}/3${nextReady(op)}`}}},1000);
window.addEventListener('resize',()=>{moveNav();showTutorial()});
try{const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();tg.setHeaderColor('#050507');tg.setBackgroundColor('#050507');try{tg.disableVerticalSwipes()}catch(e){}const u=tg.initDataUnsafe?.user;if(u&&!S.name)S.name=(u.first_name||'').slice(0,18)}}catch(e){}
render(true);setTimeout(()=>$('#splash').classList.add('out'),1900);
