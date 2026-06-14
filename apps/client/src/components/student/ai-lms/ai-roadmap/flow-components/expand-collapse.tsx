import { HierarchyNode, hierarchy } from "d3-hierarchy";
import { Loader2 } from "lucide-react";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/base.css";
import "reactflow/dist/style.css";
import { Node } from "@/lib/shared/types/common";
import { Drawer } from "./drawer";
import ReactFlowPro from "./react-flow-pro";

type Props = {
  data?: Node[] | null;
  isPending: boolean;
  roadmapId?: string;
};

function ExpandCollapse(props: Props) {
  const { data, isPending, roadmapId } = props;

  if (isPending)
    return (
      <div className="w-full h-[86vh] flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  if (!data?.length || data[0] == null) {
    return (
      <div className="flex h-[86vh] w-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Roadmap content is not available yet. Try going back and opening this roadmap again, or generate a new one.
      </div>
    );
  }

  const h: HierarchyNode<unknown> = hierarchy<unknown>(data[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h.descendants().forEach((d: any, i: number) => {
    d.id = `${i}`;
    d._children = d.children;
    d.children = null;
  });

  return (
    <div className="w-full h-[84vh]">
      <ReactFlowProvider>
        <Drawer roadmapId={roadmapId} />
        <ReactFlowPro {...props} h={h} />
      </ReactFlowProvider>
    </div>
  );
}

export default ExpandCollapse;
