import type { ComplianceItem } from "@/types";
import { mockComplianceItems } from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import { ComplianceItemSchema } from "@/lib/schemas";

export async function getComplianceStatus(): Promise<ComplianceItem[]> {
  return apiCall(async () => {
    await delay(280);
    return ComplianceItemSchema.array().parse(mockComplianceItems);
  });
}
