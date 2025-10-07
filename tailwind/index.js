const API = "https://todoapitest.juansegaliz.com/todos";

// Refs
const msg = document.getElementById("message");
const rows = document.getElementById("rows");
const search = document.getElementById("search");
const statusRadios = document.querySelectorAll('input[name="status"]');

let todos = [];
let filtered = [];

function showMsg(text, ok = true) {
  msg.textContent = text;
  msg.className = ok ? "text-sm text-emerald-700" : "text-sm text-rose-700";
  setTimeout(() => (msg.textContent = ""), 2500);
}

async function request(method = "GET", path = "", body) {
  const res = await fetch(API + (path || ""), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data, status: res.status };
}

function renderRows(list) {
  rows.innerHTML = "";
  if (!list.length) {
    rows.innerHTML = `<tr><td colspan="3" class="px-5 py-4 text-sm text-slate-500">No hay tareas.</td></tr>`;
    return;
  }
  for (const t of list) {
    const id = t.Id ?? t.id;
    const done = t.IsCompleted ?? t.isCompleted ?? false;
    const title = t.Title ?? t.title ?? "(sin título)";
    const desc = t.Description ?? t.description ?? "";
    rows.insertAdjacentHTML("beforeend", `
      <tr class="border-t">
        <td class="px-5 py-3 text-sm">${id ?? "-"}</td>
        <td class="px-5 py-3">
          <div class="text-sm font-medium ${done ? "line-through text-slate-400" : ""}">${title}</div>
          <div class="text-xs text-slate-500">${desc}</div>
        </td>
        <td class="px-5 py-3 text-sm">${done ? "✅" : "⏳"}</td>
      </tr>
    `);
  }
}

function applyFilters() {
  const q = (search.value || "").toLowerCase();
  const status = [...statusRadios].find(r => r.checked)?.value || "all";
  filtered = todos.filter(t => {
    const title = (t.Title ?? t.title ?? "").toLowerCase();
    const desc = (t.Description ?? t.description ?? "").toLowerCase();
    const done = t.IsCompleted ?? t.isCompleted ?? false;
    const matchText = title.includes(q) || desc.includes(q);
    const matchStatus = status === "all" || (status === "open" ? !done : done);
    return matchText && matchStatus;
  });
  renderRows(filtered);
}

async function loadTodos() {
  const { ok, data } = await request("GET");
  if (!ok) { showMsg("No se pudieron cargar las tareas.", false); return; }
  todos = Array.isArray(data) ? data : (data?.data || []);
  applyFilters();
}

document.addEventListener("DOMContentLoaded", loadTodos);
search.addEventListener("input", applyFilters);
statusRadios.forEach(r => r.addEventListener("change", applyFilters));
