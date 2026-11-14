// 「快速成长指南」核心视图渲染与交互控制器 v2.5
const MOAT_LABELS = {
  intangible: "无形资产",
  switching: "高转换成本",
  network: "网络效应",
  cost: "成本优势",
  scale: "规模优势"
};

const REDFLAG_LABELS = {
  cashflow_diverge: "净利涨但经营现金流下滑",
  oneoff_charge: "连年计提一次性费用",
  ar_spike: "应收/存货增速远超营收",
  serial_ma: "连环并购堆商誉",
  cfo_audit: "CFO辞职或换审计师",
  option_dilute: "滥发期权稀释股本"
};

const MUNGER_BIAS_LABELS = {
  social_proof: "社会认同羊群追高",
  inconsistency: "避免不一致性死扛补仓",
  incentive: "轻信利益相关方激励忽悠",
  man_with_hammer: "单学科铁锤人盲信"
};

window.GrowthApp = {
  currentTab: "portfolio",      // portfolio | reader | evaluator | flashcards
  readerSubTab: "roadmap",      // roadmap | chapters | industry
  chapterFilter: "ALL",         // ALL | P0 | P1 | P2 | UNREAD
  chapterSearch: "",
  globalSearch: "",
  isComposing: false,
  allChaptersCollapsed: false,
  collapsedChapters: {},
  industrySort: "wide",         // wide | total
  maximFilter: "all",           // all | unmastered | mastered
  maximBookScope: "all",        // all | active
  randomMaximIndex: 0,
  wideMode: false,
  editingEvalId: null,
  toastTimer: null,

  // 极速阅读计时器状态
  timerSeconds: 45 * 60,
  timerRunning: false,
  timerInterval: null,

  escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  showToast(msg) {
    const el = document.getElementById("app-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.classList.remove("show");
    }, 2400);
  },

  init() {
    const state = window.GrowthStore.init();
    this.applyDarkMode(!!state.darkMode);
    const activeBook = window.GrowthStore.getActiveBook();
    if (activeBook) {
      this.timerSeconds = (activeBook.speedReadMinutes || 45) * 60;
    }
    this.renderAll();
  },

  applyDarkMode(isDark) {
    document.body.classList.toggle("dark-mode", !!isDark);
    const btn = document.getElementById("btn-dark-mode");
    if (btn) {
      btn.textContent = isDark ? "☀️" : "🌙";
      btn.title = isDark ? "切换为日间模式" : "切换为夜间护眼模式";
    }
  },

  toggleDarkMode() {
    const next = !window.GrowthStore.state.darkMode;
    window.GrowthStore.setDarkMode(next);
    this.applyDarkMode(next);
    this.showToast(next ? "🌙 已开启夜间护眼模式" : "☀️ 已切换为日间模式");
  },

  forceRefreshApp() {
    const cleanUrl = window.location.origin + window.location.pathname + "?v=" + Date.now();
    window.location.replace(cleanUrl);
  },

  toggleWideMode() {
    this.wideMode = !this.wideMode;
    const shell = document.getElementById("app-shell");
    if (shell) {
      shell.classList.toggle("wide-mode", this.wideMode);
    }
    const btn = document.getElementById("btn-view-mode");
    if (btn) {
      btn.textContent = this.wideMode ? "📱 小程序视图" : "🖥️ 宽屏视图";
    }
  },

  switchTab(tabName, options = {}) {
    this.currentTab = tabName;
    if (options.bookId) {
      window.GrowthStore.setActiveBook(options.bookId);
    }
    if (options.subTab) {
      this.readerSubTab = options.subTab;
    }
    this.renderAll();
    if (!options.skipScrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  jumpToChapter(bookId, chapterNum) {
    window.GrowthStore.setActiveBook(bookId);
    this.currentTab = "reader";
    this.readerSubTab = "chapters";
    this.chapterFilter = "ALL";
    this.chapterSearch = "";
    const collapseKey = `${bookId}__${chapterNum}`;
    this.collapsedChapters[collapseKey] = false;
    this.allChaptersCollapsed = false;
    this.renderAll();
    setTimeout(() => {
      const target = document.querySelector(`[data-chapter-num="${CSS.escape(chapterNum)}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  },

  onBookChange(bookId) {
    window.GrowthStore.setActiveBook(bookId);
    const book = window.GrowthStore.getActiveBook();
    this.timerSeconds = (book.speedReadMinutes || 45) * 60;
    this.stopTimer();
    this.renderAll();
  },

  // ==================== 计时器控制 ====================
  toggleTimer() {
    if (this.timerRunning) {
      this.stopTimer();
    } else {
      this.timerRunning = true;
      this.timerInterval = setInterval(() => {
        if (this.timerSeconds > 0) {
          this.timerSeconds--;
          const disp = document.getElementById("speed-timer-display");
          if (disp) disp.textContent = this.formatTime(this.timerSeconds);
        } else {
          this.stopTimer();
          this.showToast("🎉 极速阅读倒计时完成！快去点亮自检清单吧");
        }
      }, 1000);
    }
    this.renderMainContent();
  },

  stopTimer() {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  resetTimer() {
    this.stopTimer();
    const book = window.GrowthStore.getActiveBook();
    this.timerSeconds = (book.speedReadMinutes || 45) * 60;
    this.renderMainContent();
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  },

  renderAll() {
    this.renderActiveBookBar();
    this.renderMainContent();
    this.renderBottomTabbar();
  },

  renderActiveBookBar() {
    const bar = document.getElementById("active-book-bar");
    if (!bar) return;
    const books = window.GrowthStore.getAllBooks();
    const activeBook = window.GrowthStore.getActiveBook();
    if (!activeBook) return;
    const prog = window.GrowthStore.getBookProgress(activeBook.id);

    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;">
        <span style="white-space:nowrap;">当前研读：</span>
        <select class="active-book-select" onchange="GrowthApp.onBookChange(this.value)">
          ${books.map(b => `
            <option value="${this.escapeHtml(b.id)}" ${b.id === activeBook.id ? "selected" : ""}>
              ${b.coverIcon || "📘"} 《${this.escapeHtml(b.title)}》 (${b.positionType === "core" ? "核心重仓" : b.positionType === "active" ? "建仓中" : "观察池"})
            </option>
          `).join("")}
        </select>
      </div>
      <div style="white-space:nowrap;color:#fbbf24;font-weight:700;">
        吸收率 ${prog.percent}%
      </div>
    `;
  },

  renderBottomTabbar() {
    const tabs = [
      { id: "portfolio", icon: "📊", label: "认知持仓" },
      { id: "reader", icon: "⚡", label: "极速拆书" },
      { id: "evaluator", icon: "⚖️", label: "投研体检" },
      { id: "flashcards", icon: "🌱", label: "核心闪卡" }
    ];
    const el = document.getElementById("bottom-tabbar");
    if (!el) return;
    el.innerHTML = tabs.map(t => `
      <button class="tab-item ${this.currentTab === t.id ? "active" : ""}" onclick="GrowthApp.switchTab('${t.id}')">
        <span class="tab-icon">${t.icon}</span>
        <span>${t.label}</span>
      </button>
    `).join("");
  },

  renderMainContent() {
    const container = document.getElementById("main-content");
    if (!container) return;

    if (this.currentTab === "portfolio") {
      container.innerHTML = this.renderPortfolioView();
    } else if (this.currentTab === "reader") {
      container.innerHTML = this.renderReaderView();
    } else if (this.currentTab === "evaluator") {
      container.innerHTML = this.renderEvaluatorView();
      if (this.editingEvalId) {
        this.populateEvalForm(this.editingEvalId);
      }
    } else if (this.currentTab === "flashcards") {
      container.innerHTML = this.renderFlashcardsView();
    }
  },

  // ==================== TAB 1: 认知持仓看板 + 全书库搜索 ====================
  renderPortfolioView() {
    const books = window.GrowthStore.getAllBooks();
    const activeBook = window.GrowthStore.getActiveBook();
    const selectedCat = window.GrowthStore.state.selectedCategory || "all";

    const coreCount = books.filter(b => b.positionType === "core" || b.positionType === "active").length;
    const totalMaxims = books.reduce((acc, b) => {
      return acc + (b.chapters || []).reduce((s, ch) => s + ((ch.maxims || []).length), 0);
    }, 0);
    const masteredCount = Object.values(window.GrowthStore.state.masteredMaxims || {}).filter(Boolean).length;
    const evalCount = (window.GrowthStore.state.stockEvaluations || []).length;
    const totalProg = window.GrowthStore.getTotalPortfolioProgress();
    const activeProg = window.GrowthStore.getBookProgress(activeBook.id);

    const sectorStats = (window.GROWTH_CATEGORIES || []).filter(c => c.id !== "all").map(cat => {
      const catBooks = books.filter(b => b.category === cat.id);
      let done = 0, items = 0;
      catBooks.forEach(b => {
        const p = window.GrowthStore.getBookProgress(b.id);
        done += p.doneItems;
        items += p.totalItems;
      });
      const pct = items > 0 ? Math.round((done / items) * 100) : 0;
      return { ...cat, count: catBooks.length, pct };
    });

    const filteredBooks = selectedCat === "all"
      ? books
      : books.filter(b => b.category === selectedCat);

    return `
      <!-- 持仓净值黑金总览卡 -->
      <div class="portfolio-hero">
        <div class="portfolio-hero-top">
          <div>
            <div class="hero-label">认知资产总持仓净值 · 快速成长指南</div>
            <div class="hero-main-val">
              ${totalProg.percent}%
              <span>全书库综合吸收率 · 当前主攻《${this.escapeHtml(activeBook.title)}》(${activeProg.percent}%)</span>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <button class="btn-top gold" onclick="GrowthApp.switchTab('reader', { bookId: '${this.escapeHtml(activeBook.id)}', subTab: 'roadmap' })">
              ⚡ 速读《${this.escapeHtml(activeBook.title)}》
            </button>
          </div>
        </div>
        <div class="hero-metrics-grid">
          <div class="hero-metric-item">
            <div class="hero-metric-num">${books.length} 本</div>
            <div class="hero-metric-lbl">持仓精读书库</div>
          </div>
          <div class="hero-metric-item">
            <div class="hero-metric-num">${coreCount} 本</div>
            <div class="hero-metric-lbl">重仓/建仓精读</div>
          </div>
          <div class="hero-metric-item">
            <div class="hero-metric-num">${masteredCount}/${totalMaxims}</div>
            <div class="hero-metric-lbl">已内化大师箴言</div>
          </div>
          <div class="hero-metric-item" style="cursor:pointer;" onclick="GrowthApp.switchTab('evaluator')">
            <div class="hero-metric-num">${evalCount} 只</div>
            <div class="hero-metric-lbl">实战体检标的 ↗</div>
          </div>
        </div>
        <!-- 四大认知赛道仓位分布概览（手机端自动 2x2） -->
        <div class="sector-overview-grid">
          ${sectorStats.map(s => `
            <div class="sector-mini-card ${selectedCat === s.id ? "active" : ""}" onclick="GrowthApp.selectCategory('${s.id}')">
              <div style="color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.icon} ${s.name}</div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:2px;">
                <strong style="color:#f8fafc;font-size:12px;">${s.count}本</strong>
                <span style="color:#fbbf24;font-size:10.5px;">吸收 ${s.pct}%</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- 全书库跨书知识检索栏（不重绘 input，完美兼容中文输入法） -->
      <div class="global-search-bar">
        <div style="display:flex;gap:8px;">
          <input id="global-search-input" type="text" class="form-input"
                 placeholder="🔎 全书库跨书检索概念/指标/案例（如：自由现金流、ROE、银行、安全边际...）"
                 value="${this.escapeHtml(this.globalSearch)}"
                 oncompositionstart="GrowthApp.isComposing=true"
                 oncompositionend="GrowthApp.isComposing=false;GrowthApp.onGlobalSearch(this.value)"
                 oninput="if(!GrowthApp.isComposing)GrowthApp.onGlobalSearch(this.value)" />
          <button id="global-search-clear-btn" class="btn btn-outline"
                  style="flex:0 0 auto;white-space:nowrap;display:${this.globalSearch.trim() ? "inline-block" : "none"};"
                  onclick="GrowthApp.clearGlobalSearch()">清空</button>
        </div>
      </div>

      <div id="global-search-results-container">
        ${this.renderGlobalSearchResultsHtml()}
      </div>

      <!-- 赛道分类筛选胶囊 -->
      <div class="category-pills">
        ${window.GROWTH_CATEGORIES.map(cat => `
          <button class="cat-pill ${selectedCat === cat.id ? "active" : ""}"
                  onclick="GrowthApp.selectCategory('${cat.id}')">
            ${cat.icon} ${cat.name}
          </button>
        `).join("")}
      </div>

      <!-- 书籍持仓卡片列表 -->
      <div class="books-grid">
        ${filteredBooks.map(book => {
          const prog = window.GrowthStore.getBookProgress(book.id);
          const posInfo = window.POSITION_LEVELS[book.positionType] || window.POSITION_LEVELS.watch;
          const isCurrent = book.id === activeBook.id;
          const isCustom = String(book.id).startsWith("custom-book-");
          return `
            <div class="book-card ${isCurrent ? "active-holding" : ""}">
              <div>
                <div class="book-card-header">
                  <div class="book-cover-mini" style="background:${book.coverColor || "#1e293b"}">
                    ${book.coverIcon || "📘"}
                  </div>
                  <div class="book-meta">
                    <div class="book-badges">
                      <select class="pos-select-mini ${posInfo.badgeClass}"
                              title="点击调整本书持仓等级"
                              onchange="GrowthApp.onChangeBookPosition('${this.escapeHtml(book.id)}', this.value)">
                        <option value="core" ${book.positionType === "core" ? "selected" : ""}>🏰 核心重仓 ▾</option>
                        <option value="active" ${book.positionType === "active" ? "selected" : ""}>⚡ 建仓速读 ▾</option>
                        <option value="watch" ${book.positionType === "watch" ? "selected" : ""}>👀 观察池 ▾</option>
                      </select>
                      <span class="badge badge-speed">⚡ ${book.speedReadMinutes || 45}分钟速读</span>
                      ${isCustom ? `
                        <button class="btn-outline" style="padding:1px 6px;font-size:11px;border-radius:6px;color:var(--neg-red);margin-left:auto;"
                                onclick="GrowthApp.onDeleteCustomBook('${this.escapeHtml(book.id)}', '${this.escapeHtml(book.title)}')">删除</button>
                      ` : ""}
                    </div>
                    <div class="book-title">《${this.escapeHtml(book.title)}》</div>
                    <div class="book-author">${this.escapeHtml(book.author)} ${book.wordCount ? `· ${this.escapeHtml(book.wordCount)}` : ""}</div>
                  </div>
                </div>

                <div class="book-question-box">
                  <strong>核心命题：</strong>${this.escapeHtml(book.coreQuestion)}
                </div>
              </div>

              <div>
                <div class="book-progress-row">
                  <div class="progress-label-row">
                    <span>章节精读 ${prog.readCount}/${prog.totalChapters} · 自检通关 ${prog.cpCount}/${prog.totalCp}</span>
                    <strong style="color:var(--gold-dark)">吸收率 ${prog.percent}%</strong>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width:${prog.percent}%"></div>
                  </div>
                </div>

                <div class="book-actions">
                  <button class="btn btn-primary" onclick="GrowthApp.switchTab('reader', { bookId: '${this.escapeHtml(book.id)}', subTab: 'roadmap' })">
                    ⚡ 三阶极速读法
                  </button>
                  <button class="btn btn-outline" onclick="GrowthApp.switchTab('reader', { bookId: '${this.escapeHtml(book.id)}', subTab: 'chapters' })">
                    📑 逐章精读 (${(book.chapters || []).length})
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- 底部多书扩展与备份说明卡 -->
      <div class="section-card" style="margin-top:16px;">
        <div class="section-title">
          <span>🧱 模块化多书架构 & 本地资产安全备份</span>
          <div style="display:flex;gap:6px;">
            <button class="btn-outline" style="padding:4px 10px;border-radius:16px;font-size:12px;cursor:pointer;" onclick="GrowthApp.openBackupModal()">📦 导出/恢复备份</button>
            <button class="btn-top gold" onclick="GrowthApp.openNewBookModal()">＋ 新书建仓</button>
          </div>
        </div>
        <p style="font-size:12.5px;color:var(--text-secondary);">
          本系统采用<strong>「标准认知资产 Schema + 独立书籍数据包」</strong>设计。新书 <code>.epub</code> 放入当前项目目录即可拆解入库；建议定期点击右上角<strong>「📦 备份」</strong>导出学习进度与持仓体检报告，跨手机/电脑随时同步。
        </p>
      </div>
    `;
  },

  renderGlobalSearchResultsHtml() {
    const q = this.globalSearch.trim().toLowerCase();
    if (!q) return "";
    const books = window.GrowthStore.getAllBooks();
    const hits = [];

    books.forEach(book => {
      (book.chapters || []).forEach(ch => {
        const hay = [
          ch.num,
          ch.title,
          ch.thesis,
          ch.howToRead,
          ...(ch.keyPoints || []),
          ...(ch.maxims || []),
          ...(ch.cases || []).map(c => c.name + " " + c.desc)
        ].join(" ");
        if (hay.toLowerCase().includes(q)) {
          // 提取第一条命中的要点或精髓预览
          const matchedPoint =
            (ch.keyPoints || []).find(kp => kp.toLowerCase().includes(q)) ||
            (ch.maxims || []).find(m => m.toLowerCase().includes(q)) ||
            ch.thesis ||
            "";
          hits.push({
            bookId: book.id,
            bookTitle: book.title,
            coverIcon: book.coverIcon || "📘",
            chapterNum: ch.num,
            chapterTitle: ch.title,
            priority: ch.priority || "P1",
            snippet: matchedPoint
          });
        }
      });
    });

    if (hits.length === 0) {
      return `
        <div class="section-card global-search-results" style="text-align:center;padding:18px;color:var(--text-secondary);">
          全书库中暂未找到包含「<strong>${this.escapeHtml(this.globalSearch.trim())}</strong>」的章节内容
        </div>
      `;
    }

    return `
      <div class="section-card global-search-results">
        <div class="section-title">
          <span>🔎 全书库跨书检索结果（共命中 ${hits.length} 个章节）</span>
          <span style="font-size:11.5px;color:var(--text-secondary);font-weight:500;">点击直达对应原书章节</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;">
          ${hits.slice(0, 30).map(h => `
            <div style="padding:10px 12px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-subtle);cursor:pointer;"
                 onclick="GrowthApp.jumpToChapter('${this.escapeHtml(h.bookId)}', '${this.escapeHtml(h.chapterNum)}')">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:4px;">
                <strong style="font-size:13px;color:var(--gold-dark);">${h.coverIcon} 《${this.escapeHtml(h.bookTitle)}》 · ${this.escapeHtml(h.chapterNum)} ${this.escapeHtml(h.chapterTitle)}</strong>
                <span class="priority-tag priority-${h.priority}" style="flex-shrink:0;">${h.priority}</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${this.escapeHtml(h.snippet)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  onGlobalSearch(val) {
    this.globalSearch = val;
    const container = document.getElementById("global-search-results-container");
    if (container) {
      container.innerHTML = this.renderGlobalSearchResultsHtml();
    }
    const clearBtn = document.getElementById("global-search-clear-btn");
    if (clearBtn) {
      clearBtn.style.display = val.trim() ? "inline-block" : "none";
    }
  },

  clearGlobalSearch() {
    this.globalSearch = "";
    const input = document.getElementById("global-search-input");
    if (input) input.value = "";
    this.onGlobalSearch("");
  },

  onChangeBookPosition(bookId, posType) {
    window.GrowthStore.setBookPosition(bookId, posType);
    this.renderAll();
    this.showToast("✓ 已更新书籍持仓等级");
  },

  onDeleteCustomBook(bookId, title) {
    if (!confirm(`确定要从书库中移除自建书籍《${title}》吗？`)) return;
    window.GrowthStore.deleteCustomBook(bookId);
    this.renderAll();
    this.showToast(`已移除《${title}》`);
  },

  selectCategory(catId) {
    const cur = window.GrowthStore.state.selectedCategory;
    window.GrowthStore.state.selectedCategory = (cur === catId && catId !== "all") ? "all" : catId;
    window.GrowthStore.save();
    this.renderMainContent();
  },

  // ==================== TAB 2: 极速拆书视图 ====================
  renderReaderView() {
    const book = window.GrowthStore.getActiveBook();
    const hasIndustryTable = book.industryMoatTable && book.industryMoatTable.length > 0;

    return `
      <!-- 顶部子导航 -->
      <div class="sub-tabs">
        <button class="sub-tab-btn ${this.readerSubTab === "roadmap" ? "active" : ""}"
                onclick="GrowthApp.setReaderSubTab('roadmap')">
          ⚡ ${book.speedReadMinutes || 45}分钟速读法
        </button>
        <button class="sub-tab-btn ${this.readerSubTab === "chapters" ? "active" : ""}"
                onclick="GrowthApp.setReaderSubTab('chapters')">
          📑 全书逐章精读 (${(book.chapters || []).length})
        </button>
        ${hasIndustryTable ? `
          <button class="sub-tab-btn ${this.readerSubTab === "industry" ? "active" : ""}"
                  onclick="GrowthApp.setReaderSubTab('industry')">
            ${(book.extraTableMeta && book.extraTableMeta.tabLabel) || "🗺️ 专题数据表"}
          </button>
        ` : ""}
      </div>

      ${this.readerSubTab === "roadmap" ? this.renderRoadmapSubView(book) : ""}
      ${this.readerSubTab === "chapters" ? this.renderChaptersSubView(book) : ""}
      ${this.readerSubTab === "industry" ? this.renderIndustrySubView(book) : ""}
    `;
  },

  setReaderSubTab(subTab) {
    this.readerSubTab = subTab;
    this.renderMainContent();
  },

  renderRoadmapSubView(book) {
    const guide = book.speedReadGuide || { passes: [], checkpoints: [] };
    const cpMap = window.GrowthStore.state.completedCheckpoints[book.id] || {};
    const prog = window.GrowthStore.getBookProgress(book.id);

    return `
      <!-- 专注速读倒计时器 -->
      <div class="timer-banner">
        <div>
          <div style="font-size:12px;color:#cbd5e1;">⏱️ 《${this.escapeHtml(book.title)}》极速通关计时器</div>
          <div style="font-size:11px;color:#94a3b8;">按三阶配速拒绝拖延，先抓骨架再啃核心</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span id="speed-timer-display" class="timer-display">${this.formatTime(this.timerSeconds)}</span>
          <button class="btn-top gold" onclick="GrowthApp.toggleTimer()">
            ${this.timerRunning ? "⏸ 暂停" : "▶ 开始速读"}
          </button>
          <button class="btn-top" onclick="GrowthApp.resetTimer()">重置</button>
        </div>
      </div>

      <!-- 为什么这本书能快速读完？ -->
      <div class="section-card">
        <div class="section-title">
          <span>🔑 如何快速读透《${this.escapeHtml(book.title)}》？</span>
          <span class="badge badge-core">${this.escapeHtml(book.wordCount || "")}</span>
        </div>
        <div class="chapter-thesis" style="margin-bottom:12px;">
          💡 <strong>拆书洞察：</strong>${guide.structuralSecret || this.escapeHtml(book.coreQuestion)}
        </div>

        <!-- 全书核心逻辑闭环 -->
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-main);">
          📐 全书底层逻辑公式（4步闭环）：
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:14px;">
          ${(book.coreFormula || []).map(f => `
            <div style="background:var(--bg-subtle);padding:10px 12px;border-radius:8px;border:1px solid var(--border-color);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;gap:8px;">
                <strong style="font-size:13px;color:var(--gold-dark);">${f.step}：${f.title}</strong>
                <span style="font-size:11px;color:var(--text-secondary);white-space:nowrap;">${f.chapters}</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);">${f.detail}</div>
            </div>
          `).join("")}
        </div>

        <!-- 三阶速读实操步骤 -->
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-main);">
          🚀 三阶极速阅读路线图（照着做，${book.speedReadMinutes || 45}分钟读完）：
        </div>
        ${(guide.passes || []).map(p => `
          <div class="pass-card">
            <div class="pass-header">
              <span class="pass-name">${p.order} · ${p.name}</span>
              <span class="pass-badge">⏱️ ${p.duration}</span>
            </div>
            <div style="font-size:12px;color:var(--gold-dark);margin-bottom:6px;font-weight:600;">
              策略：${p.strategy}
            </div>
            <ul class="pass-list">
              ${(p.actions || []).map(act => `<li>${act}</li>`).join("")}
            </ul>
          </div>
        `).join("")}

        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="GrowthApp.setReaderSubTab('chapters')">
            📑 进入逐章精读（按 P0/P1/P2 优先级）
          </button>
          <button class="btn btn-outline" onclick="GrowthApp.openBookFlashcards('${this.escapeHtml(book.id)}')">
            🌱 速刷本书「${book.maximLabel || "核心箴言"}」闪卡
          </button>
        </div>
      </div>

      <!-- 交互式通关自检清单 -->
      <div class="section-card">
        <div class="section-title">
          <span>✅ 速读通关自检清单（勾选点亮认知吸收率）</span>
          <span style="font-size:12px;color:var(--pos-green);font-weight:700;">已掌握 ${prog.cpCount}/${prog.totalCp}</span>
        </div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">
          读完一本书真正的标准不是“翻过了每一页”，而是能否自信地勾选以下核心认知检验点：
        </p>
        ${(guide.checkpoints || []).map(cp => {
          const done = !!cpMap[cp.id];
          return `
            <div class="checkpoint-item ${done ? "done" : ""}"
                 onclick="GrowthApp.onToggleCheckpoint('${this.escapeHtml(book.id)}', '${this.escapeHtml(cp.id)}')">
              <div class="checkpoint-box">${done ? "✓" : ""}</div>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--text-main);">${cp.title}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${cp.question}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  onToggleCheckpoint(bookId, cpId) {
    window.GrowthStore.toggleCheckpoint(bookId, cpId);
    this.renderAll();
  },

  openBookFlashcards(bookId) {
    if (bookId) window.GrowthStore.setActiveBook(bookId);
    this.maximBookScope = "active";
    this.randomMaximIndex = 0;
    this.switchTab("flashcards");
  },

  getPriorityLabelsForBook(book) {
    if (book && book.priorityLabels) return book.priorityLabels;
    return {
      P0: "★ P0 核心必读（决定性底层框架）",
      P1: "◆ P1 实战闭环（方法论与案例应用）",
      P2: "○ P2 观念校准（快速浏览即可）"
    };
  },

  renderChaptersSubView(book) {
    const chapters = book.chapters || [];
    const readMap = window.GrowthStore.state.readChapters[book.id] || {};
    const p0Count = chapters.filter(c => c.priority === "P0").length;
    const p1Count = chapters.filter(c => c.priority === "P1").length;
    const p2Count = chapters.filter(c => c.priority === "P2").length;
    const unreadCount = chapters.filter(c => !readMap[c.num]).length;

    return `
      <!-- 章节优先级过滤器与搜索栏（局部刷新列表，彻底解决中文拼音打字断词 Bug） -->
      <div class="section-card" style="padding:12px 14px;">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
          <button class="cat-pill ${this.chapterFilter === "ALL" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('ALL')">
            全部 (${chapters.length})
          </button>
          <button class="cat-pill ${this.chapterFilter === "UNREAD" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('UNREAD')">
            📖 未读 (${unreadCount})
          </button>
          <button class="cat-pill ${this.chapterFilter === "P0" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('P0')">
            ★ P0 必读 (${p0Count})
          </button>
          <button class="cat-pill ${this.chapterFilter === "P1" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('P1')">
            ◆ P1 实战 (${p1Count})
          </button>
          <button class="cat-pill ${this.chapterFilter === "P2" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('P2')">
            ○ P2 校准 (${p2Count})
          </button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input id="chapter-search-input" type="text" class="form-input" style="flex:1;min-width:180px;"
                 placeholder="🔍 在《${this.escapeHtml(book.title)}》中搜索关键词（支持中文词组流畅输入）"
                 value="${this.escapeHtml(this.chapterSearch)}"
                 oncompositionstart="GrowthApp.isComposing=true"
                 oncompositionend="GrowthApp.isComposing=false;GrowthApp.onSearchChapter(this.value)"
                 oninput="if(!GrowthApp.isComposing)GrowthApp.onSearchChapter(this.value)" />
          <button class="btn btn-outline" style="flex:0 0 auto;white-space:nowrap;"
                  onclick="GrowthApp.toggleCollapseAllChapters('${this.escapeHtml(book.id)}')">
            ${this.allChaptersCollapsed ? "📂 展开全部" : "📁 目录速览"}
          </button>
          <button class="btn btn-outline" style="flex:0 0 auto;white-space:nowrap;"
                  onclick="GrowthApp.markAllRead('${this.escapeHtml(book.id)}')">
            ✓ 全部已读
          </button>
        </div>
      </div>

      <!-- 独立章节列表容器 -->
      <div id="chapters-list-container">
        ${this.renderChaptersListHtml(book)}
      </div>
    `;
  },

  renderChaptersListHtml(book) {
    const chapters = book.chapters || [];
    const readMap = window.GrowthStore.state.readChapters[book.id] || {};
    const bookNotes = window.GrowthStore.state.bookNotes[book.id] || [];
    const priorityLabels = this.getPriorityLabelsForBook(book);

    const filtered = chapters.filter(ch => {
      if (this.chapterFilter === "UNREAD" && readMap[ch.num]) return false;
      if (this.chapterFilter !== "ALL" && this.chapterFilter !== "UNREAD" && ch.priority !== this.chapterFilter) {
        return false;
      }
      if (!this.chapterSearch.trim()) return true;
      const q = this.chapterSearch.trim().toLowerCase();
      const hay = [
        ch.num, ch.title, ch.thesis, ch.howToRead,
        ...(ch.keyPoints || []),
        ...(ch.maxims || []),
        ...(ch.cases || []).map(c => c.name + " " + c.desc)
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    if (filtered.length === 0) {
      return `
        <div class="section-card" style="text-align:center;padding:28px 16px;color:var(--text-secondary);">
          <div style="font-size:24px;margin-bottom:6px;">🔍</div>
          <div style="font-size:13.5px;font-weight:700;color:var(--text-main);margin-bottom:4px;">当前筛选或搜索条件下暂无匹配章节</div>
          <div style="font-size:12px;margin-bottom:12px;">可尝试切换优先级标签或清空搜索关键词</div>
          <button class="btn btn-outline" style="max-width:160px;margin:0 auto;" onclick="GrowthApp.resetChapterFilter()">重置筛选条件</button>
        </div>
      `;
    }

    return filtered.map((ch, idx) => {
      const isRead = !!readMap[ch.num];
      const collapseKey = `${book.id}__${ch.num}`;
      const isCollapsed = this.collapsedChapters[collapseKey] !== undefined
        ? this.collapsedChapters[collapseKey]
        : this.allChaptersCollapsed;
      const chNotes = bookNotes.filter(n => n.chapterNum === ch.num);

      return `
        <div class="chapter-card ${isRead ? "is-read" : ""} ${isCollapsed ? "collapsed" : ""}"
             data-chapter-num="${this.escapeHtml(ch.num)}">
          <div class="chapter-top">
            <div style="cursor:pointer;flex:1;" onclick="GrowthApp.toggleSingleChapterCollapse('${this.escapeHtml(book.id)}', '${this.escapeHtml(ch.num)}')">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                <span class="priority-tag priority-${ch.priority || "P1"}">
                  ${priorityLabels[ch.priority] || ch.priority}
                </span>
                <span class="badge badge-watch">⏱️ 建议速读 ${ch.estMinutes || 3} 分钟</span>
                <span style="font-size:11px;color:var(--text-muted);">${isCollapsed ? "▶ 点击展开详情" : "▼ 点击收起"}</span>
              </div>
              <h3 style="font-size:15.5px;font-weight:800;color:var(--text-main);">
                ${this.escapeHtml(ch.num)} · ${this.escapeHtml(ch.title)}
              </h3>
            </div>
            <button class="btn ${isRead ? "btn-primary" : "btn-outline"}"
                    style="flex:0 0 auto;padding:5px 10px;font-size:12px;"
                    onclick="GrowthApp.onToggleChapterRead('${this.escapeHtml(book.id)}', '${this.escapeHtml(ch.num)}')">
              ${isRead ? "✓ 已读透" : "标记已读"}
            </button>
          </div>

          <div class="chapter-thesis">
            🎯 <strong>本章一句话精髓：</strong>${ch.thesis}
          </div>

          <div class="chapter-body">
            <div class="how-to-read-box">
              ⚡ <strong>极速读法指导：</strong>${ch.howToRead}
            </div>

            <ul class="keypoints-list">
              ${(ch.keyPoints || []).map(kp => `<li>${kp}</li>`).join("")}
            </ul>

            ${(ch.cases && ch.cases.length > 0) ? `
              <div class="cases-box">
                ${ch.cases.map(c => `
                  <div class="case-item ${c.type === "pos" ? "case-pos" : "case-neg"}">
                    <strong>${c.type === "pos" ? "✅ 正面标杆案例" : "⚠️ 反面陷阱案例"} · ${c.name}：</strong>
                    ${c.desc}
                  </div>
                `).join("")}
              </div>
            ` : ""}

            ${(ch.maxims && ch.maxims.length > 0) ? `
              <div style="border-top:1px dashed var(--border-color);padding-top:8px;margin-top:8px;">
                <div style="font-size:11.5px;font-weight:700;color:var(--gold-dark);">📌 本章「${book.maximLabel || "核心箴言"}」：</div>
                ${ch.maxims.map((m, mIdx) => `
                  <div class="maxim-quote">“${mIdx + 1}. ${m}”</div>
                `).join("")}
              </div>
            ` : ""}

            <!-- 随章即兴感悟笔记区 -->
            <div style="border-top:1px dashed var(--border-color);padding-top:10px;margin-top:10px;">
              ${chNotes.map(n => `
                <div style="background:var(--bg-subtle);padding:7px 10px;border-radius:7px;margin-bottom:6px;font-size:12px;display:flex;justify-content:space-between;gap:8px;">
                  <div><strong style="color:var(--gold-dark);">✍️ 本章笔记 (${n.date})：</strong>${this.escapeHtml(n.content)}</div>
                  <span style="color:var(--text-muted);cursor:pointer;white-space:nowrap;" onclick="GrowthApp.deleteChapterNote('${this.escapeHtml(book.id)}', '${this.escapeHtml(n.id)}')">删除</span>
                </div>
              `).join("")}
              <div style="display:flex;gap:6px;">
                <input id="ch-note-input-${idx}" type="text" class="form-input" style="padding:6px 10px;font-size:12.5px;"
                       placeholder="✍️ 随手记下读完「${this.escapeHtml(ch.num)}」的启发或持仓印证..." />
                <button class="btn btn-outline" style="flex:0 0 auto;padding:5px 10px;font-size:12px;white-space:nowrap;"
                        onclick="GrowthApp.addChapterQuickNote('${this.escapeHtml(book.id)}', '${this.escapeHtml(ch.num)}', 'ch-note-input-${idx}')">
                  ＋ 记一笔
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  toggleSingleChapterCollapse(bookId, chNum) {
    const key = `${bookId}__${chNum}`;
    const current = this.collapsedChapters[key] !== undefined
      ? this.collapsedChapters[key]
      : this.allChaptersCollapsed;
    this.collapsedChapters[key] = !current;
    const listContainer = document.getElementById("chapters-list-container");
    if (listContainer) {
      listContainer.innerHTML = this.renderChaptersListHtml(window.GrowthStore.getBookById(bookId));
    }
  },

  toggleCollapseAllChapters(bookId) {
    this.allChaptersCollapsed = !this.allChaptersCollapsed;
    const book = window.GrowthStore.getBookById(bookId);
    (book.chapters || []).forEach(ch => {
      delete this.collapsedChapters[`${bookId}__${ch.num}`];
    });
    this.renderMainContent();
  },

  addChapterQuickNote(bookId, chNum, inputId) {
    const input = document.getElementById(inputId);
    const val = (input?.value || "").trim();
    if (!val) return;
    window.GrowthStore.addNote(bookId, `${chNum} 精读感悟`, val, chNum);
    const listContainer = document.getElementById("chapters-list-container");
    if (listContainer) {
      listContainer.innerHTML = this.renderChaptersListHtml(window.GrowthStore.getBookById(bookId));
    }
    this.showToast(`✓ 已保存「${chNum}」读书笔记`);
  },

  deleteChapterNote(bookId, noteId) {
    window.GrowthStore.deleteNote(bookId, noteId);
    const listContainer = document.getElementById("chapters-list-container");
    if (listContainer) {
      listContainer.innerHTML = this.renderChaptersListHtml(window.GrowthStore.getBookById(bookId));
    }
  },

  setChapterFilter(f) {
    this.chapterFilter = f;
    this.renderMainContent();
  },

  resetChapterFilter() {
    this.chapterFilter = "ALL";
    this.chapterSearch = "";
    this.renderMainContent();
  },

  onSearchChapter(val) {
    this.chapterSearch = val;
    const book = window.GrowthStore.getActiveBook();
    const listContainer = document.getElementById("chapters-list-container");
    if (listContainer && book) {
      listContainer.innerHTML = this.renderChaptersListHtml(book);
    }
  },

  onToggleChapterRead(bookId, chNum) {
    const scrollY = window.scrollY;
    window.GrowthStore.toggleChapterRead(bookId, chNum);
    this.renderAll();
    window.scrollTo(0, scrollY);
  },

  markAllRead(bookId) {
    window.GrowthStore.markAllChaptersRead(bookId, true);
    this.renderAll();
    this.showToast("🎉 已将本书全部章节标记为已读！");
  },

  renderIndustrySubView(book) {
    const rows = [...(book.industryMoatTable || [])];
    const meta = book.extraTableMeta || {};
    if (this.industrySort === "wide") {
      rows.sort((a, b) => b.wide - a.wide || b.total - a.total);
    } else {
      rows.sort((a, b) => b.total - a.total || b.wide - a.wide);
    }

    return `
      <div class="section-card">
        <div class="section-title">
          <span>${meta.title || `🗺️ 《${this.escapeHtml(book.title)}》核心数据分布全景`}</span>
          <div style="display:flex;gap:6px;">
            <button class="cat-pill ${this.industrySort === "wide" ? "active" : ""}"
                    onclick="GrowthApp.setIndustrySort('wide')">按宽护城河%排序</button>
            <button class="cat-pill ${this.industrySort === "total" ? "active" : ""}"
                    onclick="GrowthApp.setIndustrySort('total')">按总护城河%排序</button>
          </div>
        </div>
        ${meta.desc ? `
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:12px;">
            ${meta.desc}
          </p>
        ` : ""}

        <div style="display:flex;gap:14px;font-size:12px;margin-bottom:10px;flex-wrap:wrap;">
          <span><strong style="color:#d97706;">■</strong> 宽护城河占比 (%)</span>
          <span><strong style="color:#3b82f6;">■</strong> 窄护城河占比 (%)</span>
          <span><strong style="color:#cbd5e1;">■</strong> 无护城河 (%)</span>
        </div>

        ${rows.map(r => `
          <div class="industry-row">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">
              <strong>${r.industry}</strong>
              <span style="white-space:nowrap;">
                <strong style="color:#d97706;">宽 ${r.wide}%</strong> +
                <span style="color:#2563eb;">窄 ${r.narrow}%</span> =
                <strong>合计 ${r.total}%</strong>
              </span>
            </div>
            <div class="industry-bar-wrap">
              <div class="bar-wide" style="width:${r.wide}%"></div>
              <div class="bar-narrow" style="width:${r.narrow}%"></div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);">💡 ${r.note}</div>
          </div>
        `).join("")}
      </div>
    `;
  },

  setIndustrySort(s) {
    this.industrySort = s;
    this.renderMainContent();
  },

  // ==================== TAB 3: 六步全书库合流投研体检仪（支持编辑更新） ====================
  renderEvaluatorView() {
    const evals = window.GrowthStore.state.stockEvaluations || [];
    const editingItem = this.editingEvalId ? window.GrowthStore.getStockEvaluationById(this.editingEvalId) : null;

    return `
      <div id="evaluator-form-card" class="section-card">
        <div class="section-title">
          <span>⚖️ 全书库六步投研体检 & 估值决策仪</span>
          <span class="badge badge-core">v2.5 七书模型大合流</span>
        </div>

        ${editingItem ? `
          <div class="edit-mode-banner">
            <span>✏️ 正在编辑复盘：<strong>${this.escapeHtml(editingItem.name)}</strong> ${editingItem.ticker ? `(${this.escapeHtml(editingItem.ticker)})` : ""}</span>
            <button class="btn btn-outline" style="flex:0 0 auto;padding:4px 10px;font-size:12px;" onclick="GrowthApp.cancelEditEvaluation()">取消编辑</button>
          </div>
        ` : `
          <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px;">
            融合<strong>多尔西10分钟测试与护城河</strong>、<strong>《股市真规则》财务造假六面红旗</strong>、<strong>老唐三年五折法</strong>、<strong>格雷厄姆乘数</strong>与<strong>芒格逆向误判清单</strong>，支持随时回填编辑更新：
          </p>
        `}

        <!-- 步骤 0：标的基本信息 -->
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;" class="form-group">
          <div>
            <label class="form-label">股票名称 / 持仓标的</label>
            <input id="eval-name" class="form-input" placeholder="例如：贵州茅台 / 腾讯控股 / 美的集团" />
          </div>
          <div>
            <label class="form-label">股票代码</label>
            <input id="eval-ticker" class="form-input" placeholder="如 600519 / 00700" />
          </div>
        </div>

        <!-- 步骤 1：10分钟选股测试与历史资本回报率 -->
        <div class="form-group">
          <label class="form-label">步骤 1：《股市真规则》10分钟测试（长期 ROE≥15% / ROA>7% / FCF占营收>5%？）</label>
          <select id="eval-roic-pass" class="form-select">
            <option value="yes">✅ 优等通过：长期 ROE≥15%（或高ROIC）、自由现金流充沛，非高杠杆硬撑</option>
            <option value="turnaround">🔄 结构反转：历史回报一般，但已剥离亏损资产或重签高价长协（如阿奇煤炭）</option>
            <option value="no">❌ 未通过：资本回报率平庸或长期烧钱无自由现金流（判定无护城河）</option>
          </select>
          <input id="eval-roic-note" class="form-input" style="margin-top:6px;"
                 placeholder="补充财务备注（如：近5年平均ROE 24%，FCF/营收 18%，账面净现金充沛）" />
        </div>

        <!-- 步骤 2：五大真护城河识别 -->
        <div class="form-group">
          <label class="form-label">步骤 2：定性识别结构性竞争优势（可多选，切勿把“好产品/高市占率/明星CEO”当护城河）</label>
          <div class="checkbox-grid">
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="intangible" />
              <span><strong>① 无形资产</strong>：具备提价权的品牌（非仅知名度）、多元专利群、或准入严且不限价的牌照许可</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="switching" />
              <span><strong>② 高转换成本</strong>：深度嵌入客户工作流、高昂的数据迁移/重新培训成本、或零容忍故障风险</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="network" />
              <span><strong>③ 封闭网络效应</strong>：新用户使老用户价值非线性暴增，且网络对竞争对手封闭</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="cost" />
              <span><strong>④ 结构性成本优势</strong>：无法复制的地理位置半径垄断或独特低成本资源（非易模仿流程）</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="scale" />
              <span><strong>⑤ 规模与利基垄断</strong>：高密度配送网、巨额固定成本分摊、或“小池塘大鱼”</span>
            </label>
          </div>
          <input id="eval-moat-detail" class="form-input" style="margin-top:6px;"
                 placeholder="一句话写下它最核心的护城河证据（如：提价10%客户不流失 / 替换系统需停工重训）" />
        </div>

        <!-- 步骤 3：财务造假「六面红旗」 & 护城河侵蚀排雷 -->
        <div class="form-group">
          <label class="form-label">🚩 步骤 3：《股市真规则》财务粉饰「六面红旗」 & 护城河侵蚀排雷（如有请勾选）</label>
          <div class="checkbox-grid">
            <label class="check-pill danger-pill">
              <input type="checkbox" name="eval-redflag" value="cashflow_diverge" />
              <span>🚩 <strong>红旗1 · 现金流背离</strong>：净利润节节攀升，但经营活动现金流净额持续下滑或为负</span>
            </label>
            <label class="check-pill danger-pill">
              <input type="checkbox" name="eval-redflag" value="ar_spike" />
              <span>🚩 <strong>红旗2 · 塞货压库</strong>：应收账款或存货增速显著快于营业收入增速，或坏账计提比例反常下降</span>
            </label>
            <label class="check-pill danger-pill">
              <input type="checkbox" name="eval-redflag" value="oneoff_charge" />
              <span>🚩 <strong>红旗3 · 洗大澡成瘾</strong>：每隔一两年就计提所谓“一次性重组费用/减值”掩盖日常经营亏损</span>
            </label>
            <label class="check-pill danger-pill">
              <input type="checkbox" name="eval-redflag" value="serial_ma" />
              <span>🚩 <strong>红旗4 · 并购与治理异动</strong>：靠连环收购拼凑增长留巨额商誉、CFO突然辞职、或每年滥发期权超总股本2%</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-erosion" value="tech" />
              <span>⚠️ <strong>护城河侵蚀 · 技术颠覆或行业恶化</strong>：跨界新技术替代主业，或下游集采/渠道寡头集中压价</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-erosion" value="pricing" />
              <span>⚠️ <strong>护城河侵蚀 · 提价受阻或盲目跨界</strong>：客户开始对提价说“不”，或管理层把钱砸向陌生无护城河亏损副业</span>
            </label>
          </div>
        </div>

        <!-- 步骤 4：三大经典估值工具实时测算器 -->
        <div class="form-group" style="background:var(--bg-subtle);padding:12px;border-radius:10px;border:1px solid var(--border-color);">
          <label class="form-label">📐 步骤 4：三大经典估值工具实时测算（数据随档案自动保存）</label>
          <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:8px;">
            ① <strong>多尔西现金回报率</strong> = <code>(自由现金流 + 净利息) ÷ 企业价值(市值 + 长债 - 现金)</code>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">
            <input id="cr-mcap" type="number" step="any" class="form-input" placeholder="当前市值(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="cr-debt" type="number" step="any" class="form-input" placeholder="长期有息债(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="cr-cash" type="number" step="any" class="form-input" placeholder="账面现金(亿)" oninput="GrowthApp.calcCashReturn()" />
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-items:center;margin-bottom:10px;">
            <input id="cr-fcf" type="number" step="any" class="form-input" placeholder="年自由现金流(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="cr-int" type="number" step="any" class="form-input" placeholder="净利息(选填0)" oninput="GrowthApp.calcCashReturn()" />
            <div id="cr-result-box" style="font-size:12.5px;font-weight:800;color:var(--gold-dark);text-align:center;">
              现金回报率: --%
            </div>
          </div>

          <div style="border-top:1px dashed var(--border-color);padding-top:8px;margin-top:4px;font-size:11.5px;color:var(--text-secondary);margin-bottom:6px;">
            ② <strong>老唐估值法</strong>（3年后合理利润×25倍PE的5折买点） & ③ <strong>格雷厄姆乘数</strong>（PE×PB ≤ 22.5）
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-items:center;margin-bottom:6px;">
            <input id="lt-profit3y" type="number" step="any" class="form-input" placeholder="3年后预估净利(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="bg-pe" type="number" step="any" class="form-input" placeholder="当前市盈率 PE" oninput="GrowthApp.calcCashReturn()" />
            <input id="bg-pb" type="number" step="any" class="form-input" placeholder="当前市净率 PB" oninput="GrowthApp.calcCashReturn()" />
          </div>
          <div id="lt-bg-result-box" style="font-size:12px;font-weight:700;color:var(--navy-accent);background:var(--bg-card);padding:7px 10px;border-radius:6px;border:1px solid var(--border-color);">
            💡 输入上方参数自动计算：老唐理想买点市值 -- 亿 | 格雷厄姆 PE×PB = --
          </div>

          <select id="eval-val-status" class="form-select" style="margin-top:8px;">
            <option value="undervalued">🟢 显著低估（具备充足安全边际，进入击球区买点）</option>
            <option value="fair" selected>🟡 估值合理（可长期持有赚取企业内生ROIC复利）</option>
            <option value="overvalued">🔴 明显高估（警惕负向投机收益/杀估值风险）</option>
          </select>
        </div>

        <!-- 步骤 5：查理·芒格《穷查理宝典》逆向思考与心理误判防呆清单 -->
        <div class="form-group">
          <label class="form-label">🌱 步骤 5：查理·芒格「逆向思考」与《人类误判心理学》盲点自检</label>
          <input id="eval-invert-note" class="form-input" style="margin-bottom:8px;"
                 placeholder="🔄 反过来想：未来3年发生什么事会让这笔投资惨败？（写清死穴才能避开死穴）" />
          <div class="checkbox-grid">
            <label class="check-pill munger-pill">
              <input type="checkbox" name="eval-munger-bias" value="social_proof" />
              <span>🧠 警惕「社会认同倾向」：我是不是因为近期股价暴涨、周围人都在热议而心痒追高？</span>
            </label>
            <label class="check-pill munger-pill">
              <input type="checkbox" name="eval-munger-bias" value="inconsistency" />
              <span>🧠 警惕「避免不一致性」：我是不是因为被套牢不甘心认错，而在基本面恶化时盲目摊平补仓？</span>
            </label>
            <label class="check-pill munger-pill">
              <input type="checkbox" name="eval-munger-bias" value="incentive" />
              <span>🧠 警惕「激励超级反应」：我的买入逻辑是否轻信了利益相关方（如卖方研报、管理层画饼）？</span>
            </label>
          </div>
        </div>

        <!-- 步骤 6：第14章 卖出四原则核查 -->
        <div class="form-group">
          <label class="form-label">步骤 6：第14章「何时出手」——卖出四原则核查（全否=坐等复利）</label>
          <div class="checkbox-grid">
            <label class="check-pill">
              <input type="checkbox" name="eval-sell" value="mistake" />
              <span>1. 我当初分析公司时是否犯了逻辑错误（买入理由已不存在）？</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-sell" value="deteriorate" />
              <span>2. 公司经营基本面与护城河是否已出现永久性（非暂时性）恶化？</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-sell" value="better" />
              <span>3. 我的资金是否遇到了显著更便宜、风险收益比更高的绝佳替代标的？</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-sell" value="overweight" />
              <span>4. 这只股票大涨后在我的持仓簿中占比是否过高（超过风险承受上限）？</span>
            </label>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" style="flex:1;padding:11px;" onclick="GrowthApp.submitEvaluation()">
            ${editingItem ? "💾 保存修改并更新持仓档案" : "🛡️ 生成投研体检结论并存入持仓档案"}
          </button>
          ${editingItem ? `
            <button class="btn btn-outline" style="flex:0 0 auto;padding:11px 16px;" onclick="GrowthApp.cancelEditEvaluation()">取消</button>
          ` : ""}
        </div>
      </div>

      <!-- 已保存的持仓体检档案列表 -->
      <div class="section-card">
        <div class="section-title">
          <span>📋 已归档的持仓投研体检报告 (${evals.length})</span>
          <span style="font-size:11.5px;color:var(--text-secondary);font-weight:500;">支持随时点击「编辑」更新估值与基本面</span>
        </div>
        ${evals.map(ev => {
          const ratingBadge = ev.moatRating === "wide"
            ? `<span class="badge badge-core">🏰 宽护城河</span>`
            : ev.moatRating === "narrow"
            ? `<span class="badge badge-active">🛡️ 窄护城河</span>`
            : `<span class="badge" style="background:var(--neg-red-bg);color:var(--neg-red);">⚠️ 无护城河</span>`;
          const redFlagCount = (ev.redFlags || []).length;
          const moatTags = (ev.moatTypes || []).map(t => MOAT_LABELS[t] || t).join(" · ");

          return `
            <div style="border:1px solid ${this.editingEvalId === ev.id ? "#f59e0b" : "var(--border-color)"};border-radius:12px;padding:13px 14px;margin-bottom:10px;background:var(--bg-card);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <strong style="font-size:15px;">${this.escapeHtml(ev.name)}</strong>
                  ${ev.ticker ? `<span style="font-size:12px;color:var(--text-secondary);">(${this.escapeHtml(ev.ticker)})</span>` : ""}
                  ${ratingBadge}
                  ${redFlagCount > 0 ? `<span class="badge" style="background:var(--neg-red-bg);color:var(--neg-red);">🚩 ${redFlagCount}面财务红旗</span>` : ""}
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                  <button class="btn-outline" style="padding:2px 8px;border-radius:6px;cursor:pointer;font-size:11.5px;color:var(--gold-dark);"
                          onclick="GrowthApp.startEditEvaluation('${this.escapeHtml(ev.id)}')">✏️ 编辑</button>
                  <button class="btn-outline" style="padding:2px 8px;border-radius:6px;cursor:pointer;font-size:11.5px;color:var(--text-muted);"
                          onclick="GrowthApp.deleteEvaluation('${this.escapeHtml(ev.id)}')">删除</button>
                </div>
              </div>

              <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:4px;">
                <strong>财务筛查：</strong>${this.escapeHtml(ev.roicNote || (ev.roicPass === "yes" ? "长期高ROIC/ROE达标" : "待观察"))}
                ${ev.cashReturnRate ? ` · <strong>现金回报率：</strong><span style="color:var(--gold-dark);font-weight:700;">${this.escapeHtml(ev.cashReturnRate)}</span>` : ""}
              </div>

              ${(ev.ltBuySummary || ev.bgValSummary || ev.metrics?.mcap) ? `
                <div style="font-size:12px;color:var(--navy-accent);background:var(--bg-subtle);padding:5px 9px;border-radius:6px;margin-bottom:6px;">
                  📐 ${ev.metrics?.mcap ? `当前市值 ${this.escapeHtml(ev.metrics.mcap)}亿 · ` : ""}
                  ${ev.ltBuySummary ? `老唐买点：<strong>${this.escapeHtml(ev.ltBuySummary)}</strong> ` : ""}
                  ${ev.bgValSummary ? `| PE×PB：<strong>${this.escapeHtml(ev.bgValSummary)}</strong>` : ""}
                </div>
              ` : ""}

              <div style="font-size:12.5px;color:var(--text-main);margin-bottom:5px;">
                <strong>护城河拆解${moatTags ? ` (${moatTags})` : ""}：</strong>${this.escapeHtml(ev.moatDetail || "未填写详细描述")}
              </div>

              ${ev.invertNote ? `
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:5px;">
                  🔄 <strong>逆向思考死穴：</strong>${this.escapeHtml(ev.invertNote)}
                </div>
              ` : ""}

              ${redFlagCount > 0 ? `
                <div style="font-size:12px;color:var(--neg-red);margin-bottom:5px;">
                  🚩 <strong>财务预警：</strong>${(ev.redFlags || []).map(f => REDFLAG_LABELS[f] || f).join("、")}
                </div>
              ` : ""}

              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border-color);">
                <div style="font-size:12px;font-weight:700;color:${(ev.sellSignalCount > 0 || redFlagCount >= 2) ? "var(--neg-red)" : "var(--pos-green)"};">
                  📌 ${this.escapeHtml(ev.verdict)}
                </div>
                <span style="font-size:11px;color:var(--text-muted);">${ev.updatedDate ? `更新于 ${ev.updatedDate}` : (ev.date || "")}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  calcCashReturn() {
    const mcapRaw = document.getElementById("cr-mcap")?.value || "";
    const debtRaw = document.getElementById("cr-debt")?.value || "";
    const cashRaw = document.getElementById("cr-cash")?.value || "";
    const fcfRaw = document.getElementById("cr-fcf")?.value || "";
    const intrRaw = document.getElementById("cr-int")?.value || "";
    const p3yRaw = document.getElementById("lt-profit3y")?.value || "";
    const peRaw = document.getElementById("bg-pe")?.value || "";
    const pbRaw = document.getElementById("bg-pb")?.value || "";

    const mcap = parseFloat(mcapRaw || "0");
    const debt = parseFloat(debtRaw || "0");
    const cash = parseFloat(cashRaw || "0");
    const fcf = parseFloat(fcfRaw || "0");
    const intr = parseFloat(intrRaw || "0");
    const p3y = parseFloat(p3yRaw || "0");
    const pe = parseFloat(peRaw || "0");
    const pb = parseFloat(pbRaw || "0");

    const box = document.getElementById("cr-result-box");
    const ltBox = document.getElementById("lt-bg-result-box");

    const ltBuySummary = p3y > 0 ? `${(p3y * 25 * 0.5).toFixed(1)}亿 (合理${(p3y * 25).toFixed(0)}亿)` : "";
    const bgValSummary = (pe > 0 && pb > 0)
      ? `${(pe * pb).toFixed(1)} (${pe * pb <= 22.5 ? "✅≤22.5" : "⚠️>22.5"})`
      : "";

    if (ltBox) {
      ltBox.innerHTML = `💡 老唐5折买点：<strong>${ltBuySummary || "-- 亿"}</strong> &nbsp;|&nbsp; 格雷厄姆 PE×PB：<strong>${bgValSummary || "--"}</strong>`;
    }

    let cashReturnRate = "";
    const ev = mcap + debt - cash;
    if (ev > 0 && fcf !== 0) {
      const rate = ((fcf + intr) / ev) * 100;
      cashReturnRate = `${rate.toFixed(2)}%`;
      if (box) box.textContent = `现金回报率: ${cashReturnRate}`;
    } else if (box) {
      box.textContent = "现金回报率: --%";
    }

    return {
      cashReturnRate,
      ltBuySummary,
      bgValSummary,
      metrics: {
        mcap: mcapRaw,
        debt: debtRaw,
        cash: cashRaw,
        fcf: fcfRaw,
        intr: intrRaw,
        profit3y: p3yRaw,
        pe: peRaw,
        pb: pbRaw
      }
    };
  },

  startEditEvaluation(evalId) {
    this.editingEvalId = evalId;
    this.renderMainContent();
    const card = document.getElementById("evaluator-form-card");
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  cancelEditEvaluation() {
    this.editingEvalId = null;
    this.renderMainContent();
  },

  populateEvalForm(evalId) {
    const ev = window.GrowthStore.getStockEvaluationById(evalId);
    if (!ev) return;

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el && v !== undefined && v !== null) el.value = v;
    };

    setVal("eval-name", ev.name || "");
    setVal("eval-ticker", ev.ticker || "");
    setVal("eval-roic-pass", ev.roicPass || "yes");
    setVal("eval-roic-note", ev.roicNote || "");
    setVal("eval-moat-detail", ev.moatDetail || "");
    setVal("eval-val-status", ev.valuationStatus || "fair");
    setVal("eval-invert-note", ev.invertNote || "");

    const m = ev.metrics || {};
    setVal("cr-mcap", m.mcap || "");
    setVal("cr-debt", m.debt || "");
    setVal("cr-cash", m.cash || "");
    setVal("cr-fcf", m.fcf || "");
    setVal("cr-int", m.intr || "");
    setVal("lt-profit3y", m.profit3y || "");
    setVal("bg-pe", m.pe || "");
    setVal("bg-pb", m.pb || "");

    const setChecks = (name, arr) => {
      const set = new Set(arr || []);
      document.querySelectorAll(`input[name='${name}']`).forEach(chk => {
        chk.checked = set.has(chk.value);
      });
    };

    setChecks("eval-moat-type", ev.moatTypes);
    setChecks("eval-erosion", ev.erosionRisks);
    setChecks("eval-redflag", ev.redFlags);
    setChecks("eval-munger-bias", ev.mungerBiases);
    setChecks("eval-sell", ev.sellSignals);

    this.calcCashReturn();
    if (!m.mcap && ev.cashReturnRate) {
      const box = document.getElementById("cr-result-box");
      if (box) box.textContent = `现金回报率: ${ev.cashReturnRate}`;
    }
  },

  submitEvaluation() {
    const name = (document.getElementById("eval-name")?.value || "").trim();
    if (!name) {
      alert("请输入股票名称/持仓标的！");
      return;
    }
    const ticker = (document.getElementById("eval-ticker")?.value || "").trim();
    const roicPass = document.getElementById("eval-roic-pass")?.value || "yes";
    const roicNote = (document.getElementById("eval-roic-note")?.value || "").trim();
    const moatDetail = (document.getElementById("eval-moat-detail")?.value || "").trim();
    const valStatus = document.getElementById("eval-val-status")?.value || "fair";
    const invertNote = (document.getElementById("eval-invert-note")?.value || "").trim();

    const calc = this.calcCashReturn();
    const existing = this.editingEvalId ? window.GrowthStore.getStockEvaluationById(this.editingEvalId) : null;
    const cashReturnRate = calc.cashReturnRate || (existing && !calc.metrics.mcap ? existing.cashReturnRate : "");

    const moatTypes = Array.from(document.querySelectorAll("input[name='eval-moat-type']:checked")).map(el => el.value);
    const erosionRisks = Array.from(document.querySelectorAll("input[name='eval-erosion']:checked")).map(el => el.value);
    const redFlags = Array.from(document.querySelectorAll("input[name='eval-redflag']:checked")).map(el => el.value);
    const mungerBiases = Array.from(document.querySelectorAll("input[name='eval-munger-bias']:checked")).map(el => el.value);
    const sellSignals = Array.from(document.querySelectorAll("input[name='eval-sell']:checked")).map(el => el.value);

    // 综合护城河评级逻辑（融合财务红旗降级）
    let moatRating = "none";
    if (roicPass === "no" || moatTypes.length === 0 || redFlags.length >= 2) {
      moatRating = "none";
    } else if (moatTypes.length >= 2 && erosionRisks.length === 0 && redFlags.length === 0 && roicPass === "yes") {
      moatRating = "wide";
    } else {
      moatRating = "narrow";
    }

    let verdict = "";
    if (redFlags.length >= 2) {
      verdict = `🚩 触发 ${redFlags.length} 面《股市真规则》财务红旗！强烈建议一票否决或立即排查假账风险！`;
    } else if (sellSignals.length > 0) {
      verdict = `⚠️ 触发 ${sellSignals.length} 项第14章卖出准则，建议复核减仓或换仓！`;
    } else if (mungerBiases.length > 0) {
      const biasNames = mungerBiases.map(b => MUNGER_BIAS_LABELS[b] || b).join("、");
      verdict = `🧠 芒格清单预警：当前存在「${biasNames}」倾向，建议冷静24小时重读逆向死穴后再决策！`;
    } else if (redFlags.length === 1) {
      verdict = `⚠️ 亮起 1 面财务红旗（${REDFLAG_LABELS[redFlags[0]]}），需持续紧盯下季财报现金流验证后再加仓。`;
    } else if (moatRating === "none") {
      verdict = "⚠️ 缺乏结构性护城河，警惕高收益均值回归陷阱，不宜长期重仓。";
    } else if (valStatus === "undervalued") {
      verdict = `🎯 具备${moatRating === "wide" ? "宽" : "窄"}护城河且估值低估，属于击球区优质买点！`;
    } else if (valStatus === "fair") {
      verdict = `✅ 具备${moatRating === "wide" ? "宽" : "窄"}护城河且估值合理，可坐等享受ROIC复利。`;
    } else {
      verdict = `⏳ 公司具备护城河但当前估值偏贵，建议列入观察池耐心等待好价格。`;
    }

    const payload = {
      name,
      ticker,
      roicPass,
      roicNote,
      moatTypes,
      moatDetail,
      erosionRisks,
      redFlags,
      mungerBiases,
      invertNote,
      moatRating,
      valuationStatus: valStatus,
      cashReturnRate,
      ltBuySummary: calc.ltBuySummary,
      bgValSummary: calc.bgValSummary,
      metrics: calc.metrics,
      sellSignals,
      sellSignalCount: sellSignals.length,
      verdict
    };

    if (this.editingEvalId) {
      window.GrowthStore.updateStockEvaluation(this.editingEvalId, payload);
      this.editingEvalId = null;
      this.showToast(`✓ 已更新《${name}》的体检报告`);
    } else {
      window.GrowthStore.addStockEvaluation(payload);
      this.showToast(`✓ 已归档《${name}》的体检报告`);
    }

    this.renderAll();
  },

  deleteEvaluation(evalId) {
    if (!confirm("确定要删除这份持仓体检档案吗？")) return;
    if (this.editingEvalId === evalId) this.editingEvalId = null;
    window.GrowthStore.deleteStockEvaluation(evalId);
    this.renderAll();
    this.showToast("已删除体检档案");
  },

  // ==================== TAB 4: 箴言闪卡与复利笔记（修复抽卡范围联动） ====================
  getAllMaximsList() {
    const books = window.GrowthStore.getAllBooks();
    const list = [];
    books.forEach(b => {
      (b.chapters || []).forEach(ch => {
        (ch.maxims || []).forEach((m, idx) => {
          list.push({
            key: `${b.id}__${ch.num}__${idx}`,
            bookId: b.id,
            bookTitle: b.title,
            chapterNum: ch.num,
            chapterTitle: ch.title,
            text: m
          });
        });
      });
    });
    return list;
  },

  getScopedAndFilteredMaxims() {
    const activeBook = window.GrowthStore.getActiveBook();
    const rawMaxims = this.getAllMaximsList();
    const scoped = this.maximBookScope === "active"
      ? rawMaxims.filter(m => m.bookId === activeBook.id)
      : rawMaxims;
    const basePool = scoped.length > 0 ? scoped : rawMaxims;

    const masteredMap = window.GrowthStore.state.masteredMaxims || {};
    const filtered = basePool.filter(m => {
      if (this.maximFilter === "unmastered") return !masteredMap[m.key];
      if (this.maximFilter === "mastered") return !!masteredMap[m.key];
      return true;
    });

    return {
      activeBook,
      basePool,
      filtered,
      drawPool: filtered.length > 0 ? filtered : basePool,
      masteredMap
    };
  },

  renderFlashcardsView() {
    const { activeBook, basePool, filtered, drawPool, masteredMap } = this.getScopedAndFilteredMaxims();
    const masteredCount = basePool.filter(m => masteredMap[m.key]).length;
    const safeIdx = this.randomMaximIndex % Math.max(1, drawPool.length);
    const currentCard = drawPool[safeIdx] || basePool[0];
    const notes = window.GrowthStore.state.bookNotes[activeBook.id] || [];

    return `
      <!-- 顶部随机抽卡大卡片（已与书籍范围及待强化筛选池联动） -->
      ${currentCard ? `
        <div class="portfolio-hero" style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 65%,#065f46 100%);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
            <span class="badge badge-core">
              🌱 ${this.maximBookScope === "active" ? `《${this.escapeHtml(activeBook.title)}》` : "全书库"}${this.maximFilter === "unmastered" ? " · 待强化池" : ""} (${safeIdx + 1}/${drawPool.length})
            </span>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <button class="btn-top" style="padding:3px 9px;font-size:11px;"
                      onclick="GrowthApp.toggleMaximBookScope()">
                ${this.maximBookScope === "active" ? `📘 仅《${this.escapeHtml(activeBook.title)}》 (点此看全部)` : `📚 全部书库 (点此只看当前书)`}
              </button>
              <span style="font-size:12px;color:#a7f3d0;">已内化 ${masteredCount}/${basePool.length} 条</span>
            </div>
          </div>
          <div style="font-size:16px;font-weight:700;line-height:1.65;color:#ffffff;margin-bottom:12px;">
            “${currentCard.text}”
          </div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:14px;cursor:pointer;"
               onclick="GrowthApp.jumpToChapter('${this.escapeHtml(currentCard.bookId)}', '${this.escapeHtml(currentCard.chapterNum)}')">
            —— 出自《${this.escapeHtml(currentCard.bookTitle)}》· ${this.escapeHtml(currentCard.chapterNum)} ${this.escapeHtml(currentCard.chapterTitle)} ↗
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn-top gold" onclick="GrowthApp.nextRandomMaxim()">
              🎲 随机下一张 (${this.maximFilter === "unmastered" ? "仅抽待强化" : "当前范围"})
            </button>
            <button class="btn-top" onclick="GrowthApp.onToggleMaxim('${this.escapeHtml(currentCard.key)}')">
              ${masteredMap[currentCard.key] ? "✓ 已掌握（点击取消）" : "标记为已掌握"}
            </button>
          </div>
        </div>
      ` : ""}

      <!-- 读书与实战感悟笔记 -->
      <div class="section-card">
        <div class="section-title">
          <span>✍️ 《${this.escapeHtml(activeBook.title)}》成长复利笔记 (${notes.length})</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input id="note-input" class="form-input" placeholder="记录你读完本书的启发或与自己持仓股票的印证..." />
          <button class="btn btn-primary" style="flex:0 0 auto;white-space:nowrap;" onclick="GrowthApp.addBookNote('${this.escapeHtml(activeBook.id)}')">
            ＋ 记录感悟
          </button>
        </div>
        ${notes.map(n => `
          <div style="background:var(--bg-subtle);padding:10px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-bottom:4px;">
              <span>📌 ${this.escapeHtml(n.tag)} · ${this.escapeHtml(n.date)}</span>
              <span style="cursor:pointer;color:var(--text-muted);" onclick="GrowthApp.deleteBookNote('${this.escapeHtml(activeBook.id)}', '${this.escapeHtml(n.id)}')">删除</span>
            </div>
            <div>${this.escapeHtml(n.content)}</div>
          </div>
        `).join("")}
      </div>

      <!-- 核心箴言清单 -->
      <div class="section-card">
        <div class="section-title">
          <span>📜 ${this.maximBookScope === "active" ? `《${this.escapeHtml(activeBook.title)}》「${activeBook.maximLabel || "核心箴言"}」(${filtered.length})` : `全书库原著「核心箴言」总库 (${filtered.length})`}</span>
          <div style="display:flex;gap:6px;">
            <button class="cat-pill ${this.maximFilter === "all" ? "active" : ""}"
                    onclick="GrowthApp.setMaximFilter('all')">全部</button>
            <button class="cat-pill ${this.maximFilter === "unmastered" ? "active" : ""}"
                    onclick="GrowthApp.setMaximFilter('unmastered')">待强化</button>
            <button class="cat-pill ${this.maximFilter === "mastered" ? "active" : ""}"
                    onclick="GrowthApp.setMaximFilter('mastered')">已内化</button>
          </div>
        </div>
        ${filtered.length === 0 ? `
          <div style="text-align:center;padding:18px;color:var(--text-secondary);font-size:12.5px;">
            ${this.maximFilter === "unmastered" ? "🎉 太棒了！当前范围内的箴言已全部内化掌握！" : "暂无符合当前筛选条件的箴言"}
          </div>
        ` : filtered.map(m => {
          const done = !!masteredMap[m.key];
          return `
            <div class="checkpoint-item ${done ? "done" : ""}"
                 onclick="GrowthApp.onToggleMaxim('${this.escapeHtml(m.key)}')">
              <div class="checkpoint-box">${done ? "✓" : ""}</div>
              <div>
                <div style="font-size:13px;color:var(--text-main);font-weight:600;">“${m.text}”</div>
                <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">
                  《${this.escapeHtml(m.bookTitle)}》 · ${this.escapeHtml(m.chapterNum)} ${this.escapeHtml(m.chapterTitle)}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  nextRandomMaxim() {
    const { drawPool } = this.getScopedAndFilteredMaxims();
    if (drawPool.length <= 1) return;
    const curIdx = this.randomMaximIndex % drawPool.length;
    const step = 1 + Math.floor(Math.random() * (drawPool.length - 1));
    this.randomMaximIndex = (curIdx + step) % drawPool.length;
    this.renderMainContent();
  },

  onToggleMaxim(key) {
    window.GrowthStore.toggleMaximMastered(key);
    this.renderAll();
  },

  setMaximFilter(f) {
    this.maximFilter = f;
    this.randomMaximIndex = 0;
    this.renderMainContent();
  },

  toggleMaximBookScope() {
    this.maximBookScope = this.maximBookScope === "active" ? "all" : "active";
    this.randomMaximIndex = 0;
    this.renderMainContent();
  },

  addBookNote(bookId) {
    const input = document.getElementById("note-input");
    const val = (input?.value || "").trim();
    if (!val) return;
    window.GrowthStore.addNote(bookId, "实战感悟", val);
    this.renderMainContent();
    this.showToast("✓ 已记录感悟笔记");
  },

  deleteBookNote(bookId, noteId) {
    window.GrowthStore.deleteNote(bookId, noteId);
    this.renderMainContent();
  },

  // ==================== 数据备份导出与恢复弹窗控制 ====================
  openBackupModal() {
    const modal = document.getElementById("backup-modal");
    if (modal) modal.classList.add("open");
  },

  closeBackupModal() {
    const modal = document.getElementById("backup-modal");
    if (modal) modal.classList.remove("open");
  },

  downloadBackupFile() {
    try {
      const payload = window.GrowthStore.exportBackupPayload();
      const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `快速成长指南备份_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast("💾 备份文件已开始下载！");
    } catch (e) {
      alert("导出失败：" + e.message);
    }
  },

  async copyBackupText() {
    const payload = window.GrowthStore.exportBackupPayload();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.getElementById("backup-json-textarea");
        if (ta) {
          ta.value = payload;
          ta.select();
          document.execCommand("copy");
        }
      }
      this.showToast("📋 已复制备份同步码！可粘贴发给手机或电脑");
    } catch (e) {
      const ta = document.getElementById("backup-json-textarea");
      if (ta) ta.value = payload;
      this.showToast("已在下方文本框生成备份码，请全选复制");
    }
  },

  importBackupFromFile(fileInput) {
    const file = fileInput?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = window.GrowthStore.importBackupPayload(String(reader.result || ""));
        this.applyDarkMode(!!window.GrowthStore.state.darkMode);
        this.closeBackupModal();
        this.renderAll();
        this.showToast(`🎉 恢复成功（${res.evalCount}份体检 · ${res.noteCount}条笔记）`);
      } catch (err) {
        alert("备份文件恢复失败：" + err.message);
      } finally {
        fileInput.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  },

  importBackupFromTextarea() {
    const ta = document.getElementById("backup-json-textarea");
    const raw = (ta?.value || "").trim();
    if (!raw) {
      alert("请先粘贴 JSON 备份同步码！");
      return;
    }
    try {
      const res = window.GrowthStore.importBackupPayload(raw);
      if (ta) ta.value = "";
      this.applyDarkMode(!!window.GrowthStore.state.darkMode);
      this.closeBackupModal();
      this.renderAll();
      this.showToast(`🎉 恢复成功（${res.evalCount}份体检 · ${res.noteCount}条笔记）`);
    } catch (err) {
      alert("同步码恢复失败：" + err.message);
    }
  },

  // ==================== 新书建仓弹窗 ====================
  openNewBookModal() {
    const modal = document.getElementById("new-book-modal");
    if (modal) modal.classList.add("open");
  },

  closeNewBookModal() {
    const modal = document.getElementById("new-book-modal");
    if (modal) modal.classList.remove("open");
  },

  submitNewBook() {
    const title = (document.getElementById("nb-title")?.value || "").trim();
    const author = (document.getElementById("nb-author")?.value || "").trim();
    const category = document.getElementById("nb-category")?.value || "value-investing";
    const positionType = document.getElementById("nb-position")?.value || "active";
    const question = (document.getElementById("nb-question")?.value || "").trim();
    const thesis = (document.getElementById("nb-thesis")?.value || "").trim();

    if (!title) {
      alert("请输入书名！");
      return;
    }

    const newBook = {
      id: "custom-book-" + Date.now(),
      title,
      author: author || "核心作者",
      category,
      positionType,
      wordCount: "自定义建仓",
      speedReadMinutes: 45,
      addedDate: new Date().toISOString().slice(0, 10),
      coverColor: "linear-gradient(135deg, #1e293b 0%, #0f172a 70%, #b45309 100%)",
      coverIcon: "📘",
      coreQuestion: question || `如何通过《${title}》构建长期复利认知？`,
      coreFormula: [
        {
          step: "核心主线",
          title: thesis || `《${title}》核心思维模型`,
          detail: "可将新书 .epub 放入工作区目录，运行 tools/parse_epub.py 或交由 AI 深度拆解全部章节。",
          chapters: "全书总览"
        }
      ],
      speedReadGuide: {
        structuralSecret: `遵循「三阶极速阅读法」：先用10分钟读序言与目录抓核心命题，再用25分钟精读P0重点章节，最后用10分钟结合持仓实战内化。`,
        passes: [
          {
            order: "第一阶",
            name: "10分钟 · 骨架扫描",
            duration: "10 min",
            strategy: "通读目录、序言与每章小结，提炼核心命题。",
            actions: [question || `明确《${title}》试图解决的核心问题。`]
          }
        ],
        checkpoints: [
          {
            id: "cp-" + Date.now(),
            title: `掌握《${title}》核心框架`,
            question: thesis || `我已理解本书的核心论点并能复述给他人。`
          }
        ]
      },
      industryMoatTable: [],
      chapters: [
        {
          num: "第1章",
          title: "核心精华总览",
          priority: "P0",
          estMinutes: 10,
          thesis: thesis || `《${title}》的核心思想浓缩。`,
          howToRead: "精读核心章节，结合自身投资组合做笔记。",
          keyPoints: [
            question || "思考本书如何优化你的选股、估值或持仓心态。"
          ],
          cases: [],
          maxims: [
            thesis || `好书如好股，重仓精读产生认知复利。`
          ]
        }
      ]
    };

    window.GrowthStore.addCustomBook(newBook);
    ["nb-title", "nb-author", "nb-question", "nb-thesis"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    this.closeNewBookModal();
    this.renderAll();
    this.showToast(`🎉《${title}》已成功建仓入库！`);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.GrowthApp.init();
});
