// 书库注册中心（统一管理所有已深度拆解书籍与观察池书单）
// 以后每新增一本书，只需在 data/books/ 下新建一个 JS 文件，并在此数组注册即可！
window.BUILTIN_BOOKS = [
  window.BOOK_PAT_DORSEY_MOAT,
  window.BOOK_GRAHAM_INTELLIGENT,
  window.BOOK_TANGCHAO_REPORT,
  window.BOOK_HOWARD_IMPORTANT,
  window.BOOK_HOWARD_CYCLE,
  ...(window.PRESET_WATCHLIST_BOOKS || [])
].filter(Boolean);
