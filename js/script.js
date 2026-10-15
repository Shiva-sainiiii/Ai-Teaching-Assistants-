import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ls = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = t => (window.marked && window.DOMPurify) ? DOMPurify.sanitize(marked.parse(t, { breaks: true })) : esc(t).replace(/\n/g, "<br>");
const skel = () => '<div class="sk"><i></i><i></i><i></i></div>';
const mk = (tag, props) => Object.assign(document.createElement(tag), props);
const seg = (sel, cb) => $$(sel + " button").forEach(b => b.onclick = () => { $$(sel + " button").forEach(x => x.classList.toggle("on", x === b)); cb(b); });
const mini = (label, icon, fn) => { const b = mk("button", { type: "button", innerHTML: `<i class="ph ph-${icon}"></i> ${label}` }); b.onclick = () => fn(b); return b; };

/* ---------- storage + cloud sync (local first, Firebase as backup) ---------- */
let uid = null;
try { uid = localStorage.getItem("firebase_userId"); if (!uid) { uid = "user_" + Math.random().toString(36).slice(2, 11); localStorage.setItem("firebase_userId", uid); } } catch { uid = "user_anon"; }
let ref = null, synced = null;
try {
  const app = initializeApp({
    apiKey: "AIzaSyCMXebF7sLllONAqK0d1Cgryf1g7PHDf94", authDomain: "ai-teaching-assistants.firebaseapp.com",
    projectId: "ai-teaching-assistants", storageBucket: "ai-teaching-assistants.firebasestorage.app",
    messagingSenderId: "1092142076008", appId: "1:1092142076008:web:d5c2f4e148fc8dcfb56bdd", measurementId: "G-BBP298QGT8"
  });
  ref = doc(getFirestore(app), "user_data", uid);
  isSupported().then(ok => ok && getAnalytics(app)).catch(() => {});
} catch {}
const sync = async data => { if (!ref) return; try { await setDoc(ref, data, { merge: true }); synced = true; } catch { synced = false; } };
const topic = q => { const t = ls.get("topics", []); if (!t.includes(q)) { t.push(q); ls.set("topics", t.slice(-200)); sync({ topics: arrayUnion(q) }); } };

/* study time: counts only while the tab is visible, flushed every minute and on hide */
let tick = 0;
function flush() { if (!tick) return; const d = tick; tick = 0; ls.set("studySec", ls.get("studySec", 0) + d); sync({ studySec: increment(d) }); }
setInterval(() => { if (!document.hidden && ++tick % 60 === 0) flush(); }, 1000);
document.addEventListener("visibilitychange", () => document.hidden && flush());

