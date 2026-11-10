#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
「快速成长指南」新书 EPUB 自动解析与拆书草稿生成工具
用法：
  把任意新的 .epub 电子书放进 /Users/frank/Desktop/快速阅读/ 目录下，
  运行：python3 tools/parse_epub.py
即可在 tools/extracted/ 下生成该书的完整纯文本章节与目录结构，方便快速深度精读并接入 data/books/！
"""

import os
import re
import zipfile
import xml.etree.ElementTree as ET

def extract_epub(epub_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(epub_path))[0]
    safe_name = re.sub(r"[^\w\u4e00-\u9fa5\-]+", "_", base_name)[:40]
    md_path = os.path.join(out_dir, f"{safe_name}_fulltext.md")

    total_chars = 0
    chapters_summary = []

    with zipfile.ZipFile(epub_path, "r") as z, open(md_path, "w", encoding="utf-8") as out:
        out.write(f"# {base_name}\n\n")
        # 1. 尝试解析 toc.ncx
        ncx_files = [n for n in z.namelist() if n.endswith(".ncx")]
        if ncx_files:
            out.write("## 目录 (TOC)\n\n")
            try:
                toc_xml = z.read(ncx_files[0]).decode("utf-8", errors="ignore")
                root = ET.fromstring(toc_xml)
                for nav in root.iter():
                    if nav.tag.endswith("navPoint"):
                        label = ""
                        src = ""
                        for child in nav:
                            if child.tag.endswith("navLabel"):
                                for t in child:
                                    if t.tag.endswith("text") and t.text:
                                        label = t.text.strip()
                            elif child.tag.endswith("content"):
                                src = child.attrib.get("src", "")
                        if label:
                            out.write(f"- {label} (`{src}`)\n")
            except Exception as e:
                out.write(f"- TOC解析提示: {e}\n")
            out.write("\n---\n\n")

        # 2. 提取所有正文章节
        for name in sorted(z.namelist()):
            if name.endswith((".html", ".xhtml", ".htm")):
                raw = z.read(name).decode("utf-8", errors="ignore")
                raw = re.sub(r"</(p|h1|h2|h3|h4|li|tr|div)>", "\n", raw)
                text = re.sub(r"<[^>]+>", "", raw)
                lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
                lines = [l for l in lines if l]
                char_count = sum(len(l) for l in lines)
                total_chars += char_count
                preview = lines[0][:60] if lines else ""
                chapters_summary.append((name, char_count, preview))
                out.write(f"\n\n## [{name}] ({char_count} 字)\n\n")
                out.write("\n".join(lines))

    print(f"✅ 已解析: {base_name}")
    print(f"   总字数: 约 {total_chars:,} 字 | 章节文件数: {len(chapters_summary)}")
    print(f"   输出文件: {md_path}\n")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root_dir, "tools", "extracted")
    epubs = [f for f in os.listdir(root_dir) if f.lower().endswith(".epub")]
    if not epubs:
        print("未在根目录下发现 .epub 文件。请将电子书放入根目录后重试。")
        return
    print(f"📚 发现 {len(epubs)} 本 EPUB 电子书，开始提取...")
    for epub in epubs:
        extract_epub(os.path.join(root_dir, epub), out_dir)

if __name__ == "__main__":
    main()
