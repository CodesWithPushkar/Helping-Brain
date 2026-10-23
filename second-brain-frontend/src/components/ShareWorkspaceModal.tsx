import { useState } from "react";
import { Copy, Link2, Unlink, X } from "lucide-react";
import api from "../api/axios";

type ShareWorkspaceModalProps = {
  isOpen: boolean;
  workspaceId: number;
  workspaceName: string;
  onClose: () => void;
};

export default function ShareWorkspaceModal({
  isOpen,
  workspaceId,
  workspaceName,
  onClose,
}: ShareWorkspaceModalProps) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const headers = { Authorization: localStorage.getItem("token") };

  async function createInvite() {
    setBusy(true);
    setMessage("");
    try {
      const response = await api.post(
        `/workspace/${workspaceId}/invite-link`,
        {},
        { headers },
      );
      setInviteUrl(response.data.inviteUrl);
    } catch (error) {
      console.error(
        "Invite link creation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      setMessage("Could not create an invite link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("Invite link copied.");
    } catch (error) {
      console.error(
        "Invite link copy failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      setMessage("Copy failed. Select and copy the link above.");
    }
  }

  async function revokeInvite() {
    setBusy(true);
    setMessage("");
    try {
      await api.delete(`/workspace/${workspaceId}/invite-link`, { headers });
      setInviteUrl("");
      setMessage("The invite link has been revoked.");
    } catch (error) {
      console.error(
        "Invite link revocation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      setMessage("Could not revoke the invite link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14192B]/50 px-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-workspace-title"
        className="w-full max-w-md rounded-2xl border border-black/10 bg-[#F7F5EE] shadow-2xl"
      >
        <div className="flex items-start justify-between px-5 pt-5">
          <div>
            <h2 id="share-workspace-title" className="text-lg font-semibold text-[#1B1E2A]">
              Share workspace
            </h2>
            <p className="mt-1 text-sm text-[#6B6E7C]">{workspaceName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#6B6E7C] transition-colors hover:text-[#1B1E2A]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <p className="text-sm leading-6 text-[#505361]">
            Anyone with this link can join as an editor after signing in. The link stays active until you revoke it.
          </p>

          {inviteUrl && (
            <div className="flex gap-2">
              <input
                aria-label="Workspace invite link"
                readOnly
                value={inviteUrl}
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-[#1B1E2A]"
              />
              <button
                type="button"
                onClick={copyInvite}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm text-[#1B1E2A] hover:bg-black/5"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          )}

          {message && <p role="status" className="text-xs text-[#3F6F62]">{message}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={revokeInvite}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#9A4E43] hover:bg-[#9A4E43]/5 disabled:opacity-50"
          >
            <Unlink size={14} />
            Revoke link
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-[#6B6E7C] hover:text-[#1B1E2A]"
            >
              Done
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={createInvite}
              className="flex items-center gap-1.5 rounded-lg bg-[#14192B] px-3 py-2 text-sm font-medium text-[#F7F5EE] hover:bg-[#1E2540] disabled:opacity-50"
            >
              <Link2 size={14} />
              {busy ? "Please wait..." : "Generate link"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
