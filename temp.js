
// ─────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────
const GRAD_PRESETS = [
  { grad:'linear-gradient(135deg,#0d1b2a,#1a3a5c)', color:'#7eb8f7', pat:'dots'  },
  { grad:'linear-gradient(135deg,#1a0a28,#361a54)', color:'#b07ef7', pat:'grid'  },
  { grad:'linear-gradient(135deg,#0a2018,#1a5038)', color:'#7ef7b8', pat:'lines' },
  { grad:'linear-gradient(135deg,#2a1a0a,#5a3a18)', color:'#f7c87e', pat:'cross' },
  { grad:'linear-gradient(135deg,#28100a,#502018)', color:'#f78070', pat:'dots'  },
  { grad:'linear-gradient(135deg,#0a1428,#18284a)', color:'#70a8f7', pat:'lines' },
  { grad:'linear-gradient(135deg,#100e1c,#1e1c34)', color:'#9090c0', pat:'grid'  },
  { grad:'linear-gradient(135deg,#0a2028,#183850)', color:'#70d4e8', pat:'cross' },
];
const EMOJI_PRESETS = ['📁','🔥','⚡','💡','🚀','🎯','🧠','📱','🎨','💼','🌐','✨','🔮','📊','🎵','🏆','💎','🌙','☀️','🌊'];
const TOPIC_COLOR_PRESETS = [
  { color:'#7eb8f7', dot:'#5090d0' },
  { color:'#b07ef7', dot:'#9060d0' },
  { color:'#7ef7b8', dot:'#50c090' },
  { color:'#f7c87e', dot:'#d0a050' },
  { color:'#f78070', dot:'#d05050' },
  { color:'#70d4e8', dot:'#50b0c8' },
  { color:'#f770b8', dot:'#d050a0' },
  { color:'#c8e870', dot:'#a0c050' },
];

// Built-in project visual metadata
const PROJ_META_BUILTIN = {
  'twitter':        { grad:'linear-gradient(135deg,#0d1b2a,#1a3a5c)', emoji:'𝕏',  color:'#7eb8f7', pat:'dots'  },
  'roast-my-focus': { grad:'linear-gradient(135deg,#1a0a28,#361a54)', emoji:'🔥', color:'#b07ef7', pat:'grid'  },
  'deep-learning':  { grad:'linear-gradient(135deg,#0a2018,#1a5038)', emoji:'🧠', color:'#7ef7b8', pat:'lines' },
};

// Built-in topic metadata
const TOPIC_META_BUILTIN = {
  'social-media': { color:'#7eb8f7', dot:'#5090d0', label:'Social Media' },
  'master':       { color:'#b07ef7', dot:'#9060d0', label:'Master'       },
  'app':          { color:'#7ef7b8', dot:'#50c090', label:'App'          },
  '':             { color:'#6070a0', dot:'#506080', label:'None'         },
};

// ─────────────────────────────────────────────
// DIFFICULTY / MONEY
// ─────────────────────────────────────────────
const DIFF_MONEY  = {easy:10,'medium-easy':25,'medium-hard':50,hard:100};
const DIFF_LABELS = {easy:'Easy','medium-easy':'Med Easy','medium-hard':'Med Hard',hard:'Hard'};
const DIFF_COLORS = {easy:'var(--grn)','medium-easy':'#70a8f7','medium-hard':'var(--amb)',hard:'var(--red)'};

// ─────────────────────────────────────────────
// DATA MODEL
// ─────────────────────────────────────────────
const STORAGE_KEY = 'focus-os-v3';
const DEFAULTS = {
  tasks:[], templates:[], penalties:[], agents:[],
  settings:{
    topics:['social-media','master','app'],
    topicMeta:{},   // user-defined or user-customized topics
    projects:[
      {id:'twitter',        name:'Twitter',        topic:'social-media'},
      {id:'roast-my-focus', name:'Roast My Focus', topic:'app'         },
      {id:'deep-learning',  name:'Deep Learning',  topic:'master'      },
    ],
    projMeta:{},    // user-defined project visuals
  },
  lastRecurringCheck:null
};

function loadData(){
  try{
    const r=localStorage.getItem(STORAGE_KEY);
    if(r){
      const d=JSON.parse(r);
      d.settings=d.settings||DEFAULTS.settings;
      d.settings.topics=d.settings.topics||DEFAULTS.settings.topics;
      d.settings.topicMeta=d.settings.topicMeta||{};
      d.settings.projects=d.settings.projects||DEFAULTS.settings.projects;
      d.settings.projMeta=d.settings.projMeta||{};
      d.templates=d.templates||[];
      d.penalties=d.penalties||[];
      d.agents=d.agents||[];
      (d.tasks||[]).forEach(t=>{
        if(!('scheduledWeek' in t))t.scheduledWeek=null;
        if(!('scheduledDate' in t))t.scheduledDate=null;
        if(!('difficulty' in t))t.difficulty='medium-easy';
        if(!('penalized' in t))t.penalized=false;
        if(!('assignedAgent' in t))t.assignedAgent=null;
        if(!('salaryCredited' in t))t.salaryCredited=false;
      });
      return d;
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULTS));
}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(db));}
let db=loadData();

// ─────────────────────────────────────────────
// METADATA HELPERS (dynamic — support custom topics/projects)
// ─────────────────────────────────────────────
function getTopicMeta(t){
  const builtin=TOPIC_META_BUILTIN[t]||{color:'#8898b0',dot:'#6070a0',label:t||'None'};
  const user=db.settings.topicMeta[t]||{};
  return{...builtin,...user};
}
function getProjMeta(id){
  const builtin=PROJ_META_BUILTIN[id]||{grad:'linear-gradient(135deg,#111,#222)',emoji:'📁',color:'#8898b0',pat:'dots'};
  const user=db.settings.projMeta[id]||{};
  return{...builtin,...user};
}
function topicLabel(t){return getTopicMeta(t).label}
function projectName(id){return(db.settings.projects.find(p=>p.id===id)||{}).name||id||'—'}

// Returns the inner HTML for a project thumbnail div (handles both image and gradient)
function projThumbInner(pm){
  if(pm.img){return`<img src="${pm.img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;}
  return`<div class="proj-thumb-pattern pat-${pm.pat}" style="color:${pm.color};opacity:.35"></div>`;
}
function projThumbBgStyle(pm){
  return pm.img?'background:var(--s2)':'background:'+pm.grad;
}

// Topic tag inline style (works for any topic, built-in or custom)
function topicTagHtml(t){
  if(!t)return'';
  const m=getTopicMeta(t);
  const c=m.color;
  // parse hex to rgb for rgba() background
  const r=parseInt(c.slice(1,3),16)||136;
  const g=parseInt(c.slice(3,5),16)||152;
  const b=parseInt(c.slice(5,7),16)||176;
  return`<span class="tag" style="background:rgba(${r},${g},${b},.2);color:${c}">${m.label}</span>`;
}

const PRIO_DOT_CLS = {high:'p-high',medium:'p-med',low:'p-low'};
const STATUS_CLS   = {backlog:'s-backlog',todo:'s-todo','in-progress':'s-inprog',done:'s-done',failed:'s-failed'};
const STATUS_LABELS= {backlog:'Backlog',todo:'To Do','in-progress':'In Prog',done:'Done',failed:'Failed'};
function statusLabel(s){return STATUS_LABELS[s]||s}

function getFiltered(){
  return db.tasks.filter(t=>{
    if(activeTopic!==null&&t.topic!==activeTopic)return false;
    return true;
  });
}

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let currentView='daily', viewMode='daily', activeTopic=null;
let kanbanMode='todo'; // 'todo' | 'progress'
let selectedWeek='', selectedDay='';
let dailyTopicFilter=null, dailyProjFilter=null;
let planTopicFilter=null, planProjFilter=null;
let dragSource='';
let backlogSort={col:'createdAt',dir:'desc'};
let dragTaskId=null;
let assignTaskId=null;
let expandedWeeks=new Set();
let collapsedTopics=new Set();
let pendingSchedule={week:null,date:null};

// Visual creator state
let vcTopic='', vcProject='', vcStatus='todo', vcPriority='medium', vcDifficulty='medium-easy';

// Calendar view state
let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
let calTopicFilter=null, calProjFilter=null;

// Add-project modal state
let apGradIdx=0, apEmoji='📁', apImgData=null, apEditId=null;
// Add-topic modal state
let atColorIdx=0;
// Project detail state
let currentProjectId=null, pdCalMode='done', pdCalYear=new Date().getFullYear(), pdCalMonth=new Date().getMonth();

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function localDateStr(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseDate(s){
  if(typeof s!=='string')return new Date(s);
  const [y,m,d]=s.split('T')[0].split('-');
  return new Date(parseInt(y),parseInt(m)-1,parseInt(d));
}
function uuid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function todayStr(){return localDateStr(new Date());}
function escH(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function getMondayOf(d){
  const date=parseDate(d);
  const day=date.getDay();
  date.setDate(date.getDate()+(day===0?-6:1-day));
  return localDateStr(date);
}
function getWeekDates(mon){
  return Array.from({length:7},(_,i)=>{
    const d=parseDate(mon);d.setDate(d.getDate()+i);
    return localDateStr(d);
  });
}
function addDays(ds,n){const d=parseDate(ds);d.setDate(d.getDate()+n);return localDateStr(d);}
function addWeeks(ms,n){return addDays(ms,n*7)}
function formatWeekRange(mon){
  const dates=getWeekDates(mon);
  const s=parseDate(dates[0]),e=parseDate(dates[6]);
  const o={month:'short',day:'numeric'};
  if(s.getMonth()===e.getMonth())return`${s.toLocaleDateString('en-US',o)} – ${e.getDate()}, ${e.getFullYear()}`;
  return`${s.toLocaleDateString('en-US',o)} – ${e.toLocaleDateString('en-US',o)}, ${e.getFullYear()}`;
}
function formatDateLong(ds){return parseDate(ds).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
function formatDate(s){return s?parseDate(s).toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}
function dayAbbr(ds){return parseDate(ds).toLocaleDateString('en-US',{weekday:'short'})}
function dayNum(ds){return parseDate(ds).getDate()}
function showToast(msg,ms=2200){
  const el=document.getElementById('toast');
  el.textContent=msg;el.style.display='block';
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>el.style.display='none',ms);
}

// ─────────────────────────────────────────────
// RECURRING ENGINE
// ─────────────────────────────────────────────
function checkRecurring(){
  const today=todayStr();
  if(db.lastRecurringCheck===today)return;
  const dow=new Date().getDay();let n=0;
  db.templates.forEach(tmpl=>{
    if(!tmpl.days.includes(dow))return;
    const exists=db.tasks.some(t=>t.fromTemplate===tmpl.id&&t.dueDate===today);
    if(!exists){
      db.tasks.push({id:uuid(),title:tmpl.title,topic:tmpl.topic||'',project:tmpl.project||'',
        status:'todo',priority:tmpl.priority||'medium',dueDate:today,scheduledDate:today,
        scheduledWeek:getMondayOf(today),completedDate:null,notes:tmpl.notes||'',
        createdAt:new Date().toISOString(),fromTemplate:tmpl.id});
      n++;
    }
  });
  db.lastRecurringCheck=today;
  if(n>0){saveData();showToast(`${n} recurring task${n>1?'s':''} added`);}
  else saveData();
}

// ─────────────────────────────────────────────
// PENALTY ENGINE
// ─────────────────────────────────────────────
function checkPenalties(){
  const today=todayStr();
  let n=0,lost=0;
  db.tasks.forEach(t=>{
    if(!t.scheduledDate||t.scheduledDate>=today||t.status==='done'||t.penalized)return;
    t.penalized=true;
    const amount=DIFF_MONEY[t.difficulty]||0;
    db.penalties.push({id:uuid(),taskId:t.id,taskTitle:t.title,amount,
      date:t.scheduledDate,topic:t.topic||'',project:t.project||'',difficulty:t.difficulty||'medium-easy'});
    n++;lost+=amount;
  });
  if(n>0){saveData();showToast(`⚠ ${n} missed task${n>1?'s':''} — $${lost} lost`,3500);}
}

// ─────────────────────────────────────────────
// SIDEBAR — dynamic topics from db
// ─────────────────────────────────────────────
function getTopicGroups(){
  return [
    {id:null,key:'__all__',label:'All',dot:'#8898b0',hdr:'#a8bcd0'},
    ...db.settings.topics.map(t=>{
      const m=getTopicMeta(t);
      return{id:t,key:t,label:m.label,dot:m.dot,hdr:m.color};
    })
  ];
}
const VIEW_ITEMS=[
  {id:'projects', icon:'◉',label:'Stats'},
  {id:'daily',    icon:'▦',label:'Daily Kanban'},
  {id:'planning', icon:'◫',label:'Planning'},
  {id:'recurring',icon:'↻',label:'Recurring'},
  {id:'calendar', icon:'◷',label:'Calendar'},
];

function agentAvatarHtml(agent,size=26){
  if(agent.photo){
    return`<img src="${escH(agent.photo)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0">`;
  }
  return`<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--ac2);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*.5)}px;flex-shrink:0">${escH(agent.emoji||'🤖')}</div>`;
}

