// 「快速成长指南」本地持久化状态引擎（类“我的持仓簿”数据层 v2.5）
const STORAGE_KEY = "FAST_GROWTH_GUIDE_STATE_V1";

const DEFAULT_STATE = {
  activeBookId: "",
  selectedCategory: "all",
  darkMode: false,
  positionOverrides: {},
  completedCheckpoints: {},
  readChapters: {},
  masteredMaxims: {},
  bookNotes: {
    "pat-dorsey-moat": [
      {
        id: "demo-note-1",
        date: "2026-11-10",
        tag: "核心感悟",
        content: "以前买股票容易被“好产品、高市占率、明星管理层”迷惑，读完第2章和第10章终于明白：赌马要赌马本身（结构性护城河），而不是骑师！"
      }
    ]
  },
  // 护城河实战体检记录（与“我的持仓簿”联动，支持二次编辑复盘）
  stockEvaluations: [
    {
      id: "eval-demo-fastenal",
      date: "2026-11-10",
      name: "快扣 (Fastenal / 书中第11章标杆案例)",
      ticker: "FAST",
      roicPass: "yes",
      roicNote: "连续10年ROIC > 20%，FCF/营收常年>8%，且几乎零有息负债",
      moatTypes: ["cost", "scale"],
      moatDetail: "全美2000家门店（老二仅一半）+ 自有配送车队，卖沉重且低价的螺丝紧固件，在小城市形成50英里半径地理位置与规模垄断。",
      erosionRisks: [],
      redFlags: [],
      mungerBiases: [],
      invertNote: "若北美制造业长期外迁或工业电商彻底打破最后一公里急件配送壁垒，可能削弱门店密度优势。",
      moatRating: "wide",
      valuationStatus: "fair",
      cashReturnRate: "6.8%",
      ltBuySummary: "",
      bgValSummary: "",
      metrics: {
        mcap: "",
        debt: "",
        cash: "",
        fcf: "",
        intr: "",
        profit3y: "",
        pe: "",
        pb: ""
      },
      sellSignals: [],
      sellSignalCount: 0,
      verdict: "✅ 具备宽护城河且估值合理，可耐心持有享受ROIC复利。"
    }
  ],
  customBooks: []
};

