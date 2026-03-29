/**
 * API 커넥터 레지스트리
 * sourceType → connector 매핑
 */
import type { ApiConnector } from "./types";
import { kepcoConnector } from "./kepco";

const connectors: Record<string, ApiConnector> = {
  kepco: kepcoConnector,
};

export function getConnector(sourceType: string): ApiConnector | null {
  return connectors[sourceType] ?? null;
}

export type { ApiConnector, ConnectorConfig, SyncResult, MonthlyActivityResult } from "./types";
