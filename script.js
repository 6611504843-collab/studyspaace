const $ = (id) => document.getElementById(id);
const DAYS = [{n:"อา.",v:0},{n:"จ.",v:1},{n:"อ.",v:2},{n:"พ.",v:3},{n:"พฤ.",v:4},{n:"ศ.",v:5},{n:"ส.",v:6}];
const today = new Date();
const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const read = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
let tasks = read("studyspace_tasks");
let classes = read("studyspace_classes");
const save = () => { localStorage.setItem("studyspace_tasks",JSON.stringify(tasks)); localStorage.setItem("studyspace_classes",JSON.stringify(classes)); };
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateText = value => value ? new Date(value+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"2-digit"}) : "ไม่ระบุ";
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200);}
function showView(name){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===name+"View"));document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));$("pageTitle").textContent=({overview:"ภาพรวม",tasks:"งานของฉัน",timetable:"ตารางเรียน"})[name];}
function taskMarkup(t){return `<div class="task-item ${t.done?"completed":""}"><input class="task-check" type="checkbox" data-toggle="${t.id}" ${t.done?"checked":""} aria-label="ทำเครื่องหมายงานเสร็จ"><div class="task-info"><strong>${escapeHTML(t.name)} ${t.priority==="high"?'<span class="priority">สำคัญ</span>':""}</strong><small>${escapeHTML(t.subject||"ไม่ระบุวิชา")} · ส่ง ${dateText(t.due)}</small></div><div class="task-actions"><button class="icon-btn" data-edit="${t.id}" aria-label="แก้ไขงาน">✎</button><button class="icon-btn" data-delete="${t.id}" aria-label="ลบงาน">×</button></div></div>`;}
function renderTasks(){
 const sorted=[...tasks].sort((a,b)=>a.done-b.done||a.due.localeCompare(b.due));
 $("totalCount").textContent=tasks.length;$("pendingCount").textContent=tasks.filter(t=>!t.done).length;$("doneCount").textContent=tasks.filter(t=>t.done).length;
 $("overviewTasks").innerHTML=sorted.slice(0,4).map(taskMarkup).join("")||'<div class="empty-state"><span>✦</span>ยังไม่มีงาน ลองเพิ่มงานแรกของคุณ</div>';
 const q=$("taskSearch").value.trim().toLowerCase(), filter=$("taskFilter").value;
 const filtered=sorted.filter(t=>(filter==="all"||(filter==="done"?t.done:!t.done))&&(`${t.name} ${t.subject}`.toLowerCase().includes(q)));
 $("allTasks").innerHTML=filtered.map(taskMarkup).join("")||'<div class="empty-state"><span>☁</span>ไม่พบรายการงาน</div>';
}
function renderClasses(){
 const todays=classes.filter(c=>Number(c.day)===today.getDay()).sort((a,b)=>a.start.localeCompare(b.start));
 $("todayClasses").innerHTML=todays.map(c=>`<div class="class-row"><span class="time-pill">${c.start}–${c.end}</span><div><strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.room||"ไม่ระบุห้อง")}</small></div></div>`).join("")||'<div class="empty-state">วันนี้ไม่มีตารางเรียน 🎉</div>';
 const hours=Array.from({length:12},(_,i)=>String(i+7).padStart(2,"0")+":00");
 let html='<div></div>'+DAYS.map(d=>`<div class="schedule-head">${d.n}</div>`).join("");
 hours.forEach(hour=>{html+=`<div class="schedule-time">${hour}</div>`;DAYS.forEach(day=>{const items=classes.filter(c=>Number(c.day)===day.v&&c.start<hour.replace(":00",":59")&&c.end>hour).sort((a,b)=>a.start.localeCompare(b.start));html+=`<div class="schedule-cell">${items.map(c=>`<div class="class-chip">${escapeHTML(c.name)}<small>${c.start}–${c.end}</small><button class="icon-btn" data-class-delete="${c.id}" title="ลบวิชา">×</button></div>`).join("")}</div>`;});});
 $("scheduleGrid").innerHTML=html;
}
function render(){renderTasks();renderClasses();}
function openTask(task=null){$("taskForm").reset();$("taskId").value=task?.id||"";$("taskModalTitle").textContent=task?"แก้ไขงาน":"เพิ่มงานใหม่";$("taskName").value=task?.name||"";$("taskSubject").value=task?.subject||"";$("taskDue").value=task?.due||dateKey(today);$("taskPriority").value=task?.priority||"normal";$("taskDetails").value=task?.details||"";$("taskDialog").showModal();}
function openClass(){$("classForm").reset();$("classDay").value=String(today.getDay());$("classStart").value="09:00";$("classEnd").value="12:00";$("classDialog").showModal();}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
$("quickAdd").addEventListener("click",()=>openTask());$("addTaskBtn").addEventListener("click",()=>openTask());$("addClassBtn").addEventListener("click",openClass);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const id=$("taskId").value;const item={id:id||String(Date.now()),name:$("taskName").value.trim(),subject:$("taskSubject").value.trim(),due:$("taskDue").value,priority:$("taskPriority").value,details:$("taskDetails").value.trim(),done:tasks.find(t=>t.id===id)?.done||false};if(id)tasks=tasks.map(t=>t.id===id?item:t);else tasks.push(item);save();render();$("taskDialog").close();toast("บันทึกงานเรียบร้อยแล้ว");});
$("classForm").addEventListener("submit",e=>{e.preventDefault();const start=$("classStart").value,end=$("classEnd").value;if(end<=start){toast("เวลาสิ้นสุดต้องหลังเวลาเริ่ม");return;}classes.push({id:String(Date.now()),name:$("className").value.trim(),room:$("classRoom").value.trim(),day:$("classDay").value,start,end});save();render();$("classDialog").close();toast("เพิ่มวิชาเรียนเรียบร้อยแล้ว");});
document.addEventListener("click",e=>{const toggle=e.target.closest("[data-toggle]");if(toggle){const t=tasks.find(x=>x.id===toggle.dataset.toggle);if(t){t.done=toggle.checked;save();render();}}const edit=e.target.closest("[data-edit]");if(edit){const t=tasks.find(x=>x.id===edit.dataset.edit);if(t)openTask(t);}const del=e.target.closest("[data-delete]");if(del&&confirm("ต้องการลบงานนี้หรือไม่?")){tasks=tasks.filter(t=>t.id!==del.dataset.delete);save();render();toast("ลบงานแล้ว");}const cd=e.target.closest("[data-class-delete]");if(cd&&confirm("ต้องการลบวิชานี้หรือไม่?")){classes=classes.filter(c=>c.id!==cd.dataset.classDelete);save();render();toast("ลบวิชาแล้ว");}});
$("taskSearch").addEventListener("input",renderTasks);$("taskFilter").addEventListener("change",renderTasks);
$("todayLabel").textContent=today.toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
render();