function renderSidebar(){
  const nav=document.getElementById('sidebar-nav');
  const topicHtml=getTopicGroups().map(group=>{
    const collapsed=collapsedTopics.has(group.key);
    const count=group.id===null?db.tasks.length:db.tasks.filter(t=>t.topic===group.id).length;
    const isActiveGroup=activeTopic===group.id;
    return`<div class="nav-group">
      <button class="nav-group-hdr" onclick="toggleTopicSection('${group.key}')">
        <span class="nav-group-label">
          <span class="nav-dot" style="background:${group.dot}"></span>
          <span style="color:${isActiveGroup?group.hdr:''}">${group.label}</span>
        </span>
        <div style="display:flex;align-items:center;gap:5px">
          <span class="nav-cnt">${count}</span>
          <span class="nav-caret">${collapsed?'▸':'▾'}</span>
        </div>
      </button>
      ${collapsed?'':VIEW_ITEMS.map(v=>{
        const isActive=activeTopic===group.id&&currentView===v.id;
        return`<button class="nav-item${isActive?' active':''}"
          onclick="selectTopicView(${group.id===null?'null':`'${group.id}'`},'${v.id}')">
          <span class="nav-item-icon">${v.icon}</span>${v.label}
        </button>`;
      }).join('')}
    </div>`;
  }).join('');

  // Agents section (fixed at bottom of topics)
  const agentsActive=currentView==='agents';
  const agentsSection=`<div style="border-top:1px solid var(--b1);margin:8px 0 0;padding-top:8px">
    <button class="nav-item${agentsActive?' active':''}" onclick="switchView('agents')" style="padding-left:12px">
      <span class="nav-item-icon">🤖</span>Agents
      <span class="nav-cnt" style="margin-left:auto">${db.agents.length}</span>
    </button>
  </div>`;

  nav.innerHTML=topicHtml+agentsSection;
}
function toggleTopicSection(key){collapsedTopics.has(key)?collapsedTopics.delete(key):collapsedTopics.add(key);renderSidebar();}
function selectTopicView(topicId,viewId){activeTopic=topicId;switchView(viewId);}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function switchView(view){
  currentView=view;
  if(view!=='project-detail')currentProjectId=null;
  renderSidebar();renderCurrentView();
}
function setMode(mode){viewMode=mode;currentView=mode;renderSidebar();renderCurrentView();}
function switchToDay(ds){selectedDay=ds;switchView('daily');}
function prevPeriod(){
  if(currentView==='weekly')selectedWeek=addWeeks(selectedWeek,-1);
  else selectedDay=addDays(selectedDay,-1);
  renderCurrentView();
}
function nextPeriod(){
  if(currentView==='weekly')selectedWeek=addWeeks(selectedWeek,1);
  else selectedDay=addDays(selectedDay,1);
  renderCurrentView();
}
function goToToday(){selectedWeek=getMondayOf(new Date());selectedDay=todayStr();renderCurrentView();}

function updateHeader(){
  const badge=document.getElementById('topic-badge');
  badge.style.display='none';
  const isDaily=currentView==='daily';
  document.getElementById('period-nav').style.display=isDaily?'flex':'none';
  document.getElementById('mode-toggle').style.display='none';
  document.getElementById('static-title').style.display=isDaily?'none':'block';
  if(isDaily)document.getElementById('period-lbl').textContent=formatDateLong(selectedDay).toUpperCase();
  const TITLES={projects:'Stats',weekly:'Weekly',planning:'Planning',recurring:'Recurring',calendar:'Calendar',stats:'Stats','project-detail':currentProjectId?projectName(currentProjectId):'Project',agents:'Agents'};
  if(TITLES[currentView]){
    const prefix=(activeTopic&&currentView!=='agents')?(topicLabel(activeTopic)+' · '):'';
    document.getElementById('static-title').textContent=(prefix+TITLES[currentView]).toUpperCase();
  }
}
function renderCurrentView(){
  updateHeader();
  if(currentView==='weekly')renderWeekly();
  else if(currentView==='daily')renderDaily();
  else if(currentView==='projects')renderStatsView();
  else if(currentView==='planning')renderPlanning();
  else if(currentView==='recurring')renderRecurringView();
  else if(currentView==='calendar')renderCalendarView();
  else if(currentView==='stats')renderStatsView();
  else if(currentView==='agents')renderAgents();
  else if(currentView==='project-detail')renderProjectDetail(currentProjectId);
}

function renderAgentBadge(agentId){
  const ag=db.agents.find(x=>x.id===agentId);
  if(!ag)return'';
  return`<span class="tag" style="background:var(--s2);color:var(--wh);display:flex;align-items:center;padding:2px 4px;gap:4px;border:1px solid var(--b1)">${agentAvatarHtml(ag,12)} ${escH(ag.name)}</span>`;
}

