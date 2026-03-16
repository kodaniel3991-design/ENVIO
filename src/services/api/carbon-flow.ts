import type { CarbonFlowNode } from "@/types";
import { mockCarbonFlowRoot } from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import { CarbonFlowNodeSchema } from "@/lib/schemas";

export async function getCarbonFlowTree(): Promise<CarbonFlowNode> {
  return apiCall(async () => {
    await delay(250);
    return CarbonFlowNodeSchema.parse(mockCarbonFlowRoot) as CarbonFlowNode;
  });
}
