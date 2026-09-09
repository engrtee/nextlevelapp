// Builds downloadable resume files (docx, PDF, plain text) from generated resume text.
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { jsPDF } from "jspdf";

export async function buildDocxBlob(resumeText: string): Promise<Blob> {
  const paragraphs = resumeText.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return new Paragraph({ text: "" });
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 60) {
      return new Paragraph({ text: trimmed, heading: HeadingLevel.HEADING_2 });
    }
    return new Paragraph({ text: trimmed });
  });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBlob(doc);
}

export function buildPdfBlob(resumeText: string): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginLeft = 40;
  const marginTop = 50;
  const lineHeight = 14;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pdf.internal.pageSize.getWidth() - marginLeft * 2;

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(11);

  let y = marginTop;
  for (const rawLine of resumeText.split("\n")) {
    const wrapped = pdf.splitTextToSize(rawLine || " ", maxWidth);
    for (const line of wrapped) {
      if (y > pageHeight - marginTop) {
        pdf.addPage();
        y = marginTop;
      }
      pdf.text(line, marginLeft, y);
      y += lineHeight;
    }
  }

  return pdf.output("blob");
}

export function buildTextBlob(resumeText: string): Blob {
  return new Blob([resumeText], { type: "text/plain" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