// ─────────────────────────────────────────────
// TASK CARD HTML
// ─────────────────────────────────────────────
function taskCard(t,ctx){
  const done=t.status==='done';
  const failed=t.status==='failed';
  const over=t.dueDate&&t.dueDate<todayStr()&&!done&&!failed;
  return`<div draggable="true"
    ondragstart="dzStart(event,'${t.id}')"
    onclick="openVC('${t.id}')"
    class="task-card${done?' is-done':''}">
    <div class="tc-title${done?' done':failed?' failed':''}">${escH(t.title)}</div>
    <div class="tc-meta">
      ${topicTagHtml(t.topic)}
      ${t.project?`<span class="tag" style="background:rgba(255,255,255,.06);color:var(--su)">${escH(projectName(t.project))}</span>`:''}
      ${t.assignedAgent?renderAgentBadge(t.assignedAgent):t.person?`<span class="tag" style="background:var(--ac2);color:var(--wh)">@${escH(t.person)}</span>`:''}
      ${ctx==='weekly'?`<span class="tag ${STATUS_CLS[t.status]||''}">${statusLabel(t.status)}</span>`:''}
      ${t.fromTemplate?`<span style="font-size:9px;color:var(--ac)">↻</span>`:''}
      ${t.difficulty&&t.difficulty!=='medium-easy'?`<span class="diff-badge diff-${t.difficulty}">${DIFF_LABELS[t.difficulty]||''}</span>`:''}
      <span class="prio-dot ${PRIO_DOT_CLS[t.priority]||'p-low'}" style="margin-left:auto"></span>
      ${over?`<span style="font-size:9px;color:var(--red);font-family:var(--fm)">⚠ ${formatDate(t.dueDate)}</span>`:''}
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// AGENTS VIEW
// ─────────────────────────────────────────────
function renderAgents(){
  const wrap=document.getElementById('view-content');
  if(db.agents.length===0){
    wrap.innerHTML=`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--mu)">
      <div style="font-size:32px;margin-bottom:12px">🤖</div>
      <div style="font-family:var(--fm);font-size:11px;letter-spacing:.08em">NO AI AGENTS YET</div>
      <button onclick="openAgentModal()" style="margin-top:20px;padding:8px 16px;background:var(--ac);color:var(--wh);border:none;border-radius:6px;font-family:var(--fm);font-size:10px;cursor:pointer">+ CREATE FIRST AGENT</button>
    </div>`;
    return;
  }
  let html=`<div class="agents-wrap">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <span style="font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mu)">AI AGENTS</span>
      <button onclick="openAgentModal()" style="font-family:var(--fm);font-size:9px;color:var(--ac);background:none;border:1px solid var(--b1);padding:4px 10px;border-radius:6px;cursor:pointer;letter-spacing:.06em;transition:all .1s" onmouseover="this.style.borderColor='var(--ac)'" onmouseout="this.style.borderColor='var(--b1)'">+ NEW AGENT</button>
    </div>
    <div class="agents-grid">`;
  
  db.agents.forEach(ag=>{
    const ptasks=db.tasks.filter(t=>t.assignedAgent===ag.id);
    const earned=ptasks.filter(t=>t.status==='done').reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
    const lost=ptasks.filter(t=>t.status==='failed').reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
    const balance=earned-lost;
    const activeTasks=ptasks.filter(t=>t.status==='todo'||t.status==='in-progress');

    html+=`<div class="agent-card" onclick="openAgentModal('${ag.id}')">
      <div class="agent-card-top">
        ${agentAvatarHtml(ag,38)}
        <div style="flex:1;min-width:0">
          <div class="agent-name">${escH(ag.name)}</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--mu);margin-top:2px">${activeTasks.length} active tasks</div>
        </div>
      </div>
      <div class="agent-context">${escH(ag.context||'')}</div>
      <div class="agent-stats-row">
        <div class="agent-stat" style="color:var(--grn)">
          <div class="agent-stat-val">+$${earned}</div>
          <div class="agent-stat-lbl">EARNED</div>
        </div>
        <div class="agent-stat" style="color:var(--act);border-left:1px solid var(--b1)">
          <div class="agent-stat-val">$${balance}</div>
          <div class="agent-stat-lbl">BALANCE</div>
        </div>
        <div class="agent-stat" style="color:var(--red);border-left:1px solid var(--b1)">
          <div class="agent-stat-val">-$${lost}</div>
          <div class="agent-stat-lbl">LOST</div>
        </div>
      </div>
    </div>`;
  });
  
  html+=`</div></div>`;
  wrap.innerHTML=html;
}

function openAgentModal(id=null){
  const ttl=document.getElementById('agent-modal-ttl');
  const inpInp=document.getElementById('agent-id');
  const inpEm=document.getElementById('agent-emoji');
  const inpPh=document.getElementById('agent-photo');
  const inpNm=document.getElementById('agent-name');
  const inpCtx=document.getElementById('agent-context');
  const delBtn=document.getElementById('agent-del-btn');
  const m=document.getElementById('agent-modal');
  if(id){
    const a=db.agents.find(x=>x.id===id);
    if(a){
      ttl.textContent='Edit Agent';inpInp.value=id;inpEm.value=a.emoji||'';inpPh.value=a.photo||'';
      inpNm.value=a.name;inpCtx.value=a.context||'';delBtn.style.display='inline-block';
    }
  }else{
    ttl.textContent='New Agent';inpInp.value='';inpEm.value='🤖';inpPh.value='';
    inpNm.value='';inpCtx.value='';delBtn.style.display='none';
  }
  updateAgentAvatarPreview();
  m.style.display='flex';
  setTimeout(()=>inpNm.focus(),10);
}
function closeAgentModal(){
  document.getElementById('agent-modal').style.display='none';
}
function updateAgentAvatarPreview(){
  const e=document.getElementById('agent-emoji').value.trim();
  const p=document.getElementById('agent-photo').value.trim();
  const prev=document.getElementById('agent-avatar-preview');
  prev.innerHTML=agentAvatarHtml({emoji:e,photo:p},56);
}
function saveAgent(){
  let id=document.getElementById('agent-id').value;
  const em=document.getElementById('agent-emoji').value.trim();
  const ph=document.getElementById('agent-photo').value.trim();
  const nm=document.getElementById('agent-name').value.trim();
  const ctx=document.getElementById('agent-context').value.trim();
  if(!nm)return showToast('Agent needs a name');
  if(id){
    const a=db.agents.find(x=>x.id===id);
    if(a){a.name=nm;a.emoji=em;a.photo=ph;a.context=ctx;}
  }else{
    db.agents.push({id:'ag_'+uuid(),name:nm,emoji:em,photo:ph,context:ctx});
  }
  saveData();closeAgentModal();
  if(currentView==='agents')renderAgents();
  else if(currentView==='planning')renderPlanning();
  showToast('Agent saved');
  renderSidebar();
}
function deleteAgent(){
  let id=document.getElementById('agent-id').value;
  db.agents=db.agents.filter(a=>a.id!==id);
  db.tasks.forEach(t=>{if(t.assignedAgent===id)t.assignedAgent=null;});
  saveData();closeAgentModal();
  if(currentView==='agents')renderAgents();
  renderSidebar();
  showToast('Agent deleted');
}

// ─────────────────────────────────────────────
// PROJECTS HUB
// ─────────────────────────────────────────────
function renderProjectsHub(){
  const tasks=getFiltered();
  const projs=activeTopic?db.settings.projects.filter(p=>p.topic===activeTopic):db.settings.projects;

  document.getElementById('view-content').innerHTML=`
  <div style="height:100%;overflow-y:auto;padding:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <span style="font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mu)">${activeTopic?topicLabel(activeTopic)+' · ':''}Projects</span>
      <button onclick="openAddProjModal()" style="font-family:var(--fm);font-size:9px;color:var(--ac);background:none;border:1px solid var(--b1);padding:4px 10px;border-radius:6px;cursor:pointer;letter-spacing:.06em;transition:all .1s" onmouseover="this.style.borderColor='var(--ac)'" onmouseout="this.style.borderColor='var(--b1)'">+ NEW PROJECT</button>
    </div>
    <div class="projects-grid">
      ${projs.map(p=>{
        const pm=getProjMeta(p.id);
        const ptasks=tasks.filter(t=>t.project===p.id);
        const done=ptasks.filter(t=>t.status==='done').length;
        const ptm=getTopicMeta(p.topic);
        const money=ptasks.filter(t=>t.status==='done').reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
        return `<div class="proj-card drop-zone" id="proj-${p.id}" style="position:relative"
          ondragover="dzOver(event,'proj-${p.id}','project')"
          ondrop="dzDrop(event,'${p.id}','project')"
          ondragleave="dzLeave(event)">
          <div class="proj-thumb" style="${projThumbBgStyle(pm)}" onclick="openProjectDetail('${p.id}')">
            ${projThumbInner(pm)}
            <span class="proj-thumb-emoji" style="position:relative;z-index:1">${pm.emoji}</span>
          </div>
          <button onclick="event.stopPropagation();openAddProjModal('${p.id}')" style="position:absolute;top:8px;right:8px;background:rgba(9,9,16,.7);border:1px solid rgba(255,255,255,.1);color:var(--su);border-radius:5px;padding:3px 7px;font-family:var(--fm);font-size:8px;cursor:pointer;letter-spacing:.06em;backdrop-filter:blur(4px);transition:color .1s;z-index:2" onmouseover="this.style.color='var(--wh)'" onmouseout="this.style.color='var(--su)'">✏ EDIT</button>
          <div class="proj-drop-hint">DROP HERE</div>
          <div class="proj-body" onclick="openProjectDetail('${p.id}')" style="cursor:pointer">
            <div class="proj-name">${escH(p.name)}</div>
            <div class="proj-meta">
              <span style="font-family:var(--fm);font-size:9px;letter-spacing:.06em;color:${ptm.color}">${ptm.label}</span>
              <span class="proj-cnt">${ptasks.length} tasks</span>
            </div>
            ${money>0?`<div style="font-family:var(--fm);font-size:9px;color:var(--grn);margin-top:4px">$${money.toLocaleString()} earned</div>`:''}
            ${ptasks.length>0?`<div style="margin-top:6px;height:3px;background:var(--s2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.round(done/ptasks.length*100)}%;background:var(--grn);border-radius:99px"></div></div>`:''}
          </div>
        </div>`;
      }).join('')}
      <div onclick="openAddProjModal()" style="border:2px dashed var(--b2);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:180px;cursor:pointer;transition:all .1s;color:var(--b3)"
        onmouseover="this.style.borderColor='var(--ac)';this.style.color='var(--ac)'" onmouseout="this.style.borderColor='var(--b2)';this.style.color='var(--b3)'">
        <span style="font-size:24px">+</span>
        <span style="font-family:var(--fm);font-size:9px;letter-spacing:.1em">NEW PROJECT</span>
      </div>
    </div>
  </div>`;
}

function openProjectDetail(projId){
  currentProjectId=projId;
  pdCalYear=new Date().getFullYear();pdCalMonth=new Date().getMonth();pdCalMode='done';
  currentView='project-detail';renderSidebar();renderCurrentView();
}

function pdCalPrev(){pdCalMonth--;if(pdCalMonth<0){pdCalMonth=11;pdCalYear--;}renderProjectDetail(currentProjectId);}
function pdCalNext(){pdCalMonth++;if(pdCalMonth>11){pdCalMonth=0;pdCalYear++;}renderProjectDetail(currentProjectId);}
function pdSetCalMode(m){pdCalMode=m;renderProjectDetail(currentProjectId);}

function renderProjectDetail(projId){
  const proj=db.settings.projects.find(p=>p.id===projId);
  if(!proj){switchView('projects');return;}
  const pm=getProjMeta(projId);
  const ptm=getTopicMeta(proj.topic);
  const today=todayStr();
  const thisWeek=getMondayOf(today);

  // All tasks for this project
  const all=db.tasks.filter(t=>t.project===projId);
  const doneTasks=all.filter(t=>t.status==='done');
  const weekTasks=all.filter(t=>t.scheduledWeek===thisWeek&&t.status!=='done');
  const totalMoney=doneTasks.reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
  const countByDiff={easy:0,'medium-easy':0,'medium-hard':0,hard:0};
  doneTasks.forEach(t=>{if(t.difficulty&&countByDiff[t.difficulty]!==undefined)countByDiff[t.difficulty]++;});

  // Mini calendar
  const firstDay=new Date(pdCalYear,pdCalMonth,1);
  const daysInMonth=new Date(pdCalYear,pdCalMonth+1,0).getDate();
  const startOffset=(firstDay.getDay()+6)%7;
  const calTasks=pdCalMode==='done'
    ?doneTasks.filter(t=>t.completedDate)
    :all.filter(t=>t.status!=='done'&&t.scheduledDate);
  const byDate={};
  calTasks.forEach(t=>{
    const d=pdCalMode==='done'?t.completedDate:t.scheduledDate;
    if(d){if(!byDate[d])byDate[d]=[];byDate[d].push(t);}
  });
  const cells=[];
  for(let i=0;i<startOffset;i++){const d=new Date(pdCalYear,pdCalMonth,1-(startOffset-i));cells.push({date:localDateStr(d),other:true});}
  for(let d=1;d<=daysInMonth;d++){const ds=`${pdCalYear}-${String(pdCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;cells.push({date:ds,other:false});}
  while(cells.length<42){const d=new Date(pdCalYear,pdCalMonth+1,cells.length-startOffset-daysInMonth+1);cells.push({date:localDateStr(d),other:true});}
  const monthLabel=firstDay.toLocaleDateString('en-US',{month:'long',year:'numeric'});

  document.getElementById('view-content').innerHTML=`
  <div class="pd-wrap">
    <div class="pd-hero">
      <div class="pd-hero-bg" style="${projThumbBgStyle(pm)}">
        ${projThumbInner(pm)}
      </div>
      <div class="pd-hero-overlay"></div>
      <button class="pd-back" onclick="switchView('projects')">← Projects</button>
      <button class="pd-edit-btn" onclick="openAddProjModal('${projId}')">✏ Edit Style</button>
      <div class="pd-hero-content">
        <div class="pd-hero-emoji">${pm.emoji}</div>
        <div class="pd-hero-info">
          <div class="pd-hero-name">${escH(proj.name)}</div>
          <div class="pd-hero-meta">
            <span style="color:${ptm.color}">${ptm.label}</span>
            &nbsp;·&nbsp;${all.length} tasks&nbsp;·&nbsp;<span style="color:var(--grn)">$${totalMoney.toLocaleString()} earned</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pd-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

        <!-- This Week -->
        <div class="pd-section">
          <div class="pd-section-title">
            This Week
            <span style="color:var(--b3)">${weekTasks.length} tasks</span>
          </div>
          ${weekTasks.length===0
            ?`<div style="font-family:var(--fm);font-size:9px;color:var(--b3);padding:10px 0;text-align:center">No tasks scheduled this week</div>`
            :weekTasks.map(t=>`<div class="pd-task-row" onclick="openVC('${t.id}')">
              <span class="prio-dot ${PRIO_DOT_CLS[t.priority]||'p-low'}"></span>
              <span class="pd-task-title">${escH(t.title)}</span>
              <span class="tag ${STATUS_CLS[t.status]||''}" style="flex-shrink:0">${statusLabel(t.status)}</span>
              ${t.difficulty?`<span class="diff-badge diff-${t.difficulty}" style="flex-shrink:0">${DIFF_LABELS[t.difficulty]}</span>`:''}
            </div>`).join('')}
          <button onclick="openVC(null,'todo',null)" style="margin-top:6px;width:100%;border:1px dashed var(--b2);background:none;border-radius:7px;padding:6px;font-family:var(--fm);font-size:9px;color:var(--b3);cursor:pointer;transition:color .1s" onmouseover="this.style.color='var(--su)'" onmouseout="this.style.color='var(--b3)'">+ ADD TASK</button>
        </div>

        <!-- Stats -->
        <div class="pd-section">
          <div class="pd-section-title">Stats</div>
          <div style="display:flex;gap:16px;margin-bottom:14px">
            <div>
              <div style="font-family:var(--fm);font-size:24px;font-weight:700;color:var(--wh);line-height:1">$${totalMoney.toLocaleString()}</div>
              <div style="font-family:var(--fm);font-size:9px;color:var(--mu);margin-top:3px">total earned</div>
            </div>
            <div>
              <div style="font-family:var(--fm);font-size:24px;font-weight:700;color:var(--grn);line-height:1">${doneTasks.length}</div>
              <div style="font-family:var(--fm);font-size:9px;color:var(--mu);margin-top:3px">tasks done</div>
            </div>
            <div>
              <div style="font-family:var(--fm);font-size:24px;font-weight:700;color:var(--bl);line-height:1">${all.filter(t=>t.status!=='done').length}</div>
              <div style="font-family:var(--fm);font-size:9px;color:var(--mu);margin-top:3px">remaining</div>
            </div>
          </div>
          ${all.length>0?`<div style="height:4px;background:var(--s2);border-radius:99px;overflow:hidden;margin-bottom:12px">
            <div style="height:100%;width:${Math.round(doneTasks.length/all.length*100)}%;background:var(--grn);border-radius:99px"></div>
          </div>`:''}
          ${Object.entries(countByDiff).map(([d,c])=>c>0?`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
            <span class="diff-badge diff-${d}">${DIFF_LABELS[d]}</span>
            <div style="display:flex;gap:8px;align-items:center">
              <span style="font-family:var(--fm);font-size:9px;color:var(--su)">${c}×</span>
              <span style="font-family:var(--fm);font-size:9px;font-weight:700;color:${DIFF_COLORS[d]}">$${(c*DIFF_MONEY[d]).toLocaleString()}</span>
            </div>
          </div>`:'').join('')}
        </div>
      </div>

      <!-- Calendar -->
      <div class="pd-section">
        <div class="pd-section-title">
          Calendar
          <div style="display:flex;align-items:center;gap:6px">
            <div style="display:flex;background:var(--s2);border:1px solid var(--b1);border-radius:6px;padding:2px;gap:2px">
              <button class="mode-btn${pdCalMode==='done'?' active':''}" onclick="pdSetCalMode('done')">DONE</button>
              <button class="mode-btn${pdCalMode==='todo'?' active':''}" onclick="pdSetCalMode('todo')">TO-DO</button>
            </div>
            <button class="period-btn" onclick="pdCalPrev()">&#8249;</button>
            <span style="font-family:var(--fm);font-size:9px;color:var(--w2);min-width:100px;text-align:center">${monthLabel.toUpperCase()}</span>
            <button class="period-btn" onclick="pdCalNext()">&#8250;</button>
          </div>
        </div>
        <div class="cal-grid">
          ${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d=>`<div class="cal-day-hdr">${d}</div>`).join('')}
          ${cells.map(cell=>{
            const ct=byDate[cell.date]||[];
            const isToday=cell.date===today;
            const show=ct.slice(0,2);const more=ct.length-show.length;
            return`<div class="cal-cell${cell.other?' other-month':''}${isToday?' today':''}${ct.length>0?' has-tasks':''}">
              <div class="cal-date-num${isToday?' today':''}">${parseInt(cell.date.split('-')[2])}</div>
              ${show.map(t=>`<div class="cal-task-chip" onclick="event.stopPropagation();openVC('${t.id}')"
                style="background:${pdCalMode==='done'?'rgba(88,192,144,.15)':'rgba(90,120,152,.15)'};color:${pdCalMode==='done'?'var(--grn)':'var(--bl)'}"
                title="${escH(t.title)}">${escH(t.title)}</div>`).join('')}
              ${more>0?`<div class="cal-more">+${more}</div>`:''}
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Done Tasks -->
      <div class="pd-section">
        <div class="pd-section-title">
          Completed Tasks
          <span style="color:var(--b3)">${doneTasks.length}</span>
        </div>
        ${doneTasks.length===0
          ?`<div style="font-family:var(--fm);font-size:9px;color:var(--b3);padding:10px 0;text-align:center">No completed tasks yet</div>`
          :[...doneTasks].sort((a,b)=>(b.completedDate||'').localeCompare(a.completedDate||'')).slice(0,20).map(t=>`
          <div class="pd-task-row" onclick="openVC('${t.id}')">
            <span style="font-size:10px;color:var(--grn)">✓</span>
            <span class="pd-task-title done">${escH(t.title)}</span>
            ${t.difficulty?`<span class="diff-badge diff-${t.difficulty}" style="flex-shrink:0">${DIFF_LABELS[t.difficulty]}</span>`:''}
            <span style="font-family:var(--fm);font-size:9px;color:var(--grn);flex-shrink:0">$${DIFF_MONEY[t.difficulty]||0}</span>
            <span style="font-family:var(--fm);font-size:9px;color:var(--mu);flex-shrink:0">${t.completedDate?formatDate(t.completedDate):''}</span>
          </div>`).join('')}
        ${doneTasks.length>20?`<div style="font-family:var(--fm);font-size:9px;color:var(--mu);text-align:center;padding:6px">Showing 20 of ${doneTasks.length}</div>`:''}
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// WEEKLY VIEW
// ─────────────────────────────────────────────
function setKanbanMode(m){kanbanMode=m;renderCurrentView();}

function renderWeekly(){
  const tasks=getFiltered();const weekDates=getWeekDates(selectedWeek);const today=todayStr();

  const toggle=`<div style="padding:10px 14px 2px;flex-shrink:0;display:flex;align-items:center;gap:8px">
    <div class="mode-toggle">
      <button class="mode-btn${kanbanMode==='todo'?' active':''}" onclick="setKanbanMode('todo')">TO-DO</button>
      <button class="mode-btn${kanbanMode==='progress'?' active':''}" onclick="setKanbanMode('progress')">DOING / DONE</button>
    </div>
  </div>`;

  if(kanbanMode==='todo'){
    const weekBacklog=tasks.filter(t=>t.scheduledWeek===selectedWeek&&!t.scheduledDate&&(t.status==='todo'||t.status==='backlog'));
    const cols=[{id:'__weekbacklog__',isBacklog:true,label:'Week',tasks:weekBacklog}]
      .concat(weekDates.map(d=>({id:d,isBacklog:false,label:dayAbbr(d),num:dayNum(d),isToday:d===today,tasks:tasks.filter(t=>t.scheduledDate===d&&(t.status==='todo'||t.status==='backlog'))})));
    document.getElementById('view-content').innerHTML=`
    <div style="display:flex;flex-direction:column;height:100%">
      ${toggle}
      <div style="display:flex;gap:10px;padding:8px 14px 14px;overflow-x:auto;flex:1">
        ${cols.map(col=>`
        <div style="flex-shrink:0;width:182px;display:flex;flex-direction:column">
          <div class="col-hdr">
            <div class="col-hdr-left">
              ${col.isBacklog
                ?`<span style="font-family:var(--fm);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ac)">◈ WEEK</span>`
                :`<button onclick="switchToDay('${col.id}')" style="background:none;border:none;cursor:pointer;display:flex;align-items:baseline;gap:5px;color:inherit">
                    <span class="col-day-num${col.isToday?' today':''}">${col.num}</span>
                    <span class="col-day-abbr${col.isToday?' today':''}">${col.label}</span>
                  </button>`}
            </div>
            <div class="col-hdr-right">
              <span class="col-cnt">${col.tasks.length}</span>
              <button class="col-add" onclick="event.stopPropagation();openVC(null,'todo',${col.isBacklog?'null':`'${col.id}'`})">+</button>
            </div>
          </div>
          <div id="wcol-${escH(col.id)}" class="day-col drop-zone"
            style="border-top-color:${col.isBacklog?'var(--ac)':col.isToday?'var(--bl)':'var(--b2)'}"
            ondragover="dzOver(event,'${escH(col.id)}','weekly')"
            ondrop="dzDrop(event,'${escH(col.id)}','weekly')"
            ondragleave="dzLeave(event)">
            ${col.tasks.length===0?`<div class="empty-col">${col.isBacklog?'PLAN VIA PLANNING VIEW':'DROP OR CLICK +'}</div>`:col.tasks.map(t=>taskCard(t,'weekly')).join('')}
          </div>
        </div>`).join('')}
      </div>
    </div>`;

  }else{
    // DOING / DONE view — each day split into two sub-columns
    document.getElementById('view-content').innerHTML=`
    <div style="display:flex;flex-direction:column;height:100%">
      ${toggle}
      <div style="display:flex;gap:8px;padding:8px 14px 14px;overflow-x:auto;flex:1">
        ${weekDates.map(d=>{
          const isToday=d===today;
          const doingT=tasks.filter(t=>t.scheduledDate===d&&t.status==='in-progress');
          const doneT=tasks.filter(t=>t.scheduledDate===d&&t.status==='done');
          const total=doingT.length+doneT.length;
          return`<div style="flex-shrink:0;width:272px;display:flex;flex-direction:column">
            <div class="col-hdr">
              <div class="col-hdr-left">
                <button onclick="switchToDay('${d}')" style="background:none;border:none;cursor:pointer;display:flex;align-items:baseline;gap:5px;color:inherit">
                  <span class="col-day-num${isToday?' today':''}">${dayNum(d)}</span>
                  <span class="col-day-abbr${isToday?' today':''}">${dayAbbr(d)}</span>
                </button>
              </div>
              <div class="col-hdr-right">
                <span class="col-cnt">${total}</span>
                <button class="col-add" onclick="event.stopPropagation();openVC(null,'in-progress','${d}')">+</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;flex:1">
              <div style="display:flex;flex-direction:column">
                <div style="font-family:var(--fm);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--amb);padding:3px 4px 5px;display:flex;align-items:center;gap:4px">
                  Doing <span class="col-cnt">${doingT.length}</span>
                </div>
                <div id="wpd-${d}-doing" class="day-col drop-zone" style="border-top-color:var(--amb);min-height:120px;padding:6px"
                  ondragover="dzOver(event,'${d}|in-progress','weekly-progress')"
                  ondrop="dzDrop(event,'${d}|in-progress','weekly-progress')"
                  ondragleave="dzLeave(event)">
                  ${doingT.length===0?`<div class="empty-col" style="font-size:8px">DROP</div>`:doingT.map(t=>taskCard(t,'weekly')).join('')}
                </div>
              </div>
              <div style="display:flex;flex-direction:column">
                <div style="font-family:var(--fm);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--grn);padding:3px 4px 5px;display:flex;align-items:center;gap:4px">
                  Done <span class="col-cnt">${doneT.length}</span>
                </div>
                <div id="wpd-${d}-done" class="day-col drop-zone" style="border-top-color:var(--grn);min-height:120px;padding:6px"
                  ondragover="dzOver(event,'${d}|done','weekly-progress')"
                  ondrop="dzDrop(event,'${d}|done','weekly-progress')"
                  ondragleave="dzLeave(event)">
                  ${doneT.length===0?`<div class="empty-col" style="font-size:8px">DROP</div>`:doneT.map(t=>taskCard(t,'weekly')).join('')}
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }
}

// ─────────────────────────────────────────────
// DAILY KANBAN VIEW
// ─────────────────────────────────────────────
function setDailyTopicFilter(t){dailyTopicFilter=t;dailyProjFilter=null;renderCurrentView();}
function setDailyProjFilter(p){dailyProjFilter=p;renderCurrentView();}

function renderDailyFilterBar(){
  // Topic chips
  const topics=db.settings.topics;
  const tChips=topics.map(t=>{
    const m=getTopicMeta(t);const active=dailyTopicFilter===t;
    const r=parseInt(m.color.slice(1,3),16)||136,g=parseInt(m.color.slice(3,5),16)||152,b=parseInt(m.color.slice(5,7),16)||176;
    return`<button onclick="setDailyTopicFilter('${t}')" style="display:flex;align-items:center;gap:5px;font-family:var(--fm);font-size:9px;padding:4px 10px;border-radius:99px;border:1px solid ${active?m.color:'var(--b2)'};background:${active?`rgba(${r},${g},${b},.18)`:'none'};color:${active?m.color:'var(--su)'};cursor:pointer;letter-spacing:.05em;transition:all .1s">
      <span style="width:5px;height:5px;border-radius:50%;background:${m.dot};flex-shrink:0"></span>${m.label}
    </button>`;
  }).join('');

  // Project chips (filtered by topic if active)
  const projs=dailyTopicFilter?db.settings.projects.filter(p=>p.topic===dailyTopicFilter):db.settings.projects;
  const pChips=projs.map(p=>{
    const pm=getProjMeta(p.id);const active=dailyProjFilter===p.id;
    return`<button onclick="setDailyProjFilter('${p.id}')" style="font-family:var(--fm);font-size:9px;padding:4px 10px;border-radius:99px;border:1px solid ${active?pm.color:'var(--b2)'};background:${active?'rgba(90,120,152,.18)':'none'};color:${active?pm.color:'var(--su)'};cursor:pointer;letter-spacing:.05em;transition:all .1s">${escH(p.name)}</button>`;
  }).join('');

  const hasFilter=dailyTopicFilter!==null||dailyProjFilter!==null;
  const clearBtn=hasFilter?`<button onclick="setDailyTopicFilter(null)" style="font-family:var(--fm);font-size:9px;padding:4px 10px;border-radius:99px;border:1px solid var(--red);color:var(--red);background:none;cursor:pointer;letter-spacing:.05em;transition:all .1s">✕ Clear</button>`:'';

  const sep=projs.length>0?`<div style="width:1px;height:16px;background:var(--b2);flex-shrink:0"></div>`:'';

  return`<div style="padding:10px 16px;flex-shrink:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--b1)">
    <span style="font-family:var(--fm);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);flex-shrink:0">Filter:</span>
    <button onclick="setDailyTopicFilter(null)" style="font-family:var(--fm);font-size:9px;padding:4px 10px;border-radius:99px;border:1px solid ${dailyTopicFilter===null&&dailyProjFilter===null?'var(--ac)':'var(--b2)'};background:${dailyTopicFilter===null&&dailyProjFilter===null?'rgba(90,120,152,.18)':'none'};color:${dailyTopicFilter===null&&dailyProjFilter===null?'var(--wh)':'var(--su)'};cursor:pointer;letter-spacing:.05em;transition:all .1s">All</button>
    ${tChips}
    ${sep}
    ${pChips}
    ${clearBtn}
  </div>`;
}

function renderDaily(){
  let tasks=db.tasks.filter(t=>t.scheduledDate===selectedDay);
  if(dailyTopicFilter!==null)tasks=tasks.filter(t=>t.topic===dailyTopicFilter);
  if(dailyProjFilter!==null)tasks=tasks.filter(t=>t.project===dailyProjFilter);

  const todoTasks=tasks.filter(t=>t.status==='todo'||t.status==='backlog');
  const doingTasks=tasks.filter(t=>t.status==='in-progress');
  const doneTasks=tasks.filter(t=>t.status==='done');

  const cols=[
    {id:'todo',       label:'TO-DO',  accent:'var(--bl)',  border:'var(--bl)',  tasks:todoTasks},
    {id:'in-progress',label:'DOING',  accent:'var(--amb)', border:'var(--amb)', tasks:doingTasks},
    {id:'done',       label:'DONE',   accent:'var(--grn)', border:'var(--grn)', tasks:doneTasks},
  ];

  document.getElementById('view-content').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    ${renderDailyFilterBar()}
    <div style="display:flex;gap:12px;padding:12px 16px 16px;flex:1;overflow:auto">
      ${cols.map(col=>`
      <div style="flex:1;min-width:220px;display:flex;flex-direction:column">
        <div class="col-hdr">
          <div class="col-hdr-left">
            <span style="font-family:var(--fm);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${col.accent};font-weight:700">${col.label}</span>
            <span class="col-cnt">${col.tasks.length}</span>
          </div>
          <button class="col-add" onclick="openVC(null,'${col.id}','${selectedDay}')">+</button>
        </div>
        <div id="dcol-${escH(col.id)}" class="day-col drop-zone"
          style="flex:1;border-top-color:${col.border};border-top-width:2px"
          ondragover="dzOver(event,'${escH(col.id)}','daily')"
          ondrop="dzDrop(event,'${escH(col.id)}','daily')"
          ondragleave="dzLeave(event)">
          ${col.tasks.length===0
            ?`<div class="empty-col">DROP HERE</div>`
            :col.tasks.map(t=>taskCard(t,'daily')).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// PLANNING VIEW
// ─────────────────────────────────────────────
function setPlanTopicFilter(t){planTopicFilter=t;planProjFilter=null;renderPlanning();}
function setPlanProjFilter(p){planProjFilter=p;renderPlanning();}

function getPlanFiltered(){
  let tasks=db.tasks;
  const topicF=activeTopic!==null?activeTopic:planTopicFilter;
  if(topicF!==null)tasks=tasks.filter(t=>t.topic===topicF);
  if(planProjFilter!==null)tasks=tasks.filter(t=>t.project===planProjFilter);
  return tasks;
}

function renderPlanFilterBar(){
  const effectiveTopic=activeTopic!==null?activeTopic:planTopicFilter;
  const availProjs=effectiveTopic!==null
    ?db.settings.projects.filter(p=>p.topic===effectiveTopic)
    :db.settings.projects;

  const chipStyle=(active,color)=>
    `font-family:var(--fm);font-size:9px;padding:4px 10px;border-radius:99px;border:1px solid ${active?color:'var(--b2)'};background:${active?'rgba(90,120,152,.18)':'none'};color:${active?color:'var(--su)'};cursor:pointer;letter-spacing:.05em;transition:all .1s`;

  // Topic chips — only when activeTopic is null
  let topicSection='';
  if(activeTopic===null){
    const tChips=db.settings.topics.map(t=>{
      const m=getTopicMeta(t);const active=planTopicFilter===t;
      return`<button onclick="setPlanTopicFilter('${t}')" style="${chipStyle(active,m.color)};display:flex;align-items:center;gap:5px">
        <span style="width:5px;height:5px;border-radius:50%;background:${m.dot};flex-shrink:0"></span>${m.label}
      </button>`;
    }).join('');
    const allActive=planTopicFilter===null&&planProjFilter===null;
    topicSection=`
      <button onclick="setPlanTopicFilter(null)" style="${chipStyle(allActive,'var(--ac)')}">All</button>
      ${tChips}
      ${availProjs.length>0?`<div style="width:1px;height:16px;background:var(--b2);flex-shrink:0"></div>`:''}`;
  }

  // Project chips
  const pChips=availProjs.map(p=>{
    const pm=getProjMeta(p.id);const active=planProjFilter===p.id;
    return`<button onclick="setPlanProjFilter('${p.id}')" style="${chipStyle(active,pm.color)}">${escH(p.name)}</button>`;
  }).join('');

  const hasFilter=planTopicFilter!==null||planProjFilter!==null;
  const clearBtn=hasFilter?`<button onclick="setPlanTopicFilter(null)" style="${chipStyle(false,'var(--red)')};border-color:var(--red);color:var(--red)">✕ Clear</button>`:'';

  return`<div style="padding:8px 14px;flex-shrink:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--b1)">
    <span style="font-family:var(--fm);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);flex-shrink:0">Filter:</span>
    ${topicSection}
    ${pChips}
    ${clearBtn}
  </div>`;
}

function renderPlanning(){
  const filtered=getPlanFiltered();
  const unscheduled=filtered.filter(t=>!t.scheduledWeek);
  const weeks=Array.from({length:5},(_,i)=>addWeeks(getMondayOf(todayStr()),i));
  document.getElementById('view-content').innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">
    ${renderPlanFilterBar()}
    <div class="plan-wrap" style="flex:1;overflow:hidden">
      <div class="plan-left">
        <div class="plan-left-hdr">
          <div class="plan-left-ttl">Unscheduled</div>
          <div class="plan-left-sub">${unscheduled.length} tasks · drag to week →</div>
        </div>
        <div class="plan-left-scroll" ondragover="event.preventDefault()" ondrop="dzPlanUnschedule(event)">
          ${unscheduled.length===0?`<div class="empty-state"><span class="empty-icon">✓</span>ALL SCHEDULED</div>`
            :unscheduled.map(t=>`
            <div draggable="true" ondragstart="dzStart(event,'${t.id}','plan-unscheduled')" onclick="openVC('${t.id}')" class="task-card" style="margin-bottom:6px">
              <div class="tc-title">${escH(t.title)}</div>
              <div class="tc-meta">${topicTagHtml(t.topic)}${t.project?`<span class="tag" style="background:rgba(255,255,255,.06);color:var(--su)">${escH(projectName(t.project))}</span>`:''}<span class="prio-dot ${PRIO_DOT_CLS[t.priority]||'p-low'}" style="margin-left:auto"></span></div>
            </div>`).join('')}
          <button onclick="openVC()" style="width:100%;margin-top:6px;border:1px dashed var(--b2);background:none;border-radius:8px;padding:8px;font-family:var(--fm);font-size:9px;color:var(--b3);cursor:pointer;letter-spacing:.08em;transition:color .1s"
            onmouseover="this.style.color='var(--su)'" onmouseout="this.style.color='var(--b3)'">+ NEW TASK</button>
        </div>
      </div>
      <div class="plan-right">
        ${weeks.map(weekStart=>{
          const isThisWeek=weekStart===getMondayOf(todayStr());
          const weekTasks=filtered.filter(t=>t.scheduledWeek===weekStart);
          const weekOnly=weekTasks.filter(t=>!t.scheduledDate);
          const expanded=expandedWeeks.has(weekStart);
          const weekDates=getWeekDates(weekStart);
          return`<div class="week-block">
            <div class="week-block-hdr drop-zone" id="pw-${weekStart}"
              ondragover="dzOver(event,'pw-${weekStart}','plan-week')"
              ondrop="dzDrop(event,'${weekStart}','plan-week')"
              ondragleave="dzLeave(event)"
              style="${isThisWeek?'background:rgba(90,120,152,.06)':''}">
              <div style="display:flex;align-items:center;gap:8px" onclick="toggleExpandWeek('${weekStart}')">
                <span style="font-family:var(--fm);font-size:9px;color:var(--mu)">${expanded?'▼':'▶'}</span>
                <span style="font-family:var(--fm);font-size:10px;font-weight:700;letter-spacing:.06em;color:${isThisWeek?'var(--bl)':'var(--w2)'}">
                  ${isThisWeek?'THIS WEEK  ·  ':''}${formatWeekRange(weekStart).toUpperCase()}
                </span>
                <span class="nav-cnt">${weekTasks.length}</span>
                ${weekOnly.length>0?`<span style="font-family:var(--fm);font-size:9px;color:var(--b3)">(${weekOnly.length} unscheduled)</span>`:''}
              </div>
              <button onclick="event.stopPropagation();switchView('daily');selectedDay='${weekStart}';renderCurrentView();"
                style="font-family:var(--fm);font-size:9px;color:var(--ac);background:none;border:none;cursor:pointer;letter-spacing:.06em">OPEN →</button>
            </div>
            ${weekOnly.length>0?`<div class="week-block-chips drop-zone">${weekOnly.map(t=>`<div draggable="true" ondragstart="dzStart(event,'${t.id}')" onclick="openVC('${t.id}')" class="plan-chip"><span class="prio-dot ${PRIO_DOT_CLS[t.priority]||'p-low'}"></span>${escH(t.title)}</div>`).join('')}</div>`:''}
            ${expanded?weekDates.map(d=>{
              const dayTasks=filtered.filter(t=>t.scheduledDate===d);
              const isToday=d===todayStr();
              return`<div class="plan-day-row drop-zone" id="pd-${d}"
                ondragover="dzOver(event,'pd-${d}','plan-day')"
                ondrop="dzDrop(event,'${d}','plan-day')"
                ondragleave="dzLeave(event)"
                style="${isToday?'background:rgba(90,120,152,.05)':''}">
                <div class="plan-day-lbl" style="color:${isToday?'var(--bl)':'var(--mu)'}">${dayAbbr(d).toUpperCase()} ${dayNum(d)}</div>
                <div style="flex:1;display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-height:28px">
                  ${dayTasks.length===0?`<span style="font-family:var(--fm);font-size:9px;color:var(--b3)">← drop to schedule</span>`
                    :dayTasks.map(t=>`<div draggable="true" ondragstart="dzStart(event,'${t.id}')" onclick="openVC('${t.id}')" class="plan-chip"><span class="prio-dot ${PRIO_DOT_CLS[t.priority]||'p-low'}"></span>${escH(t.title)}</div>`).join('')}
                </div>
                <button onclick="switchToDay('${d}')" style="font-family:var(--fm);font-size:9px;color:var(--b3);background:none;border:none;cursor:pointer;transition:color .1s"
                  onmouseover="this.style.color='var(--ac)'" onmouseout="this.style.color='var(--b3)'">OPEN →</button>
              </div>`;
            }).join(''):''}
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}
function toggleExpandWeek(w){expandedWeeks.has(w)?expandedWeeks.delete(w):expandedWeeks.add(w);renderPlanning();}

// ─────────────────────────────────────────────
// ALL TASKS VIEW
// ─────────────────────────────────────────────
function renderAllTasks(){
  const tasks=getFiltered();
  const sorted=[...tasks].sort((a,b)=>{const av=a[backlogSort.col]||'',bv=b[backlogSort.col]||'';return(av<bv?-1:av>bv?1:0)*(backlogSort.dir==='asc'?1:-1);});
  const si=c=>backlogSort.col===c?(backlogSort.dir==='asc'?' ↑':' ↓'):'';
  document.getElementById('view-content').innerHTML=`
  <div class="tasks-wrap">
    <div class="tasks-hdr">
      <span class="tasks-cnt">${tasks.length} TASK${tasks.length!==1?'S':''}</span>
      <button class="btn-new" style="width:auto;padding:7px 14px;font-size:10px" onclick="openVC()">+ NEW</button>
    </div>
    <div style="border:1px solid var(--b1);border-radius:10px;overflow:hidden">
      <table class="tasks-tbl">
        <thead style="background:var(--s1)"><tr>
          <th onclick="sortAll('title')">TITLE${si('title')}</th>
          <th onclick="sortAll('status')" style="width:90px">STATUS${si('status')}</th>
          <th onclick="sortAll('topic')" style="width:100px">TOPIC${si('topic')}</th>
          <th onclick="sortAll('project')" style="width:110px">PROJECT${si('project')}</th>
          <th onclick="sortAll('priority')" style="width:60px">PRIO${si('priority')}</th>
          <th onclick="sortAll('dueDate')" style="width:80px">DUE${si('dueDate')}</th>
        </tr></thead>
        <tbody>
          ${sorted.length===0?`<tr><td colspan="6" class="empty-state" style="padding:40px">NO TASKS YET</td></tr>`
            :sorted.map(t=>{
              const done=t.status==='done';const over=t.dueDate&&t.dueDate<todayStr()&&!done;
              const m=getTopicMeta(t.topic);
              return`<tr onclick="openVC('${t.id}')">
                <td><span style="font-size:12px;color:${done?'var(--mu)':'var(--wh)'};${done?'text-decoration:line-through':''}">${escH(t.title)}</span>${t.fromTemplate?`<span style="font-size:9px;color:var(--ac);margin-left:4px">↻</span>`:''}</td>
                <td><span class="tag ${STATUS_CLS[t.status]||''}">${statusLabel(t.status)}</span></td>
                <td>${topicTagHtml(t.topic)||`<span style="color:var(--b3)">—</span>`}</td>
                <td style="color:var(--su);font-size:11px">${t.project?escH(projectName(t.project)):`<span style="color:var(--b3)">—</span>`}</td>
                <td><span class="prio-dot ${PRIO_DOT_CLS[t.priority]||'p-low'}" style="display:inline-block"></span></td>
                <td style="font-family:var(--fm);font-size:9px;color:${over?'var(--red)':'var(--su)'}">${t.dueDate?formatDate(t.dueDate):`<span style="color:var(--b3)">—</span>`}</td>
              </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function sortAll(col){backlogSort.dir=backlogSort.col===col?(backlogSort.dir==='asc'?'desc':'asc'):'asc';backlogSort.col=col;renderAllTasks();}

// ─────────────────────────────────────────────
// RECURRING VIEW
// ─────────────────────────────────────────────
function renderRecurringView(){
  const templates=activeTopic?db.templates.filter(t=>t.topic===activeTopic):db.templates;
  document.getElementById('view-content').innerHTML=`
  <div class="rec-wrap">
    <div class="rec-hdr">
      <span style="font-family:var(--fm);font-size:9px;color:var(--mu);letter-spacing:.08em">Auto-generated tasks by day</span>
      <button class="btn-new" style="width:auto;padding:7px 14px;font-size:10px" onclick="openRecModal()">+ TEMPLATE</button>
    </div>
    ${templates.length===0?`<div class="empty-state" style="padding:60px"><span class="empty-icon">↻</span>NO RECURRING TEMPLATES</div>`
      :templates.map(tmpl=>`
      <div class="rec-card" onclick="openRecModal('${tmpl.id}')">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--wh);margin-bottom:6px">${escH(tmpl.title)}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${topicTagHtml(tmpl.topic)}
            ${tmpl.project?`<span class="tag" style="background:rgba(255,255,255,.06);color:var(--su)">${escH(projectName(tmpl.project))}</span>`:''}
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          ${[0,1,2,3,4,5,6].map(d=>`
          <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-size:9px;font-weight:700;
            background:${tmpl.days.includes(d)?'var(--ac2)':'var(--s3)'};
            color:${tmpl.days.includes(d)?'var(--wh)':'var(--mu)'};
            border:1px solid ${tmpl.days.includes(d)?'var(--ac)':'var(--b2)'}">
            ${['S','M','T','W','T','F','S'][d]}
          </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>`;
}

// ─────────────────────────────────────────────
// DRAG & DROP
// ─────────────────────────────────────────────
function dzStart(e,id,source=''){
  dragTaskId=id;dragSource=source;e.dataTransfer.effectAllowed='move';
  // Only show assign dropzone when dragging from planning unscheduled list AND there are agents
  if(source==='plan-unscheduled' && db.agents && db.agents.length>0){
    document.getElementById('assign-dz').style.display='flex';
  }
}
function dzOver(e,colId,ctx){e.preventDefault();e.currentTarget.classList.add('drag-over');}
function dzLeave(e){e.currentTarget.classList.remove('drag-over');}
function dzDrop(e,colId,ctx){
  e.preventDefault();e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  document.getElementById('assign-dz').style.display='none';
  if(!dragTaskId)return;
  const t=db.tasks.find(x=>x.id===dragTaskId);
  if(!t){dragTaskId=null;return;}
  if(ctx==='assign'){
    const tid=dragTaskId;dragTaskId=null;
    openAssignModal(tid);return;
  }
  if(ctx==='weekly-status'){
    t.status=colId;
    if(colId==='done'){t.completedDate=todayStr();}else{t.completedDate=null;}
    dragTaskId=null;saveData();renderCurrentView();return;
  }else if(ctx==='project'){
    t.project=colId;showToast(`→ ${projectName(colId)}`);
  }else if(ctx==='weekly'){
    if(colId==='__weekbacklog__')t.scheduledDate=null;
    else{t.scheduledDate=colId;t.scheduledWeek=getMondayOf(colId);if(t.status==='backlog')t.status='todo';}
  }else if(ctx==='daily'){
    if(colId==='__dayweekref__')t.scheduledDate=null;
    else{t.status=colId;if(!t.scheduledDate){t.scheduledDate=selectedDay;t.scheduledWeek=getMondayOf(selectedDay);}
    if(colId==='done')t.completedDate=todayStr();else t.completedDate=null;}
  }else if(ctx==='plan-week'){
    t.scheduledWeek=colId;t.scheduledDate=null;if(t.status==='backlog')t.status='todo';
  }else if(ctx==='plan-day'){
    t.scheduledDate=colId;t.scheduledWeek=getMondayOf(colId);if(t.status==='backlog')t.status='todo';
  }else if(ctx==='weekly-progress'){
    const parts = colId.split('|');
    const d = parts[0];
    const st = parts[1];
    t.scheduledDate=d;
    t.scheduledWeek=getMondayOf(d);
    t.status=st;
    if(st==='done')t.completedDate=todayStr();else t.completedDate=null;
  }
  dragTaskId=null;saveData();renderCurrentView();
}
function dzProjUnassign(e){
  e.preventDefault();if(!dragTaskId)return;
  const t=db.tasks.find(x=>x.id===dragTaskId);
  if(t){t.project='';showToast('Unassigned from project');}
  dragTaskId=null;saveData();renderCurrentView();
}
function dzPlanUnschedule(e){
  e.preventDefault();if(!dragTaskId)return;
  const t=db.tasks.find(x=>x.id===dragTaskId);
  if(t){t.scheduledWeek=null;t.scheduledDate=null;}
  dragTaskId=null;saveData();renderCurrentView();
}

// ─────────────────────────────────────────────
// VISUAL TASK CREATOR
// ─────────────────────────────────────────────
function openVC(taskId=null,defaultStatus=null,defaultScheduledDate=null){
  pendingSchedule={date:defaultScheduledDate,week:defaultScheduledDate?getMondayOf(defaultScheduledDate):null};
  if(taskId){
    const t=db.tasks.find(x=>x.id===taskId);if(!t)return;
    document.getElementById('vc-id').value=t.id;
    document.getElementById('vc-title').value=t.title;
    document.getElementById('vc-notes').value=t.notes||'';
    document.getElementById('vc-date').value=t.dueDate||'';
    document.getElementById('vc-del-btn').style.display='block';
    document.getElementById('vc-mode-lbl').textContent='EDIT TASK';
    vcTopic=t.topic||'';vcProject=t.project||'';vcStatus=t.status||'todo';vcPriority=t.priority||'medium';vcDifficulty=t.difficulty||'medium-easy';
  }else{
    document.getElementById('vc-id').value='';
    document.getElementById('vc-title').value='';
    document.getElementById('vc-notes').value='';
    document.getElementById('vc-date').value='';
    document.getElementById('vc-del-btn').style.display='none';
    document.getElementById('vc-mode-lbl').textContent='NEW TASK';
    vcTopic=activeTopic||'';vcProject='';vcStatus=defaultStatus||'todo';vcPriority='medium';vcDifficulty='medium-easy';
  }
  renderVCPickers();
  document.getElementById('vc-overlay').style.display='flex';
  setTimeout(()=>document.getElementById('vc-title').focus(),60);
}
function closeVC(){document.getElementById('vc-overlay').style.display='none';}

function renderVCPickers(){
  // ── Topic picker ──
  // All topics + None + "+" button
  const topics=[{id:'',label:'None',color:'#6070a0',dot:'var(--mu)'},...db.settings.topics.map(t=>({
    id:t,label:getTopicMeta(t).label,color:getTopicMeta(t).color,dot:getTopicMeta(t).dot
  }))];
  document.getElementById('vc-topic-picker').innerHTML=
    topics.map(tp=>`
      <div class="topic-chip${vcTopic===tp.id?' sel':''}" onclick="vcPickTopic('${tp.id}')">
        <span class="t-color-dot" style="background:${tp.dot}"></span>${tp.label}
      </div>`).join('')+
    `<button class="picker-add-btn" onclick="openAddTopicModal()" title="Add topic">+</button>`;

  // ── Project picker ──
  // Filter by selected topic (if any); otherwise show all
  const projs=vcTopic
    ?db.settings.projects.filter(p=>p.topic===vcTopic)
    :db.settings.projects;
  const noneCard=`<div class="proj-pick-card${vcProject===''?' sel':''}" onclick="vcPickProject('')">
    <div class="proj-pick-thumb" style="background:var(--s2)">
      <span style="font-family:var(--fm);font-size:11px;color:var(--mu)">NONE</span>
    </div>
    <div class="proj-pick-name">None</div>
  </div>`;
  const projCards=projs.map(p=>{
    const pm=getProjMeta(p.id);
    return`<div class="proj-pick-card${vcProject===p.id?' sel':''}" onclick="vcPickProject('${p.id}')">
      <div class="proj-pick-thumb" style="${projThumbBgStyle(pm)}">
        ${projThumbInner(pm)}
        <span style="font-size:22px;position:relative;z-index:1">${pm.emoji}</span>
      </div>
      <div class="proj-pick-name">${escH(p.name)}</div>
    </div>`;
  }).join('');
  const addCard=`<div class="proj-pick-add" onclick="openAddProjModal()">
    <span class="proj-pick-add-icon">+</span>
    <span class="proj-pick-add-lbl">New Project</span>
  </div>`;
  document.getElementById('vc-proj-picker').innerHTML=noneCard+projCards+addCard;

  // ── Status picker ──
  const statuses=[{id:'backlog',label:'Backlog'},{id:'todo',label:'To Do'},{id:'in-progress',label:'In Prog'},{id:'done',label:'Done'},{id:'failed',label:'Failed'}];
  document.getElementById('vc-status-picker').innerHTML=statuses.map(s=>`
    <button class="opt-btn${vcStatus===s.id?' sel':''}" onclick="vcPickStatus('${s.id}')">${s.label}</button>`).join('');

  // ── Priority picker ──
  document.getElementById('vc-prio-picker').innerHTML=[{id:'high',label:'High'},{id:'medium',label:'Med'},{id:'low',label:'Low'}].map(p=>`
    <button class="opt-btn${vcPriority===p.id?' sel':''}" onclick="vcPickPrio('${p.id}')">${p.label}</button>`).join('');

  // ── Difficulty picker ──
  document.getElementById('vc-diff-picker').innerHTML=Object.entries(DIFF_LABELS).map(([id,label])=>{
    const sel=vcDifficulty===id;
    const sty=sel?'border-color:'+DIFF_COLORS[id]+';color:'+DIFF_COLORS[id]:'';
    return`<button class="opt-btn${sel?' sel':''}" onclick="vcPickDiff('${id}')" style="${sty}">${label} <span style="font-family:var(--fm);font-size:8px;opacity:.7">$${DIFF_MONEY[id]}</span></button>`;
  }).join('');
}

function vcPickTopic(t){
  vcTopic=t;
  // Reset project if it doesn't belong to newly selected topic
  if(t&&vcProject){
    const proj=db.settings.projects.find(p=>p.id===vcProject);
    if(proj&&proj.topic!==t)vcProject='';
  }
  renderVCPickers();
}
function vcPickProject(p){vcProject=p;renderVCPickers();}
function vcPickStatus(s){vcStatus=s;renderVCPickers();}
function vcPickPrio(p){vcPriority=p;renderVCPickers();}
function vcPickDiff(d){vcDifficulty=d;renderVCPickers();}

function saveVC(){
  const title=document.getElementById('vc-title').value.trim();
  if(!title)return document.getElementById('vc-title').focus();
  const id=document.getElementById('vc-id').value;
  const dateVal=document.getElementById('vc-date').value||null;
  const data={title,topic:vcTopic,project:vcProject,status:vcStatus,priority:vcPriority,difficulty:vcDifficulty,
    dueDate:dateVal,
    notes:document.getElementById('vc-notes').value.trim(),
    completedDate:vcStatus==='done'?todayStr():null};
  
  let sDate = dateVal || pendingSchedule.date;
  let sWeek = sDate ? getMondayOf(sDate) : pendingSchedule.week;
  if (!sDate && currentView === 'weekly' && !sWeek && selectedWeek) {
    sWeek = selectedWeek;
  }

  if(id){
    const idx=db.tasks.findIndex(t=>t.id===id);
    if(idx>=0){
      const ex=db.tasks[idx];
      if(vcStatus!=='done')data.completedDate=ex.completedDate||null;
      if(dateVal) {
        data.scheduledDate = sDate;
        data.scheduledWeek = sWeek;
      }
      db.tasks[idx]={...ex,...data};
    }
  }else{
    db.tasks.push({id:uuid(),...data,scheduledDate:sDate,scheduledWeek:sWeek,createdAt:new Date().toISOString(),fromTemplate:null});
  }
  pendingSchedule={date:null,week:null};
  saveData();closeVC();renderCurrentView();renderSidebar();
  showToast(id?'Task updated':'Task created');
}
function deleteTaskVC(){
  const id=document.getElementById('vc-id').value;
  if(!id||!confirm('Delete this task?'))return;
  db.tasks=db.tasks.filter(t=>t.id!==id);
  saveData();closeVC();renderCurrentView();renderSidebar();
  showToast('Task deleted');
}

// ─────────────────────────────────────────────
// ADD TOPIC MODAL
// ─────────────────────────────────────────────
function openAddTopicModal(){
  atColorIdx=0;
  document.getElementById('at-name').value='';
  // render color swatches
  document.getElementById('at-color-picker').innerHTML=TOPIC_COLOR_PRESETS.map((c,i)=>`
    <div class="color-swatch${i===0?' sel':''}" style="background:${c.color}"
      onclick="atPickColor(${i})" id="at-swatch-${i}"></div>`).join('');
  document.getElementById('add-topic-modal').style.display='flex';
  setTimeout(()=>document.getElementById('at-name').focus(),60);
}
function closeAddTopicModal(){document.getElementById('add-topic-modal').style.display='none';}
function atPickColor(i){
  atColorIdx=i;
  TOPIC_COLOR_PRESETS.forEach((_,j)=>{
    const el=document.getElementById(`at-swatch-${j}`);
    if(el)el.classList.toggle('sel',j===i);
  });
}
function saveNewTopic(){
  const name=document.getElementById('at-name').value.trim();
  if(!name)return document.getElementById('at-name').focus();
  // Generate id from name (slugify)
  const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(db.settings.topics.includes(id)){showToast('Topic already exists');return;}
  const preset=TOPIC_COLOR_PRESETS[atColorIdx]||TOPIC_COLOR_PRESETS[0];
  db.settings.topics.push(id);
  db.settings.topicMeta[id]={color:preset.color,dot:preset.dot,label:name};
  saveData();closeAddTopicModal();
  renderVCPickers();renderSidebar();
  showToast(`Topic "${name}" created`);
}

// ─────────────────────────────────────────────
// ADD / EDIT PROJECT MODAL
// ─────────────────────────────────────────────
function apRenderEmojiGrid(){
  document.getElementById('ap-emoji-picker').innerHTML=EMOJI_PRESETS.map(em=>{
    const sel=apEmoji===em;
    return`<button class="emoji-btn${sel?' sel':''}" onclick="apPickEmoji('${em}')" id="ap-em-${em.codePointAt(0)}">${em}</button>`;
  }).join('');
  document.getElementById('ap-emoji-preview').textContent=apEmoji||'📁';
  document.getElementById('ap-custom-emoji').value=apEmoji||'';
}
function apRenderGradGrid(){
  document.getElementById('ap-grad-picker').innerHTML=GRAD_PRESETS.map((g,i)=>`
    <div class="grad-swatch${i===apGradIdx?' sel':''}" style="background:${g.grad}" onclick="apPickGrad(${i})" id="ap-grad-${i}">
      <div class="grad-swatch-pat pat-${g.pat}" style="color:${g.color};opacity:.4;position:absolute;inset:0;border-radius:6px"></div>
    </div>`).join('');
}
function apRenderImgZone(){
  const zone=document.getElementById('ap-img-zone');
  if(apImgData){
    zone.className='img-upload-zone has-img';
    zone.innerHTML=`<img src="${apImgData}"><button class="img-clear-btn" onclick="event.stopPropagation();apClearImg()">&#215;</button>`;
    document.getElementById('ap-grad-or-img-lbl').textContent='(hidden when image is set)';
  }else{
    zone.className='img-upload-zone';
    zone.innerHTML=`<span style="font-size:22px">🖼</span><span class="img-upload-lbl">Click to upload image</span>`;
    document.getElementById('ap-grad-or-img-lbl').textContent='';
  }
}

function openAddProjModal(editId=null){
  apEditId=editId;apImgData=null;
  if(editId){
    const proj=db.settings.projects.find(p=>p.id===editId);
    const pm=getProjMeta(editId);
    apEmoji=pm.emoji||'📁';apGradIdx=GRAD_PRESETS.findIndex(g=>g.grad===pm.grad);if(apGradIdx<0)apGradIdx=0;
    apImgData=pm.img||null;
    document.getElementById('ap-name').value=proj?proj.name:'';
    document.getElementById('ap-modal-ttl').textContent='Edit Project';
    document.getElementById('ap-save-btn').textContent='Save Changes';
    document.getElementById('ap-del-btn').style.display='block';
  }else{
    apEmoji='📁';apGradIdx=0;
    document.getElementById('ap-name').value='';
    document.getElementById('ap-modal-ttl').textContent='New Project';
    document.getElementById('ap-save-btn').textContent='Create Project';
    document.getElementById('ap-del-btn').style.display='none';
  }
  apRenderEmojiGrid();apRenderGradGrid();apRenderImgZone();
  document.getElementById('add-proj-modal').style.display='flex';
  setTimeout(()=>document.getElementById('ap-name').focus(),60);
}
function closeAddProjModal(){document.getElementById('add-proj-modal').style.display='none';}

function apOnEmojiInput(val){
  // Take the first emoji-like character from the input
  const chars=[...val];
  if(chars.length>0){apEmoji=chars[0];document.getElementById('ap-emoji-preview').textContent=apEmoji;apRenderEmojiGrid();}
}
function apPickEmoji(em){
  apEmoji=em;
  document.querySelectorAll('#ap-emoji-picker .emoji-btn').forEach(b=>b.classList.remove('sel'));
  const btn=document.getElementById(`ap-em-${em.codePointAt(0)}`);if(btn)btn.classList.add('sel');
  document.getElementById('ap-emoji-preview').textContent=em;
  document.getElementById('ap-custom-emoji').value=em;
}
function apPickGrad(i){
  apGradIdx=i;
  GRAD_PRESETS.forEach((_,j)=>{const el=document.getElementById(`ap-grad-${j}`);if(el)el.classList.toggle('sel',j===i);});
}
function apHandleImgUpload(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{apImgData=e.target.result;apRenderImgZone();input.value='';};
  reader.readAsDataURL(file);
}
function apClearImg(){apImgData=null;apRenderImgZone();}

function saveNewProject(){
  const name=document.getElementById('ap-name').value.trim();
  if(!name)return document.getElementById('ap-name').focus();
  const preset=GRAD_PRESETS[apGradIdx]||GRAD_PRESETS[0];
  const meta={grad:preset.grad,emoji:apEmoji||'📁',color:preset.color,pat:preset.pat};
  if(apImgData)meta.img=apImgData;

  if(apEditId){
    // Edit existing project
    const proj=db.settings.projects.find(p=>p.id===apEditId);
    if(proj)proj.name=name;
    db.settings.projMeta[apEditId]={...(db.settings.projMeta[apEditId]||{}),...meta};
    if(!apImgData)delete db.settings.projMeta[apEditId].img;
    saveData();closeAddProjModal();
    // Refresh wherever we are
    if(currentView==='project-detail')renderProjectDetail(apEditId);
    else renderCurrentView();
    renderSidebar();
    showToast(`"${name}" updated`);
  }else{
    const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+uuid().slice(0,4);
    const topic=vcTopic||db.settings.topics[0]||'';
    db.settings.projects.push({id,name,topic});
    db.settings.projMeta[id]=meta;
    saveData();closeAddProjModal();
    vcProject=id;
    if(document.getElementById('vc-overlay').style.display!=='none')renderVCPickers();
    else renderCurrentView();
    renderSidebar();
    showToast(`"${name}" created`);
  }
}

function deleteProject(){
  if(!apEditId||!confirm('Delete this project? Tasks will be unassigned.'))return;
  const name=projectName(apEditId);
  db.tasks.forEach(t=>{if(t.project===apEditId)t.project='';});
  db.settings.projects=db.settings.projects.filter(p=>p.id!==apEditId);
  delete db.settings.projMeta[apEditId];
  saveData();closeAddProjModal();
  if(currentView==='project-detail')switchView('projects');
  else renderCurrentView();
  renderSidebar();
  showToast(`"${name}" deleted`);
}

// ─────────────────────────────────────────────
// RECURRING MODAL
// ─────────────────────────────────────────────
function fillTopicSel(elId){
  document.getElementById(elId).innerHTML=
    `<option value="">— none —</option>`+
    db.settings.topics.map(t=>`<option value="${t}">${getTopicMeta(t).label}</option>`).join('');
}
function syncRecProj(){
  const topic=document.getElementById('rec-topic').value;
  const sel=document.getElementById('rec-project');
  const projs=topic?db.settings.projects.filter(p=>p.topic===topic):db.settings.projects;
  const cur=sel.value;
  sel.innerHTML=`<option value="">— none —</option>`+projs.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  if(projs.some(p=>p.id===cur))sel.value=cur;
}
function buildDaySel(){
  document.getElementById('day-selector').innerHTML=['Su','Mo','Tu','We','Th','Fr','Sa'].map((lbl,d)=>`
    <button type="button" id="dbtn-${d}" class="day-btn" onclick="toggleDay(${d})">${lbl}</button>`).join('');
}
function toggleDay(d){document.getElementById(`dbtn-${d}`).classList.toggle('on');}
function getSelDays(){return[0,1,2,3,4,5,6].filter(d=>document.getElementById(`dbtn-${d}`)?.classList.contains('on'));}
function setSelDays(ds){[0,1,2,3,4,5,6].forEach(d=>{const b=document.getElementById(`dbtn-${d}`);if(b)b.classList.toggle('on',ds.includes(d));});}

function openRecModal(tmplId=null){
  fillTopicSel('rec-topic');syncRecProj();buildDaySel();
  const delBtn=document.getElementById('rec-del-btn');
  if(tmplId){
    const tmpl=db.templates.find(t=>t.id===tmplId);if(!tmpl)return;
    document.getElementById('rec-modal-ttl').textContent='Edit Recurring';
    document.getElementById('rec-id').value=tmpl.id;
    document.getElementById('rec-title').value=tmpl.title;
    document.getElementById('rec-topic').value=tmpl.topic||'';syncRecProj();
    document.getElementById('rec-project').value=tmpl.project||'';
    document.getElementById('rec-priority').value=tmpl.priority||'medium';
    document.getElementById('rec-notes').value=tmpl.notes||'';
    setSelDays(tmpl.days||[]);delBtn.style.display='block';
  }else{
    document.getElementById('rec-modal-ttl').textContent='New Recurring';
    document.getElementById('rec-id').value='';document.getElementById('rec-title').value='';
    document.getElementById('rec-topic').value='';syncRecProj();
    document.getElementById('rec-project').value='';document.getElementById('rec-priority').value='medium';
    document.getElementById('rec-notes').value='';setSelDays([]);delBtn.style.display='none';
  }
  document.getElementById('rec-modal').style.display='flex';
  setTimeout(()=>document.getElementById('rec-title').focus(),60);
}
function closeRecModal(){document.getElementById('rec-modal').style.display='none';}
function saveRecurring(){
  const days=getSelDays();
  if(days.length===0){alert('Select at least one day.');return;}
  const id=document.getElementById('rec-id').value;
  const data={title:document.getElementById('rec-title').value.trim(),topic:document.getElementById('rec-topic').value,
    project:document.getElementById('rec-project').value,priority:document.getElementById('rec-priority').value,
    notes:document.getElementById('rec-notes').value.trim(),days};
  if(!data.title)return;
  if(id){const idx=db.templates.findIndex(t=>t.id===id);if(idx>=0)db.templates[idx]={...db.templates[idx],...data};}
  else db.templates.push({id:uuid(),...data});
  db.lastRecurringCheck=null;saveData();closeRecModal();renderCurrentView();
  showToast(id?'Template updated':'Template created');
}
function deleteRecurring(){
  const id=document.getElementById('rec-id').value;
  if(!id||!confirm('Delete template? Existing tasks remain.'))return;
  db.templates=db.templates.filter(t=>t.id!==id);
  saveData();closeRecModal();renderCurrentView();showToast('Template deleted');
}

// ─────────────────────────────────────────────
// CALENDAR VIEW
// ─────────────────────────────────────────────
function calPrev(){calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendarView();}
function calNext(){calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendarView();}
function calGoToday(){calYear=new Date().getFullYear();calMonth=new Date().getMonth();renderCalendarView();}
function calSetTopic(t){calTopicFilter=calTopicFilter===t?null:t;calProjFilter=null;renderCalendarView();}
function calSetProj(p){calProjFilter=calProjFilter===p?null:p;renderCalendarView();}

function renderCalendarView(){
  const today=todayStr();
  const firstDay=new Date(calYear,calMonth,1);
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const startDow=firstDay.getDay(); // 0=Sun
  const startOffset=(startDow+6)%7; // Mon-first: Mon=0…Sun=6

  // Filter completed tasks
  let tasks=db.tasks.filter(t=>t.status==='done'&&t.completedDate);
  if(activeTopic)tasks=tasks.filter(t=>t.topic===activeTopic);
  if(calTopicFilter)tasks=tasks.filter(t=>t.topic===calTopicFilter);
  if(calProjFilter)tasks=tasks.filter(t=>t.project===calProjFilter);

  const byDate={};
  tasks.forEach(t=>{
    const d=t.completedDate;
    if(!byDate[d])byDate[d]=[];
    byDate[d].push(t);
  });

  // Build cell array (always 42 cells = 6 rows)
  const cells=[];
  for(let i=0;i<startOffset;i++){const d=new Date(calYear,calMonth,1-(startOffset-i));cells.push({date:localDateStr(d),other:true});}
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({date:ds,other:false});
  }
  while(cells.length<42){const d=new Date(calYear,calMonth+1,cells.length-startOffset-daysInMonth+1);cells.push({date:localDateStr(d),other:true});}

  const monthLabel=firstDay.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const totalDone=tasks.length;

  // Filter chips
  const projects=calTopicFilter?db.settings.projects.filter(p=>p.topic===calTopicFilter):db.settings.projects;

  document.getElementById('view-content').innerHTML=`
  <div class="cal-wrap">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="period-btn" onclick="calPrev()">&#8249;</button>
        <span style="font-family:var(--fm);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--w2);min-width:160px;text-align:center">${monthLabel}</span>
        <button class="period-btn" onclick="calNext()">&#8250;</button>
        <button class="btn-today" onclick="calGoToday()">TODAY</button>
      </div>
      <span style="font-family:var(--fm);font-size:9px;color:var(--mu)">${totalDone} completed</span>
    </div>
    <div class="cal-filters">
      <span class="cal-filter-label">TOPIC</span>
      <div class="opt-btn${!calTopicFilter?' sel':''}" style="cursor:pointer;padding:4px 9px" onclick="calSetTopic(null)">All</div>
      ${db.settings.topics.map(t=>{const m=getTopicMeta(t);const sel=calTopicFilter===t;return`<div class="opt-btn${sel?' sel':''}" style="cursor:pointer;padding:4px 9px;display:flex;align-items:center;gap:5px" onclick="calSetTopic('${t}')"><span style="width:6px;height:6px;border-radius:50%;background:${m.dot};display:inline-block"></span>${m.label}</div>`;}).join('')}
      ${calTopicFilter?`<span style="font-family:var(--fm);font-size:9px;color:var(--b2);margin:0 2px">|</span><span class="cal-filter-label">PROJ</span>
        <div class="opt-btn${!calProjFilter?' sel':''}" style="cursor:pointer;padding:4px 9px" onclick="calSetProj(null)">All</div>
        ${projects.map(p=>{const pm=getProjMeta(p.id);const sel=calProjFilter===p.id;return`<div class="opt-btn${sel?' sel':''}" style="cursor:pointer;padding:4px 9px" onclick="calSetProj('${p.id}')">${pm.emoji} ${escH(p.name)}</div>`;}).join('')}`:''}
    </div>
    <div class="cal-grid">
      ${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d=>`<div class="cal-day-hdr">${d}</div>`).join('')}
      ${cells.map(cell=>{
        const ct=byDate[cell.date]||[];
        const isToday=cell.date===today;
        const show=ct.slice(0,3);
        const more=ct.length-show.length;
        return`<div class="cal-cell${cell.other?' other-month':''}${isToday?' today':''}${ct.length>0?' has-tasks':''}">
          <div class="cal-date-num${isToday?' today':''}">${parseInt(cell.date.split('-')[2])}</div>
          ${show.map(t=>{
            const m=getTopicMeta(t.topic);
            const r=parseInt(m.color.slice(1,3),16)||136,g=parseInt(m.color.slice(3,5),16)||152,b=parseInt(m.color.slice(5,7),16)||176;
            return`<div class="cal-task-chip" onclick="event.stopPropagation();openVC('${t.id}')"
              style="background:rgba(${r},${g},${b},.18);color:${m.color}"
              title="${escH(t.title)}">${escH(t.title)}</div>`;
          }).join('')}
          ${more>0?`<div class="cal-more">+${more} more</div>`:''}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// STATS VIEW
// ─────────────────────────────────────────────
function polarToXY(cx,cy,r,a){return[cx+r*Math.cos(a),cy+r*Math.sin(a)];}

function renderDonutChart(projData){
  const filtered=projData.filter(p=>p.count>0);
  if(!filtered.length)return`<div class="empty-state" style="padding:20px 0"><span class="empty-icon">◉</span>Complete tasks to see distribution</div>`;
  const total=filtered.reduce((s,p)=>s+p.count,0);
  const cx=110,cy=110,oR=96,iR=52,gap=0.025;
  let angle=-Math.PI/2;
  const paths=filtered.map(p=>{
    const slice=(p.count/total)*Math.PI*2;
    const sa=angle+gap/2,ea=angle+slice-gap/2;
    angle+=slice;
    const [ox1,oy1]=polarToXY(cx,cy,oR,sa);
    const [ox2,oy2]=polarToXY(cx,cy,oR,ea);
    const [ix1,iy1]=polarToXY(cx,cy,iR,ea);
    const [ix2,iy2]=polarToXY(cx,cy,iR,sa);
    const la=slice>Math.PI?1:0;
    const d=`M ${ox1.toFixed(1)} ${oy1.toFixed(1)} A ${oR} ${oR} 0 ${la} 1 ${ox2.toFixed(1)} ${oy2.toFixed(1)} L ${ix1.toFixed(1)} ${iy1.toFixed(1)} A ${iR} ${iR} 0 ${la} 0 ${ix2.toFixed(1)} ${iy2.toFixed(1)} Z`;
    return{d,color:p.meta.color,project:p};
  });
  return`<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
    <svg viewBox="0 0 220 220" width="188" height="188" style="flex-shrink:0">
      ${paths.map(({d,color})=>`<path d="${d}" fill="${color}" fill-opacity=".85" stroke="var(--bg)" stroke-width="1.5"/>`).join('')}
      <text x="${cx}" y="${cy-6}" text-anchor="middle" dominant-baseline="middle" font-family="'Space Mono',monospace" font-size="22" font-weight="700" fill="var(--wh)">${total}</text>
      <text x="${cx}" y="${cy+12}" text-anchor="middle" font-family="'Space Mono',monospace" font-size="8" fill="var(--mu)" letter-spacing="1.5">DONE</text>
    </svg>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${filtered.map(p=>`<div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:2px;background:${p.meta.color};flex-shrink:0"></div>
        <span style="font-size:11px;color:var(--w2)">${escH(p.name)}</span>
        <span style="font-family:var(--fm);font-size:9px;color:var(--mu)">${p.count}</span>
        <span style="font-family:var(--fm);font-size:9px;color:${p.meta.color}">$${p.money}</span>
      </div>`).join('')}
    </div>
  </div>`;
}

// ── Line chart: cumulative earnings over time per topic ──
function renderLineChart(topicItems){
  const allDone=db.tasks.filter(t=>t.status==='done'&&t.completedDate);
  if(!allDone.length)return`<div class="empty-state" style="padding:20px 0"><span class="empty-icon">◉</span>Complete tasks to see the chart</div>`;

  // Group incremental $ by week per topic
  const weekInc={}; // week -> {topicId: $}
  allDone.forEach(t=>{
    const w=getMondayOf(t.completedDate);
    if(!weekInc[w])weekInc[w]={};
    const tid=t.topic||'__none__';
    weekInc[w][tid]=(weekInc[w][tid]||0)+(DIFF_MONEY[t.difficulty]||0);
  });
  const weeks=Object.keys(weekInc).sort();

  // Build cumulative series per topic
  const cum={};topicItems.forEach(t=>{cum[t.id]=0;});
  let cumAll=0;
  const series=weeks.map(w=>{
    topicItems.forEach(t=>{cum[t.id]=(cum[t.id]||0)+(weekInc[w][t.id]||0);});
    cumAll+=Object.values(weekInc[w]).reduce((s,v)=>s+v,0);
    return{w,byTopic:{...cum},all:cumAll};
  });

  const maxVal=Math.max(series[series.length-1].all,1);
  const W=500,H=160,pL=46,pR=14,pT=8,pB=26;
  const cW=W-pL-pR,cH=H-pT-pB;
  const xS=i=>pL+(weeks.length>1?i/(weeks.length-1)*cW:cW/2);
  const yS=v=>pT+cH-(v/maxVal)*cH;

  // Grid + y-labels
  let grid='',yLbls='';
  [0,0.25,0.5,0.75,1].forEach(f=>{
    const y=yS(maxVal*f).toFixed(1);
    grid+=`<line x1="${pL}" y1="${y}" x2="${W-pR}" y2="${y}" stroke="var(--b1)" stroke-width="1"/>`;
    if(f===0||f===0.5||f===1)yLbls+=`<text x="${pL-4}" y="${y}" text-anchor="end" dominant-baseline="middle" font-family="'Space Mono',monospace" font-size="7" fill="var(--mu)">$${Math.round(maxVal*f)}</text>`;
  });

  // X-axis labels (up to 6)
  const step=Math.max(1,Math.ceil(weeks.length/6));
  let xLbls='';
  weeks.forEach((w,i)=>{
    if(i%step!==0&&i!==weeks.length-1)return;
    const d=parseDate(w);
    const lbl=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    xLbls+=`<text x="${xS(i).toFixed(1)}" y="${H-4}" text-anchor="middle" font-family="'Space Mono',monospace" font-size="7" fill="var(--mu)">${lbl}</text>`;
  });

  // Lines per topic
  let lines='';
  topicItems.forEach(t=>{
    if(!series.some(s=>s.byTopic[t.id]>0))return;
    const pts=series.map((s,i)=>`${xS(i).toFixed(1)},${yS(s.byTopic[t.id]).toFixed(1)}`).join(' ');
    lines+=`<polyline points="${pts}" fill="none" stroke="${t.meta.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-opacity=".9"/>`;
    // Dots at last point
    const last=series[series.length-1];
    lines+=`<circle cx="${xS(series.length-1).toFixed(1)}" cy="${yS(last.byTopic[t.id]).toFixed(1)}" r="3" fill="${t.meta.color}"/>`;
  });
  // Total line (dashed white)
  const totalPts=series.map((s,i)=>`${xS(i).toFixed(1)},${yS(s.all).toFixed(1)}`).join(' ');
  lines+=`<polyline points="${totalPts}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5" stroke-dasharray="4 3" stroke-linejoin="round"/>`;

  return`<svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible">${grid}${lines}${xLbls}${yLbls}</svg>`;
}

function renderStatsView(){
  if(activeTopic){
    // ── TOPIC STATS ──
    const topicMeta=getTopicMeta(activeTopic);
    const allT=db.tasks.filter(t=>t.topic===activeTopic);
    const doneT=allT.filter(t=>t.status==='done');
    const total=allT.length,done=doneT.length;
    const pct=total>0?Math.round(done/total*100):0;
    const money=doneT.reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
    const topicPenalties=db.penalties.filter(p=>p.topic===activeTopic);
    const penaltyTotal=topicPenalties.reduce((s,p)=>s+p.amount,0);
    const netMoney=money-penaltyTotal;
    const inProg=allT.filter(t=>t.status==='in-progress').length;
    const todo=allT.filter(t=>t.status==='todo'||t.status==='backlog').length;

    const projs=db.settings.projects.filter(p=>p.topic===activeTopic);
    const projRows=projs.map(p=>{
      const pm=getProjMeta(p.id);
      const pt=db.tasks.filter(t=>t.project===p.id);
      const pd=pt.filter(t=>t.status==='done');
      const ppct=pt.length>0?Math.round(pd.length/pt.length*100):0;
      const pm2=pd.reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
      const pLost=db.penalties.filter(q=>q.project===p.id).reduce((s,q)=>s+q.amount,0);
      return{p,pm,pt:pt.length,pd:pd.length,ppct,pm2,pLost};
    }).sort((a,b)=>b.pd-a.pd);

    const diffBreak={easy:0,'medium-easy':0,'medium-hard':0,hard:0};
    doneT.forEach(t=>{if(t.difficulty&&diffBreak[t.difficulty]!==undefined)diffBreak[t.difficulty]++;});

    // Donut for topic (using projects)
    const projData=projRows.map(r=>({...r.p,money:r.pm2,count:r.pd,meta:r.pm}));

    document.getElementById('view-content').innerHTML=`
    <div class="stats-wrap">

      <!-- Hero row -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div class="stats-card" style="border-top:2px solid ${topicMeta.color}">
          <div class="stats-title">Completion</div>
          <div style="display:flex;align-items:flex-end;gap:8px;margin-bottom:6px">
            <div class="stats-big-num" style="color:${topicMeta.color}">${pct}%</div>
            <div style="font-family:var(--fm);font-size:11px;color:var(--mu);padding-bottom:4px">${done}/${total} tasks</div>
          </div>
          <div style="height:5px;background:var(--s2);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${topicMeta.color};border-radius:99px;transition:width .4s"></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:8px">
            <span style="font-family:var(--fm);font-size:9px;color:var(--amb)">${inProg} doing</span>
            <span style="font-family:var(--fm);font-size:9px;color:var(--su)">${todo} to-do</span>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-title">Net Earned</div>
          <div class="stats-big-num" style="color:${netMoney>=0?'var(--wh)':'var(--red)'}">$${netMoney.toLocaleString()}</div>
          <div style="display:flex;gap:10px;margin-top:4px">
            <span style="font-family:var(--fm);font-size:9px;color:var(--grn)">+$${money.toLocaleString()} earned</span>
            ${penaltyTotal>0?`<span style="font-family:var(--fm);font-size:9px;color:var(--red)">−$${penaltyTotal.toLocaleString()} lost</span>`:''}
          </div>
          <div class="stats-sub" style="margin-top:4px">${done} completed · ${topicPenalties.length} missed</div>
        </div>
        <div class="stats-card">
          <div class="stats-title">By Difficulty</div>
          ${Object.entries(diffBreak).map(([d,c])=>c===0?'':
            `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
              <span class="diff-badge diff-${d}">${DIFF_LABELS[d]}</span>
              <div style="display:flex;gap:8px">
                <span style="font-family:var(--fm);font-size:9px;color:var(--su)">${c}×</span>
                <span style="font-family:var(--fm);font-size:9px;font-weight:700;color:${DIFF_COLORS[d]}">$${(c*DIFF_MONEY[d]).toLocaleString()}</span>
              </div>
            </div>`).join('')||'<div class="stats-sub">Complete tasks first</div>'}
        </div>
      </div>

      <!-- Projects breakdown -->
      <div class="stats-card">
        <div class="stats-title">Projects within ${escH(topicMeta.label)}</div>
        ${projRows.length===0?`<div class="empty-state" style="padding:14px 0">No projects in this topic</div>`
          :projRows.map(r=>`
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--b1)">
            <div style="width:36px;height:36px;border-radius:9px;${r.pm.img?`background:var(--s2)`:`background:${r.pm.grad}`};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;overflow:hidden;position:relative">
              ${r.pm.img?`<img src="${r.pm.img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:r.pm.emoji}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;color:var(--wh);margin-bottom:4px">${escH(r.p.name)}</div>
              <div style="height:4px;background:var(--s2);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${r.ppct}%;background:${r.pm.color};border-radius:99px"></div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-family:var(--fm);font-size:11px;font-weight:700;color:${r.pm.color}">${r.ppct}%</div>
              <div style="font-family:var(--fm);font-size:9px;color:var(--mu)">${r.pd}/${r.pt} done</div>
              <div style="font-family:var(--fm);font-size:9px;color:var(--grn)">+$${r.pm2.toLocaleString()}</div>
              ${r.pLost>0?`<div style="font-family:var(--fm);font-size:9px;color:var(--red)">−$${r.pLost.toLocaleString()}</div>`:''}
            </div>
          </div>`).join('')}
      </div>

      <!-- Donut by project -->
      ${projData.some(p=>p.count>0)?`<div class="stats-card">
        <div class="stats-title">Work Distribution by Project</div>
        ${renderDonutChart(projData)}
      </div>`:''}

    </div>`;

  }else{
    // ── ALL TOPICS STATS ──
    const allDone=db.tasks.filter(t=>t.status==='done');
    const totalEarned=allDone.reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
    const totalPenalties=db.penalties.reduce((s,p)=>s+p.amount,0);
    const netTotal=totalEarned-totalPenalties;
    const totalAll=db.tasks.length;
    const totalPct=totalAll>0?Math.round(allDone.length/totalAll*100):0;

    const topicItems=db.settings.topics.map(tid=>{
      const meta=getTopicMeta(tid);
      const tAll=db.tasks.filter(t=>t.topic===tid);
      const tDone=tAll.filter(t=>t.status==='done');
      const money=tDone.reduce((s,t)=>s+(DIFF_MONEY[t.difficulty]||0),0);
      const lost=db.penalties.filter(p=>p.topic===tid).reduce((s,p)=>s+p.amount,0);
      const pct=tAll.length>0?Math.round(tDone.length/tAll.length*100):0;
      return{id:tid,meta,all:tAll.length,done:tDone.length,money,lost,net:money-lost,pct};
    }).sort((a,b)=>b.net-a.net);

    const maxNet=Math.max(...topicItems.map(t=>t.net),1);

    const countByDiff={easy:0,'medium-easy':0,'medium-hard':0,hard:0};
    allDone.forEach(t=>{if(t.difficulty&&countByDiff[t.difficulty]!==undefined)countByDiff[t.difficulty]++;});

    document.getElementById('view-content').innerHTML=`
    <div class="stats-wrap">

      <!-- Summary numbers -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div class="stats-card">
          <div class="stats-title">Net Earned</div>
          <div class="stats-big-num" style="color:${netTotal>=0?'var(--wh)':'var(--red)'}">$${netTotal.toLocaleString()}</div>
          <div style="display:flex;gap:10px;margin-top:4px">
            <span style="font-family:var(--fm);font-size:9px;color:var(--grn)">+$${totalEarned.toLocaleString()}</span>
            ${totalPenalties>0?`<span style="font-family:var(--fm);font-size:9px;color:var(--red)">−$${totalPenalties.toLocaleString()}</span>`:''}
          </div>
          <div class="stats-sub" style="margin-top:4px">${allDone.length}/${totalAll} done · ${totalPct}%</div>
        </div>
        <div class="stats-card">
          <div class="stats-title">Top Topic</div>
          ${topicItems[0]&&topicItems[0].net>0
            ?`<div style="display:flex;align-items:center;gap:8px">
                <span style="width:10px;height:10px;border-radius:50%;background:${topicItems[0].meta.dot};flex-shrink:0"></span>
                <div>
                  <div style="font-size:14px;font-weight:700;color:${topicItems[0].meta.color}">${escH(topicItems[0].meta.label)}</div>
                  <div class="stats-sub">$${topicItems[0].net.toLocaleString()} net · ${topicItems[0].done} tasks done</div>
                </div>
              </div>`
            :`<div class="stats-sub">Complete tasks to see rankings</div>`}
        </div>
        <div class="stats-card">
          <div class="stats-title">By Difficulty</div>
          ${Object.entries(countByDiff).map(([d,c])=>c===0?'':
            `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
              <span class="diff-badge diff-${d}">${DIFF_LABELS[d]}</span>
              <div style="display:flex;gap:8px">
                <span style="font-family:var(--fm);font-size:9px;color:var(--su)">${c}×</span>
                <span style="font-family:var(--fm);font-size:9px;font-weight:700;color:${DIFF_COLORS[d]}">$${(c*DIFF_MONEY[d]).toLocaleString()}</span>
              </div>
            </div>`).join('')||'<div class="stats-sub">Complete tasks first</div>'}
        </div>
      </div>

      <!-- Line chart -->
      <div class="stats-card">
        <div class="stats-title" style="display:flex;align-items:center;justify-content:space-between">
          Accumulated Earnings Over Time
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${topicItems.map(t=>`<span style="display:flex;align-items:center;gap:4px;font-family:var(--fm);font-size:9px;color:${t.meta.color}"><span style="width:18px;height:2px;background:${t.meta.color};display:inline-block;border-radius:1px"></span>${t.meta.label}</span>`).join('')}
            <span style="display:flex;align-items:center;gap:4px;font-family:var(--fm);font-size:9px;color:var(--su)"><span style="width:18px;height:1px;border-top:1px dashed rgba(255,255,255,.25);display:inline-block"></span>Total</span>
          </div>
        </div>
        ${renderLineChart(topicItems)}
      </div>

      <!-- Topic comparison -->
      <div class="stats-card">
        <div class="stats-title">Topic Performance Comparison</div>
        ${topicItems.length===0?`<div class="empty-state" style="padding:14px 0">No topics yet</div>`
          :topicItems.map(t=>`
          <div style="margin-bottom:12px">
            <div style="display:grid;grid-template-columns:120px 1fr 64px 70px 52px;align-items:center;gap:10px;margin-bottom:3px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:7px;height:7px;border-radius:50%;background:${t.meta.dot};flex-shrink:0"></span>
                <span style="font-size:11px;font-weight:600;color:${t.meta.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escH(t.meta.label)}</span>
              </div>
              <div style="height:6px;background:var(--s2);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${maxNet>0?(Math.max(t.net,0)/maxNet*100):0}%;background:${t.meta.color};border-radius:99px"></div>
              </div>
              <div style="font-family:var(--fm);font-size:10px;font-weight:700;color:${t.net>=0?'var(--grn)':'var(--red)'};text-align:right">$${t.net.toLocaleString()}</div>
              <div style="font-family:var(--fm);font-size:9px;color:var(--mu);text-align:center">${t.done}/${t.all} done</div>
              <div style="font-family:var(--fm);font-size:10px;font-weight:700;color:${t.meta.color};text-align:right">${t.pct}%</div>
            </div>
            ${t.lost>0?`<div style="padding-left:130px;font-family:var(--fm);font-size:9px;color:var(--red)">−$${t.lost.toLocaleString()} lost from ${db.penalties.filter(p=>p.topic===t.id).length} missed task${db.penalties.filter(p=>p.topic===t.id).length!==1?'s':''}</div>`:''}
          </div>`).join('')}
      </div>

    </div>`;
  }
}

// ─────────────────────────────────────────────
// ASSIGN AGENT MODAL
// ─────────────────────────────────────────────
function openAssignModal(taskId){
  assignTaskId=taskId;
  document.getElementById('assign-task-id').value=taskId;
  const listEl=document.getElementById('assign-agent-list');
  const noEl=document.getElementById('assign-no-agents');
  if(!db.agents||db.agents.length===0){
    listEl.style.display='none';noEl.style.display='block';
  } else {
    noEl.style.display='none';listEl.style.display='flex';
    listEl.innerHTML=db.agents.map(ag=>{
      const balance=(ag.earned||0)-(ag.lost||0);
      const assignedCount=db.tasks.filter(t=>t.assignedAgent===ag.id&&t.status==='in-progress').length;
      return`<button onclick="assignAgentToTask('${ag.id}')"
        style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--b2);background:var(--s2);cursor:pointer;text-align:left;transition:all .12s;width:100%"
        onmouseover="this.style.borderColor='var(--ac)';this.style.background='rgba(90,120,152,.14)'"
        onmouseout="this.style.borderColor='var(--b2)';this.style.background='var(--s2)'">
        ${agentAvatarHtml(ag,36)}
        <div style="flex:1;min-width:0">
          <div style="font-family:var(--fm);font-size:11px;font-weight:700;color:var(--wh);letter-spacing:.04em">${escH(ag.name)}</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--mu);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escH(ag.context||'')}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:var(--fm);font-size:11px;font-weight:700;color:${balance>=0?'var(--grn)':'var(--red)'}">$${balance}</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--mu)">${assignedCount} active</div>
        </div>
      </button>`;
    }).join('');
  }
  document.getElementById('assign-modal').style.display='flex';
}
function closeAssignModal(){
  document.getElementById('assign-modal').style.display='none';
  assignTaskId=null;
}
function assignAgentToTask(agentId){
  if(!assignTaskId)return closeAssignModal();
  const idx=db.tasks.findIndex(t=>t.id===assignTaskId);
  if(idx>=0){
    const agent=db.agents.find(a=>a.id===agentId);
    db.tasks[idx].assignedAgent=agentId;
    db.tasks[idx].status='in-progress';
    db.tasks[idx].completedDate=null;
    saveData();
    closeAssignModal();
    renderCurrentView();
    showToast(`Assigned to ${agent?agent.name:'Agent'} · now in progress`);
  } else {
    closeAssignModal();
  }
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('add-topic-modal').style.display!=='none')closeAddTopicModal();
    else if(document.getElementById('add-proj-modal').style.display!=='none')closeAddProjModal();
    else if(document.getElementById('assign-modal')&&document.getElementById('assign-modal').style.display!=='none')closeAssignModal();
    else{closeVC();closeRecModal();}
  }
  if(e.key==='n'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();openVC();}
});
document.addEventListener('dragend', () => {
  const dz = document.getElementById('assign-dz');
  if(dz) dz.style.display='none';
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function init(){
  selectedWeek=getMondayOf(new Date());selectedDay=todayStr();
  expandedWeeks.add(selectedWeek);
  checkRecurring();
  checkPenalties();
  collapsedTopics.add('social-media');collapsedTopics.add('master');collapsedTopics.add('app');
  renderSidebar();switchView('daily');
}
init();
