/**
 * API 연동 커넥터 공통 타입
 */

export interface SyncResult {
  status: "success" | "error" | "partial";
  recordsTotal: number;
  recordsSaved: number;
  recordsFailed: number;
  errorMessage?: string;
  /** 동기화된 상세 (facility, months 등) */
  detail?: Record<string, unknown>;
  durationMs: number;
}

export interface ConnectorConfig {
  endpoint: string;
  authType: "api_key" | "oauth2" | "basic" | "none";
  authConfig: Record<string, string>;
  fieldMapping?: Record<string, string>;
}

export interface MonthlyActivityResult {
  facilityId: string;
  facilityName: string;
  year: number;
  /** 12-element array, index 0 = January */
  values: number[];
  unit: string;
  source: string;
}

/**
 * 모든 커넥터가 구현해야 하는 인터페이스
 */
export interface ApiConnector {
  /** 연결 테스트 */
  testConnection(config: ConnectorConfig): Promise<{ ok: boolean; message: string }>;
  /** 데이터 동기화 실행 */
  sync(config: ConnectorConfig, year: number, facilityId?: string): Promise<SyncResult>;
  /** 사용 가능한 데이터 미리보기 */
  preview(config: ConnectorConfig, year: number): Promise<MonthlyActivityResult[]>;
}