/* ---------- router + theme ---------- */
function go(id) {
  if (!document.getElementById("v-" + id)) id = "doc";
  $$(".view").forEach(v => v.hidden = v.id !== "v-" + id);
  $$("#nav a").forEach(a => { const on = a.dataset.go === id; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
  if (id === "progress") renderProgress();
  scrollTo(0, 0);
}
addEventListener("hashchange", () => go(location.hash.slice(1)));
$("#theme").onclick = () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t; try { localStorage.setItem("theme", t); } catch {}
  if (!$("#v-progress").hidden) renderProgress();
};

/* ---------- document ingestion ---------- */
const S = { pages: [], hist: [], read: ls.get("read", false) };
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const drop = $("#drop"), file = $("#file"), chat = $("#chat");
const say = (t, bad) => { $("#dropSub").textContent = t; $("#dropSub").classList.toggle("err", !!bad); };
const needDoc = () => { if (S.pages.length) return false; say("Add a document first.", true); location.hash = "#doc"; return true; };

async function ingest(f) {
  if (!f) return;
  drop.classList.add("busy"); say("Reading " + f.name + "...");
  try {
    let pages = [], kind = "text";
    if (f.type === "application/pdf") {
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      for (let i = 1; i <= pdf.numPages; i++) pages.push((await (await pdf.getPage(i)).getTextContent()).items.map(t => t.str).join(" "));
      if (!pages.join("").trim()) {
        kind = "ocr"; pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          say(`Scanned PDF. Reading page ${i} of ${pdf.numPages}`);
          const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 1.5 }), cv = mk("canvas", { width: vp.width, height: vp.height });
          await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
          pages.push((await Tesseract.recognize(cv, "eng")).data.text);
          cv.width = cv.height = 0;
        }
      }
    } else if (f.type.startsWith("image/")) {
      kind = "ocr"; say("Reading text from image"); pages = [(await Tesseract.recognize(f, "eng")).data.text];
    } else throw new Error("Use a PDF, JPG or PNG file.");
    if (!pages.join("").trim()) throw new Error("No readable text found in this file.");
    S.pages = pages; S.hist = [];
    $$(".m", chat).forEach(n => n.remove());
    $("#fName").textContent = f.name; $("#fPages").textContent = pages.length;
    $("#fWords").textContent = pages.join(" ").split(/\s+/).filter(Boolean).length.toLocaleString();
    $("#fKind").textContent = kind === "ocr" ? "OCR (scanned)" : "Text layer";
    $("#facts").hidden = $("#next").hidden = false;
    $("#docChipText").textContent = f.name; $("#docChip .dot").classList.add("ok");
    $("#emptyMsg").textContent = "Ask anything about this document. A few ideas:"; $("#chips").hidden = $("#chatEmpty").hidden = false;
    $("#dropTitle").textContent = "Replace document"; say("Drop another file or click to browse.");
    ls.set("pdfCount", ls.get("pdfCount", 0) + 1); sync({ pdfCount: increment(1) });
  } catch (e) { console.error(e); say(e.message || "Could not read this file.", true); }
  finally { drop.classList.remove("busy"); file.value = ""; }
}
file.onchange = () => ingest(file.files[0]);
["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => ingest(e.dataTransfer.files[0]));

/* ---------- retrieval: score ~1000 char chunks, keep page numbers ---------- */
const STOP = new Set("the and for are was with that this what how why who when which about from into does tell explain give list please can you your".split(" "));
const fmt = cs => cs.map(c => `[Page ${c.p}]\n${c.t}`).join("\n\n");
function sample(max) {
  const n = S.pages.length, full = S.pages.reduce((a, t) => a + t.length, 0);
  let idx = [...S.pages.keys()], per = Infinity;
  if (full > max) { per = Math.max(300, Math.floor(max / n)); const k = Math.min(n, Math.floor(max / per)); idx = Array.from({ length: k }, (_, i) => Math.floor(i * n / k)); }
  return idx.map(i => ({ p: i + 1, t: S.pages[i].slice(0, per) }));
}
function retrieve(q) {
  const terms = (q.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []).filter(w => w.length > 2 && !STOP.has(w));
  const chunks = [];
  S.pages.forEach((t, i) => { for (let o = 0; o < t.length; o += 900) { const c = t.slice(o, o + 1000); chunks.push({ p: i + 1, t: c, l: c.toLowerCase() }); } });
  const hits = chunks.map(c => ({ c, s: terms.reduce((n, w) => n + c.l.split(w).length - 1, 0) })).filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.c).sort((a, b) => a.p - b.p);
  return hits.length ? hits : sample(6000);
}

/* ---------- AI ---------- */
async function callAI(prompt, history = []) {
  let res;
  try { res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, history }) }); }
  catch { throw new Error("Can't reach the server. Check your connection."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.reply) throw new Error(data.error || "The AI did not answer. Try again.");
  return data.reply;
}

