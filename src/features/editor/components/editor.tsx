"use client";

import { Errorview, Loadingview } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

export const EditorLoading = () => {
  return <Loadingview message="Loading Editor" />;
};

export const EditorError = () => {
  return <Errorview message="Error loading Editor" />;
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  return <p>{JSON.stringify(workflow, null, 2)}</p>;
};
