const fs = require("fs");
const path = require("path");

const outDir = path.join(process.cwd(), "samples");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "demo-income-statement.pdf");

const lines = [
  "Demo Income Statement",
  "Company: Acme Industries Ltd",
  "Period: FY 2024",
  "Revenue 1250000",
  "Cost of Goods Sold 640000",
  "Gross Profit 610000",
  "Operating Expenses 210000",
  "Operating Income 400000",
  "Net Income 305000",
  "Currency: USD",
  "Units: Whole",
];

const textOps = ["BT", "/F1 12 Tf", "72 760 Td"];
for (let i = 0; i < lines.length; i += 1) {
  const safe = lines[i].replace(/[()\\]/g, "\\$&");
  if (i === 0) textOps.push(`(${safe}) Tj`);
  else textOps.push(`T* (${safe}) Tj`);
}
textOps.push("ET");
const stream = textOps.join("\n");

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
];

let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
const offsets = [0];
for (let i = 0; i < objects.length; i += 1) {
  offsets.push(Buffer.byteLength(pdf, "latin1"));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}

const xrefStart = Buffer.byteLength(pdf, "latin1");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i < offsets.length; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
pdf += `startxref\n${xrefStart}\n%%EOF\n`;

fs.writeFileSync(outFile, Buffer.from(pdf, "latin1"));
console.log(outFile);