/* ---------- voice ---------- */
const lang = () => ls.get("lang", (navigator.language || "").startsWith("hi") ? "hi-IN" : "en-IN");
const paintLang = () => $("#langBtn").textContent = lang().startsWith("hi") ? "हिं" : "EN";
$("#langBtn").onclick = () => { ls.set("lang", lang().startsWith("hi") ? "en-IN" : "hi-IN"); paintLang(); }; paintLang();
const paintRead = () => { $("#readBtn").setAttribute("aria-pressed", S.read); $("#readBtn").classList.toggle("on", S.read); }; paintRead();
$("#readBtn").onclick = () => { S.read = !S.read; ls.set("read", S.read); paintRead(); if (!S.read) window.speechSynthesis?.cancel(); };
let speaking = null;
function speak(text, b) {
  const synth = window.speechSynthesis; if (!synth) return;
  const was = speaking; synth.cancel(); speaking = null;
  if (was) was.lastChild.textContent = " Listen";
  if (was === b) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[*#_`>]/g, "").replace(/https?:\/\/\S+/g, "link"));
  u.lang = lang(); const v = synth.getVoices().find(v => v.lang.replace("_", "-").startsWith(u.lang.slice(0, 2))); if (v) u.voice = v;
  u.onend = u.onerror = () => { b.lastChild.textContent = " Listen"; if (speaking === b) speaking = null; };
  b.lastChild.textContent = " Stop"; speaking = b; synth.speak(u);
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition; let rec = null;
if (!SR) $("#micBtn").hidden = true;
$("#micBtn").onclick = () => {
  if (rec) return rec.stop();
  rec = new SR(); rec.lang = lang();
  rec.onstart = () => $("#micBtn").classList.add("rec");
  rec.onend = () => { $("#micBtn").classList.remove("rec"); rec = null; };
  rec.onresult = e => ask(e.results[0][0].transcript);
  rec.start();
};

/* ---------- chat ---------- */
["What are the main ideas?", "Define the key terms", "What could an exam ask?"].forEach(t => $("#chips").append(mk("button", { type: "button", textContent: t, onclick: () => ask(t) })));
const addMsg = cls => { const d = mk("div", { className: "m " + cls }); chat.append(d); d.scrollIntoView({ block: "end", behavior: "smooth" }); return d; };
async function ask(q) {
  if (needDoc()) return;
  $("#chatEmpty").hidden = true; topic(q);
  const un = addMsg("u"); un.textContent = q;
  const b = addMsg("b"); b.innerHTML = skel();
  const ctx = retrieve(q), pages = [...new Set(ctx.map(c => c.p))].slice(0, 6);
  try {
    const r = await callAI(`Document excerpts:\n${fmt(ctx)}\n\nQuestion: ${q}`, S.hist.slice(-6));
    S.hist.push({ role: "user", content: q }, { role: "assistant", content: r });
    b.innerHTML = `<div class="prose">${md(r)}</div>`;
    const meta = mk("div", { className: "meta", innerHTML: "<span>Read from</span>" + pages.map(p => `<span class="src">p.${p}</span>`).join("") });
    const listen = mini("Listen", "speaker-high", x => speak(r, x));
    meta.append(mini("Copy", "copy", x => { navigator.clipboard?.writeText(r); x.lastChild.textContent = " Copied"; setTimeout(() => x.lastChild.textContent = " Copy", 1600); }), listen);
    b.append(meta);
    if (S.read) speak(r, listen);
  } catch (e) {
    b.innerHTML = `<p class="err">${esc(e.message)}</p>`;
    b.append(mk("div", { className: "meta" })); $(".meta", b).append(mini("Retry", "arrow-clockwise", () => { un.remove(); b.remove(); ask(q); }));
  }
  b.scrollIntoView({ block: "end", behavior: "smooth" });
}
$("#form").onsubmit = e => { e.preventDefault(); const q = $("#input").value.trim(); if (q) { $("#input").value = ""; ask(q); } };

/* ---------- summary ---------- */
const MODES = {
  points: "Summarise this document as 6 to 10 clear bullet points.",
  notes: "Write structured study notes: short headings, bullets under each, and a closing list of terms to remember.",
  simple: "Explain this document in plain language a 15-year-old would follow, in short paragraphs."
};
let mode = "points"; seg("#sumMode", b => mode = b.dataset.m);
$("#sumBtn").onclick = async () => {
  if (needDoc()) return;
  const out = $("#sumOut"); out.innerHTML = skel(); $("#sumActs").hidden = true; $("#sumBtn").disabled = true;
  try { const r = await callAI(`${MODES[mode]} Use Markdown.\n\n${fmt(sample(10000))}`); out.innerHTML = md(r); out.dataset.raw = r; $("#sumActs").hidden = false; }
  catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  $("#sumBtn").disabled = false;
};
$("#sumCopy").onclick = () => { navigator.clipboard?.writeText($("#sumOut").dataset.raw || ""); const s = $("#sumCopy span"); s.textContent = "Copied"; setTimeout(() => s.textContent = "Copy", 1600); };
$("#sumPrint").onclick = () => { const t = document.title; document.title = "Summary - " + ($("#fName").textContent || "Margin"); print(); document.title = t; };

/* ---------- quiz: one question at a time ---------- */
let qn = 5, Q = null; seg("#qCount", b => qn = +b.dataset.n);
$("#quizBtn").onclick = async () => {
  if (needDoc()) return;
  const box = $("#quizBox"); box.innerHTML = skel(); $("#quizBtn").disabled = true; Q = null;
  try {
    const raw = await callAI(`Write exactly ${qn} multiple-choice questions with 4 options each from the document below. Reply with ONLY a raw JSON array, no markdown fences, in this shape: [{"question":"...","options":["...","...","...","..."],"answer":"must equal one option exactly","explanation":"one sentence"}]\n\n${fmt(sample(9000))}`);
    const items = JSON.parse((raw.match(/\[[\s\S]*\]/) || [raw])[0]);
    const qs = items.map(x => {
      const o = (x.options || []).map(String), ans = String(x.answer ?? "").trim();
      let a = o.indexOf(ans);
      if (a < 0 && /^[A-D]$/i.test(ans)) a = "ABCD".indexOf(ans.toUpperCase());
      if (a < 0 && ans) a = o.findIndex(t => t.includes(ans) || ans.includes(t));
      return { q: String(x.question || ""), o, a, e: String(x.explanation || "") };
    }).filter(x => x.q && x.o.length > 1 && x.a >= 0 && x.a < x.o.length);
    if (qs.length < 2) throw new Error("unusable");
    Q = { qs, i: 0, score: 0, miss: [], marks: [], done: false, locked: false }; showQ();
  } catch (e) { box.innerHTML = `<p class="err">${e.message === "unusable" || e instanceof SyntaxError ? "The AI's reply could not be turned into a quiz. Try again." : esc(e.message)}</p>`; }
  $("#quizBtn").disabled = false;
};
function showQ() {
  const x = Q.qs[Q.i], box = $("#quizBox");
  box.innerHTML = `<div class="ticks">${Q.qs.map((_, k) => `<i class="${Q.marks[k] || (k === Q.i ? "cur" : "")}"></i>`).join("")}</div><p class="qn">Question ${Q.i + 1} of ${Q.qs.length}</p><p class="q"></p><div class="opts"></div><div class="fb" hidden></div>`;
  $(".q", box).textContent = x.q;
  x.o.forEach((t, k) => { const b = mk("button", { className: "opt", innerHTML: `<b>${"ABCD"[k] || k + 1}</b><span></span>`, onclick: () => pick(k) }); b.lastChild.textContent = t; $(".opts", box).append(b); });
}
function pick(k) {
  if (!Q || Q.locked || k >= Q.qs[Q.i].o.length) return;
  Q.locked = true;
  const x = Q.qs[Q.i], ok = k === x.a;
  $$("#quizBox .opt").forEach((b, j) => { b.disabled = true; if (j === x.a) b.classList.add("ok"); else if (j === k) b.classList.add("no"); });
  Q.marks[Q.i] = ok ? "ok" : "no"; ok ? Q.score++ : Q.miss.push(x);
  $$("#quizBox .ticks i")[Q.i].className = Q.marks[Q.i];
  const fb = $("#quizBox .fb"); fb.hidden = false;
  fb.append(mk("p", { textContent: (ok ? "Correct. " : "Not quite. ") + x.e }), mk("button", { className: "btn", textContent: Q.i === Q.qs.length - 1 ? "See result" : "Next question", onclick: next }));
}
function next() { Q.locked = false; if (Q.i < Q.qs.length - 1) { Q.i++; showQ(); } else finish(); }
function finish() {
  const { score, qs, miss } = Q, pct = Math.round(score / qs.length * 100), at = Date.now(), box = $("#quizBox"); Q.done = true;
  const log = ls.get("quizLog", []); log.push({ pct, score, total: qs.length, at }); ls.set("quizLog", log.slice(-50));
  sync({ quizLog: arrayUnion({ pct, score, total: qs.length, at }) });
  box.innerHTML = `<p class="qn">Result</p><p class="score">${score}<span class="muted">/${qs.length}</span></p><p class="muted">${pct >= 80 ? "Strong. You know this material." : pct >= 50 ? "Solid base. Review the misses below." : "Worth another read. Start with the misses below."}</p>`;
  if (miss.length) {
    const ol = mk("ol", { className: "recent" });
    miss.forEach(x => { const li = mk("li", { innerHTML: "<strong></strong><br><span></span>" }); li.firstChild.textContent = x.q; li.lastChild.textContent = "Answer: " + x.o[x.a]; ol.append(li); });
    box.append(ol);
  }
  box.append(mk("button", { className: "btn", textContent: "Build another quiz", onclick: () => $("#quizBtn").click() }));
}
addEventListener("keydown", e => {
  if (!Q || Q.done || $("#v-quiz").hidden || e.metaKey || e.ctrlKey || e.altKey || e.target.matches("input,textarea")) return;
  const k = "1234abcd".indexOf(e.key.toLowerCase());
  if (k >= 0) pick(k % 4); else if (e.key === "Enter" && Q.locked && !e.target.closest("button")) next();
});

/* ---------- progress ---------- */
let chart = null;
function renderProgress() {
  flush();
  const log = [...ls.get("quizData", []).map(pct => ({ pct })), ...ls.get("quizLog", [])];
  const topics = ls.get("topics", []), mins = ls.get("studyTime", 0) + Math.floor(ls.get("studySec", 0) / 60);
  $("#avg").textContent = log.length ? Math.round(log.reduce((a, b) => a + b.pct, 0) / log.length) + "%" : "--";
  $("#avgSub").textContent = log.length ? `Across ${log.length} ${log.length === 1 ? "quiz" : "quizzes"}` : "No quizzes yet";
  $("#sDocs").textContent = ls.get("pdfCount", 0); $("#sQs").textContent = topics.length; $("#sQuiz").textContent = log.length;
  $("#sTime").textContent = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : mins + " min";
  $("#syncTxt").textContent = synced === true ? "Backed up to the cloud" : synced === false ? "Saved on this device only" : "Saved on this device";
  $("#sync .dot").classList.toggle("ok", synced === true);
  const rc = $("#recent"); rc.innerHTML = "";
  topics.slice(-6).reverse().forEach(t => rc.append(mk("li", { textContent: t })));
  if (!topics.length) rc.append(mk("li", { textContent: "Questions you ask will be listed here." }));
  chart?.destroy(); chart = null;
  $("#chartEmpty").hidden = log.length > 0; $("#chart").hidden = !log.length;
  if (!log.length || !window.Chart) return;
  const css = getComputedStyle(document.documentElement), v = n => css.getPropertyValue(n).trim();
  Chart.defaults.font.family = '"Geist Mono", monospace';
  chart = new Chart($("#chart"), {
    type: "line",
    data: { labels: log.map((_, i) => i + 1), datasets: [{ data: log.map(l => l.pct), borderColor: v("--acc"), backgroundColor: v("--wash"), fill: true, borderWidth: 2, tension: .3, pointRadius: 3, pointBackgroundColor: v("--acc") }] },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: v("--mut") }, title: { display: true, text: "Quiz number", color: v("--mut") } },
        y: { min: 0, max: 100, border: { display: false }, grid: { color: v("--line") }, ticks: { color: v("--mut"), stepSize: 25, callback: n => n + "%" } }
      }
    }
  });
}

go(location.hash.slice(1));
