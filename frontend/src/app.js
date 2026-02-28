/* app.js - vanilla + bootstrap + SortableJS
   Data model: your exact backend payload (array of sheets), plus ids.
   Empty/padding values: null.
*/

const STATE = {
  data: [],
  activeSheetId: null,
  search: "",
  modal: {
    isAdd: false,
    sheetId: null,
    tcId: null,
    draft: null, // deep-cloned testcase for editing
  },
};

// USE WEB LOCAL STORAGE

// function loadState() {
//   const raw = localStorage.getItem("tcg:data");
//   if (!raw) return null;
//   try { return JSON.parse(raw); } catch { return null; }
// }

// function persist() {
//   localStorage.setItem("tcg:data", JSON.stringify(STATE.data));
// }


const ARR_FIELDS = ["testprocedure","precondition","testdata","expectedresult","actualresult"];

function uid(prefix="id") {
  if (window.crypto && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getSheetById(sheetId) {
  return STATE.data.find(s => s.id === sheetId) || null;
}

function getActiveSheet() {
  if (!STATE.activeSheetId) {
    STATE.activeSheetId = STATE.data[0]?.id ?? null;
  }
  return getSheetById(STATE.activeSheetId);
}

function ensureArray(tc, field) {
  if (!Array.isArray(tc[field])) tc[field] = [];
}

function getRowCount(tc) {
  let maxLen = 0;
  for (const f of ARR_FIELDS) {
    ensureArray(tc, f);
    maxLen = Math.max(maxLen, tc[f].length);
  }
  return maxLen;
}

function padToNull(arr, len) {
  while (arr.length < len) arr.push(null);
}

function ensureRow(tc, rowIndex) {
  const len = rowIndex + 1;
  for (const f of ARR_FIELDS) {
    ensureArray(tc, f);
    padToNull(tc[f], len);
  }
}

function addRow(tc) {
  const n = getRowCount(tc);
  ensureRow(tc, n); // adds row at index n
}

function deleteRow(tc, i) {
  for (const f of ARR_FIELDS) {
    ensureArray(tc, f);
    if (tc[f].length > i) tc[f].splice(i, 1);
  }
}

function moveRow(tc, from, to) {
  const maxIndex = Math.max(from, to);
  ensureRow(tc, maxIndex);
  for (const f of ARR_FIELDS) {
    const [item] = tc[f].splice(from, 1);
    tc[f].splice(to, 0, item ?? null);
  }
}

function isNullishEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  return false;
}

function trimTrailingEmptyRows(tc) {
  const n = getRowCount(tc);
  let lastKeep = -1;
  for (let i = 0; i < n; i++) {
    const anyNonEmpty = ARR_FIELDS.some(f => !isNullishEmpty(tc[f][i]));
    if (anyNonEmpty) lastKeep = i;
  }
  const newLen = lastKeep + 1;
  for (const f of ARR_FIELDS) {
    ensureArray(tc, f);
    tc[f] = tc[f].slice(0, newLen);
  }
}

function setCell(tc, field, rowIndex, value) {
  ensureRow(tc, rowIndex);
  const v = (value ?? "").trim();
  tc[field][rowIndex] = v === "" ? null : v;
}

function getCell(tc, field, rowIndex) {
  ensureArray(tc, field);
  return tc[field][rowIndex] ?? "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const elTabs = document.getElementById("sheetTabs");
const elTbody = document.getElementById("testCaseTbody");
const elSheetMeta = document.getElementById("sheetMeta");
const elSearch = document.getElementById("searchInput");

function renderTabs() {
  elTabs.innerHTML = "";
  const activeId = STATE.activeSheetId || STATE.data[0]?.id;

  for (const sheet of STATE.data) {
    const li = document.createElement("li");
    li.className = "nav-item";

    const sheetTab = document.createElement("button");
    sheetTab.type = "button";
    sheetTab.className = "nav-link" + (sheet.id === activeId ? " active" : "");
    sheetTab.textContent = sheet.sheetName || "(unnamed)";

    // click to switch tab
    sheetTab.onclick = () => {
      STATE.activeSheetId = sheet.id;
      renderAll();
    };

    // TODO: double click to rename
    sheetTab.ondblclick = (e) => {
      e.preventDefault();
      e.stopPropagation(); // avoid triggering click selection weirdness
      
      //renameSheetTab(sheet);
      const current = sheet.sheetName || "";
      const name = prompt("Rename sheet:", current);
      if (name === null) return; // user cancelled
      const trimmed = name.trim();
      if (!trimmed) return; // ignore empty
      sheet.sheetName = trimmed;

      // if you enable localStorage later, call persist() here
      // persist();

      renderAll();
    };

    li.appendChild(sheetTab);
    elTabs.appendChild(li);
  }

  const liPlus = document.createElement("li");
  liPlus.className = "nav-item ms-auto";
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "nav-link tab-plus";
  plus.textContent = "+";
  plus.title = "Add sheet";
  plus.onclick = () => {
    const newSheet = {
      id: uid("sheet"),
      sheetName: `New Sheet ${STATE.data.length + 1}`,
      testCase: []
    };
    STATE.data.push(newSheet);
    STATE.activeSheetId = newSheet.id;
    renderAll();
  };
  liPlus.appendChild(plus);
  elTabs.appendChild(liPlus);
}

function badgeType(type) {
  const map = {
    Positive: "bg-success-subtle text-success",
    Negative: "bg-danger-subtle text-danger",
    Edge: "bg-warning-subtle text-warning",
    Regression: "bg-info-subtle text-info",
  };
  const cls = map[type] || "bg-secondary-subtle text-secondary";
  return `<span class="badge rounded-pill ${cls}">${escapeHtml(type || "")}</span>`;
}

function badgeResult(res) {
  if (res === "1") return `<span class="badge text-bg-success">PASS</span>`;
  if (res === "0") return `<span class="badge text-bg-danger">FAIL</span>`;
  if (res === ".") return `<span class="badge text-bg-warning">.</span>`;
  if (res === "Blocked") return `<span class="badge text-bg-secondary">Blocked</span>`;
  return `<span class="badge text-bg-secondary">${escapeHtml(res ?? "")}</span>`;
}

function renderDetailGrid(tc) {
  for (const f of ARR_FIELDS) ensureArray(tc, f);
  const n = getRowCount(tc);

  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push(`
      <tr>
        <td class="text-secondary mono">${i+1}</td>
        <td class="cell-text">${escapeHtml(tc.testprocedure[i] ?? "")}</td>
        <td class="cell-text">${escapeHtml(tc.precondition[i] ?? "")}</td>
        <td class="cell-text">${escapeHtml(tc.testdata[i] ?? "")}</td>
        <td class="cell-text">${escapeHtml(tc.expectedresult[i] ?? "")}</td>
        <td class="cell-text">${escapeHtml(tc.actualresult[i] ?? "")}</td>
      </tr>
    `);
  }

  return `
    <div class="small mb-2 text-secondary">Expanded detail (index-aligned view) · rows: <span class="mono">${n}</span></div>
    <div class="table-responsive">
      <table class="table table-sm table-bordered detail-grid mb-0">
        <thead class="table-light">
          <tr>
            <th style="width: 48px;">#</th>
            <th>Procedure</th>
            <th>Precondition</th>
            <th>Test Data</th>
            <th>Expected</th>
            <th>Actual</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("") || `<tr><td colspan="6" class="text-center text-secondary">No row slots yet</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderTable() {
  const sheet = getActiveSheet();
  if (!sheet) {
    elSheetMeta.textContent = "No sheets yet.";
    elTbody.innerHTML = "";
    return;
  }

  const q = (STATE.search || "").trim().toLowerCase();
  let cases = sheet.testCase || [];
  if (q) {
    cases = cases.filter(tc =>
      (tc.tcid || "").toLowerCase().includes(q) ||
      (tc.testscenario || "").toLowerCase().includes(q)
    );
  }

  elSheetMeta.textContent = `${sheet.sheetName} · ${cases.length} test case(s)`;
  elTbody.innerHTML = "";

  for (const tc of cases) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button class="btn btn-sm btn-link" data-action="toggle" title="Expand">▸</button></td>
      <td class="mono">${escapeHtml(tc.tcid ?? "")}</td>
      <td>
        <div class="fw-semibold truncate-2">${escapeHtml(tc.testscenario ?? "")}</div>
        <div class="text-secondary small mono">id: ${escapeHtml(tc.id ?? "")}</div>
      </td>
      <td>${badgeType(tc.type)}</td>
      <td>${badgeResult(tc.testresult)}</td>
      <td class="text-secondary">${escapeHtml(tc.notes ?? "")}</td>
      <td>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete">Delete</button>
        </div>
      </td>
    `;

    const detailTr = document.createElement("tr");
    detailTr.className = "d-none";
    detailTr.innerHTML = `
      <td colspan="7" class="bg-body-tertiary">
        ${renderDetailGrid(tc)}
      </td>
    `;

    tr.querySelector('[data-action="toggle"]').onclick = () => {
      const isHidden = detailTr.classList.contains("d-none");
      detailTr.classList.toggle("d-none", !isHidden);
      tr.querySelector('[data-action="toggle"]').textContent = isHidden ? "▾" : "▸";
    };

    tr.querySelector('[data-action="edit"]').onclick = () => openModalEdit(sheet.id, tc.id);
    tr.querySelector('[data-action="delete"]').onclick = () => {
      if (!confirm(`Delete ${tc.tcid}?`)) return;
      sheet.testCase = (sheet.testCase || []).filter(x => x.id !== tc.id);
      renderAll();
    };

    elTbody.appendChild(tr);
    elTbody.appendChild(detailTr);
  }
}

function renderAll() {
  renderTabs();
  renderTable();
}

const modalEl = document.getElementById("tcModal");
const bsModal = new bootstrap.Modal(modalEl);
const elModalTitle = document.getElementById("tcModalTitle");
const elModalSubtitle = document.getElementById("tcModalSubtitle");

const f_tcid = document.getElementById("f_tcid");
const f_testscenario = document.getElementById("f_testscenario");
const f_type = document.getElementById("f_type");
const f_testresult = document.getElementById("f_testresult");
const f_notes = document.getElementById("f_notes");

const rowSlotTbody = document.getElementById("rowSlotTbody");
let rowSortable = null;

function openModalAdd() {
  const sheet = getActiveSheet();
  if (!sheet) return;

  const draft = {
    id: uid("tc"),
    tcid: "",
    testscenario: "",
    type: "Positive",
    precondition: [],
    testdata: [],
    testprocedure: [],
    expectedresult: [],
    actualresult: [],
    testresult: ".",
    notes: null,
  };

  STATE.modal = {
    isAdd: true,
    sheetId: sheet.id,
    tcId: draft.id,
    draft
  };

  fillModalFromDraft();
  bsModal.show();
}

function openModalEdit(sheetId, tcId) {
  const sheet = getSheetById(sheetId);
  const tc = (sheet?.testCase || []).find(x => x.id === tcId);
  if (!sheet || !tc) return;

  STATE.modal = {
    isAdd: false,
    sheetId,
    tcId,
    draft: deepClone(tc),
  };

  fillModalFromDraft();
  bsModal.show();
}

function fillModalFromDraft() {
  const {isAdd, sheetId, tcId, draft} = STATE.modal;
  const sheet = getSheetById(sheetId);

  elModalTitle.textContent = isAdd ? "Add Test Case" : "Edit Test Case";
  elModalSubtitle.textContent = `${sheet?.sheetName ?? ""} · internal id: ${tcId}`;

  f_tcid.value = draft.tcid ?? "";
  f_testscenario.value = draft.testscenario ?? "";
  f_type.value = draft.type ?? "Positive";
  f_testresult.value = draft.testresult ?? "1";
  f_notes.value = draft.notes ?? "";

  renderRowSlots();
}

function syncDraftFromScalars() {
  const d = STATE.modal.draft;
  d.tcid = (f_tcid.value ?? "").trim();
  d.testscenario = (f_testscenario.value ?? "").trim();
  d.type = f_type.value;
  d.testresult = f_testresult.value;
  const notes = (f_notes.value ?? "").trim();
  d.notes = notes === "" ? null : notes;
}

function renderRowSlots() {
  const d = STATE.modal.draft;
  const n = getRowCount(d);
  rowSlotTbody.innerHTML = "";

  for (let i = 0; i < n; i++) {
    const tr = document.createElement("tr");
    tr.dataset.rowIndex = String(i);
    tr.innerHTML = `
      <td class="text-center"><span class="row-handle" title="Drag">≡</span></td>
      <td class="text-secondary mono">${i+1}</td>
      <td><textarea class="form-control form-control-sm" rows="2" data-field="testprocedure">${escapeHtml(getCell(d,"testprocedure",i))}</textarea></td>
      <td><textarea class="form-control form-control-sm" rows="2" data-field="precondition">${escapeHtml(getCell(d,"precondition",i))}</textarea></td>
      <td><textarea class="form-control form-control-sm" rows="2" data-field="testdata">${escapeHtml(getCell(d,"testdata",i))}</textarea></td>
      <td><textarea class="form-control form-control-sm" rows="2" data-field="expectedresult">${escapeHtml(getCell(d,"expectedresult",i))}</textarea></td>
      <td><textarea class="form-control form-control-sm" rows="2" data-field="actualresult">${escapeHtml(getCell(d,"actualresult",i))}</textarea></td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-danger" title="Delete row" data-action="delrow">🗑</button>
      </td>
    `;

    tr.querySelectorAll("textarea[data-field]").forEach(el => {
      el.addEventListener("input", (e) => {
        const field = e.target.getAttribute("data-field");
        const rowIndex = Number(tr.dataset.rowIndex);
        setCell(STATE.modal.draft, field, rowIndex, e.target.value);
      });
    });

    tr.querySelector('[data-action="delrow"]').onclick = () => {
      deleteRow(STATE.modal.draft, i);
      renderRowSlots();
    };

    rowSlotTbody.appendChild(tr);
  }

  if (rowSortable) {
    rowSortable.destroy();
    rowSortable = null;
  }
  rowSortable = new Sortable(rowSlotTbody, {
    handle: ".row-handle",
    animation: 150,
    onEnd: (evt) => {
      if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
      const from = evt.oldIndex;
      const to = evt.newIndex;
      if (from === to) return;
      moveRow(STATE.modal.draft, from, to);
      renderRowSlots();
    }
  });
}

document.getElementById("btnAddRow").onclick = () => {
  addRow(STATE.modal.draft);
  renderRowSlots();
};
document.getElementById("btnTrimRows").onclick = () => {
  trimTrailingEmptyRows(STATE.modal.draft);
  renderRowSlots();
};
document.getElementById("btnSaveTc").onclick = () => {
  syncDraftFromScalars();
  trimTrailingEmptyRows(STATE.modal.draft);

  const sheet = getSheetById(STATE.modal.sheetId);
  if (!sheet) return;

  if (STATE.modal.isAdd) {
    sheet.testCase = sheet.testCase || [];
    sheet.testCase.push(deepClone(STATE.modal.draft));
  } else {
    const idx = (sheet.testCase || []).findIndex(x => x.id === STATE.modal.tcId);
    if (idx >= 0) sheet.testCase[idx] = deepClone(STATE.modal.draft);
  }

  bsModal.hide();
  renderAll();
};

document.getElementById("btnAddTestCase").onclick = openModalAdd;

document.getElementById("btnDownloadJson").onclick = () => {
  const blob = new Blob([JSON.stringify(STATE.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "testcases.json";
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById("btnDownloadExcel").onclick = async () => {
  try {

    const res = await fetch("/excel/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(STATE.data),
    });

    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "testcases.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(String(e) + "\\n\\nTip: Implement POST /export in your Node server to return the exceljs workbook as .xlsx.");
  }
};

elSearch.addEventListener("input", (e) => {
  STATE.search = e.target.value || "";
  renderTable();
});

(function init() {
  for (const sheet of STATE.data) {
    if (!sheet.id) sheet.id = uid("sheet");
    sheet.testCase = sheet.testCase || [];
    for (const tc of sheet.testCase) {
      if (!tc.id) tc.id = uid("tc");
      for (const f of ARR_FIELDS) ensureArray(tc, f);
      if (tc.notes === undefined) tc.notes = null;
    }
  }
  STATE.activeSheetId = STATE.data[0]?.id ?? null;
  renderAll();
})();


// USE WEB LOCAL STORAGE

// (function init() {
//   const saved = loadState();
//   STATE.data = Array.isArray(saved) ? saved : [];

//   // ensure at least one sheet
//   if (STATE.data.length === 0) {
//     const s = { id: uid("sheet"), sheetName: "Sheet 1", testCase: [] };
//     STATE.data.push(s);
//   }

//   // ensure ids + arrays
//   for (const sheet of STATE.data) {
//     if (!sheet.id) sheet.id = uid("sheet");
//     sheet.testCase = sheet.testCase || [];
//     for (const tc of sheet.testCase) {
//       if (!tc.id) tc.id = uid("tc");
//       for (const f of ARR_FIELDS) ensureArray(tc, f);
//       if (tc.notes === undefined) tc.notes = null;
//     }
//   }

//   STATE.activeSheetId = STATE.data[0]?.id ?? null;
//   renderAll();
// })();
