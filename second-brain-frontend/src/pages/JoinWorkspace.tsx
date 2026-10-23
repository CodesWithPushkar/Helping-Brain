import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function JoinWorkspace() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    token ? "Joining workspace..." : "This invite link is invalid.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!localStorage.getItem("token")) {
      navigate(`/signin?next=${encodeURIComponent(`/join/${token}`)}`, { replace: true });
      return;
    }

    let active = true;
    api.post(`/workspace/invite/${token}`, {}, {
      headers: { Authorization: localStorage.getItem("token") },
    }).then(() => {
      if (active) navigate("/dashboard", { replace: true });
    }).catch((error: unknown) => {
      console.error(
        "Workspace invite could not be accepted:",
        error instanceof Error ? error.message : "Unknown error",
      );
      if (active) setMessage("This invite link is invalid, revoked, or unavailable.");
    });

    return () => {
      active = false;
    };
  }, [navigate, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F3] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-6 text-center shadow-sm">
        <h1 className="font-serif text-xl font-semibold text-[#1B1E2A]">Helping Brain</h1>
        <p role="status" className="mt-3 text-sm text-[#6B6E7C]">{message}</p>
        {message.startsWith("This invite") && (
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-5 rounded-lg bg-[#14192B] px-4 py-2 text-sm font-medium text-white"
          >
            Back to dashboard
          </button>
        )}
      </div>
    </main>
  );
}
