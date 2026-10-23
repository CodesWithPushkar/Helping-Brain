import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  return (
    <div className="my-2 rounded-xl overflow-hidden bg-[#14161D]">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[10px] font-mono font-medium tracking-wide text-white/50 uppercase bg-white/10 px-2 py-0.5 rounded-md">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-medium text-white/40 hover:text-white/90 transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "4px 16px 16px",
          fontSize: "12.5px",
          background: "transparent",
        }}
        wrapLongLines
      >
        {code.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MessageContent({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 decoration-black/30 hover:decoration-black"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-2 border-black/15 text-[#1B1E2A]/70">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-black/10 px-2 py-1 bg-black/[0.03] text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-black/10 px-2 py-1">{children}</td>
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match);
            const text = String(children).replace(/\n$/, "");

            if (!isBlock) {
              return (
                <code
                  className="px-1 py-0.5 rounded bg-black/[0.06] text-[#1B1E2A] text-[0.85em] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match![1]} code={text} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}