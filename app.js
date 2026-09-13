/* WAY 管理基幹 Phase 1 デモ（静的モック）
   本物（Next.js + Supabase）の判定ロジックをブラウザ内で再現している。データは localStorage に保持。
   画面に出す文字列はすべて esc() でエスケープしてから差し込む。 */
(function () {
  "use strict";
  const KEY = "way-demo-state-v2";
  const ROLE_KEY = "way-demo-role";
  const ROLE_NAME = { representative: "代表（デモ）", admin: "管理部（デモ）" };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- state ----------
  let S;
  function fresh() { return JSON.parse(JSON.stringify(window.SEED)); }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { S = JSON.parse(raw); return; } } catch (_) {}
    S = fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} }
  let role = "representative";
  try { role = localStorage.getItem(ROLE_KEY) || role; } catch (_) {}
  const ui = { comment: null, exportLe: "" };

  // ---------- lookups ----------
  const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
  let LE, DEPT, ACC, CP, BANK;
  function index() { LE = byId(S.legal_entities); DEPT = byId(S.departments); ACC = byId(S.accounts); CP = byId(S.counterparties); BANK = byId(S.bank_accounts); }
  const inv = (id) => S.invoices.find((i) => i.id === id);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Math.random().toString(16).slice(2) + Date.now().toString(16));
  const now = () => new Date().toISOString();

  // ---------- format ----------
  const yen = (n) => (n == null ? "—" : "¥" + Math.round(Number(n)).toLocaleString("ja-JP"));
  const pad = (n) => String(n).padStart(2, "0");
  const D = (d) => (typeof d === "string" ? new Date(d) : d);
  const ymd = (d) => { if (!d) return "—"; const t = D(d); return `${t.getFullYear()}/${pad(t.getMonth() + 1)}/${pad(t.getDate())}`; };
  const md = (d) => { if (!d) return "—"; const t = D(d); return `${t.getMonth() + 1}/${t.getDate()}`; };
  const ym = (d) => { const t = D(d); return `${t.getFullYear()}年${t.getMonth() + 1}月`; };
  const dtime = (d) => { if (!d) return "—"; const t = D(d); return `${ymd(t)} ${pad(t.getHours())}:${pad(t.getMinutes())}`; };

  // ---------- labels ----------
  const approvalLabel = { draft: "確認待ち", submitted: "承認待ち", first_checked: "管理部チェック済", approved: "承認済", on_hold: "保留", returned: "差戻し", expired: "失効（再申請が必要）" };
  const approvalTone = { draft: "gray", submitted: "gold", first_checked: "gold", approved: "green", on_hold: "amber", returned: "red", expired: "red" };
  const receiptLabel = { received: "受信", extracted: "読み取り済（下書き）", confirmed: "内容確定", rejected: "却下" };
  const receiptTone = { received: "gray", extracted: "amber", confirmed: "green", rejected: "red" };
  const paymentLabel = { none: "—", scheduled: "支払予定", paid: "支払済", exported: "弥生連携済", corrected: "訂正済" };
  const paymentTone = { none: "gray", scheduled: "gold", paid: "green", exported: "navy", corrected: "amber" };
  const eventLabel = { received: "受信", extracted: "AIが読み取り（サンプル）", confirmed: "内容を確定", rejected: "却下", submitted: "承認を申請", first_checked: "管理部でチェック", approved: "承認", held: "保留", returned: "差戻し", expired: "承認が失効", reopened: "再開", scheduled: "支払予定に登録", paid: "振込済みとして記録", exported: "弥生へ出力", corrected: "訂正", edited: "内容を変更" };
  const pill = (label, tone) => `<span class="pill ${tone}">${esc(label)}</span>`;
  const ApprovalBadge = (s) => pill(approvalLabel[s], approvalTone[s]);
  const ReceiptBadge = (s) => pill(receiptLabel[s], receiptTone[s]);
  const PaymentBadge = (s) => (s === "none" ? "" : pill(paymentLabel[s], paymentTone[s]));
  const Flags = (rs) => (rs && rs.length ? `<ul class="flags">${rs.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "");

  // ---------- 権限（本物の can() と同じ） ----------
  function can(action) {
    switch (action) {
      case "approve": case "hold": case "return": return role === "representative";
      case "first_check": return role === "admin";
      default: return role === "admin" || role === "representative";
    }
  }
  const TRANS = {
    "draft>submit": ["submitted", "submitted"], "returned>submit": ["submitted", "submitted"], "expired>submit": ["submitted", "submitted"],
    "submitted>first_check": ["first_checked", "first_checked"],
    "submitted>approve": ["approved", "approved"], "first_checked>approve": ["approved", "approved"], "on_hold>approve": ["approved", "approved"],
    "submitted>hold": ["on_hold", "held"], "first_checked>hold": ["on_hold", "held"],
    "submitted>return": ["returned", "returned"], "first_checked>return": ["returned", "returned"], "on_hold>return": ["returned", "returned"],
  };
  function logEvent(i, type, from, to, comment) {
    S.events.push({ invoice_id: i.id, approval_version: i.approval_version, event_type: type, actor_name: ROLE_NAME[role], from_status: from, to_status: to, comment: comment || null, created_at: now() });
  }
  function splitTax(total, rate) { const excl = Math.round(total / (1 + rate)); return { amount_excl_tax: excl, tax_amount: total - excl }; }

  // ---------- actions（戻り値: エラー文字列 or null） ----------
  function transition(id, action, comment) {
    if (!can(action)) return "権限がありません";
    const i = inv(id); if (!i) return "見つかりません";
    if (i.receipt_status !== "confirmed") return "内容を確定してから申請してください";
    const t = TRANS[`${i.approval_status}>${action}`];
    if (!t) return `「${approvalLabel[i.approval_status]}」からは進めません`;
    if ((action === "hold" || action === "return") && !comment) return "理由を入れてください";
    if (action === "approve" && i.needs_human_review) {
      const fc = S.events.some((e) => e.invoice_id === id && e.approval_version === i.approval_version && e.event_type === "first_checked" && e.actor_name !== ROLE_NAME[role]);
      if (!fc) return "要確認の請求書は、管理部（承認者以外）のチェックを通してから承認してください";
    }
    const from = i.approval_status; i.approval_status = t[0];
    logEvent(i, t[1], from, t[0], comment);
    if (action === "approve") { i.payment_status = "scheduled"; logEvent(i, "scheduled", "none", "scheduled"); }
    return null;
  }
  function markPaid(id) {
    if (!can("pay")) return "権限がありません";
    const i = inv(id);
    if (!i || i.approval_status !== "approved" || i.payment_status !== "scheduled") return "承認済み・支払予定の請求書だけ記録できます";
    i.payment_status = "paid"; logEvent(i, "paid", "scheduled", "paid"); return null;
  }
  function confirmExtraction(id, f) {
    if (!can("confirm")) return "権限がありません";
    const i = inv(id); if (!i || !(i.receipt_status === "received" || i.receipt_status === "extracted")) return "確定できる状態ではありません";
    if (!f.counterparty_id || !f.department_id || !f.invoice_number || !f.due_date || !(f.total_amount > 0)) return "すべての項目を入れてください";
    const d = DEPT[f.department_id]; if (!d || d.legal_entity_id !== i.legal_entity_id) return "選んだ事業部はこの請求書の法人のものではありません";
    const line = i.invoice_lines[0]; const rate = line ? Number(line.tax_rate) : 0.1; const tax = splitTax(f.total_amount, rate);
    const from = i.receipt_status;
    Object.assign(i, { counterparty_id: f.counterparty_id, department_id: f.department_id, invoice_number: f.invoice_number, due_date: f.due_date, total_amount: f.total_amount, ...tax, receipt_status: "confirmed" });
    if (line) { line.amount = tax.amount_excl_tax; line.department_id = f.department_id; }
    logEvent(i, "confirmed", from, "confirmed"); return null;
  }
  function rejectInvoice(id, comment) {
    if (!can("confirm")) return "権限がありません";
    const i = inv(id); if (!i || i.receipt_status === "confirmed" || i.receipt_status === "rejected") return "却下できる状態ではありません";
    if (!comment) return "理由を入れてください";
    const from = i.receipt_status; i.receipt_status = "rejected"; logEvent(i, "rejected", from, "rejected", comment); return null;
  }
  const KEY_FIELDS = ["total_amount", "counterparty_id", "bank_account_id", "legal_entity_id", "due_date"];
  function editKeyFields(id, f) {
    if (!can("edit")) return "権限がありません";
    const i = inv(id); if (!i || i.receipt_status !== "confirmed") return "確定前は「確定」フォームで直してください";
    if (i.payment_status === "paid" || i.payment_status === "exported") return "支払済み・連携済みのものは直せません（訂正は Phase 2）";
    const d = DEPT[f.department_id]; if (!d || d.legal_entity_id !== f.legal_entity_id) return "選んだ事業部はその法人のものではありません";
    if (f.bank_account_id) {
      const b = BANK[f.bank_account_id]; if (!b || b.counterparty_id !== f.counterparty_id) return "選んだ口座はこの支払先のものではありません";
      if (b.valid_to && b.valid_to < f.due_date) return "選んだ口座は有効期限が切れています（旧口座）";
    }
    const after = { total_amount: f.total_amount, due_date: f.due_date, counterparty_id: f.counterparty_id, legal_entity_id: f.legal_entity_id, bank_account_id: f.bank_account_id || null };
    const changed = KEY_FIELDS.filter((k) => String(i[k] ?? "") !== String(after[k] ?? ""));
    const deptChanged = i.department_id !== f.department_id;
    if (!changed.length && !deptChanged) return "変更がありません";
    const willExpire = i.approval_status === "approved";
    const leChanged = i.legal_entity_id !== f.legal_entity_id;
    const line = i.invoice_lines[0]; const rate = line ? Number(line.tax_rate) : 0.1; const tax = splitTax(f.total_amount, rate);
    const before = Object.fromEntries(changed.map((k) => [k, i[k]]));
    Object.assign(i, after, tax, { department_id: f.department_id });
    if (leChanged) { i.needs_human_review = true; if (!i.review_reasons.includes("法人を変更したため、確認してください")) i.review_reasons.push("法人を変更したため、確認してください"); }
    if (line) { line.amount = tax.amount_excl_tax; line.department_id = f.department_id; }
    logEvent(i, "edited", null, null, changed.length ? changed.map((k) => `${k}: ${before[k]} → ${after[k]}`).join(" / ") : "事業部を変更");
    if (willExpire) { const from = i.approval_status; i.approval_status = "expired"; i.approval_version += 1; i.payment_status = "none"; logEvent(i, "expired", from, "expired", "承認後にキー項目が変更されたため失効。再申請が必要"); }
    return null;
  }

  // ---------- 弥生 仕訳CSV（本物の buildJournalCsv と同じ25項目） ----------
  const TAX_CLASS = { "0.1": "課対仕入10%", "0.08": "課対仕入8%（軽）", "0": "対象外" };
  const cut = (s, max) => { let w = 0, out = ""; for (const ch of String(s)) { const cw = /[^\x01-\x7E｡-ﾟ]/.test(ch) ? 2 : 1; if (w + cw > max) break; w += cw; out += ch; } return out; };
  const q = (v) => { v = v == null ? "" : String(v); return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  function journalRows(le) {
    return S.invoices.filter((i) => i.approval_status === "approved" && i.payment_status === "paid" && (!le || i.legal_entity_id === le)).sort((a, b) => (a.issue_date || "").localeCompare(b.issue_date || ""));
  }
  function buildCsv(items) {
    const lines = items.map((i) => {
      const line = i.invoice_lines[0]; const rate = line ? Number(line.tax_rate) : 0.1;
      const acc = line && ACC[line.account_id] ? ACC[line.account_id].name : "雑費";
      const dept = i.department_id && DEPT[i.department_id] ? DEPT[i.department_id].name : "";
      const cp = CP[i.counterparty_id] ? CP[i.counterparty_id].name : "";
      return ["2000", "", "", ymd(i.issue_date || i.due_date), acc, "", dept, TAX_CLASS[String(rate)] || "対象外", Math.round(i.total_amount), Math.round(i.tax_amount || 0),
        "未払金", "", "", "対象外", Math.round(i.total_amount), "", cut(`${cp} ${i.invoice_number || ""}`.trim(), 64), cut(i.invoice_number || "", 10), i.due_date ? ymd(i.due_date) : "", "0", "", cut(`基幹ID ${i.id}`, 180), "0", "0", "no"].map(q).join(",");
    });
    const total = items.reduce((a, i) => a + Math.round(i.total_amount), 0);
    return { text: lines.join("\r\n") + "\r\n", debitTotal: total, creditTotal: total, balanced: true };
  }
  function createExport(le) {
    if (!can("export")) return "権限がありません";
    const items = journalRows(le); if (!items.length) return "出力対象がありません（承認済み・支払済みで未連携のもの）";
    const csv = buildCsv(items);
    const batch = { id: uuid(), kind: "yayoi_journal_export", status: "succeeded", started_at: now(), finished_at: now(), row_count: items.length, ok_count: items.length, error_count: 0, balance_ok: true, file_path: `yayoi_journal_${ymd(new Date()).replace(/\//g, "-")}.csv`, error_summary: null, payload: csv.text, actor_name: ROLE_NAME[role] };
    S.batches.unshift(batch);
    for (const i of items) { i.payment_status = "exported"; logEvent(i, "exported", "paid", "exported", `弥生仕訳CSV バッチ ${batch.id.slice(0, 8)}`); }
    download(batch.payload, batch.file_path); return null;
  }
  function download(text, name) {
    // デモは UTF-8（BOM付き）。本番は Shift_JIS に変換して出す
    const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- 試算表CSV 取込 ----------
  function parseCsv(text) {
    const rows = []; let row = [], cell = "", inQ = false;
    for (let k = 0; k < text.length; k++) {
      const c = text[k];
      if (inQ) { if (c === '"') { if (text[k + 1] === '"') { cell += '"'; k++; } else inQ = false; } else cell += c; }
      else if (c === '"') inQ = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[k + 1] === "\n") k++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim() !== ""));
  }
  function importTb(le, period, text, fileName) {
    if (!can("import")) return "権限がありません";
    if (!le || !period) return "法人と対象月を選んでください";
    const rows = parseCsv(text); if (rows.length < 2) return "CSVにデータ行がありません";
    const head = rows[0].map((h) => h.trim());
    const find = (...keys) => head.findIndex((h) => keys.some((k) => h.includes(k)));
    const cAcc = find("勘定科目", "科目"), cDept = find("部門"), cDr = find("借方"), cCr = find("貸方");
    if (cAcc < 0 || cDr < 0 || cCr < 0) return `列を見つけられません（見つかった列: ${head.join(" / ")}）。「勘定科目」「借方」「貸方」が必要です`;
    const accByName = Object.fromEntries(S.accounts.map((a) => [a.name, a.id]));
    const deptByName = Object.fromEntries(S.departments.filter((d) => d.legal_entity_id === le).map((d) => [d.name, d.id]));
    const num = (s) => { const t = String(s ?? "").replace(/[,¥\s]/g, ""); if (t === "" || t === "-") return 0; const n = Number(t); return Number.isFinite(n) ? n : NaN; };
    const out = [], problems = [];
    rows.slice(1).forEach((r, idx) => {
      const ln = idx + 2; const accName = String(r[cAcc] ?? "").trim(); const accId = accByName[accName];
      if (!accId) { problems.push(`${ln}行目: 勘定科目「${accName}」がマスタにありません`); return; }
      const deptName = cDept >= 0 ? String(r[cDept] ?? "").trim() : ""; const deptId = deptName ? deptByName[deptName] : null;
      if (deptName && !deptId) { problems.push(`${ln}行目: 部門「${deptName}」がこの法人にありません`); return; }
      const d = num(r[cDr]), c = num(r[cCr]); if (Number.isNaN(d) || Number.isNaN(c)) { problems.push(`${ln}行目: 借方/貸方が数値ではありません`); return; }
      out.push({ legal_entity_id: le, department_id: deptId || null, period: `${period}-01`, account_id: accId, debit: d, credit: c });
    });
    const batch = { id: uuid(), kind: "yayoi_tb_import", started_at: now(), finished_at: now(), row_count: rows.length - 1, file_path: fileName, actor_name: ROLE_NAME[role], balance_ok: null, error_summary: null };
    if (problems.length) {
      Object.assign(batch, { status: "failed", ok_count: 0, error_count: problems.length, error_summary: problems.slice(0, 5).join(" / ") }); S.batches.unshift(batch); save();
      return `取り込みを中止しました。${problems.slice(0, 3).join(" / ")}${problems.length > 3 ? ` ほか${problems.length - 3}件` : ""}`;
    }
    S.ledger_lines = S.ledger_lines.filter((r) => !(r.legal_entity_id === le && r.period === `${period}-01`)).concat(out);
    const dr = out.reduce((a, r) => a + r.debit, 0), cr = out.reduce((a, r) => a + r.credit, 0);
    Object.assign(batch, { status: "succeeded", ok_count: out.length, error_count: 0, balance_ok: Math.round(dr) === Math.round(cr) }); S.batches.unshift(batch);
    return null;
  }

  // ---------- router ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, ""); const [path, qs] = h.split("?");
    return { seg: path.split("/").filter(Boolean), p: new URLSearchParams(qs || "") };
  }
  const href = (path, params) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(params || {})) if (v) p.set(k, v); const s = p.toString(); return `#/${path}${s ? "?" + s : ""}`; };

  // ---------- pages ----------
  const NAV = [["", "支払の承認", "5日・10日・月末にどこへいくら払うか"], ["inbox", "請求書の受信箱", "届いた請求書を確定する"], ["pl", "法人別・事業部別PL", "弥生から取り込んだ数字"], ["imports", "弥生との連携", "CSVの出し入れ"]];
  function renderNav(seg) {
    $("#nav").innerHTML = NAV.map(([p, l, h]) => `<a href="#/${p}" class="${(seg[0] || "") === p ? "active" : ""}"><span class="label">${l}</span><span class="hint">${h}</span></a>`).join("");
  }
  const leTabs = (cur, base, params) => `<div class="row">${[["", "全法人"], ...S.legal_entities.map((l) => [l.id, l.short_name])].map(([id, n]) => `<a class="btn btn-sm ${cur === id ? "btn-primary" : "btn-ghost"}" href="${href(base, { ...params, le: id, dept: "" })}">${esc(n)}</a>`).join("")}</div>`;
  const cpName = (i) => (i.counterparty_id && CP[i.counterparty_id] ? CP[i.counterparty_id].name : null);
  const leDept = (i) => `${esc(LE[i.legal_entity_id]?.short_name || "")}<span class="muted"> ／ </span>${esc(i.department_id && DEPT[i.department_id] ? DEPT[i.department_id].name : "事業部未設定")}`;
  const BUCKETS = ["5日", "10日", "月末", "その他"];
  const bucketOf = (due) => { if (!due) return "その他"; const day = D(due).getDate(); if (day === 5) return "5日"; if (day === 10) return "10日"; if (day >= 25) return "月末"; return "その他"; };
  const commentBox = (id, action, label) => ui.comment === `${id}:${action}`
    ? `<form class="inline" data-act="transition-comment" data-id="${id}" data-action="${action}"><input class="input" name="comment" placeholder="${label}" autofocus required><div class="row gap2"><button class="btn btn-sm ${action === "return" ? "btn-danger" : "btn-ghost"}">${action === "return" ? "差戻す" : "保留にする"}</button><button type="button" class="btn btn-sm btn-ghost" data-act="cancel-comment">やめる</button></div></form>`
    : `<button class="btn btn-sm ${action === "return" ? "btn-danger" : "btn-ghost"}" data-act="ask-comment" data-id="${id}" data-action="${action}">${label.replace("の理由", "")}</button>`;
  const commentBoxGeneric = (id, action, label, ph) => ui.comment === `${id}:${action}`
    ? `<form class="inline" data-act="reject" data-id="${id}"><input class="input" name="comment" placeholder="${ph}" required autofocus><div class="row gap2"><button class="btn btn-sm btn-danger">却下する</button><button type="button" class="btn btn-sm btn-ghost" data-act="cancel-comment">やめる</button></div></form>`
    : `<button class="btn btn-sm btn-danger" data-act="ask-comment" data-id="${id}" data-action="${action}">${label}</button>`;

  function pageDashboard(p) {
    const rows = S.invoices.filter((i) => i.receipt_status === "confirmed" && ["submitted", "first_checked", "approved", "on_hold", "returned", "expired"].includes(i.approval_status) && i.payment_status !== "exported").sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    const months = [...new Set(rows.map((r) => (r.due_date || "").slice(0, 7)).filter(Boolean))].sort();
    const thisMonth = ymd(new Date()).slice(0, 7).replace("/", "-");
    const month = p.get("month") === "all" ? "all" : (p.get("month") || (months.includes(thisMonth) ? thisMonth : months[0] || thisMonth));
    const le = p.get("le") || "", dept = p.get("dept") || "";
    const filtered = rows.filter((r) => (!le || r.legal_entity_id === le) && (!dept || r.department_id === dept) && (month === "all" || (r.due_date || "").startsWith(month)));
    const pending = filtered.filter((r) => ["submitted", "first_checked", "on_hold"].includes(r.approval_status));
    const approved = filtered.filter((r) => r.approval_status === "approved");
    const stuck = filtered.filter((r) => ["returned", "expired"].includes(r.approval_status));
    const sum = (xs) => xs.reduce((a, r) => a + Number(r.total_amount), 0);
    const byDue = new Map(); for (const r of approved) { const k = r.due_date || "未定"; byDue.set(k, [...(byDue.get(k) || []), r]); }
    const params = { le, dept, month };
    const pillLink = (active, h, label) => `<a class="pill ${active ? "gold" : "gray"}" href="${h}">${esc(label)}</a>`;
    return `<div class="page">
      <header class="ph"><div><p class="eyebrow">${month === "all" ? "すべての月" : ym(month + "-01")} ／ 支払の承認</p><h1 class="title">5日・10日・月末に、どこへいくら払うか</h1><p class="lead">承認待ちを見て、承認・保留・差戻しを押す。承認したものが支払予定に並びます。振込は銀行側で行います。</p></div>${leTabs(le, "", params)}</header>
      <div class="row small" style="margin-top:-12px"><span class="sub">支払月</span>${months.map((m) => pillLink(month === m, href("", { ...params, month: m }), ym(m + "-01"))).join("")}${pillLink(month === "all", href("", { ...params, month: "all" }), "すべて")}</div>
      ${le ? `<div class="row small" style="margin-top:-12px">${pillLink(!dept, href("", { ...params, dept: "" }), "全事業部")}${S.departments.filter((d) => d.legal_entity_id === le).map((d) => pillLink(dept === d.id, href("", { ...params, dept: d.id }), d.name)).join("")}</div>` : ""}
      <section class="stats">
        <div class="card stat"><p class="k">承認待ち</p><p class="v num" style="color:var(--gold-d)">${yen(sum(pending))}</p><p class="s num">${pending.length}件</p></div>
        <div class="card stat"><p class="k">承認済み（支払予定）</p><p class="v num ok">${yen(sum(approved))}</p><p class="s num">${approved.length}件</p></div>
        <div class="card stat"><p class="k">差戻し・失効</p><p class="v num ${stuck.length ? "danger" : "sub"}">${yen(sum(stuck))}</p><p class="s num">${stuck.length}件</p></div>
      </section>
      <section class="card card-key">
        <div class="hd row between"><h2>承認待ち <small class="num">${pending.length}件</small></h2>${role !== "representative" ? `<p class="xs sub">承認ボタンは代表のみ表示されます</p>` : ""}</div>
        <div class="scroll"><table class="data"><thead><tr><th>期日</th><th>支払先</th><th>法人 ／ 事業部</th><th class="right">金額（税込）</th><th>状態</th><th>気になる点</th><th></th></tr></thead><tbody>
        ${pending.length ? pending.map((r) => `<tr>
          <td class="num nowrap">${md(r.due_date)}</td>
          <td><a class="semi" href="#/inbox/${r.id}">${esc(cpName(r) || "（未確定）")}</a><div class="xs sub num">${esc(r.invoice_number || "")}${CP[r.counterparty_id]?.is_individual ? " ／ 個人事業主" : ""}</div></td>
          <td class="small">${leDept(r)}</td><td class="num right semi nowrap">${yen(r.total_amount)}</td><td>${ApprovalBadge(r.approval_status)}</td><td style="min-width:200px">${Flags(r.review_reasons)}</td>
          <td style="min-width:230px"><div class="col">
            ${can("first_check") && r.approval_status === "submitted" ? `<button class="btn btn-sm btn-secondary" data-act="transition" data-id="${r.id}" data-action="first_check">管理部でチェック済みにする</button>` : ""}
            ${can("approve") ? `<div class="row gap2"><button class="btn btn-sm btn-primary" data-act="transition" data-id="${r.id}" data-action="approve">承認</button>${r.approval_status !== "on_hold" ? commentBox(r.id, "hold", "保留の理由") : ""}${commentBox(r.id, "return", "差戻しの理由")}</div>` : ""}
          </div></td></tr>`).join("") : `<tr><td colspan="7" class="sub" style="text-align:center">承認待ちはありません</td></tr>`}
        </tbody></table></div>
      </section>
      <section class="card">
        <div class="hd"><h2>支払予定 <small class="num">${approved.length}件 ／ ${yen(sum(approved))}</small></h2><p class="small sub">承認済み。期日ごとにまとめています。銀行で振込を終えたら「振込済みとして記録」を押すと、弥生への出力対象になります。このシステムから振込は行いません。</p></div>
        <div class="buckets">${BUCKETS.map((b) => { const xs = approved.filter((r) => bucketOf(r.due_date) === b); return `<div><p class="k">${b}${b === "月末" ? '<span style="font-weight:400">（25日以降）</span>' : ""}</p><p class="v num ${xs.length ? "" : "muted"}">${yen(sum(xs))}</p><p class="s num">${xs.length}件</p></div>`; }).join("")}</div>
        ${[...byDue.entries()].map(([due, xs]) => `<div><div class="group"><span class="num semi">${due === "未定" ? "期日未定" : ymd(due)}<span class="sub" style="margin-left:8px;font-weight:400">${bucketOf(due === "未定" ? null : due)}</span></span><span class="num sub">${xs.length}件 ／ ${yen(sum(xs))}</span></div>
          <div class="scroll"><table class="data"><tbody>${xs.map((r) => `<tr><td style="width:40%"><a class="semi" href="#/inbox/${r.id}">${esc(cpName(r))}</a><div class="xs sub num">${esc(r.invoice_number || "")}</div></td><td class="small">${leDept(r)}</td><td class="num right semi nowrap">${yen(r.total_amount)}</td><td>${PaymentBadge(r.payment_status)}</td><td class="right">${can("pay") && r.payment_status === "scheduled" ? `<button class="btn btn-sm btn-ghost" data-act="pay" data-id="${r.id}">振込済みとして記録</button>` : ""}</td></tr>`).join("")}</tbody></table></div></div>`).join("")}
        ${approved.length ? "" : `<p class="p6 sub">支払予定はありません</p>`}
      </section>
      ${stuck.length ? `<section class="card"><div class="hd"><h2>差戻し・失効 <small class="num">${stuck.length}件</small></h2><p class="small sub">管理部が内容を直して、もう一度申請します。</p></div>
        <div class="scroll"><table class="data"><tbody>${stuck.map((r) => `<tr><td style="width:40%"><a class="semi" href="#/inbox/${r.id}">${esc(cpName(r))}</a><div class="xs sub num">${esc(r.invoice_number || "")}</div></td><td class="small">${leDept(r)}</td><td class="num right semi nowrap">${yen(r.total_amount)}</td><td>${ApprovalBadge(r.approval_status)}</td><td class="right">${can("submit") ? `<button class="btn btn-sm btn-secondary" data-act="transition" data-id="${r.id}" data-action="submit">再申請</button>` : ""}</td></tr>`).join("")}</tbody></table></div></section>` : ""}
    </div>`;
  }

  function pageInbox(p) {
    const tab = p.get("tab") === "done" ? "done" : "todo";
    const rows = [...S.invoices].sort((a, b) => (b.received_at || "").localeCompare(a.received_at || ""));
    const todo = rows.filter((r) => r.receipt_status === "received" || r.receipt_status === "extracted");
    const done = rows.filter((r) => r.receipt_status === "confirmed" || r.receipt_status === "rejected");
    const list = tab === "todo" ? todo : done;
    return `<div class="page">
      <header><p class="eyebrow">請求書の受信箱</p><h1 class="title">届いた請求書を、確定する</h1><p class="lead">専用アドレス（例: <span class="num">invoice@way-example.jp</span>）に届いたメールをここに集めます。AIが金額・支払先・期日を下書きし、管理部が確定すると承認に進みます。今は取り込みが未接続のため、サンプルが入っています。</p></header>
      <div class="row"><a class="btn btn-sm ${tab === "todo" ? "btn-primary" : "btn-ghost"}" href="#/inbox">確定待ち <span class="num">${todo.length}</span></a><a class="btn btn-sm ${tab === "done" ? "btn-primary" : "btn-ghost"}" href="#/inbox?tab=done">確定・却下済み <span class="num">${done.length}</span></a></div>
      <section class="card"><div class="scroll"><table class="data"><thead><tr><th>受信</th><th>支払先（AI読み取りのサンプル）</th><th>法人 ／ 事業部</th><th class="right">金額</th><th>期日</th><th>読み取り</th><th>承認</th><th>気になる点</th></tr></thead><tbody>
        ${list.length ? list.map((r) => { const ex = r.extraction || {}; return `<tr class="link"><td class="num nowrap small">${dtime(r.received_at)}</td><td><a class="semi" href="#/inbox/${r.id}">${esc(cpName(r) || ex.counterparty_name || "（読み取り中）")}</a><div class="xs sub num">${esc(r.invoice_number || ex.invoice_number || "")}</div></td><td class="small">${leDept(r)}</td><td class="num right semi nowrap">${yen(r.total_amount)}</td><td class="num nowrap">${md(r.due_date)}</td><td>${ReceiptBadge(r.receipt_status)}</td><td>${r.receipt_status === "confirmed" ? ApprovalBadge(r.approval_status) : '<span class="muted">—</span>'}</td><td style="min-width:200px">${Flags(r.review_reasons)}</td></tr>`; }).join("") : `<tr><td colspan="8" class="sub" style="text-align:center">ありません</td></tr>`}
      </tbody></table></div></section></div>`;
  }

  function pageDetail(id) {
    const i = inv(id); if (!i) return `<div class="page"><p>見つかりません。<a href="#/inbox">受信箱へ</a></p></div>`;
    const ex = i.extraction || {}; const cp = CP[i.counterparty_id]; const bank = i.bank_account_id ? BANK[i.bank_account_id] : null;
    const canConfirm = can("confirm") && (i.receipt_status === "received" || i.receipt_status === "extracted");
    const confirmed = i.receipt_status === "confirmed";
    const events = S.events.filter((e) => e.invoice_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
    const depts = S.departments.filter((d) => d.legal_entity_id === i.legal_entity_id);
    const banks = S.bank_accounts.filter((b) => b.counterparty_id === i.counterparty_id).sort((a, b) => b.valid_from.localeCompare(a.valid_from));
    const opt = (list, val, fmt) => list.map((x) => `<option value="${x.id}" ${x.id === val ? "selected" : ""}>${esc(fmt(x))}</option>`).join("");
    const guess = i.counterparty_id || (S.counterparties.find((c) => c.name === ex.counterparty_name) || {}).id || "";
    return `<div class="page">
      <div class="small"><a class="sub" href="#/inbox">← 受信箱</a></div>
      <header class="ph"><div><p class="eyebrow">${leDept(i)}</p><h1 class="title" style="font-size:26px">${esc(cp?.name || ex.counterparty_name || "支払先が未確定の請求書")}</h1><p class="num sub" style="font-size:14px">請求書番号 ${esc(i.invoice_number || ex.invoice_number || "—")} ／ 受信 ${dtime(i.received_at)}</p></div><div class="row">${ReceiptBadge(i.receipt_status)}${confirmed ? ApprovalBadge(i.approval_status) : ""}${PaymentBadge(i.payment_status)}</div></header>
      ${i.review_reasons.length ? `<div class="card p5" style="border-left:4px solid var(--danger)"><p class="small semi danger">人が確認する条件に当たっています</p><div class="mt1">${Flags(i.review_reasons)}</div></div>` : ""}
      <div class="detail"><div class="col gap6">
        <section class="card p6"><h2 style="font-size:16px">${canConfirm ? "AIの読み取り結果を確認して確定する" : "請求内容"}</h2>
          ${canConfirm ? `<form class="form" data-act="confirm" data-id="${i.id}">
            <div class="span2 aidraft">AI読み取りのサンプル（メール取込は未接続）: <b>${esc(ex.counterparty_name || "—")}</b> ／ 番号 <span class="num">${esc(ex.invoice_number || "—")}</span> ／ 合計 <span class="num">${ex.total != null ? yen(ex.total) : "—"}</span> ／ 期日 <span class="num">${esc(ex.due_date || "—")}</span><span class="xs sub" style="display:block">下書きは参考です。原本と見比べて、違っていれば直してから確定してください。</span></div>
            <div><label class="label">支払先</label><select class="input" name="counterparty_id" required><option value="">選んでください</option>${opt(S.counterparties, guess, (c) => c.name)}</select></div>
            <div><label class="label">事業部（費用の帰属）</label><select class="input" name="department_id" required><option value="">選んでください</option>${opt(depts, i.department_id, (d) => d.name)}</select></div>
            <div><label class="label">請求書番号</label><input class="input num" name="invoice_number" value="${esc(i.invoice_number || ex.invoice_number || "")}" required></div>
            <div><label class="label">支払期日</label><input class="input num" type="date" name="due_date" value="${esc(i.due_date || ex.due_date || "")}" required></div>
            <div><label class="label">金額（税込・円）</label><input class="input num" type="number" min="1" step="1" name="total_amount" value="${Math.round(i.total_amount)}" required></div>
            <div style="display:flex;align-items:flex-end"><button class="btn btn-primary" style="width:100%">この内容で確定する</button></div>
          </form>` : `<dl class="kv">
            <dt>金額（税込）</dt><dd class="num"><b style="font-size:18px">${yen(i.total_amount)}</b> <span class="xs sub">税抜 ${yen(i.amount_excl_tax)} ／ 税 ${yen(i.tax_amount)}</span></dd>
            <dt>支払期日</dt><dd class="num">${ymd(i.due_date)}</dd><dt>発行日</dt><dd class="num">${ymd(i.issue_date)}</dd>
            <dt>振込先</dt><dd>${bank ? esc(`${bank.bank_name} ${bank.branch_name || ""} ${bank.account_number_masked}`) : '<span class="muted">未登録</span>'}</dd>
            <dt>インボイス</dt><dd class="num">${cp?.invoice_registration_number ? esc(cp.invoice_registration_number) : '<span class="warn">登録番号なし（仕入税額控除に影響）</span>'}</dd>
            <dt>源泉徴収</dt><dd>${cp?.withholding_required ? "対象（個人事業主への報酬）" : "対象外"}</dd>
            <dt>原本</dt><dd><span class="muted">未保存（メール取り込み接続後に保存されます）</span></dd></dl>`}
        </section>
        ${confirmed && can("edit") && i.payment_status !== "paid" && i.payment_status !== "exported" ? `<section class="card p6"><h2 style="font-size:16px">金額・期日・支払先・法人・口座を直す</h2><p class="small sub mt1">承認済みのものを直すと承認が失効し、もう一度申請が必要になります（誰が何を変えたかは履歴に残ります）。</p>
          <form class="form" data-act="edit" data-id="${i.id}">
            <div><label class="label">金額（税込・円）</label><input class="input num" type="number" min="1" step="1" name="total_amount" value="${Math.round(i.total_amount)}" required></div>
            <div><label class="label">支払期日</label><input class="input num" type="date" name="due_date" value="${esc(i.due_date || "")}" required></div>
            <div><label class="label">支払先</label><select class="input" name="counterparty_id" required>${opt(S.counterparties, i.counterparty_id, (c) => c.name)}</select></div>
            <div><label class="label">法人（誰が払うか）</label><select class="input" name="legal_entity_id" data-act="le-change" required>${opt(S.legal_entities, i.legal_entity_id, (l) => l.short_name)}</select></div>
            <div><label class="label">事業部（費用の帰属）</label><select class="input" name="department_id" id="edit-dept" required><option value="">選んでください</option>${opt(depts, i.department_id, (d) => d.name)}</select></div>
            <div><label class="label">振込先口座</label><select class="input" name="bank_account_id"><option value="">未選択</option>${opt(banks, i.bank_account_id, (b) => `${b.bank_name} ${b.branch_name || ""} ${b.account_number_masked}${b.valid_to ? "（旧口座）" : ""}`)}</select></div>
            <div class="span2 row gap4"><button class="btn btn-secondary">変更を保存する</button></div>
          </form></section>` : ""}
      </div>
      <aside class="col gap6">
        <section class="card card-key p5"><h2 style="font-size:15px">操作</h2><div class="col mt2">
          ${canConfirm ? commentBoxGeneric(i.id, "reject", "却下する（重複・宛先違い）", "却下の理由") : ""}
          ${confirmed && can("submit") && ["draft", "returned", "expired"].includes(i.approval_status) ? `<button class="btn btn-sm btn-primary" data-act="transition" data-id="${i.id}" data-action="submit">承認を申請する</button>` : ""}
          ${confirmed && can("first_check") && i.approval_status === "submitted" ? `<button class="btn btn-sm btn-secondary" data-act="transition" data-id="${i.id}" data-action="first_check">管理部でチェック済みにする</button>` : ""}
          ${confirmed && can("approve") && ["submitted", "first_checked", "on_hold"].includes(i.approval_status) ? `<button class="btn btn-sm btn-primary" data-act="transition" data-id="${i.id}" data-action="approve">承認する</button>${i.approval_status !== "on_hold" ? commentBox(i.id, "hold", "保留の理由") : ""}${commentBox(i.id, "return", "差戻しの理由")}` : ""}
          ${confirmed && can("pay") && i.approval_status === "approved" && i.payment_status === "scheduled" ? `<button class="btn btn-sm btn-ghost" data-act="pay" data-id="${i.id}">振込済みとして記録</button>` : ""}
          ${!canConfirm && !confirmed ? `<p class="small sub">この請求書は却下されています</p>` : ""}
          ${!can("approve") && confirmed && ["submitted", "first_checked", "on_hold"].includes(i.approval_status) ? `<p class="xs sub">承認・保留・差戻しは代表だけができます</p>` : ""}
        </div></section>
        <section class="card p5"><h2 style="font-size:15px">履歴</h2><ol class="hist">${events.map((e) => `<li><span class="dot ${e.event_type === "approved" ? "g" : ["returned", "expired", "rejected"].includes(e.event_type) ? "r" : ""}"></span><div><p><b>${esc(eventLabel[e.event_type] || e.event_type)}</b><span class="sub"> ／ ${esc(e.actor_name || "システム")}</span></p>${e.comment ? `<p class="sub">「${esc(e.comment)}」</p>` : ""}<p class="xs muted num">${dtime(e.created_at)}${e.approval_version > 1 ? ` ／ v${e.approval_version}` : ""}</p></div></li>`).join("")}</ol></section>
      </aside></div></div>`;
  }

  function pagePl(p) {
    const le = p.get("le") && LE[p.get("le")] ? p.get("le") : null;
    const rows = S.ledger_lines.map((r) => ({ ...r, acc: ACC[r.account_id] }));
    const periods = [...new Set(rows.map((r) => r.period))].sort();
    const scope = le ? rows.filter((r) => r.legal_entity_id === le) : rows;
    const isRev = (r) => r.acc && (r.acc.category === "revenue" || r.acc.category === "other_income");
    const isCogs = (r) => r.acc && r.acc.category === "cogs", isSga = (r) => r.acc && r.acc.category === "sga";
    const val = (r) => (isRev(r) ? r.credit - r.debit : r.debit - r.credit);
    const sumBy = (xs, f) => xs.filter(f).reduce((a, r) => a + val(r), 0);
    const per = periods.map((pp) => { const xs = scope.filter((r) => r.period === pp); const rev = sumBy(xs, isRev), cogs = sumBy(xs, isCogs), sga = sumBy(xs, isSga); return { p: pp, rev, cogs, gross: rev - cogs, sga, op: rev - cogs - sga }; });
    const last = periods[periods.length - 1]; const lastRows = scope.filter((r) => r.period === last);
    const accMap = new Map(); for (const r of lastRows) { if (!r.acc) continue; const c = accMap.get(r.acc.code) || { name: r.acc.name, sort: r.acc.sort_order, amount: 0 }; c.amount += val(r); accMap.set(r.acc.code, c); }
    const accRows = [...accMap.entries()].sort((a, b) => a[1].sort - b[1].sort);
    const deptRows = S.departments.filter((d) => !le || d.legal_entity_id === le).map((d) => { const xs = lastRows.filter((r) => r.department_id === d.id); const rev = sumBy(xs, isRev), cost = sumBy(xs, (r) => isCogs(r) || isSga(r)); return { d, rev, cost, op: rev - cost, le: LE[d.legal_entity_id]?.short_name || "" }; }).filter((x) => x.rev !== 0 || x.cost !== 0);
    const fmtP = (pp) => { const d = D(pp); return `${d.getFullYear()}/${d.getMonth() + 1}`; };
    const missing = periods.includes("2026-09-01") ? [] : ["2026-09-01"];
    const batch = S.batches.find((b) => b.kind === "yayoi_tb_import");
    const rowsDef = [["売上高", "rev"], ["売上原価（外注費）", "cogs"], ["売上総利益", "gross"], ["販管費", "sga"], ["営業利益", "op"]];
    return `<div class="page">
      <header class="ph"><div><p class="eyebrow">法人別・事業部別PL</p><h1 class="title">月々の成績を、法人と事業部で見る</h1><p class="lead">弥生会計から取り込んだ残高試算表を、事業部のタグで組み直しています。${batch ? `最終取込 <span class="num">${ymd(batch.finished_at)}</span>（${batch.row_count}行、貸借${batch.balance_ok === true ? "一致" : batch.balance_ok === false ? "不一致" : "未確認"}）。` : ""}</p></div>
        <div class="row"><a class="btn btn-sm ${!le ? "btn-primary" : "btn-ghost"}" href="#/pl">3社まとめて</a>${S.legal_entities.map((l) => `<a class="btn btn-sm ${le === l.id ? "btn-primary" : "btn-ghost"}" href="#/pl?le=${l.id}">${esc(l.short_name)}</a>`).join("")}</div></header>
      <section class="card card-key"><div class="hd"><h2>月次推移 <small>${le ? esc(LE[le].name) : "3社まとめて（社内取引の調整前）"}</small></h2></div>
        <div class="scroll"><table class="data"><thead><tr><th>項目</th>${per.map((x) => `<th class="num right">${fmtP(x.p)}</th>`).join("")}${missing.map((m) => `<th class="num right danger">${fmtP(m)}</th>`).join("")}</tr></thead><tbody>
          ${rowsDef.map(([label, k]) => `<tr class="${k === "gross" || k === "op" ? "bold" : ""}"><td style="${k === "gross" || k === "op" ? "" : "padding-left:24px"}">${label}</td>${per.map((x) => `<td class="num right nowrap ${k === "op" && x.op < 0 ? "danger" : ""}">${yen(x[k])}</td>`).join("")}${missing.map(() => `<td class="right xs danger">${k === "rev" ? "弥生の締め待ち" : ""}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div>
        <p class="ft">9月分は弥生会計の月次締めが終わると取り込めます。「10月から見える」とは、10月分の蓄積が始まり、確定した数字は締めの後に出るという意味です。</p></section>
      <div class="two">
        <section class="card"><div class="hd"><h2 style="font-size:16px">事業部別 <small class="num">${last ? fmtP(last) : ""}</small></h2></div>
          <div class="scroll"><table class="data"><thead><tr><th>事業部</th><th class="right">売上</th><th class="right">費用</th><th class="right">利益</th></tr></thead><tbody>${deptRows.map((x) => `<tr><td><span class="semi">${esc(x.d.name)}</span><span class="xs sub" style="display:block">${esc(x.le)}</span></td><td class="num right nowrap">${yen(x.rev)}</td><td class="num right nowrap">${yen(x.cost)}</td><td class="num right nowrap semi ${x.op < 0 ? "danger" : ""}">${yen(x.op)}</td></tr>`).join("")}</tbody></table></div>
          <p class="ft">管理部は売上を持たないので費用だけが出ます。本社の共通費を各事業部へ分ける処理は未対応です（要件定義で決めます）。</p></section>
        <section class="card"><div class="hd"><h2 style="font-size:16px">科目別 <small class="num">${last ? fmtP(last) : ""}</small></h2></div>
          <div class="scroll"><table class="data"><thead><tr><th>勘定科目</th><th class="right">金額</th></tr></thead><tbody>${accRows.map(([code, a]) => `<tr><td><span class="num xs muted" style="margin-right:8px">${esc(code)}</span>${esc(a.name)}</td><td class="num right nowrap">${yen(a.amount)}</td></tr>`).join("")}</tbody></table></div></section>
      </div></div>`;
  }

  const kindLabel = { yayoi_journal_export: "弥生へ 仕訳CSV出力", yayoi_tb_import: "弥生から 試算表CSV取込" };
  const statusLabel = { running: "実行中", succeeded: "成功", failed: "失敗", partial: "一部取込" };
  function pageImports() {
    const items = journalRows(ui.exportLe); const csv = buildCsv(items);
    return `<div class="page">
      <header><p class="eyebrow">弥生との連携</p><h1 class="title">弥生会計と、CSVで往復する</h1><p class="lead">弥生には本番で使える外部APIがまだ無いため（Yayoi SeamLink は2026年9月時点でα版）、弥生インポート形式のCSVでやり取りします。出す方向は「支払済みの請求書 → 未払金の仕訳」、受ける方向は「残高試算表 → 法人別・事業部別PL」。</p></header>
      <div class="two">
        <section class="card card-key p6"><h2 style="font-size:16px">弥生へ出す：仕訳CSV</h2><p class="small sub mt1">承認済み・支払済みで、まだ出していない請求書が対象。出力すると「弥生連携済」になり、二重に出せなくなります。25項目・借方=費用科目／貸方=未払金。<b>デモでは UTF-8 で出します（本番は Shift_JIS）。</b></p>
          <div class="col gap2 mt4"><div class="row">${[["", "全法人"], ...S.legal_entities.map((l) => [l.id, l.short_name])].map(([id, n]) => `<button type="button" class="btn btn-sm ${ui.exportLe === id ? "btn-primary" : "btn-ghost"}" data-act="export-le" data-le="${id}">${esc(n)}</button>`).join("")}</div>
            <div class="note"><p><span class="num" style="font-size:22px;font-weight:700">${items.length}</span> 件 ／ 借方 <span class="num semi">${yen(csv.debitTotal)}</span> ＝ 貸方 <span class="num semi">${yen(csv.creditTotal)}</span> <span class="ok">（一致）</span></p>
              ${items.length ? `<ul class="list">${items.map((i) => `<li><span>${esc(LE[i.legal_entity_id]?.short_name)} ／ ${esc(cpName(i))} <span class="muted">→ ${esc(i.invoice_lines[0] && ACC[i.invoice_lines[0].account_id] ? ACC[i.invoice_lines[0].account_id].name : "雑費")}</span></span><span class="num">${yen(i.total_amount)}</span></li>`).join("")}</ul>` : ""}</div>
            ${can("export") ? `<button class="btn btn-primary" data-act="export" ${items.length ? "" : "disabled"}>仕訳CSVを確定してダウンロード</button>` : `<p class="small sub">出力は管理部または代表が行います</p>`}</div></section>
        <section class="card p6"><h2 style="font-size:16px">弥生から受ける：残高試算表CSV</h2><p class="small sub mt1">弥生会計で月次締め後に「残高試算表」をCSV出力し、ここに入れます。列は「勘定科目・部門・借方・貸方」を自動で探します。同じ月・法人を再取込すると置き換わります。</p>
          ${can("import") ? `<form class="form" data-act="import">
            <div><label class="label">法人</label><select class="input" name="le" required><option value="">選んでください</option>${S.legal_entities.map((l) => `<option value="${l.id}">${esc(l.short_name)}</option>`).join("")}</select></div>
            <div><label class="label">対象月</label><input class="input num" type="month" name="period" value="2026-09" required></div>
            <div class="span2"><label class="label">残高試算表CSV（Shift_JIS / UTF-8）</label><input class="input" type="file" name="file" accept=".csv,text/csv" required style="padding-top:8px"></div>
            <div class="span2 row gap4"><button class="btn btn-secondary">取り込む</button><a class="small" href="#" data-act="sample-tb" style="color:var(--gold-d)">サンプルCSVをダウンロード（チポーレ 2026-09）</a></div></form>` : `<p class="small sub mt4">取込は管理部または代表が行います</p>`}</section>
      </div>
      <section class="card"><div class="hd"><h2 style="font-size:16px">連携の履歴</h2><p class="small sub">いつ・誰が・何件・貸借が合ったか。失敗した理由もここに残ります。</p></div>
        <div class="scroll"><table class="data"><thead><tr><th>日時</th><th>種類</th><th>状態</th><th class="right">行数</th><th class="right">取込</th><th class="right">エラー</th><th>貸借</th><th>ファイル</th><th>実行者</th></tr></thead><tbody>
          ${S.batches.length ? S.batches.map((b) => `<tr><td class="num nowrap small">${dtime(b.finished_at || b.started_at)}</td><td class="small">${kindLabel[b.kind] || esc(b.kind)}</td><td>${pill(statusLabel[b.status] || b.status, b.status === "succeeded" ? "green" : b.status === "failed" ? "red" : "amber")}</td><td class="num right">${b.row_count}</td><td class="num right">${b.ok_count}</td><td class="num right">${b.error_count}</td><td class="small">${b.balance_ok == null ? "—" : b.balance_ok ? "一致" : '<span class="danger">不一致</span>'}</td><td class="xs sub">${b.kind === "yayoi_journal_export" && b.payload ? `<a href="#" data-act="redownload" data-id="${b.id}" style="color:var(--gold-d)">${esc(b.file_path)}（再ダウンロード）</a>` : esc(b.file_path || "")}${b.error_summary ? `<span class="warn" style="display:block">${esc(b.error_summary)}</span>` : ""}</td><td class="small">${esc(b.actor_name || "システム")}</td></tr>`).join("") : `<tr><td colspan="9" class="sub" style="text-align:center">まだありません</td></tr>`}
        </tbody></table></div></section></div>`;
  }

  // ---------- render ----------
  function render() {
    index();
    const { seg, p } = route();
    renderNav(seg);
    let html;
    if (!seg.length) html = pageDashboard(p);
    else if (seg[0] === "inbox" && seg[1]) html = pageDetail(seg[1]);
    else if (seg[0] === "inbox") html = pageInbox(p);
    else if (seg[0] === "pl") html = pagePl(p);
    else if (seg[0] === "imports") html = pageImports();
    else html = pageDashboard(p);
    $("#main").innerHTML = html;
    $("#role").value = role;
    document.title = ({ "": "支払の承認", inbox: "請求書の受信箱", pl: "法人別・事業部別PL", imports: "弥生との連携" }[seg[0] || ""] || "WAY 管理基幹") + " ｜ WAY 管理基幹";
    const af = $("#main [autofocus]"); if (af) af.focus();
  }
  let toastTimer;
  function toast(msg, err) { const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : ""); clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.className = "toast"), err ? 4200 : 2200); }
  function done(err, okMsg) { if (err) { toast(err, true); } else { save(); ui.comment = null; toast(okMsg || "記録しました"); } render(); }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]"); if (!el || el.tagName === "FORM" || el.tagName === "SELECT") return;
    const act = el.dataset.act;
    if (act === "transition") { e.preventDefault(); done(transition(el.dataset.id, el.dataset.action), { approve: "承認しました。支払予定に移りました", first_check: "チェック済みにしました", submit: "承認を申請しました" }[el.dataset.action]); }
    else if (act === "pay") { e.preventDefault(); done(markPaid(el.dataset.id), "振込済みとして記録しました。弥生への出力対象になります"); }
    else if (act === "ask-comment") { e.preventDefault(); ui.comment = `${el.dataset.id}:${el.dataset.action}`; render(); }
    else if (act === "cancel-comment") { e.preventDefault(); ui.comment = null; render(); }
    else if (act === "export-le") { e.preventDefault(); ui.exportLe = el.dataset.le; render(); }
    else if (act === "export") { e.preventDefault(); done(createExport(ui.exportLe), "確定しました。CSVをダウンロードしています"); }
    else if (act === "redownload") { e.preventDefault(); const b = S.batches.find((x) => x.id === el.dataset.id); if (b) download(b.payload, b.file_path); }
    else if (act === "sample-tb") { e.preventDefault(); sampleTb(); }
    else if (act === "reset") { e.preventDefault(); if (confirm("サンプルデータを初期状態に戻します。よろしいですか？")) { S = fresh(); save(); ui.comment = null; toast("初期状態に戻しました"); render(); } }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-act]"); if (!f) return; e.preventDefault();
    const fd = new FormData(f); const v = Object.fromEntries(fd.entries());
    const act = f.dataset.act;
    if (act === "transition-comment") done(transition(f.dataset.id, f.dataset.action, v.comment.trim()), f.dataset.action === "hold" ? "保留にしました" : "差し戻しました");
    else if (act === "reject") done(rejectInvoice(f.dataset.id, v.comment.trim()), "却下しました");
    else if (act === "confirm") done(confirmExtraction(f.dataset.id, { ...v, total_amount: Number(v.total_amount) }), "確定しました。次は「承認を申請する」");
    else if (act === "edit") done(editKeyFields(f.dataset.id, { ...v, total_amount: Number(v.total_amount) }), "保存しました");
    else if (act === "import") {
      const file = fd.get("file"); if (!(file && file.size)) return toast("CSVファイルを選んでください", true);
      file.arrayBuffer().then((buf) => {
        let text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
        if (text.includes("�")) { try { text = new TextDecoder("shift_jis").decode(buf); } catch (_) {} }
        text = text.replace(/^﻿/, "");
        done(importTb(v.le, v.period, text, file.name), "取り込みました。PL画面に反映されています");
      });
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "role") { role = e.target.value; try { localStorage.setItem(ROLE_KEY, role); } catch (_) {} ui.comment = null; toast(`${ROLE_NAME[role]} の視点に切り替えました`); render(); }
    if (e.target.dataset.act === "le-change") {
      const sel = $("#edit-dept"); const le = e.target.value;
      sel.innerHTML = `<option value="">選んでください</option>` + S.departments.filter((d) => d.legal_entity_id === le).map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join("");
    }
  });
  window.addEventListener("hashchange", () => { ui.comment = null; render(); window.scrollTo(0, 0); });

  function sampleTb() {
    // チポーレ 2026-08 の取込済みデータから、9月用のサンプルCSVを作る（数字は少し動かす）
    const le = S.legal_entities[0].id;
    const src = S.ledger_lines.filter((r) => r.legal_entity_id === le && r.period === "2026-08-01");
    const rows = [["勘定科目", "部門", "借方金額", "貸方金額"], ...src.map((r) => [ACC[r.account_id]?.name || "", r.department_id ? DEPT[r.department_id]?.name || "" : "", Math.round(r.debit * 1.03), Math.round(r.credit * 1.03)])];
    download(rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n", "sample_試算表_チポーレ_2026-09.csv");
  }

  load(); render();
})();
