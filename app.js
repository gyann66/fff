const API_URL = "https://novaaiapi.gyansinha19.workers.dev/"; // For separate Worker deployment, replace with your full Worker URL.
const form = document.getElementById("chatForm");
const input = document.getElementById("promptInput");
const messagesEl = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendButton = document.getElementById("sendButton");
const statusEl = document.getElementById("connectionStatus");
const recentList = document.getElementById("recentList");
const conversations = [];
let currentConversation = [];
let busy = false;

function fitInput(){ input.style.height="auto"; input.style.height=Math.min(input.scrollHeight,150)+"px"; }
input.addEventListener("input",fitInput);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
document.querySelectorAll(".suggestion").forEach(b=>b.addEventListener("click",()=>{input.value=b.dataset.prompt||"";fitInput();input.focus();}));
document.getElementById("newChat").addEventListener("click",newChat);
document.getElementById("homeLink").addEventListener("click",newChat);
document.getElementById("mobileMenu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();newChat();input.focus();}});

function newChat(){
  if(currentConversation.length) saveConversation();
  currentConversation=[]; messagesEl.innerHTML=""; welcome.hidden=false;
  document.getElementById("sidebar").classList.remove("open");
  input.value="";fitInput();input.focus();
}
function saveConversation(){
  const first=currentConversation.find(m=>m.role==="user");
  if(!first)return;
  const title=first.content.length>31?first.content.slice(0,31)+"…":first.content;
  const existing=conversations.find(c=>c.id===currentConversation);
  if(!existing) conversations.unshift({id:currentConversation,title});
  renderRecent();
}
function renderRecent(){
  recentList.innerHTML="";
  if(!conversations.length){recentList.innerHTML='<div class="empty-recent">Your conversations<br>will appear here.</div>';return;}
  conversations.slice(0,8).forEach(c=>{const b=document.createElement("button");b.className="recent-item";b.textContent=c.title;b.title=c.title;b.onclick=()=>{currentConversation=c.id;messagesEl.innerHTML="";welcome.hidden=true;c.id.forEach(m=>renderMessage(m.role,m.content));document.getElementById("sidebar").classList.remove("open");};recentList.appendChild(b);});
}
function renderMessage(role,content){
  const wrap=document.createElement("div");wrap.className="message "+(role==="user"?"user":"assistant");
  const av=document.createElement("div");av.className="message-avatar";av.textContent=role==="user"?"YOU":"✳";
  const body=document.createElement("div");body.className="message-body";
  const label=document.createElement("div");label.className="message-label";label.textContent=role==="user"?"You":"Nova AI";
  const text=document.createElement("div");text.className="message-text";text.textContent=content;
  body.append(label,text);wrap.append(av,body);messagesEl.appendChild(wrap);return text;
}
function addTyping(){
  const wrap=document.createElement("div");wrap.className="message assistant";wrap.id="typing";
  wrap.innerHTML='<div class="message-avatar">✳</div><div class="message-body"><div class="message-label">Nova AI is thinking</div><div class="typing"><span></span><span></span><span></span></div></div>';
  messagesEl.appendChild(wrap);return wrap;
}
async function sendMessage(content){
  if(busy||!content.trim())return;
  busy=true;sendButton.disabled=true;welcome.hidden=true;
  currentConversation.push({role:"user",content});
  renderMessage("user",content);input.value="";fitInput();messagesEl.scrollTop=messagesEl.scrollHeight;
  const typing=addTyping();messagesEl.scrollTop=messagesEl.scrollHeight;
  try{
    const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:currentConversation.slice(-20)})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);
    const reply=String(data.reply||"No response received.");
    typing.remove();currentConversation.push({role:"assistant",content:reply});renderMessage("assistant",reply);
    statusEl.textContent="AI connected";
  }catch(err){
    typing.remove();
    const msg=err.message.includes("Failed to fetch")?"The AI backend is not connected yet. Deploy the Cloudflare Worker and set your API key as a secret.":err.message;
    const text=renderMessage("assistant","I couldn't reach the AI service.");const note=document.createElement("div");note.className="error-note";note.textContent=msg;text.parentElement.appendChild(note);
    statusEl.textContent="Backend not connected";
  }finally{busy=false;sendButton.disabled=false;input.focus();messagesEl.scrollTop=messagesEl.scrollHeight;}
}
form.addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value);});
