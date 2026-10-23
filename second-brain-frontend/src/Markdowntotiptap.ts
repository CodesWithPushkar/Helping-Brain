function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFormat(str: string) {
  return escapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function markdownToTiptapHTML(markdown: string): string {
  const blocks = markdown.split(/```(\w+)?\n([\s\S]*?)```/g);
  let html = "";

  for (let i = 0; i < blocks.length; i += 3) {
    const textPart = blocks[i];
    const lang = blocks[i + 1];
    const code = blocks[i + 2];

    if (textPart && textPart.trim()) {
      html += textPart
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para) => {
          const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
          const isBulletList = lines.every((l) => /^[-*]\s+/.test(l));
          const isOrderedList = lines.every((l) => /^\d+[.)]\s+/.test(l));

          if (isBulletList) {
            return `<ul>${lines
              .map((l) => `<li>${inlineFormat(l.replace(/^[-*]\s+/, ""))}</li>`)
              .join("")}</ul>`;
          }
          if (isOrderedList) {
            return `<ol>${lines
              .map((l) => `<li>${inlineFormat(l.replace(/^\d+[.)]\s+/, ""))}</li>`)
              .join("")}</ol>`;
          }
          return `<p>${inlineFormat(para)}</p>`;
        })
        .join("");
    }

    if (code !== undefined) {
      html += `<pre><code class="language-${lang || "text"}">${escapeHtml(
        code.replace(/\n$/, "")
      )}</code></pre>`;
    }
  }

  return html || `<p>${inlineFormat(markdown)}</p>`;
}