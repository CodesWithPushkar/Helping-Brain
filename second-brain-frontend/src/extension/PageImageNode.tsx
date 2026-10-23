import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import api from "../api/axios";

const PageImageNode = Node.create({
  name: "pageImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      imageId: { default: null },
      alt: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-page-image]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-page-image": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageImageView);
  },
});

function PageImageView({ node }: NodeViewProps) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const imageId = node.attrs.imageId as number | null;
  const alt = node.attrs.alt as string;

  useEffect(() => {
    if (!imageId) return;
    let objectUrl = "";
    let active = true;
    const token = localStorage.getItem("token");

    api.get(`/page-images/${imageId}`, {
      headers: { Authorization: token },
      responseType: "blob",
    }).then((response) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(response.data);
      setSrc(objectUrl);
    }).catch((error: unknown) => {
      console.error("Page image load failed:", error);
      if (active) setFailed(true);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  return (
    <NodeViewWrapper className="my-4">
      {src ? (
        <img src={src} alt={alt} className="max-h-[70vh] max-w-full rounded-xl object-contain" />
      ) : (
        <span className="inline-block rounded-lg bg-[#F4F0E6] px-3 py-2 text-xs text-[#6B6876]">
          {failed ? "Image could not be loaded" : "Loading image…"}
        </span>
      )}
    </NodeViewWrapper>
  );
}

export default PageImageNode;
