import { useState } from "react";
import { X } from "lucide-react";

export interface NewWorkshopFormPayload {
  name: string;
}

interface NewWorkspaceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (page: NewWorkshopFormPayload) => void;
}

export default function NewWorkspaceForm({
  isOpen,
  onClose,
  onCreate,
}: NewWorkspaceFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the Workshop a name to continue.");
      return;
    }

    onCreate({ name: trimmed});
    setName("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14192B]/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#F7F5EE] border border-black/10 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-semibold text-[#1B1E2A] text-lg">New Workshop</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-[#6B6E7C] hover:text-[#1B1E2A] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 pb-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="folder-name" className="text-xs font-semibold text-[#1B1E2A]">
                Name
              </label>
              <input
                id="folder-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. My Workshop"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#1B1E2A] outline-none focus:border-[#3F8F82]"
              />
              {error && <span className="text-xs text-[#B4553F]">{error}</span>}
            </div>


  
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#6B6E7C] hover:text-[#1B1E2A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#14192B] px-4 py-2 text-sm font-semibold text-[#F7F5EE] hover:bg-[#1E2540]"
            >
              Create Workshop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