window.GrowthStore = {
  state: null,

  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = this._mergeWithDefaults(parsed);
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } catch (e) {
      console.warn("LocalStorage load fallback:", e);
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    this._ensureValidActiveBook();
    return this.state;
  },

  _mergeWithDefaults(parsed) {
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      ...(parsed || {}),
      positionOverrides: { ...(parsed?.positionOverrides || {}) },
      completedCheckpoints: { ...DEFAULT_STATE.completedCheckpoints, ...(parsed?.completedCheckpoints || {}) },
      readChapters: { ...DEFAULT_STATE.readChapters, ...(parsed?.readChapters || {}) },
      masteredMaxims: { ...DEFAULT_STATE.masteredMaxims, ...(parsed?.masteredMaxims || {}) },
      bookNotes: { ...DEFAULT_STATE.bookNotes, ...(parsed?.bookNotes || {}) },
      stockEvaluations: Array.isArray(parsed?.stockEvaluations)
        ? parsed.stockEvaluations
        : JSON.parse(JSON.stringify(DEFAULT_STATE.stockEvaluations)),
      customBooks: Array.isArray(parsed?.customBooks) ? parsed.customBooks : []
    };
  },

  _ensureValidActiveBook() {
    const all = this.getAllBooks();
    if (!this.state.activeBookId || !all.some(b => b.id === this.state.activeBookId)) {
      if (all[0]) this.state.activeBookId = all[0].id;
    }
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  },

  setDarkMode(enabled) {
    this.state.darkMode = !!enabled;
    this.save();
  },

  getAllBooks() {
    const builtins = window.BUILTIN_BOOKS || [];
    const customs = this.state.customBooks || [];
    const overrides = this.state.positionOverrides || {};
    return [...builtins, ...customs].map(b => {
      if (overrides[b.id]) {
        return { ...b, positionType: overrides[b.id] };
      }
      return b;
    });
  },

  getBookById(bookId) {
    const all = this.getAllBooks();
    return all.find(b => b.id === bookId) || all[0];
  },

  getActiveBook() {
    return this.getBookById(this.state.activeBookId);
  },

  setActiveBook(bookId) {
    this.state.activeBookId = bookId;
    this.save();
  },

  setBookPosition(bookId, positionType) {
    if (!this.state.positionOverrides) this.state.positionOverrides = {};
    this.state.positionOverrides[bookId] = positionType;
    const customIdx = (this.state.customBooks || []).findIndex(b => b.id === bookId);
    if (customIdx >= 0) {
      this.state.customBooks[customIdx].positionType = positionType;
    }
    this.save();
  },

  deleteCustomBook(bookId) {
    this.state.customBooks = (this.state.customBooks || []).filter(b => b.id !== bookId);
    if (this.state.positionOverrides) delete this.state.positionOverrides[bookId];
    delete this.state.readChapters[bookId];
    delete this.state.completedCheckpoints[bookId];
    delete this.state.bookNotes[bookId];
    this._ensureValidActiveBook();
    this.save();
  },

  // 计算单本书的“认知吸收率”（综合章节阅读进度 + 速读自检清单完成度）
  getBookProgress(bookId) {
    const book = this.getBookById(bookId);
    if (!book) return { percent: 0, readCount: 0, totalChapters: 0, cpCount: 0, totalCp: 0, doneItems: 0, totalItems: 0 };

    const totalChapters = (book.chapters || []).length;
    const readMap = this.state.readChapters[bookId] || {};
    const readCount = (book.chapters || []).filter(ch => readMap[ch.num]).length;

    const checkpoints = (book.speedReadGuide && book.speedReadGuide.checkpoints) || [];
    const totalCp = checkpoints.length;
    const cpMap = this.state.completedCheckpoints[bookId] || {};
    const cpCount = checkpoints.filter(cp => cpMap[cp.id]).length;

    const totalItems = totalChapters + totalCp;
    const doneItems = readCount + cpCount;
    const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return { percent, readCount, totalChapters, cpCount, totalCp, doneItems, totalItems };
  },

  // 计算全书库综合认知净值与各赛道吸收率
  getTotalPortfolioProgress() {
    const books = this.getAllBooks();
    let totalDone = 0;
    let totalItems = 0;
    let totalReadChapters = 0;
    let totalChapters = 0;
    let totalCpDone = 0;
    let totalCp = 0;

    books.forEach(b => {
      const p = this.getBookProgress(b.id);
      totalDone += p.doneItems;
      totalItems += p.totalItems;
      totalReadChapters += p.readCount;
      totalChapters += p.totalChapters;
      totalCpDone += p.cpCount;
      totalCp += p.totalCp;
    });

    const percent = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
    return {
      percent,
      totalDone,
      totalItems,
      totalReadChapters,
      totalChapters,
      totalCpDone,
      totalCp
    };
  },

  toggleChapterRead(bookId, chapterNum) {
    if (!this.state.readChapters[bookId]) {
      this.state.readChapters[bookId] = {};
    }
    this.state.readChapters[bookId][chapterNum] = !this.state.readChapters[bookId][chapterNum];
    this.save();
  },

  markAllChaptersRead(bookId, status = true) {
    const book = this.getBookById(bookId);
    if (!book) return;
    if (!this.state.readChapters[bookId]) {
      this.state.readChapters[bookId] = {};
    }
    (book.chapters || []).forEach(ch => {
      this.state.readChapters[bookId][ch.num] = status;
    });
    this.save();
  },

  toggleCheckpoint(bookId, cpId) {
    if (!this.state.completedCheckpoints[bookId]) {
      this.state.completedCheckpoints[bookId] = {};
    }
    this.state.completedCheckpoints[bookId][cpId] = !this.state.completedCheckpoints[bookId][cpId];
    this.save();
  },

  toggleMaximMastered(maximKey) {
    this.state.masteredMaxims[maximKey] = !this.state.masteredMaxims[maximKey];
    this.save();
  },

  addNote(bookId, tag, content, chapterNum = "") {
    if (!this.state.bookNotes[bookId]) {
      this.state.bookNotes[bookId] = [];
    }
    this.state.bookNotes[bookId].unshift({
      id: "note-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      tag: tag || "读书笔记",
      chapterNum: chapterNum || "",
      content
    });
    this.save();
  },

  deleteNote(bookId, noteId) {
    if (!this.state.bookNotes[bookId]) return;
    this.state.bookNotes[bookId] = this.state.bookNotes[bookId].filter(n => n.id !== noteId);
    this.save();
  },

  addStockEvaluation(evalObj) {
    this.state.stockEvaluations.unshift({
      id: "eval-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...evalObj
    });
    this.save();
  },

  updateStockEvaluation(evalId, evalObj) {
    const idx = (this.state.stockEvaluations || []).findIndex(e => e.id === evalId);
    if (idx === -1) {
      this.addStockEvaluation(evalObj);
      return;
    }
    const prev = this.state.stockEvaluations[idx];
    this.state.stockEvaluations[idx] = {
      ...prev,
      ...evalObj,
      id: prev.id,
      updatedDate: new Date().toISOString().slice(0, 10)
    };
    this.save();
  },

  getStockEvaluationById(evalId) {
    return (this.state.stockEvaluations || []).find(e => e.id === evalId) || null;
  },

  deleteStockEvaluation(evalId) {
    this.state.stockEvaluations = this.state.stockEvaluations.filter(e => e.id !== evalId);
    this.save();
  },

  addCustomBook(bookObj) {
    this.state.customBooks.push(bookObj);
    this.state.activeBookId = bookObj.id;
    this.save();
  },

  // ==================== 数据备份导出与恢复 ====================
  exportBackupPayload() {
    return JSON.stringify(
      {
        app: "FAST_GROWTH_GUIDE",
        version: "2.5",
        exportedAt: new Date().toISOString(),
        state: this.state
      },
      null,
      2
    );
  },

  importBackupPayload(rawText) {
    const parsed = JSON.parse(rawText);
    const candidateState = parsed && typeof parsed === "object" && parsed.state ? parsed.state : parsed;
    if (!candidateState || typeof candidateState !== "object") {
      throw new Error("备份格式无效：未找到有效状态对象");
    }
    const hasExpectedKeys =
      "readChapters" in candidateState ||
      "completedCheckpoints" in candidateState ||
      "stockEvaluations" in candidateState ||
      "bookNotes" in candidateState;
    if (!hasExpectedKeys) {
      throw new Error("备份内容不匹配：未检测到阅读进度或持仓体检字段");
    }
    this.state = this._mergeWithDefaults(candidateState);
    this._ensureValidActiveBook();
    this.save();

    const noteCount = Object.values(this.state.bookNotes || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    const evalCount = (this.state.stockEvaluations || []).length;
    const customCount = (this.state.customBooks || []).length;
    return { noteCount, evalCount, customCount };
  }
};
