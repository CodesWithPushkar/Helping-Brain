import type { JSONContent } from "@tiptap/core";

type TextEdit = { start: number; end: number; replacement: string };

function getSingleTextEdit(base: string, changed: string): TextEdit {
  let start = 0;
  while (start < base.length && start < changed.length && base[start] === changed[start]) {
    start += 1;
  }

  let baseEnd = base.length;
  let changedEnd = changed.length;
  while (
    baseEnd > start &&
    changedEnd > start &&
    base[baseEnd - 1] === changed[changedEnd - 1]
  ) {
    baseEnd -= 1;
    changedEnd -= 1;
  }

  return { start, end: baseEnd, replacement: changed.slice(start, changedEnd) };
}

export function mergeTextChanges(base: string, local: string, remote: string): string | null {
  if (local === base) return remote;
  if (remote === base || local === remote) return local;

  const edits = [getSingleTextEdit(base, local), getSingleTextEdit(base, remote)];
  const [first, second] = edits;
  const firstIsInsert = first.start === first.end;
  const secondIsInsert = second.start === second.end;

  if (
    (firstIsInsert && secondIsInsert && first.start === second.start) ||
    (firstIsInsert && first.start > second.start && first.start < second.end) ||
    (secondIsInsert && second.start > first.start && second.start < first.end) ||
    (first.start < second.end && second.start < first.end) ||
    first.start === second.start
  ) {
    return null;
  }

  return edits
    .sort((left, right) => right.start - left.start)
    .reduce(
      (text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end),
      base,
    );
}

export function mergePageContent(
  base: JSONContent,
  local: JSONContent,
  remote: JSONContent,
): JSONContent | null {
  const same = (left: JSONContent, right: JSONContent) =>
    JSON.stringify(left) === JSON.stringify(right);
  if (same(local, base)) return remote;
  if (same(remote, base) || same(local, remote)) return local;
  if (
    base.type !== local.type ||
    base.type !== remote.type ||
    JSON.stringify(base.attrs) !== JSON.stringify(local.attrs) ||
    JSON.stringify(base.attrs) !== JSON.stringify(remote.attrs) ||
    JSON.stringify(base.marks) !== JSON.stringify(local.marks) ||
    JSON.stringify(base.marks) !== JSON.stringify(remote.marks)
  ) {
    return null;
  }

  if (base.text !== undefined && local.text !== undefined && remote.text !== undefined) {
    const text = mergeTextChanges(base.text, local.text, remote.text);
    return text === null ? null : { ...base, text };
  }

  const baseChildren = base.content ?? [];
  const localChildren = local.content ?? [];
  const remoteChildren = remote.content ?? [];
  if (
    baseChildren.length !== localChildren.length ||
    baseChildren.length !== remoteChildren.length
  ) {
    return null;
  }

  const children: JSONContent[] = [];
  for (let index = 0; index < baseChildren.length; index += 1) {
    const merged = mergePageContent(
      baseChildren[index],
      localChildren[index],
      remoteChildren[index],
    );
    if (!merged) return null;
    children.push(merged);
  }

  return { ...base, ...(children.length > 0 && { content: children }) };
}
