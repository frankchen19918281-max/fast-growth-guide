// 「快速成长指南」核心视图渲染与交互控制器
window.GrowthApp = {
  currentTab: "portfolio",      // portfolio | reader | evaluator | flashcards
  readerSubTab: "roadmap",      // roadmap | chapters | industry
  chapterFilter: "ALL",         // ALL | P0 | P1 | P2
  chapterSearch: "",
  industrySort: "wide",         // wide | total
  maximFilter: "all",           // all | unmastered | mastered
  maximBookScope: "all",        // all | active
  randomMaximIndex: 0,
  wideMode: false,

  // 45分钟极速阅读计时器状态
  timerSeconds: 45 * 60,
  timerRunning: false,
  timerInterval: null,

  init() {
    window.GrowthStore.init();
    this.renderAll();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  onBookChange(bookId) {
    window.GrowthStore.setActiveBook(bookId);
    const book = window.GrowthStore.getActiveBook();
    this.timerSeconds = (book.speedReadMinutes || 45) * 60;
    this.stopTimer();
    this.renderAll();
  },

  // 计时器控制
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
    const prog = window.GrowthStore.getBookProgress(activeBook.id);

    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;min-width:0;">
        <span>当前持仓研读：</span>
        <select class="active-book-select" onchange="GrowthApp.onBookChange(this.value)">
          ${books.map(b => `
            <option value="${b.id}" ${b.id === activeBook.id ? "selected" : ""}>
              ${b.coverIcon || "📘"} 《${b.title}》 (${b.positionType === "core" ? "核心重仓" : b.positionType === "active" ? "建仓中" : "观察池"})
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
      { id: "evaluator", icon: "🛡️", label: "护城河体检" },
      { id: "flashcards", icon: "🌱", label: "箴言闪卡" }
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
    } else if (this.currentTab === "flashcards") {
      container.innerHTML = this.renderFlashcardsView();
    }
  },

  // ==================== TAB 1: 认知持仓看板 ====================
  renderPortfolioView() {
    const books = window.GrowthStore.getAllBooks();
    const activeBook = window.GrowthStore.getActiveBook();
    const selectedCat = window.GrowthStore.state.selectedCategory || "all";

    // 汇总统计指标（全组合动态净值 + 当前主攻书籍联动）
    const coreCount = books.filter(b => b.positionType === "core" || b.positionType === "active").length;
    const totalMaxims = books.reduce((acc, b) => {
      return acc + (b.chapters || []).reduce((s, ch) => s + ((ch.maxims || []).length), 0);
    }, 0);
    const masteredCount = Object.values(window.GrowthStore.state.masteredMaxims || {}).filter(Boolean).length;
    const evalCount = (window.GrowthStore.state.stockEvaluations || []).length;
    const totalProg = window.GrowthStore.getTotalPortfolioProgress();
    const activeProg = window.GrowthStore.getBookProgress(activeBook.id);

    // 4大认知赛道持仓与吸收率统计
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
              <span>全书库综合吸收率 · 当前主攻《${activeBook.title}》(${activeProg.percent}%)</span>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <button class="btn-top" onclick="GrowthApp.forceRefreshApp()">🔄 刷新书库</button>
            <button class="btn-top gold" onclick="GrowthApp.switchTab('reader', { bookId: '${activeBook.id}', subTab: 'roadmap' })">
              ⚡ 速读《${activeBook.title}》
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
            <div class="hero-metric-lbl">核心重仓精读</div>
          </div>
          <div class="hero-metric-item">
            <div class="hero-metric-num">${masteredCount}/${totalMaxims}</div>
            <div class="hero-metric-lbl">已内化大师箴言</div>
          </div>
          <div class="hero-metric-item">
            <div class="hero-metric-num">${evalCount} 只</div>
            <div class="hero-metric-lbl">护城河体检标的</div>
          </div>
        </div>
        <!-- 四大认知赛道仓位分布概览 -->
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:11px;">
          ${sectorStats.map(s => `
            <div style="background:rgba(255,255,255,0.06);padding:6px 8px;border-radius:8px;cursor:pointer;" onclick="GrowthApp.selectCategory('${s.id}')">
              <div style="color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.icon} ${s.name}</div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:2px;">
                <strong style="color:#f8fafc;font-size:12px;">${s.count}本</strong>
                <span style="color:#fbbf24;font-size:10.5px;">吸收 ${s.pct}%</span>
              </div>
            </div>
          `).join("")}
        </div>
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
          return `
            <div class="book-card ${isCurrent ? "active-holding" : ""}">
              <div>
                <div class="book-card-header">
                  <div class="book-cover-mini" style="background:${book.coverColor || "#1e293b"}">
                    ${book.coverIcon || "📘"}
                  </div>
                  <div class="book-meta">
                    <div class="book-badges">
                      <span class="badge ${posInfo.badgeClass}">${posInfo.label}</span>
                      <span class="badge badge-speed">⚡ ${book.speedReadMinutes || 45}分钟速读</span>
                    </div>
                    <div class="book-title">《${book.title}》</div>
                    <div class="book-author">${book.author} · ${book.wordCount || ""}</div>
                  </div>
                </div>

                <div class="book-question-box">
                  <strong>核心命题：</strong>${book.coreQuestion}
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
                  <button class="btn btn-primary" onclick="GrowthApp.switchTab('reader', { bookId: '${book.id}', subTab: 'roadmap' })">
                    ⚡ 三阶极速读法
                  </button>
                  <button class="btn btn-outline" onclick="GrowthApp.switchTab('reader', { bookId: '${book.id}', subTab: 'chapters' })">
                    📑 逐章精读 (${(book.chapters || []).length})
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- 底部多书扩展说明卡 -->
      <div class="section-card" style="margin-top:16px;background:linear-gradient(135deg,#fffbeb 0%,#ffffff 100%);border-color:#fde68a;">
        <div class="section-title">
          <span>🧱 模块化多书架构（随时放入新书无缝扩展）</span>
          <button class="btn-top gold" onclick="GrowthApp.openNewBookModal()">＋ 新书建仓</button>
        </div>
        <p style="font-size:12.5px;color:var(--text-secondary);">
          本系统采用<strong>「标准认知资产 Schema + 独立书籍数据包」</strong>架构设计。未来你有任何新书（如《股市真规则》《聪明的投资者》《安全边际》），只需把 <code>.epub</code> 放入当前目录，或点击右上角「＋新书建仓」，即可自动按<strong>「核心公式 + 三阶极速路线图 + 逐章P0/P1/P2拆解 + 箴言闪卡」</strong>标准格式挂载入库。
        </p>
      </div>
    `;
  },

  selectCategory(catId) {
    window.GrowthStore.state.selectedCategory = catId;
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
            🗺️ 行业护城河表
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
          <div style="font-size:12px;color:#cbd5e1;">⏱️ 《${book.title}》极速通关计时器</div>
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
          <span>🔑 如何快速读透《${book.title}》？</span>
          <span class="badge badge-core">${book.wordCount || ""}</span>
        </div>
        <div class="chapter-thesis" style="margin-bottom:12px;">
          💡 <strong>拆书洞察：</strong>${guide.structuralSecret || book.coreQuestion}
        </div>

        <!-- 全书核心逻辑闭环 -->
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-main);">
          📐 全书底层逻辑公式（4步闭环）：
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:14px;">
          ${(book.coreFormula || []).map(f => `
            <div style="background:var(--bg-subtle);padding:10px 12px;border-radius:8px;border:1px solid var(--border-color);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <strong style="font-size:13px;color:var(--gold-dark);">${f.step}：${f.title}</strong>
                <span style="font-size:11px;color:var(--text-secondary);">${f.chapters}</span>
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

        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn btn-primary" onclick="GrowthApp.setReaderSubTab('chapters')">
            📑 进入逐章精读（按 P0/P1/P2 优先级）
          </button>
          <button class="btn btn-outline" onclick="GrowthApp.switchTab('flashcards')">
            🌱 速刷本书选股箴言闪卡
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
                 onclick="GrowthApp.onToggleCheckpoint('${book.id}', '${cp.id}')">
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

  getPriorityLabelsForBook(book) {
    if (book && book.priorityLabels) return book.priorityLabels;
    const mapByBookId = {
      "pat-dorsey-moat": {
        P0: "★ P0 核心必读（护城河真伪与侵蚀）",
        P1: "◆ P1 实战闭环（三步法/估值/卖出）",
        P2: "○ P2 观念校准（快速浏览即可）"
      },
      "graham-intelligent-investor": {
        P0: "★ P0 核心必读（市场先生与安全边际）",
        P1: "◆ P1 实战闭环（防御/进取组合配置）",
        P2: "○ P2 历史背景与技术细则（略读）"
      },
      "tangchao-financial-report": {
        P0: "★ P0 核心必读（三大表排雷与反欺诈）",
        P1: "◆ P1 实战闭环（杜邦拆解与老唐估值）",
        P2: "○ P2 复杂会计准则（快速扫读）"
      },
      "howard-marks-most-important": {
        P0: "★ P0 核心必读（第二层思维与风险控制）",
        P1: "◆ P1 实战闭环（逆向投资与防御型组合）",
        P2: "○ P2 观念延伸（快速浏览即可）"
      },
      "howard-marks-cycle": {
        P0: "★ P0 核心必读（信贷周期与市场温度计）",
        P1: "◆ P1 实战闭环（攻守调仓与周期局限）",
        P2: "○ P2 基础背景（宏观与企业盈利周期）"
      },
      "pat-dorsey-five-rules": {
        P0: "★ P0 核心必读（10分钟筛股/红旗排雷/DCF）",
        P1: "◆ P1 黄金赛道词典（医药/消费/金融/软件）",
        P2: "○ P2 传统周期词典（工业/能源/公用事业）"
      },
      "charlie-munger-almanack": {
        P0: "★ P0 核心必读（思维格栅与误判心理学）",
        P1: "◆ P1 逆向思维与学院派缺陷批判",
        P2: "○ P2 基金会与华尔街制度批判（略读）"
      }
    };
    return (book && mapByBookId[book.id]) || {
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

    const filtered = chapters.filter(ch => {
      const matchPriority = this.chapterFilter === "ALL" || ch.priority === this.chapterFilter;
      if (!matchPriority) return false;
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

    const priorityLabels = this.getPriorityLabelsForBook(book);

    return `
      <!-- 章节优先级过滤器与搜索栏 -->
      <div class="section-card" style="padding:12px 14px;">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
          <button class="cat-pill ${this.chapterFilter === "ALL" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('ALL')">
            全部 (${chapters.length})
          </button>
          <button class="cat-pill ${this.chapterFilter === "P0" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('P0')">
            ★ P0 核心必读 (${p0Count})
          </button>
          <button class="cat-pill ${this.chapterFilter === "P1" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('P1')">
            ◆ P1 实战闭环 (${p1Count})
          </button>
          <button class="cat-pill ${this.chapterFilter === "P2" ? "active" : ""}"
                  onclick="GrowthApp.setChapterFilter('P2')">
            ○ P2 观念校准 (${p2Count})
          </button>
        </div>
        <div style="display:flex;gap:8px;">
          <input type="text" class="form-input" placeholder="🔍 在《${book.title}》中搜索关键词（如：核心公式、案例、指标...）"
                 value="${this.chapterSearch}"
                 oninput="GrowthApp.onSearchChapter(this.value)" />
          <button class="btn btn-outline" style="flex:0 0 auto;white-space:nowrap;"
                  onclick="GrowthApp.markAllRead('${book.id}')">
            ✓ 全部标为已读
          </button>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="section-card" style="text-align:center;padding:28px 16px;color:var(--text-secondary);">
          <div style="font-size:24px;margin-bottom:6px;">🔍</div>
          <div style="font-size:13.5px;font-weight:700;color:var(--text-main);margin-bottom:4px;">当前筛选或搜索条件下暂无匹配章节</div>
          <div style="font-size:12px;margin-bottom:12px;">可尝试切换优先级标签或清空搜索关键词</div>
          <button class="btn btn-outline" style="max-width:160px;margin:0 auto;" onclick="GrowthApp.resetChapterFilter()">重置筛选条件</button>
        </div>
      ` : ""}

      <!-- 逐章精读列表 -->
      ${filtered.map(ch => {
        const isRead = !!readMap[ch.num];
        return `
          <div class="chapter-card ${isRead ? "is-read" : ""}">
            <div class="chapter-top">
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                  <span class="priority-tag priority-${ch.priority || "P1"}">
                    ${priorityLabels[ch.priority] || ch.priority}
                  </span>
                  <span class="badge badge-watch">⏱️ 建议速读 ${ch.estMinutes || 3} 分钟</span>
                </div>
                <h3 style="font-size:15.5px;font-weight:800;color:var(--text-main);">
                  ${ch.num} · ${ch.title}
                </h3>
              </div>
              <button class="btn ${isRead ? "btn-primary" : "btn-outline"}"
                      style="flex:0 0 auto;padding:5px 10px;font-size:12px;"
                      onclick="GrowthApp.onToggleChapterRead('${book.id}', '${ch.num}')">
                ${isRead ? "✓ 已读透" : "标记已读"}
              </button>
            </div>

            <div class="chapter-thesis">
              🎯 <strong>本章一句话精髓：</strong>${ch.thesis}
            </div>

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
                <div style="font-size:11.5px;font-weight:700;color:var(--gold-dark);">📌 原书本章「选股箴言」：</div>
                ${ch.maxims.map((m, idx) => `
                  <div class="maxim-quote">“${idx + 1}. ${m}”</div>
                `).join("")}
              </div>
            ` : ""}
          </div>
        `;
      }).join("")}
    `;
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
    this.renderMainContent();
    const input = document.querySelector(".form-input[placeholder*='搜索关键词']");
    if (input) {
      input.focus();
      input.setSelectionRange(val.length, val.length);
    }
  },

  onToggleChapterRead(bookId, chNum) {
    window.GrowthStore.toggleChapterRead(bookId, chNum);
    this.renderAll();
  },

  markAllRead(bookId) {
    window.GrowthStore.markAllChaptersRead(bookId, true);
    this.renderAll();
  },

  renderIndustrySubView(book) {
    const rows = [...(book.industryMoatTable || [])];
    if (this.industrySort === "wide") {
      rows.sort((a, b) => b.wide - a.wide || b.total - a.total);
    } else {
      rows.sort((a, b) => b.total - a.total || b.wide - a.wide);
    }

    return `
      <div class="section-card">
        <div class="section-title">
          <span>🗺️ 原书表9-1：晨星 2000+ 上市公司行业护城河分布全景</span>
          <div style="display:flex;gap:6px;">
            <button class="cat-pill ${this.industrySort === "wide" ? "active" : ""}"
                    onclick="GrowthApp.setIndustrySort('wide')">按宽护城河%排序</button>
            <button class="cat-pill ${this.industrySort === "total" ? "active" : ""}"
                    onclick="GrowthApp.setIndustrySort('total')">按总护城河%排序</button>
          </div>
        </div>
        <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:12px;">
          银行劫匪萨顿名言：“我抢银行，是因为那儿有钱。”投资前先看行业天然肥瘦：<strong>金融服务、商业服务、媒体、消费品、软件</strong>是宽护城河富矿；而<strong>工业原料、硬件、餐饮零售</strong>则是竞争修罗场。
        </p>

        <div style="display:flex;gap:14px;font-size:12px;margin-bottom:10px;">
          <span><strong style="color:#d97706;">■</strong> 宽护城河占比 (%)</span>
          <span><strong style="color:#3b82f6;">■</strong> 窄护城河占比 (%)</span>
          <span><strong style="color:#cbd5e1;">■</strong> 无护城河 (%)</span>
        </div>

        ${rows.map(r => `
          <div class="industry-row">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
              <strong>${r.industry}</strong>
              <span>
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

  // ==================== TAB 3: 护城河实战体检仪（联动持仓簿） ====================
  renderEvaluatorView() {
    const evals = window.GrowthStore.state.stockEvaluations || [];

    return `
      <div class="section-card">
        <div class="section-title">
          <span>🛡️ 巴菲特护城河三步体检 & 估值卖出决策仪</span>
          <span class="badge badge-core">与「我的持仓簿」联动</span>
        </div>
        <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px;">
          把《巴菲特的护城河》第11章「晨星三步法」、第8章「侵蚀信号」、第13章「现金回报率公式」与第14章「四大卖出准则」浓缩为一张交互式股票体检表，为你的持仓标的打分存档：
        </p>

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

        <!-- 步骤 1：历史资本回报率筛查 -->
        <div class="form-group">
          <label class="form-label">步骤 1：看看它有多少钱（过去5~10年 ROA>7% / ROE≥15% / 高ROIC？）</label>
          <select id="eval-roic-pass" class="form-select">
            <option value="yes">✅ 是：长期 ROE ≥ 15%（或 ROIC 显著高于资本成本），且非高负债硬撑</option>
            <option value="turnaround">🔄 反转：历史回报一般，但已发生剥离亏损资产/低价长协换签等结构性好转（如阿奇煤炭）</option>
            <option value="no">❌ 否：历史资本回报率平庸且无结构性好转迹象（直接判定无护城河！）</option>
          </select>
          <input id="eval-roic-note" class="form-input" style="margin-top:6px;"
                 placeholder="补充财务备注（如：近5年平均ROE 24%，账面现金充沛，无有息负债）" />
        </div>

        <!-- 步骤 2：五大真护城河识别（排雷假护城河） -->
        <div class="form-group">
          <label class="form-label">步骤 2：定性识别真正的结构性竞争优势（可多选，切勿把“好产品/高市占率/明星CEO”当护城河）</label>
          <div class="checkbox-grid">
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="intangible" />
              <span><strong>① 无形资产</strong>：具备提价权的品牌（非仅知名度）、多元专利群与创新管线、或准入严且不限价的牌照/NIMBY许可</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="switching" />
              <span><strong>② 高转换成本</strong>：深度嵌入客户业务流程、高昂的数据迁移/重新培训成本、或零容忍的致命故障风险</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="network" />
              <span><strong>③ 封闭网络效应</strong>：新用户增加使老用户价值非线性暴增，且流动性/网络对竞争对手封闭</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="cost" />
              <span><strong>④ 结构性成本优势</strong>：对手无法复制的优越地理位置（如低价值重量比半径垄断）或独特世界级资源（非单纯外包或易模仿流程）</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-moat-type" value="scale" />
              <span><strong>⑤ 相对规模与利基垄断</strong>：高密度配送网、巨额固定成本分摊、或“小池塘大鱼”（市场仅够容下一家盈利）</span>
            </label>
          </div>
          <input id="eval-moat-detail" class="form-input" style="margin-top:6px;"
                 placeholder="一句话写下它最核心的护城河证据（如：提价10%客户不流失 / 替换软件需停工重训）" />
        </div>

        <!-- 步骤 3：四大护城河侵蚀预警 -->
        <div class="form-group">
          <label class="form-label">步骤 3：排查第8章「护城河被侵蚀」的危险信号（如有请勾选）</label>
          <div class="checkbox-grid">
            <label class="check-pill">
              <input type="checkbox" name="eval-erosion" value="tech" />
              <span>⚠️ <strong>破坏性技术变革</strong>：传统印钞机业务正被跨界新技术替代（如数码之于柯达、互联网之于纸媒）</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-erosion" value="industry" />
              <span>⚠️ <strong>行业结构恶化</strong>：下游大客户集中压价（如集采/渠道寡头），或出现不以盈利为目的的非理性对手</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-erosion" value="growth" />
              <span>⚠️ <strong>破坏性跨界增长</strong>：管理层把主业赚的钱盲目砸向毫无护城河的陌生亏损领域</span>
            </label>
            <label class="check-pill">
              <input type="checkbox" name="eval-erosion" value="pricing" />
              <span>⚠️ <strong>客户对提价说“不”</strong>：一贯能提价的产品突然停止提价或被迫降价促销</span>
            </label>
          </div>
        </div>

        <!-- 步骤 4：第13章 现金回报率 + 老唐估值法 + 格雷厄姆乘数 三合一测算器 -->
        <div class="form-group" style="background:var(--bg-subtle);padding:12px;border-radius:10px;">
          <label class="form-label">📐 步骤 4：三大经典估值工具实时测算（多尔西现金回报率 + 老唐三年打五折法 + 格雷厄姆乘数）</label>
          <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:8px;">
            ① <strong>多尔西现金回报率</strong> = <code>(自由现金流 + 净利息) ÷ 企业价值(市值 + 长债 - 现金)</code>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">
            <input id="cr-mcap" type="number" step="any" class="form-input" placeholder="当前市值(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="cr-debt" type="number" step="any" class="form-input" placeholder="长期有息负债(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="cr-cash" type="number" step="any" class="form-input" placeholder="账面现金(亿)" oninput="GrowthApp.calcCashReturn()" />
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-items:center;margin-bottom:10px;">
            <input id="cr-fcf" type="number" step="any" class="form-input" placeholder="年自由现金流(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="cr-int" type="number" step="any" class="form-input" placeholder="净利息费用(选填0)" oninput="GrowthApp.calcCashReturn()" />
            <div id="cr-result-box" style="font-size:12.5px;font-weight:800;color:var(--gold-dark);text-align:center;">
              现金回报率: --%
            </div>
          </div>

          <div style="border-top:1px dashed var(--border-color);padding-top:8px;margin-top:4px;font-size:11.5px;color:var(--text-secondary);margin-bottom:6px;">
            ② <strong>老唐《读财报》估值法</strong>（3年后合理利润×25倍PE的5折买进） & ③ <strong>格雷厄姆乘数</strong>（PE×PB ≤ 22.5）
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-items:center;margin-bottom:6px;">
            <input id="lt-profit3y" type="number" step="any" class="form-input" placeholder="3年后预估净利润(亿)" oninput="GrowthApp.calcCashReturn()" />
            <input id="bg-pe" type="number" step="any" class="form-input" placeholder="当前市盈率 PE" oninput="GrowthApp.calcCashReturn()" />
            <input id="bg-pb" type="number" step="any" class="form-input" placeholder="当前市净率 PB" oninput="GrowthApp.calcCashReturn()" />
          </div>
          <div id="lt-bg-result-box" style="font-size:12px;font-weight:700;color:var(--navy-accent);background:#fff;padding:6px 10px;border-radius:6px;border:1px solid var(--border-color);">
            💡 输入上方参数自动计算：老唐理想买点市值 -- 亿 | 格雷厄姆 PE×PB = --
          </div>

          <select id="eval-val-status" class="form-select" style="margin-top:8px;">
            <option value="undervalued">🟢 显著低估（具备充足安全边际，隐含增长预期极低）</option>
            <option value="fair" selected>🟡 估值合理（可长期持有赚取企业内生ROIC增长收益）</option>
            <option value="overvalued">🔴 明显高估（警惕负向投机收益/杀估值风险）</option>
          </select>
        </div>

        <!-- 步骤 5：第14章 卖出四原则核查 -->
        <div class="form-group">
          <label class="form-label">步骤 5：第14章「何时出手」——卖出四原则核查（全否=继续坚定持有）</label>
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

        <button class="btn btn-primary" style="width:100%;padding:11px;" onclick="GrowthApp.submitEvaluation()">
          🛡️ 生成护城河体检结论并存入持仓档案
        </button>
      </div>

      <!-- 已保存的持仓体检档案列表 -->
      <div class="section-card">
        <div class="section-title">
          <span>📋 已归档的持仓护城河体检报告 (${evals.length})</span>
        </div>
        ${evals.map(ev => {
          const ratingBadge = ev.moatRating === "wide"
            ? `<span class="badge badge-core">🏰 宽护城河</span>`
            : ev.moatRating === "narrow"
            ? `<span class="badge badge-active">🛡️ 窄护城河</span>`
            : `<span class="badge" style="background:#fef2f2;color:#dc2626;">⚠️ 无护城河</span>`;
          return `
            <div style="border:1px solid var(--border-color);border-radius:12px;padding:12px 14px;margin-bottom:10px;background:#fff;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div>
                  <strong style="font-size:14.5px;">${ev.name}</strong>
                  ${ev.ticker ? `<span style="font-size:12px;color:var(--text-secondary);">(${ev.ticker})</span>` : ""}
                  ${ratingBadge}
                </div>
                <button class="btn-outline" style="border:none;color:#94a3b8;cursor:pointer;font-size:12px;"
                        onclick="GrowthApp.deleteEvaluation('${ev.id}')">删除</button>
              </div>
              <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:4px;">
                <strong>财务筛查：</strong>${ev.roicNote || (ev.roicPass === "yes" ? "长期高ROIC/ROE达标" : "待观察")}
                ${ev.cashReturnRate ? ` · <strong>现金回报率：</strong><span style="color:var(--gold-dark);font-weight:700;">${ev.cashReturnRate}</span>` : ""}
              </div>
              <div style="font-size:12.5px;color:var(--text-main);margin-bottom:6px;">
                <strong>护城河拆解：</strong>${ev.moatDetail || "未填写详细描述"}
              </div>
              <div style="font-size:12px;font-weight:700;color:${ev.sellSignalCount > 0 ? "#dc2626" : "#059669"};">
                📌 决策建议：${ev.verdict}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  calcCashReturn() {
    const mcap = parseFloat(document.getElementById("cr-mcap")?.value || "0");
    const debt = parseFloat(document.getElementById("cr-debt")?.value || "0");
    const cash = parseFloat(document.getElementById("cr-cash")?.value || "0");
    const fcf = parseFloat(document.getElementById("cr-fcf")?.value || "0");
    const intr = parseFloat(document.getElementById("cr-int")?.value || "0");
    const box = document.getElementById("cr-result-box");

    const p3y = parseFloat(document.getElementById("lt-profit3y")?.value || "0");
    const pe = parseFloat(document.getElementById("bg-pe")?.value || "0");
    const pb = parseFloat(document.getElementById("bg-pb")?.value || "0");
    const ltBox = document.getElementById("lt-bg-result-box");

    if (ltBox) {
      const ltBuy = p3y > 0 ? `${(p3y * 25 * 0.5).toFixed(1)} 亿 (合理 ${(p3y * 25).toFixed(0)} 亿)` : "-- 亿";
      const bgVal = (pe > 0 && pb > 0)
        ? `${(pe * pb).toFixed(1)} (${pe * pb <= 22.5 ? "✅≤22.5达标" : "⚠️>22.5偏高"})`
        : "--";
      ltBox.innerHTML = `💡 老唐5折买点：<strong>${ltBuy}</strong> &nbsp;|&nbsp; 格雷厄姆 PE×PB：<strong>${bgVal}</strong>`;
    }

    if (!box) return "";
    const ev = mcap + debt - cash;
    if (ev > 0 && fcf !== 0) {
      const rate = ((fcf + intr) / ev) * 100;
      const text = `${rate.toFixed(2)}%`;
      box.textContent = `现金回报率: ${text}`;
      return text;
    } else {
      box.textContent = "现金回报率: --%";
      return "";
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
    const cashReturnRate = this.calcCashReturn();

    const moatTypes = Array.from(document.querySelectorAll("input[name='eval-moat-type']:checked")).map(el => el.value);
    const erosionRisks = Array.from(document.querySelectorAll("input[name='eval-erosion']:checked")).map(el => el.value);
    const sellSignals = Array.from(document.querySelectorAll("input[name='eval-sell']:checked")).map(el => el.value);

    // 晨星三步法自动评级逻辑
    let moatRating = "none";
    if (roicPass === "no" || moatTypes.length === 0) {
      moatRating = "none";
    } else if (moatTypes.length >= 2 && erosionRisks.length === 0 && roicPass === "yes") {
      moatRating = "wide";
    } else {
      moatRating = "narrow";
    }

    let verdict = "";
    if (sellSignals.length > 0) {
      verdict = `⚠️ 触发 ${sellSignals.length} 项第14章卖出准则，建议复核减仓或换仓！`;
    } else if (moatRating === "none") {
      verdict = "⚠️ 缺乏结构性护城河，警惕高收益均值回归陷阱，不宜长期重仓。";
    } else if (valStatus === "undervalued") {
      verdict = `🎯 具备${moatRating === "wide" ? "宽" : "窄"}护城河且估值低估，属于击球区优质买点！`;
    } else if (valStatus === "fair") {
      verdict = `✅ 具备${moatRating === "wide" ? "宽" : "窄"}护城河且估值合理，可耐心持有享受ROIC复利。`;
    } else {
      verdict = `⏳ 公司具备护城河但当前估值偏贵，建议列入观察池耐心等待好价格。`;
    }

    window.GrowthStore.addStockEvaluation({
      name,
      ticker,
      roicPass,
      roicNote,
      moatTypes,
      moatDetail,
      erosionRisks,
      moatRating,
      valuationStatus: valStatus,
      cashReturnRate,
      sellSignalCount: sellSignals.length,
      verdict
    });

    this.renderAll();
  },

  deleteEvaluation(evalId) {
    window.GrowthStore.deleteStockEvaluation(evalId);
    this.renderAll();
  },

  // ==================== TAB 4: 箴言闪卡与复利笔记 ====================
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

  renderFlashcardsView() {
    const activeBook = window.GrowthStore.getActiveBook();
    const rawMaxims = this.getAllMaximsList();
    const scopedMaxims = this.maximBookScope === "active"
      ? rawMaxims.filter(m => m.bookId === activeBook.id)
      : rawMaxims;
    const allMaxims = scopedMaxims.length > 0 ? scopedMaxims : rawMaxims;

    const masteredMap = window.GrowthStore.state.masteredMaxims || {};
    const masteredCount = allMaxims.filter(m => masteredMap[m.key]).length;

    const currentCard = allMaxims[this.randomMaximIndex % Math.max(1, allMaxims.length)] || allMaxims[0];
    const filteredMaxims = allMaxims.filter(m => {
      if (this.maximFilter === "unmastered") return !masteredMap[m.key];
      if (this.maximFilter === "mastered") return !!masteredMap[m.key];
      return true;
    });

    const notes = window.GrowthStore.state.bookNotes[activeBook.id] || [];

    return `
      <!-- 顶部随机抽卡大卡片 -->
      ${currentCard ? `
        <div class="portfolio-hero" style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 65%,#065f46 100%);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
            <span class="badge badge-core">🌱 每日选股箴言闪卡 (${(this.randomMaximIndex % allMaxims.length) + 1}/${allMaxims.length})</span>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn-top" style="padding:3px 9px;font-size:11px;"
                      onclick="GrowthApp.toggleMaximBookScope()">
                ${this.maximBookScope === "active" ? `📘 仅《${activeBook.title}》 (点此看全部)` : `📚 全部书库 (点此只看当前书)`}
              </button>
              <span style="font-size:12px;color:#a7f3d0;">已内化 ${masteredCount}/${allMaxims.length} 条</span>
            </div>
          </div>
          <div style="font-size:16px;font-weight:700;line-height:1.6;color:#ffffff;margin-bottom:12px;">
            “${currentCard.text}”
          </div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:14px;">
            —— 出自《${currentCard.bookTitle}》· ${currentCard.chapterNum} ${currentCard.chapterTitle}
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-top gold" onclick="GrowthApp.nextRandomMaxim()">
              🎲 随机下一张
            </button>
            <button class="btn-top" onclick="GrowthApp.onToggleMaxim('${currentCard.key}')">
              ${masteredMap[currentCard.key] ? "✓ 已掌握（点击取消）" : "标记为已掌握"}
            </button>
          </div>
        </div>
      ` : ""}

      <!-- 读书与实战感悟笔记 -->
      <div class="section-card">
        <div class="section-title">
          <span>✍️ 《${activeBook.title}》成长复利笔记 (${notes.length})</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input id="note-input" class="form-input" placeholder="记录你读完本章的启发或与自己持仓股票的印证..." />
          <button class="btn btn-primary" style="flex:0 0 auto;white-space:nowrap;" onclick="GrowthApp.addBookNote('${activeBook.id}')">
            ＋ 记录感悟
          </button>
        </div>
        ${notes.map(n => `
          <div style="background:var(--bg-subtle);padding:10px 12px;border-radius:8px;margin-bottom:8px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-bottom:4px;">
              <span>📌 ${n.tag} · ${n.date}</span>
              <span style="cursor:pointer;color:#94a3b8;" onclick="GrowthApp.deleteBookNote('${activeBook.id}', '${n.id}')">删除</span>
            </div>
            <div>${n.content}</div>
          </div>
        `).join("")}
      </div>

      <!-- 全书 44+ 条选股箴言清单 -->
      <div class="section-card">
        <div class="section-title">
          <span>📜 全书原著「选股箴言」总库 (${filteredMaxims.length})</span>
          <div style="display:flex;gap:6px;">
            <button class="cat-pill ${this.maximFilter === "all" ? "active" : ""}"
                    onclick="GrowthApp.setMaximFilter('all')">全部</button>
            <button class="cat-pill ${this.maximFilter === "unmastered" ? "active" : ""}"
                    onclick="GrowthApp.setMaximFilter('unmastered')">待强化</button>
            <button class="cat-pill ${this.maximFilter === "mastered" ? "active" : ""}"
                    onclick="GrowthApp.setMaximFilter('mastered')">已内化</button>
          </div>
        </div>
        ${filteredMaxims.map(m => {
          const done = !!masteredMap[m.key];
          return `
            <div class="checkpoint-item ${done ? "done" : ""}"
                 onclick="GrowthApp.onToggleMaxim('${m.key}')">
              <div class="checkpoint-box">${done ? "✓" : ""}</div>
              <div>
                <div style="font-size:13px;color:var(--text-main);font-weight:600;">“${m.text}”</div>
                <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">
                  《${m.bookTitle}》 · ${m.chapterNum} ${m.chapterTitle}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  nextRandomMaxim() {
    const all = this.getAllMaximsList();
    if (all.length <= 1) return;
    this.randomMaximIndex = (this.randomMaximIndex + 1 + Math.floor(Math.random() * (all.length - 1))) % all.length;
    this.renderMainContent();
  },

  onToggleMaxim(key) {
    window.GrowthStore.toggleMaximMastered(key);
    this.renderAll();
  },

  setMaximFilter(f) {
    this.maximFilter = f;
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
  },

  deleteBookNote(bookId, noteId) {
    window.GrowthStore.deleteNote(bookId, noteId);
    this.renderMainContent();
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
    this.closeNewBookModal();
    this.renderAll();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.GrowthApp.init();
});
