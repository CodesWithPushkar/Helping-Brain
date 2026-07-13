type WorkspaceCardProps = {
  name: string;
};

function getInitials(text: string): string {
  if (!text.trim()) return "";

  const words = text.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function WorkspaceCard({ name }: WorkspaceCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-yello text-black font-bold flex items-center justify-center font-serif shrink-0">
        {getInitials(name)}
      </div>
    </div>
  );
}