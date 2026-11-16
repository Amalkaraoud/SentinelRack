const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Footer, PageNumber, HeadingLevel, VerticalAlign } = require("docx");
const { execSync } = require("child_process");
const dims = (f) => execSync(`python3 -c "from PIL import Image;im=Image.open('${f}');print(im.width,im.height)"`).toString().trim().split(" ").map(Number);
const FONT = "Times New Roman", K = "000000";
const R = (t, o = {}) => new TextRun({ text: t, font: FONT, size: o.size || 22, color: K, bold: o.bold, italics: o.italics });
const P = (t, o = {}) => new Paragraph({ spacing: { after: 110, line: 276 }, alignment: o.align || AlignmentType.JUSTIFIED, children: (Array.isArray(t) ? t : [t]).map(x => typeof x === "string" ? R(x, o) : x) });
const B = (t) => new Paragraph({ spacing: { after: 60, line: 270 }, indent: { left: 360, hanging: 240 }, alignment: AlignmentType.LEFT, children: [R("– " + t)] });
const line = (sz) => ({ style: BorderStyle.SINGLE, size: sz, color: K });
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 280, after: 100 }, border: { bottom: line(6) }, children: [R(t, { bold: true, size: 26 })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 160, after: 60 }, children: [R(t, { bold: true, size: 23 })] });
const img = (f, wIn, cap) => { const [w, h] = dims(f); const W = Math.round(wIn * 96), H = Math.round(W * h / w);
  const type = f.endsWith(".jpg") ? "jpg" : "png";
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 }, keepNext: true, children: [new ImageRun({ type, data: fs.readFileSync(f), transformation: { width: W, height: H }, altText: { title: cap, description: cap, name: cap } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [R(cap, { size: 19, italics: true })] })]; };
const table = (rows, widths) => {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, alignment: AlignmentType.CENTER,
    rows: rows.map((r, i) => new TableRow({ tableHeader: i === 0, cantSplit: true, children: r.map((c, j) => new TableCell({
      width: { size: widths[j], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, margins: { top: 50, bottom: 50, left: 80, right: 80 },
      borders: { top: line(i === 0 ? 12 : 4), bottom: line(i === 0 || i === rows.length - 1 ? 12 : 4), left: line(4), right: line(4) },
      children: [new Paragraph({ spacing: { after: 0 }, alignment: AlignmentType.LEFT, children: [R(String(c), { size: 18, bold: i === 0 })] })] })) })) });
};
const sp = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const code = (txt) => txt.split("\n").map(l => new Paragraph({ spacing: { after: 0 }, indent: { left: 300 }, children: [new TextRun({ text: l || " ", font: "Courier New", size: 17, color: K })] }));
const header = (title, sub) => {
  const logo = fs.readFileSync("assets/logo_fss_official.png");
  return [new Table({ width: { size: 9600, type: WidthType.DXA }, columnWidths: [1700, 7900], rows: [new TableRow({ children: [
    new TableCell({ width: { size: 1700, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: [new Paragraph({ children: [new ImageRun({ type: "png", data: logo, transformation: { width: 90, height: 89 }, altText: { title: "Logo", description: "Logo officiel de la Faculté des Sciences de Sfax", name: "logo" } })] })] }),
    new TableCell({ width: { size: 7900, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, borders: { top: none, bottom: none, left: none, right: none }, children: [
      new Paragraph({ spacing: { after: 20 }, children: [R("Faculté des Sciences de Sfax", { bold: true, size: 26 })] }),
      new Paragraph({ spacing: { after: 20 }, children: [R("Matière : MicroPython (MPI1) · Année universitaire 2026-2027", { size: 21 })] }),
      new Paragraph({ spacing: { after: 0 }, children: [R("Encadrante : Roua Torjmen", { size: 21 })] })] })] })] }),
    new Paragraph({ spacing: { before: 200, after: 40 }, border: { top: line(12) }, children: [] }),
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [R(title, { bold: true, size: 40 })] }),
    new Paragraph({ spacing: { after: 200 }, border: { bottom: line(12) }, children: [R(sub, { size: 21 })] })];
};
const build = (children, file) => {
  const doc = new Document({ creator: "Amal Karaoud", styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1153, right: 1153 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: K })] })] }) }, children }] });
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(file, b); console.log("ok", file); });
};
module.exports = { R, P, B, H1, H2, img, table, sp, code, header, build, line };
