// 「快速成长指南」本地持久化状态引擎（类“我的持仓簿”数据层）
const STORAGE_KEY = "FAST_GROWTH_GUIDE_STATE_V1";

const DEFAULT_STATE = {
  activeBookId: "",
  selectedCategory: "all",
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
  // 护城河实战体检记录（与“我的持仓簿”联动）
  stockEvaluations: [
    {
      id: "eval-demo-fastenal",
      date: "2026-11-10",
      name: "快扣 (Fastenal / 书中第11章标杆案例)",
      ticker: "FAST",
      roicPass: "yes",
      roicNote: "连续10年ROIC > 20%，且几乎零有息负债",
      moatTypes: ["cost", "scale"],
      moatDetail: "全美2000家门店（老二仅一半）+ 自有配送车队，卖沉重且低价的螺丝紧固件，在小城市形成50英里半径地理位置与规模垄断。",
      erosionRisks: [],
      moatRating: "wide",
      valuationStatus: "fair",
      cashReturnRate: "6.8%",
      sellSignalCount: 0,
      verdict: "核心宽护城河 · 值得长期重仓持有"
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
        this.state = {
          ...DEFAULT_STATE,
          ...parsed,
          completedCheckpoints: { ...DEFAULT_STATE.completedCheckpoints, ...(parsed.completedCheckpoints || {}) },
          readChapters: { ...DEFAULT_STATE.readChapters, ...(parsed.readChapters || {}) },
          bookNotes: { ...DEFAULT_STATE.bookNotes, ...(parsed.bookNotes || {}) }
        };
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } catch (e) {
      console.warn("LocalStorage load fallback:", e);
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    if (!this.state.activeBookId) {
      const firstBook = this.getAllBooks()[0];
      if (firstBook) this.state.activeBookId = firstBook.id;
    }
    return this.state;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  },

  getAllBooks() {
    const builtins = window.BUILTIN_BOOKS || [];
    const customs = this.state.customBooks || [];
    return [...builtins, ...customs];
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

  // 计算单本书的“认知吸收率”（综合章节阅读进度 + 速读自检清单完成度）
  getBookProgress(bookId) {
    const book = this.getBookById(bookId);
    if (!book) return { percent: 0, readCount: 0, totalChapters: 0, cpCount: 0, totalCp: 0 };

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

  addNote(bookId, tag, content) {
    if (!this.state.bookNotes[bookId]) {
      this.state.bookNotes[bookId] = [];
    }
    this.state.bookNotes[bookId].unshift({
      id: "note-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      tag: tag || "读书笔记",
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

  deleteStockEvaluation(evalId) {
    this.state.stockEvaluations = this.state.stockEvaluations.filter(e => e.id !== evalId);
    this.save();
  },

  addCustomBook(bookObj) {
    this.state.customBooks.push(bookObj);
    this.state.activeBookId = bookObj.id;
    this.save();
  }
};
