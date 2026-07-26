import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Link2 } from "lucide-react";

const PageLinkNode = (onNavigate: (pageId: number) => void) =>
  Node.create({
    name: "pageLink",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
      return {
        pageId: { default: null },
        title: { default: "" },
      };
    },

    parseHTML() {
      return [{ tag: "span[data-page-link]" }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["span", mergeAttributes(HTMLAttributes, { "data-page-link": "" })];
    },

    addNodeView() {
      return ReactNodeViewRenderer((props: any) => (
        <PageLinkView {...props} onNavigate={onNavigate} />
      ));
    },
  });

function PageLinkView({ node, onNavigate }: any) {
  const { pageId, title } = node.attrs;

  return (
    <NodeViewWrapper as="span" className="inline-block">
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigate(pageId);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper-dim border border-line text-sm text-ink hover:border-ink-soft transition-colors cursor-pointer"
      >
        <Link2 size={12} />
        {title}
      </span>
    </NodeViewWrapper>
  );
}

export default PageLinkNode;