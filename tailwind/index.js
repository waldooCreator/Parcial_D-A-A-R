const API = "https://todoapitest.juansegaliz.com/todos";

// Refs
const msg = document.getElementById("message");
const rows = document.getElementById("rows");
const search = document.getElementById("search");
const statusRadios = document.querySelectorAll('input[name="status"]');

const title = document.getElementById("title");
const description = document.getElementById("description");
const btnAdd = document.getElementById("btnAdd");

// Modal
const modal = document.getElementById("editModal");
const editId = document.getElementById("editId");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editCompleted = document.getElementById("editCompleted");
const btnSave = document.getElementById("btnSave");
const btnCancel = document.getElementById("btnCancel");

let todos = [];
let filtered = [];
let _loading = false;

// Helpers
function showMsg(text, ok = true) {
  msg.textContent = text;
  msg.className = ok ? "text-sm text-emerald-700" : "text-sm text-rose-700";
  setTimeout(() => (msg.textContent = ""), 2500);
}
function setLoading(on) {
  _loading = !!on;
  [btnAdd, btnSave].forEach(b => b && (b.disabled = _loading));
  if (_loading) {
    rows.innerHTML = `
      <tr class="animate-pulse"><td colspan="4" class="px-5 py-4">
        <div class="h-4 w-1/3 bg-slate-200 rounded mb-2"></div>
        <div class="h-4 w-2/3 bg-slate-200 rounded"></div>
      </td></tr>
      <tr class="animate-pulse"><td colspan="4" class="px-5 py-4">
        <div class="h-4 w-1/3 bg-slate-200 rounded mb-2"></div>
        <div class="h-4 w-2/3 bg-slate-200 rounded"></div>
      </td></tr>`;
  }
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
function openModal() { modal.classList.remove("hidden"); modal.classList.add("flex"); }
function closeModal() { modal.classList.add("hidden"); modal.classList.remove("flex"); }

function validateCreate() {
  const t = title.value.trim(), d = description.value.trim();
  if (t.length < 3) { showMsg("El título debe tener al menos 3 caracteres.", false); title.focus(); return false; }
  if (d.length < 3) { showMsg("La descripción debe tener al menos 3 caracteres.", false); description.focus(); return false; }
  return true;
}
function validateEdit() {
  const t = editTitle.value.trim(), d = editDescription.value.trim();
  if (t.length < 3) { showMsg("El título (edición) debe tener al menos 3 caracteres.", false); editTitle.focus(); return false; }
  if (d.length < 3) { showMsg("La descripción (edición) debe tener al menos 3 caracteres.", false); editDescription.focus(); return false; }
  return true;
}

// Render + filtros
function renderRows(list) {
  rows.innerHTML = "";
  if (!list.length) {
    rows.innerHTML = `<tr><td colspan="4" class="px-5 py-4 text-sm text-slate-500">No hay tareas. Crea una nueva usando el formulario superior.</td></tr>`;
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
        <td class="px-5 py-3 text-sm flex gap-3">
          <button data-id="${id}" class="btn-toggle text-sky-700 hover:underline">${done ? "Marcar pendiente" : "Marcar hecha"}</button>
          <button data-id="${id}" class="btn-edit text-indigo-700 hover:underline">Editar</button>
          <button data-id="${id}" class="btn-del text-rose-700 hover:underline">Eliminar</button>
        </td>
      </tr>
    `);
  }
  rows.querySelectorAll(".btn-del").forEach(b => b.addEventListener("click", () => removeTodo(b.dataset.id)));
  rows.querySelectorAll(".btn-edit").forEach(b => b.addEventListener("click", () => openEdit(b.dataset.id)));
  rows.querySelectorAll(".btn-toggle").forEach(b => b.addEventListener("click", () => toggleTodo(b.dataset.id)));
}
function applyFilters() {
  const q = (search.value || "").toLowerCase();
  const status = [...statusRadios].find(r => r.checked)?.value || "all";
  filtered = todos.filter(t => {
    const title = (t.Title ?? t.title ?? "").toLowerCase();
    const desc = (t.Description ?? t.description ?? "").toLowerCase();
    const done = (t.IsCompleted ?? t.isCompleted ?? false);
    const matchText = title.includes(q) || desc.includes(q);
    const matchStatus = status === "all" || (status === "open" ? !done : done);
    return matchText && matchStatus;
  });
  renderRows(filtered);
}

// CRUD
async function loadTodos() {
  setLoading(true);
  try {
    const { ok, data } = await request("GET");
    if (!ok) { showMsg("No se pudieron cargar las tareas.", false); return; }
    todos = Array.isArray(data) ? data : (data?.data || []);
    applyFilters();
  } finally { setLoading(false); }
}
async function addTodo() {
  if (!validateCreate()) return;
  btnAdd.disabled = true;
  try {
    const body = { Title: title.value.trim(), Description: description.value.trim(), IsCompleted: false };
    const { ok } = await request("POST", "", body);
    if (!ok) return showMsg("No se pudo crear.", false);
    title.value = ""; description.value = "";
    showMsg("Tarea creada.");
    await loadTodos();
  } finally { btnAdd.disabled = false; }
}
async function openEdit(id) {
  const { ok, data } = await request("GET", `/${id}`);
  if (!ok || !data) return showMsg("No se pudo cargar la tarea.", false);
  editId.value = data.Id ?? data.id;
  editTitle.value = data.Title ?? data.title ?? "";
  editDescription.value = data.Description ?? data.description ?? "";
  editCompleted.checked = data.IsCompleted ?? data.isCompleted ?? false;
  openModal();
}
async function saveEdit() {
  if (!validateEdit()) return;
  const id = editId.value;
  btnSave.disabled = true;
  try {
    const body = {
      Id: Number(id),
      Title: editTitle.value.trim(),
      Description: editDescription.value.trim(),
      IsCompleted: !!editCompleted.checked,
    };
    const { ok } = await request("PUT", `/${id}`, body);
    showMsg(ok ? "Cambios guardados." : "No se pudo actualizar.", !!ok);
    if (ok) { closeModal(); await loadTodos(); }
  } finally { btnSave.disabled = false; }
}
async function removeTodo(id) {
  if (!id) return;
  const { ok } = await request("DELETE", `/${id}`);
  showMsg(ok ? "Eliminada." : "No se pudo eliminar.", !!ok);
  await loadTodos();
}
async function toggleTodo(id) {
  const { ok, data } = await request("GET", `/${id}`);
  if (!ok || !data) return showMsg("No se pudo leer.", false);
  const body = {
    Id: data.Id ?? data.id,
    Title: data.Title ?? data.title ?? "",
    Description: data.Description ?? data.description ?? "",
    IsCompleted: !(data.IsCompleted ?? data.isCompleted ?? false),
  };
  const r = await request("PUT", `/${id}`, body);
  showMsg(r.ok ? "Estado actualizado." : "No se pudo cambiar estado.", !!r.ok);
  if (r.ok) await loadTodos();
}

// Eventos
document.addEventListener("DOMContentLoaded", loadTodos);
search.addEventListener("input", applyFilters);
statusRadios.forEach(r => r.addEventListener("change", applyFilters));
btnAdd.addEventListener("click", addTodo);
btnSave.addEventListener("click", saveEdit);
btnCancel.addEventListener("click", closeModal);
