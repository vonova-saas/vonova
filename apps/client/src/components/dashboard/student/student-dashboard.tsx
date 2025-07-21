export default function StudentDashboard() {
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[500px] flex-1 rounded-xl" />
      <div className="w-full overflow-x-auto py-8">
        <div className="flex gap-6 px-4 md:px-12 snap-x snap-mandatory">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-muted/50 min-h-[80vh] min-w-[80vw] md:min-w-[350px] flex-1 rounded-xl snap-center flex items-center justify-center text-2xl font-bold shadow-md"
            >
              Card {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-muted/50 min-h-[450px] flex-1 rounded-xl" />
    </>
  );
}
