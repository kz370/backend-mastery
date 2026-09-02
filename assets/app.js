/* ==========================================================================
   Backend Mastery — app.js
   Nav rendering · theme · search · progress · quiz engine · PHP highlighter
   No external dependencies. Works offline from file://
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ store */
  var MEM = {};
  var store = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        return v === null ? (k in MEM ? MEM[k] : d) : JSON.parse(v);
      } catch (e) { return k in MEM ? MEM[k] : d; }
    },
    set: function (k, v) {
      MEM[k] = v;
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
  };

  /* ------------------------------------------------------------------ icons */
  var I = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    check: '<svg class="nav-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  /* ---------------------------------------------------------------- helpers */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function toast(msg) {
    var t = document.querySelector(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ------------------------------------------------------------------ theme */
  var THEME_KEY = "bm.theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = document.getElementById("themeBtn");
    if (b) b.innerHTML = t === "dark" ? I.sun : I.moon;
  }
  var savedTheme = store.get(THEME_KEY, "dark");
  applyTheme(savedTheme);

  /* ------------------------------------------------------- PHP highlighting */
  var PHP_KW = ("abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|" +
    "empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|extends|final|finally|fn|for|foreach|function|global|goto|" +
    "if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|print|private|protected|" +
    "public|readonly|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield|true|false|null|" +
    "int|float|string|bool|void|self|parent|array_map|count|date|throw").split("|");

  function highlightPHP(src) {
    var out = "";
    var i = 0, n = src.length;
    function isIdent(c) { return /[A-Za-z0-9_\\]/.test(c); }
    while (i < n) {
      var c = src[i];
      // comments
      if (c === "/" && src[i + 1] === "/") {
        var j = src.indexOf("\n", i); if (j < 0) j = n;
        out += '<span class="tok-com">' + esc(src.slice(i, j)) + "</span>"; i = j; continue;
      }
      if (c === "#") {
        var j2 = src.indexOf("\n", i); if (j2 < 0) j2 = n;
        out += '<span class="tok-com">' + esc(src.slice(i, j2)) + "</span>"; i = j2; continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        var j3 = src.indexOf("*/", i); j3 = j3 < 0 ? n : j3 + 2;
        out += '<span class="tok-com">' + esc(src.slice(i, j3)) + "</span>"; i = j3; continue;
      }
      // strings
      if (c === "'" || c === '"') {
        var q = c, k = i + 1;
        while (k < n) { if (src[k] === "\\") { k += 2; continue; } if (src[k] === q) { k++; break; } k++; }
        out += '<span class="tok-str">' + esc(src.slice(i, k)) + "</span>"; i = k; continue;
      }
      // variables
      if (c === "$") {
        var k2 = i + 1;
        while (k2 < n && /[A-Za-z0-9_]/.test(src[k2])) k2++;
        out += '<span class="tok-var">' + esc(src.slice(i, k2)) + "</span>"; i = k2; continue;
      }
      // php tag
      if (c === "<" && src.slice(i, i + 5) === "<?php") {
        out += '<span class="tok-key">&lt;?php</span>'; i += 5; continue;
      }
      // numbers
      if (/[0-9]/.test(c) && !isIdent(src[i - 1] || "")) {
        var k3 = i;
        while (k3 < n && /[0-9._]/.test(src[k3])) k3++;
        out += '<span class="tok-num">' + esc(src.slice(i, k3)) + "</span>"; i = k3; continue;
      }
      // identifiers
      if (/[A-Za-z_\\]/.test(c)) {
        var k4 = i;
        while (k4 < n && isIdent(src[k4])) k4++;
        var word = src.slice(i, k4);
        var after = src.slice(k4).match(/^\s*/)[0].length + k4;
        var cls = "";
        if (PHP_KW.indexOf(word) >= 0) cls = "tok-key";
        else if (src[after] === "(") cls = "tok-fn";
        else if (/^[A-Z]/.test(word)) cls = "tok-cls";
        out += cls ? '<span class="' + cls + '">' + esc(word) + "</span>" : esc(word);
        i = k4; continue;
      }
      // operators
      if (/[=+\-*/%<>!&|.?:;,()[\]{}]/.test(c)) {
        out += '<span class="tok-op">' + esc(c) + "</span>"; i++; continue;
      }
      out += esc(c); i++;
    }
    return out;
  }

  function buildCode(codeText, lang) {
    var wrap = el("div", "code");
    var head = el("div", "code-head");
    head.innerHTML =
      '<div class="code-dots"><i></i><i></i><i></i></div>' +
      '<div class="code-lang">' + esc(lang || "php") + "</div>" +
      '<button class="copy-btn" type="button">' + I.copy + "<span>نسخ</span></button>";
    var pre = el("pre");
    var code = el("code");
    var L = (lang || "php").toLowerCase();
    code.innerHTML = (L === "php" || L === "js" || L === "javascript") ? highlightPHP(codeText) : esc(codeText);
    pre.appendChild(code);
    wrap.appendChild(head);
    wrap.appendChild(pre);
    head.querySelector(".copy-btn").addEventListener("click", function () {
      var btn = this;
      var done = function () {
        btn.classList.add("ok");
        btn.innerHTML = I.ok + "<span>تم</span>";
        setTimeout(function () { btn.classList.remove("ok"); btn.innerHTML = I.copy + "<span>نسخ</span>"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeText).then(done, done);
      } else {
        var ta = el("textarea"); ta.value = codeText; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
    return wrap;
  }

  // upgrade <pre data-lang> blocks placed in page HTML
  function upgradeCodeBlocks(root) {
    var pres = (root || document).querySelectorAll("pre[data-lang]");
    Array.prototype.forEach.call(pres, function (p) {
      var lang = p.getAttribute("data-lang");
      var text = p.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      p.parentNode.replaceChild(buildCode(text, lang), p);
    });
  }

  /* -------------------------------------------------------------- progress */
  var DONE_KEY = "bm.done";
  function getDone() { return store.get(DONE_KEY, {}) || {}; }
  function setDone(id, v) {
    var d = getDone();
    if (v) d[id] = 1; else delete d[id];
    store.set(DONE_KEY, d);
  }

  /* ------------------------------------------------------------------- nav */
  var NAV = window.SITE_NAV || [];
  var PAGES = [];
  NAV.forEach(function (g) { g.items.forEach(function (it) { PAGES.push({ g: g, it: it }); }); });

  function base() {
    // depth of current page relative to site root
    return window.PAGE_BASE || "";
  }

  function renderSidebar() {
    var sb = document.getElementById("sidebar");
    if (!sb) return;
    var done = getDone();
    var cur = window.PAGE_ID;

    var prog = el("div", "sb-progress");
    var total = PAGES.length;
    var n = PAGES.filter(function (p) { return done[p.it.id]; }).length;
    var pct = total ? Math.round((n / total) * 100) : 0;
    prog.innerHTML =
      '<div class="sb-progress-top"><span>تقدّمك في المنهج</span><b>' + n + "/" + total + "</b></div>" +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>';
    sb.appendChild(prog);

    var collapsed = store.get("bm.navCollapsed", {}) || {};

    NAV.forEach(function (g) {
      var grp = el("div", "nav-group");
      var hasCur = g.items.some(function (i) { return i.id === cur; });
      if (collapsed[g.id] && !hasCur) grp.classList.add("collapsed");

      var head = el("button", "nav-group-head");
      head.type = "button";
      head.innerHTML = '<span class="nav-dot" style="background:' + g.color + '"></span>' + esc(g.title) + I.chev;
      head.addEventListener("click", function () {
        grp.classList.toggle("collapsed");
        var c = store.get("bm.navCollapsed", {}) || {};
        c[g.id] = grp.classList.contains("collapsed") ? 1 : 0;
        store.set("bm.navCollapsed", c);
      });
      grp.appendChild(head);

      var list = el("div", "nav-list");
      g.items.forEach(function (it, idx) {
        var a = el("a");
        a.href = base() + it.href;
        a.innerHTML = '<span class="nav-num">' + (it.num != null ? it.num : idx + 1) + "</span>" +
          "<span>" + esc(it.title) + "</span>" + I.check;
        if (it.id === cur) a.classList.add("active");
        if (done[it.id]) a.classList.add("done");
        list.appendChild(a);
      });
      grp.appendChild(list);
      sb.appendChild(grp);
    });

    var act = sb.querySelector("a.active");
    if (act) setTimeout(function () {
      var r = act.getBoundingClientRect();
      if (r.top < 120 || r.bottom > window.innerHeight - 40) act.scrollIntoView({ block: "center" });
    }, 60);
  }

  /* ---------------------------------------------------------------- search */
  function initSearch() {
    var input = document.getElementById("searchInput");
    var box = document.getElementById("searchResults");
    if (!input || !box) return;

    function render(list) {
      box.innerHTML = "";
      if (!list.length) { box.innerHTML = '<div class="search-empty">مفيش نتيجة</div>'; box.classList.add("open"); return; }
      list.slice(0, 12).forEach(function (p) {
        var a = el("a");
        a.href = base() + p.it.href;
        a.innerHTML = esc(p.it.title) + "<span>" + esc(p.g.title) + (p.it.kw ? " · " + esc(p.it.kw.slice(0, 60)) : "") + "</span>";
        box.appendChild(a);
      });
      box.classList.add("open");
    }
    function search(q) {
      q = q.trim().toLowerCase();
      if (!q) { box.classList.remove("open"); return; }
      var res = PAGES.filter(function (p) {
        return (p.it.title + " " + (p.it.kw || "") + " " + p.g.title).toLowerCase().indexOf(q) >= 0;
      });
      render(res);
    }
    input.addEventListener("input", function () { search(this.value); });
    input.addEventListener("focus", function () { if (this.value.trim()) search(this.value); });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove("open");
    });
    input.addEventListener("keydown", function (e) {
      var items = box.querySelectorAll("a");
      var act = box.querySelector("a.active");
      var i = Array.prototype.indexOf.call(items, act);
      if (e.key === "ArrowDown") { e.preventDefault(); if (act) act.classList.remove("active"); (items[i + 1] || items[0] || {classList:{add:function(){}}}).classList.add("active"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (act) act.classList.remove("active"); (items[i - 1] || items[items.length - 1] || {classList:{add:function(){}}}).classList.add("active"); }
      else if (e.key === "Enter") { if (act) { e.preventDefault(); window.location.href = act.href; } }
      else if (e.key === "Escape") { box.classList.remove("open"); this.blur(); }
    });
    document.addEventListener("keydown", function (e) {
      if ((e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) && document.activeElement !== input) {
        e.preventDefault(); input.focus(); input.select();
      }
    });
  }

  /* ------------------------------------------------------------- page nav */
  function renderPageNav() {
    var host = document.getElementById("pageNav");
    if (!host) return;
    var idx = PAGES.findIndex(function (p) { return p.it.id === window.PAGE_ID; });
    if (idx < 0) return;
    var prev = PAGES[idx - 1], next = PAGES[idx + 1];
    host.innerHTML = "";
    var a1 = el("a", "pv");
    if (prev) { a1.href = base() + prev.it.href; a1.innerHTML = "<small>السابق ←</small><b>" + esc(prev.it.title) + "</b>"; }
    else a1.className = "pv empty";
    var a2 = el("a", "nx");
    if (next) { a2.href = base() + next.it.href; a2.innerHTML = "<small>→ التالي</small><b>" + esc(next.it.title) + "</b>"; }
    else a2.className = "nx empty";
    host.appendChild(a1);
    host.appendChild(a2);
  }

  /* ------------------------------------------------------------- done bar */
  function renderDoneBar() {
    var host = document.getElementById("doneBar");
    if (!host || !window.PAGE_ID) return;
    var done = getDone();
    function paint() {
      var isDone = !!getDone()[window.PAGE_ID];
      host.className = "done-bar" + (isDone ? " is-done" : "");
      host.innerHTML = "";
      var p = el("p", null, isDone ? "✅ خلصت الصفحة دي. تقدر ترجعلها في أي وقت للمراجعة." : "خلصت الصفحة دي؟ علّمها كمذاكرة عشان تتابع تقدّمك.");
      var b = el("button", "btn" + (isDone ? "" : " primary"));
      b.type = "button";
      b.innerHTML = isDone ? I.reset + "<span>إلغاء التعليم</span>" : I.ok + "<span>علّمها كمذاكرة</span>";
      b.addEventListener("click", function () {
        setDone(window.PAGE_ID, !getDone()[window.PAGE_ID]);
        paint();
        var sb = document.getElementById("sidebar");
        if (sb) { sb.innerHTML = ""; renderSidebar(); }
        toast(getDone()[window.PAGE_ID] ? "تمام 👌 اتسجّلت" : "اتشالت من المذاكر");
      });
      host.appendChild(p);
      host.appendChild(b);
    }
    paint();
  }

  /* ------------------------------------------------------------ quiz engine */
  var LETTERS = ["أ", "ب", "ج", "د", "هـ"];

  function buildQuiz(cfg, host) {
    var qs = cfg.questions || [];
    var key = "bm.quiz." + (cfg.id || window.PAGE_ID || "x");
    var state = { answered: 0, correct: 0 };
    var mcqCount = qs.filter(function (q) { return q.options; }).length;

    var wrap = el("section", "quiz");
    wrap.id = "quiz";

    var head = el("div", "quiz-head");
    head.innerHTML =
      '<div class="qi">' + I.quiz + "</div>" +
      "<div><h2>" + esc(cfg.title || "اختبر نفسك") + "</h2><p>" + esc(cfg.sub || (mcqCount + " سؤال — جاوب وشوف الشرح فورًا")) + "</p></div>" +
      '<div class="quiz-score"><span>النتيجة</span><em id="qScore" style="font-style:normal">0/' + mcqCount + "</em></div>";
    wrap.appendChild(head);

    var body = el("div", "quiz-body");
    wrap.appendChild(body);

    qs.forEach(function (q, qi) {
      var qEl = el("div", "q");
      var top = el("div", "q-top");
      var kind = q.kind ? '<span class="q-kind">' + esc(q.kind) + "</span>" : "";
      top.innerHTML = '<div class="q-num">' + (qi + 1) + "</div>" +
        '<div class="q-text">' + q.q + kind + "</div>";
      qEl.appendChild(top);

      if (q.code) {
        var holder = el("div");
        holder.appendChild(buildCode(q.code, q.lang || "php"));
        top.querySelector(".q-text").appendChild(holder.firstChild);
      }

      var exp = el("div", "q-exp");
      exp.innerHTML = q.exp || "";

      if (q.options) {
        var opts = el("div", "opts");
        q.options.forEach(function (o, oi) {
          var b = el("button", "opt");
          b.type = "button";
          b.innerHTML = '<span class="ok">' + LETTERS[oi] + "</span><span>" + o + "</span>";
          b.addEventListener("click", function () {
            if (qEl.dataset.done) return;
            qEl.dataset.done = "1";
            state.answered++;
            var buttons = opts.querySelectorAll(".opt");
            Array.prototype.forEach.call(buttons, function (bb, bi) {
              bb.disabled = true;
              if (bi === q.answer) bb.classList.add("correct");
              else if (bi === oi) bb.classList.add("incorrect");
              else bb.classList.add("muted");
            });
            if (oi === q.answer) { state.correct++; qEl.classList.add("right"); }
            else qEl.classList.add("wrong");
            exp.classList.add("show");
            var sc = document.getElementById("qScore");
            if (sc) sc.textContent = state.correct + "/" + mcqCount;
            if (state.answered === mcqCount) finish();
          });
          opts.appendChild(b);
        });
        qEl.appendChild(opts);
      } else {
        var open = el("div", "q-open");
        var ta = el("textarea");
        ta.placeholder = "اكتب إجابتك بكلامك أنت… (الإجابة النموذجية تحت)";
        ta.value = store.get(key + ".open." + qi, "") || "";
        ta.addEventListener("input", function () { store.set(key + ".open." + qi, this.value); });
        var rb = el("button", "btn reveal-btn");
        rb.type = "button";
        rb.innerHTML = I.eye + "<span>اعرض الإجابة النموذجية</span>";
        rb.addEventListener("click", function () {
          exp.classList.toggle("show");
          rb.querySelector("span").textContent = exp.classList.contains("show") ? "إخفاء الإجابة" : "اعرض الإجابة النموذجية";
        });
        open.appendChild(ta);
        open.appendChild(rb);
        qEl.appendChild(open);
      }

      qEl.appendChild(exp);
      body.appendChild(qEl);
    });

    var foot = el("div", "quiz-foot");
    var msg = el("div", "msg", "جاوب على الأسئلة عشان تشوف نتيجتك.");
    var reset = el("button", "btn");
    reset.type = "button";
    reset.innerHTML = I.reset + "<span>إعادة الاختبار</span>";
    reset.addEventListener("click", function () { location.reload(); });
    foot.appendChild(msg);
    foot.appendChild(reset);
    wrap.appendChild(foot);

    function finish() {
      var p = mcqCount ? Math.round((state.correct / mcqCount) * 100) : 0;
      var t;
      if (p === 100) t = "🏆 <b>علامة كاملة!</b> فاهم الموضوع من جذوره.";
      else if (p >= 80) t = "💪 <b>" + p + "%</b> — مستوى كويس جدًا. راجع اللي غلطت فيه بس.";
      else if (p >= 50) t = "📖 <b>" + p + "%</b> — الأساس موجود، محتاج قراءة تانية للأجزاء اللي غلطت فيها.";
      else t = "🔁 <b>" + p + "%</b> — ارجع اقرا الصفحة تاني، وركّز على المشكلة قبل اسم الحل.";
      msg.innerHTML = t;
      var best = store.get(key + ".best", 0) || 0;
      if (p > best) store.set(key + ".best", p);
    }

    (host || document.getElementById("quizHost") || document.querySelector(".container")).appendChild(wrap);
  }
  window.buildQuiz = buildQuiz;

  /* ------------------------------------------------------------- header UI */
  function initHeader() {
    var tb = document.getElementById("themeBtn");
    if (tb) {
      tb.innerHTML = savedTheme === "dark" ? I.sun : I.moon;
      tb.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(cur);
        store.set(THEME_KEY, cur);
      });
    }
    var mb = document.getElementById("menuBtn");
    var sb = document.getElementById("sidebar");
    var scrim = document.querySelector(".scrim");
    if (mb && sb) {
      mb.innerHTML = I.menu;
      mb.addEventListener("click", function () {
        sb.classList.toggle("open");
        if (scrim) scrim.classList.toggle("on", sb.classList.contains("open"));
      });
      if (scrim) scrim.addEventListener("click", function () {
        sb.classList.remove("open"); scrim.classList.remove("on");
      });
    }
    var si = document.querySelector(".search-wrap");
    if (si && !si.querySelector("svg")) si.insertAdjacentHTML("afterbegin", I.search);
  }

  /* --------------------------------------------------------------- scrollspy */
  function initSpy() {
    var toc = document.querySelector(".toc");
    if (!toc) return;
    var links = toc.querySelectorAll('a[href^="#"]');
    if (!links.length) return;
    var targets = Array.prototype.map.call(links, function (a) {
      return document.getElementById(a.getAttribute("href").slice(1));
    });
    window.addEventListener("scroll", function () {
      var y = window.scrollY + 130, best = -1;
      targets.forEach(function (t, i) { if (t && t.offsetTop <= y) best = i; });
      Array.prototype.forEach.call(links, function (a, i) {
        a.style.color = i === best ? "var(--accent)" : "";
        a.style.fontWeight = i === best ? "700" : "";
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    initHeader();
    renderSidebar();
    initSearch();
    upgradeCodeBlocks(document);
    renderPageNav();
    renderDoneBar();
    initSpy();
    if (window.QUIZ) buildQuiz(window.QUIZ);
    // home page progress widgets
    var hp = document.getElementById("homeProgress");
    if (hp) {
      var done = getDone();
      var n = PAGES.filter(function (p) { return done[p.it.id]; }).length;
      var pct = PAGES.length ? Math.round((n / PAGES.length) * 100) : 0;
      hp.innerHTML = '<div class="sb-progress-top"><span>الصفحات اللي خلصتها</span><b>' + n + " / " + PAGES.length + " (" + pct + '%)</b></div><div class="bar"><i style="width:' + pct + '%"></i></div>';
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
