import { Network } from "lucide-react";

function RoadmapEmptyState() {
  return (
    <div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center ">
      <Network className="mx-auto h-12 w-12 text-gray-300" />
      <span className="mt-2 block text-sm font-semibold text-gray-900">
        Generate a new roadmap
      </span>
    </div>
  );
}
const Instructions = () => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <RoadmapEmptyState />
      </div>
    </div>
  );
};

export default Instructions;
