import { Question, QuestionProgress } from '../types';

export function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateNotionMarkdown(
  questions: Question[],
  progressMap: Record<number, QuestionProgress>,
  filter: 'all' | 'bookmarked' | 'mistakes' = 'bookmarked'
): string {
  let targetQuestions = questions;
  if (filter === 'bookmarked') {
    targetQuestions = questions.filter((q) => progressMap[q.id]?.bookmarked);
  } else if (filter === 'mistakes') {
    targetQuestions = questions.filter((q) => (progressMap[q.id]?.incorrectCount || 0) > 0);
  }

  const lines: string[] = [
    `# 🎓 NACC / PSW Certification Exam Study Notes & Cheatsheet`,
    `*Generated on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | Total Questions: ${targetQuestions.length}*`,
    ``,
    `> **Active Filter:** ${filter.toUpperCase()}`,
    ``,
    `---`,
    ``,
  ];

  targetQuestions.forEach((q) => {
    const prog = progressMap[q.id];
    const isBookmarked = prog?.bookmarked ? '⭐ Bookmarked' : '';
    const mistakes = prog?.incorrectCount ? `⚠️ Mistakes: ${prog.incorrectCount}` : '';
    const tags = [isBookmarked, mistakes, q.category].filter(Boolean).join(' | ');

    lines.push(`### Ticket #${q.num}: ${q.questionEn}`);
    if (tags) {
      lines.push(`*(${tags})*`);
    }
    lines.push(``);
    lines.push(`**Options:**`);
    q.options.forEach((opt) => {
      const isCorrectMark = opt.id === q.correctOptionId ? ' ✅ **[CORRECT]**' : '';
      lines.push(`- **${opt.id}.** ${opt.textEn}${isCorrectMark}`);
    });
    lines.push(``);
    lines.push(`> 💡 **Clinical Rationale:** ${q.explanation}`);
    if (q.howToRemember) {
      lines.push(`> 🧠 **Memory Aid:** ${q.howToRemember}`);
    }
    if (q.questionUa) {
      lines.push(`> 🌐 **Reference Translation:** ${q.questionUa}`);
    }
    if (prog?.notes) {
      lines.push(``);
      lines.push(`**📝 Personal Note:** ${prog.notes}`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  });

  return lines.join('\n');
}

export function printCheatSheet(
  questions: Question[],
  filterName: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF cheat sheet.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NACC PSW Exam Cheat Sheet - ${filterName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.45;
      color: #111827;
      background: #fff;
      padding: 24px;
      margin: 0;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }
    .question-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      margin-bottom: 8px;
    }
    .q-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #0f172a;
    }
    .q-ua {
      font-size: 13px;
      color: #0369a1;
      margin-bottom: 10px;
    }
    .options {
      margin: 8px 0;
      padding-left: 0;
      list-style: none;
    }
    .option {
      font-size: 13px;
      padding: 4px 8px;
      margin-bottom: 4px;
      border-radius: 4px;
    }
    .option.correct {
      background: #dcfce7;
      font-weight: 600;
      color: #166534;
      border: 1px solid #86efac;
    }
    .rationale {
      font-size: 12px;
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      padding: 8px 12px;
      margin-top: 10px;
      color: #334155;
    }
    .mnemonic {
      font-size: 12px;
      background: #fefce8;
      border-left: 3px solid #eab308;
      padding: 6px 12px;
      margin-top: 6px;
      color: #854d0e;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">🖨️ Print / Save as PDF</button>
    <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; cursor: pointer;">Close</button>
  </div>
  <div class="header">
    <h1>🇨🇦 NACC / PSW Exam Study Guide & Ticket Review</h1>
    <p>Filter: ${filterName} | Total Tickets: ${questions.length} | Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  ${questions
    .map(
      (q) => `
    <div class="question-card">
      <div class="badge">${q.category} · Ticket #${q.num}</div>
      <div class="q-title">${q.num}. ${q.questionEn}</div>
      ${q.questionUa ? `<div class="q-ua" style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Reference: ${q.questionUa}</div>` : ''}
      <ul class="options">
        ${q.options
          .map(
            (opt) => `
          <li class="option ${opt.id === q.correctOptionId ? 'correct' : ''}">
            <strong>${opt.id}.</strong> ${opt.textEn}
            ${opt.id === q.correctOptionId ? ' ✓ [CORRECT]' : ''}
          </li>
        `
          )
          .join('')}
      </ul>
      <div class="rationale">
        <strong>💡 Rationale:</strong> ${q.explanation}
      </div>
      ${
        q.howToRemember
          ? `<div class="mnemonic"><strong>🧠 Memory Aid:</strong> ${q.howToRemember}</div>`
          : ''
      }
    </div>
  `
    )
    .join('')}
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
