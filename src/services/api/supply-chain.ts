import type { SupplyChainNode } from "@/types";
import { mockSupplyChainRoot } from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import { SupplyChainNodeSchema } from "@/lib/schemas";

export async function getSupplyChainTree(): Promise<SupplyChainNode> {
  return apiCall(async () => {
    await delay(300);
    return SupplyChainNodeSchema.parse(mockSupplyChainRoot) as SupplyChainNode;
  });
}
