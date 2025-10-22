export default async function LobbyPage({
  params,
}: {
  params: Promise<{ lang: string; roomCode: string }>;
}) {
  const { roomCode } = await params;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          Game Lobby - {roomCode}
        </p>
        <p className="text-center">
          This is a placeholder lobby page. Full lobby implementation will be
          done in Phase 2, Point 3.
        </p>
      </div>
    </div>
  );
}
