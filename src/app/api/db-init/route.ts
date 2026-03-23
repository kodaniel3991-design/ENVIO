import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function POST() {
  try {
    const pool = await getPool();

    // 1. 배출원 정보 테이블 (사용자 입력 시설)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'emission_facilities')
      CREATE TABLE emission_facilities (
        id            NVARCHAR(50)   NOT NULL PRIMARY KEY,
        scope         INT            NOT NULL CHECK (scope IN (1, 2, 3)),
        facility_name NVARCHAR(200)  NOT NULL,
        fuel_type     NVARCHAR(100)  NULL,
        energy_type   NVARCHAR(100)  NULL,
        activity_type NVARCHAR(200)  NULL,
        unit          NVARCHAR(50)   NOT NULL,
        data_method   NVARCHAR(100)  NOT NULL,
        sort_order    INT            NOT NULL DEFAULT 0,
        created_at    DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at    DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // category_id 컬럼 추가 (기존 테이블 대응 - idempotent)
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('emission_facilities')
        AND name = 'category_id'
      )
      ALTER TABLE emission_facilities
        ADD category_id NVARCHAR(50) NOT NULL DEFAULT 'fixed';
    `);

    // 2. 월별 활동량 테이블
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'activity_data')
      CREATE TABLE activity_data (
        id             INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
        facility_id    NVARCHAR(50)   NOT NULL
                         REFERENCES emission_facilities(id) ON DELETE CASCADE,
        year           INT            NOT NULL,
        month          INT            NOT NULL CHECK (month BETWEEN 1 AND 12),
        activity_value DECIMAL(18,6)  NOT NULL DEFAULT 0,
        created_at     DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at     DATETIME2      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_activity_data UNIQUE (facility_id, year, month)
      );
    `);

    // 3. 첨부파일 테이블
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'activity_attachments')
      CREATE TABLE activity_attachments (
        id           INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
        facility_id  NVARCHAR(50)   NOT NULL
                       REFERENCES emission_facilities(id) ON DELETE CASCADE,
        year         INT            NOT NULL,
        month        INT            NOT NULL CHECK (month BETWEEN 1 AND 12),
        file_name    NVARCHAR(500)  NOT NULL,
        file_type    NVARCHAR(200)  NOT NULL,
        file_size    INT            NOT NULL,
        file_data    VARBINARY(MAX) NOT NULL,
        created_at   DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // 4. 배출원 목록 테이블
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'emission_references')
      CREATE TABLE emission_references (
        id              NVARCHAR(50)   NOT NULL PRIMARY KEY,
        scope           INT            NOT NULL CHECK (scope IN (1, 2, 3)),
        category_id     NVARCHAR(50)   NOT NULL,
        source_name     NVARCHAR(200)  NOT NULL,
        fuel_type       NVARCHAR(100)  NULL,
        energy_type     NVARCHAR(100)  NULL,
        activity_type   NVARCHAR(200)  NULL,
        unit            NVARCHAR(50)   NOT NULL,
        emission_factor DECIMAL(18,6)  NOT NULL DEFAULT 0,
        factor_source   NVARCHAR(500)  NULL,
        status          NVARCHAR(20)   NOT NULL DEFAULT 'active',
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // 4. 배출계수 출처 마스터
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'emission_factor_source')
      CREATE TABLE emission_factor_source (
        id            INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
        source_code   NVARCHAR(50)   NOT NULL UNIQUE,
        publisher     NVARCHAR(200)  NOT NULL,
        document_name NVARCHAR(500)  NOT NULL,
        document_url  NVARCHAR(1000) NULL,
        country       NVARCHAR(10)   NOT NULL DEFAULT 'KR',
        year          INT            NOT NULL,
        version       NVARCHAR(100)  NULL,
        notes         NVARCHAR(1000) NULL,
        active        BIT            NOT NULL DEFAULT 1,
        created_at    DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at    DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // 5. 배출계수 마스터
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'emission_factor_master')
      CREATE TABLE emission_factor_master (
        id                    INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
        factor_code           NVARCHAR(50)   NOT NULL UNIQUE,
        scope                 INT            NOT NULL CHECK (scope IN (1, 2, 3)),
        category_code         NVARCHAR(50)   NULL,
        fuel_code             NVARCHAR(100)  NULL,
        source_type           NVARCHAR(50)   NULL,
        country               NVARCHAR(10)   NOT NULL DEFAULT 'KR',
        year                  INT            NOT NULL,
        source_name           NVARCHAR(500)  NOT NULL,
        source_version        NVARCHAR(100)  NULL,
        valid_from            DATE           NULL,
        valid_to              DATE           NULL,
        calculation_method    NVARCHAR(100)  NULL,
        co2_factor            DECIMAL(20,10) NULL,
        co2_factor_unit       NVARCHAR(50)   NULL,
        ch4_factor            DECIMAL(20,10) NULL,
        ch4_factor_unit       NVARCHAR(50)   NULL,
        n2o_factor            DECIMAL(20,10) NULL,
        n2o_factor_unit       NVARCHAR(50)   NULL,
        ncv                   DECIMAL(20,8)  NULL,
        ncv_unit              NVARCHAR(50)   NULL,
        carbon_content_factor DECIMAL(20,8)  NULL,
        oxidation_factor      DECIMAL(10,6)  NULL DEFAULT 1.0,
        gwp_ch4               DECIMAL(10,4)  NULL DEFAULT 28.0,
        gwp_n2o               DECIMAL(10,4)  NULL DEFAULT 265.0,
        source_id             INT            NULL,
        active                BIT            NOT NULL DEFAULT 1,
        created_at            DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at            DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // source_id FK 컬럼 추가 (기존 테이블 대응)
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('emission_factor_master') AND name = 'source_id'
      )
      ALTER TABLE emission_factor_master ADD source_id INT NULL;
    `);

    // FK 제약 추가 (없는 경우만)
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.foreign_keys
        WHERE name = 'FK_efm_source' AND parent_object_id = OBJECT_ID('emission_factor_master')
      )
      AND EXISTS (SELECT * FROM sys.tables WHERE name = 'emission_factor_source')
      BEGIN
        ALTER TABLE emission_factor_master
          ADD CONSTRAINT FK_efm_source
          FOREIGN KEY (source_id) REFERENCES emission_factor_source(id) ON DELETE SET NULL;
      END
    `);

    // ──────────────────────────────────────────────
    // 출처 시드 데이터 (공신력 있는 기관)
    // ──────────────────────────────────────────────
    const sourceSeed = [
      {
        code: "NIER-2023",
        publisher: "국립환경과학원 (NIER)",
        doc: "국가 온실가스 배출·흡수계수 (2023)",
        url: "https://www.nier.go.kr",
        country: "KR", year: 2023, version: "2023년판",
        notes: "환경부 산하 국립환경과학원 발행. 고정·이동연소, 산업공정, 폐기물 등 전 부문 배출계수 수록.",
      },
      {
        code: "KEEI-2023",
        publisher: "에너지경제연구원 (KEEI)",
        doc: "에너지통계연보 열량환산계수 (2023)",
        url: "https://www.keei.re.kr",
        country: "KR", year: 2023, version: "2023년판",
        notes: "연료별 NCV(순발열량) 및 탄소함유량 기준. NIER 배출계수와 연계 사용.",
      },
      {
        code: "KEA-2024",
        publisher: "한국에너지공단 (KEA)",
        doc: "2024년 전력·열 온실가스 배출계수 고시",
        url: "https://www.energy.or.kr",
        country: "KR", year: 2024, version: "2024년 고시",
        notes: "산업통상자원부 고시. Scope 2 전력·스팀 간접배출 산정 시 사용. Location-based 방식.",
      },
      {
        code: "KPX-2022",
        publisher: "한국전력거래소 (KPX)",
        doc: "전력 온실가스 배출계수 (2022년도 최종)",
        url: "https://www.kpx.or.kr",
        country: "KR", year: 2022, version: "2022 최종",
        notes: "2022년도 발전부문 실적 기반 전력 배출계수. 0.4747 tCO₂/MWh.",
      },
      {
        code: "KPX-2023",
        publisher: "한국전력거래소 (KPX)",
        doc: "전력 온실가스 배출계수 (2023년도 잠정)",
        url: "https://www.kpx.or.kr",
        country: "KR", year: 2023, version: "2023 잠정",
        notes: "2023년도 잠정 전력 배출계수. 0.4386 tCO₂/MWh (최종 확정 전).",
      },
      {
        code: "IPCC-2006",
        publisher: "IPCC",
        doc: "2006 IPCC Guidelines for National Greenhouse Gas Inventories",
        url: "https://www.ipcc-nggip.iges.or.jp/public/2006gl/",
        country: "INTL", year: 2006, version: "Volume 2 Energy",
        notes: "국제 온실가스 인벤토리 산정 표준. Tier 1 기본 배출계수 및 NCV 제공.",
      },
      {
        code: "IPCC-2019-REF",
        publisher: "IPCC",
        doc: "2019 Refinement to the 2006 IPCC Guidelines",
        url: "https://www.ipcc-nggip.iges.or.jp/public/2019rf/",
        country: "INTL", year: 2019, version: "2019 Refinement",
        notes: "2006 가이드라인의 개정판. 일부 연료·부문 계수 업데이트.",
      },
      {
        code: "IPCC-AR5-GWP",
        publisher: "IPCC",
        doc: "AR5 Climate Change 2013: Global Warming Potential Values",
        url: "https://www.ipcc.ch/report/ar5/wg1/",
        country: "INTL", year: 2013, version: "AR5 WG1",
        notes: "100년 기준 GWP: CH₄=28, N₂O=265 (피드백 미포함). 현행 국제 표준.",
      },
      {
        code: "GHG-PROTOCOL-S3",
        publisher: "World Resources Institute / WBCSD",
        doc: "GHG Protocol Corporate Value Chain (Scope 3) Standard",
        url: "https://ghgprotocol.org/scope-3-standard",
        country: "INTL", year: 2011, version: "v1.0",
        notes: "Scope 3 15개 카테고리 산정 방법론 및 계수 기준. Activity-based / Spend-based 방법 포함.",
      },
      {
        code: "DEFRA-2023",
        publisher: "UK Department for Environment Food & Rural Affairs (DEFRA)",
        doc: "UK Government GHG Conversion Factors for Company Reporting (2023)",
        url: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
        country: "UK", year: 2023, version: "2023",
        notes: "항공 출장, 호텔 숙박, 차량 이동 등 Scope 3 카테고리 배출계수 제공. 국제적으로 널리 활용.",
      },
    ];

    for (const s of sourceSeed) {
      const r = pool.request();
      r.input("code",      s.code);
      r.input("pub",       s.publisher);
      r.input("doc",       s.doc);
      r.input("url",       s.url ?? null);
      r.input("country",   s.country);
      r.input("year",      s.year);
      r.input("version",   s.version ?? null);
      r.input("notes",     s.notes ?? null);
      await r.query(`
        IF NOT EXISTS (SELECT 1 FROM emission_factor_source WHERE source_code = @code)
          INSERT INTO emission_factor_source (source_code, publisher, document_name, document_url, country, year, version, notes, active)
          VALUES (@code, @pub, @doc, @url, @country, @year, @version, @notes, 1);
      `);
    }

    // ──────────────────────────────────────────────
    // 기존 placeholder("예시") 데이터 정리
    // ──────────────────────────────────────────────
    await pool.request().query(`
      DELETE FROM emission_factor_master WHERE source_name LIKE '%예시%';
    `);

    // ──────────────────────────────────────────────
    // 배출계수 마스터 시드 (공신력 있는 실제 값)
    // 단위계: tCO₂/unit, tCH₄/unit, tN₂O/unit (raw, GWP 변환 전)
    // GWP AR5: CH₄=28, N₂O=265
    // ──────────────────────────────────────────────

    interface FactorSeed {
      code: string; scope: number; cat: string | null; fuel: string | null; stype: string | null;
      country: string; year: number;
      sname: string; sver: string | null; src_code: string;
      vfrom: string | null; vto: string | null; method: string;
      co2: number; co2u: string; ch4: number; ch4u: string; n2o: number; n2ou: string;
      ncv: number | null; ncvu: string | null;
      ccf: number | null; oxf: number; gwp_ch4: number; gwp_n2o: number;
    }

    const factors: FactorSeed[] = [
      // ── Scope 1 고정연소 ──────────────────────────────────────────
      // 천연가스(LNG) Nm3 · NIER 2023 / IPCC 2006 · NCV=40.0 MJ/Nm3
      // CO2=56.1 tCO2/TJ, CH4=5 tCH4/TJ, N2O=0.1 tN2O/TJ × NCV/10^6
      {
        code:"S1-LNG-KR-2024", scope:1, cat:"fixed", fuel:"LNG", stype:"fixed",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0022440, co2u:"tCO2/Nm3",  ch4:0.000000200, ch4u:"tCH4/Nm3",  n2o:0.0000000040, n2ou:"tN2O/Nm3",
        ncv:40.0, ncvu:"MJ/Nm3", ccf:0.494, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // 경유(Diesel) 고정연소 L · NCV=35.26 MJ/L
      // CO2=74.1 tCO2/TJ, CH4=5, N2O=0.1
      {
        code:"S1-DIESEL-FIXED-KR-2024", scope:1, cat:"fixed", fuel:"Diesel", stype:"fixed",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0026128, co2u:"tCO2/L",  ch4:0.000000176, ch4u:"tCH4/L",  n2o:0.0000000035, n2ou:"tN2O/L",
        ncv:35.26, ncvu:"MJ/L", ccf:0.840, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // LPG 고정연소 kg · NCV=50.40 MJ/kg (프로판 기준)
      // CO2=63.1 tCO2/TJ
      {
        code:"S1-LPG-KR-2024", scope:1, cat:"fixed", fuel:"LPG", stype:"fixed",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0031802, co2u:"tCO2/kg",  ch4:0.000000252, ch4u:"tCH4/kg",  n2o:0.0000000050, n2ou:"tN2O/kg",
        ncv:50.40, ncvu:"MJ/kg", ccf:0.819, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // 유연탄(역청탄) kg · NCV=25.80 MJ/kg
      // CO2=94.6 tCO2/TJ, CH4=10, N2O=1.5
      {
        code:"S1-COAL-KR-2024", scope:1, cat:"fixed", fuel:"석탄", stype:"fixed",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0024407, co2u:"tCO2/kg",  ch4:0.000000258, ch4u:"tCH4/kg",  n2o:0.0000000387, n2ou:"tN2O/kg",
        ncv:25.80, ncvu:"MJ/kg", ccf:0.658, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // B-C유(중유) L · NCV=40.19 MJ/L
      // CO2=77.4 tCO2/TJ
      {
        code:"S1-HEAVYOIL-KR-2024", scope:1, cat:"fixed", fuel:"중유", stype:"fixed",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0031107, co2u:"tCO2/L",  ch4:0.000000201, ch4u:"tCH4/L",  n2o:0.0000000040, n2ou:"tN2O/L",
        ncv:40.19, ncvu:"MJ/L", ccf:0.855, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // 등유(Kerosene) L · NCV=33.53 MJ/L
      // CO2=71.9 tCO2/TJ
      {
        code:"S1-KEROSENE-KR-2024", scope:1, cat:"fixed", fuel:"등유", stype:"fixed",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0024108, co2u:"tCO2/L",  ch4:0.000000168, ch4u:"tCH4/L",  n2o:0.0000000034, n2ou:"tN2O/L",
        ncv:33.53, ncvu:"MJ/L", ccf:0.812, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // ── Scope 1 이동연소 ──────────────────────────────────────────
      // 경유(차량) L · NCV=35.26 MJ/L · 이동연소 CH4·N2O 높음
      // IPCC 2006: CH4=3.9 kg/TJ, N2O=3.9 kg/TJ (도로 이동 경유)
      {
        code:"S1-DIESEL-MOBILE-KR-2024", scope:1, cat:"mobile", fuel:"Diesel", stype:"mobile",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0026128, co2u:"tCO2/L",  ch4:0.0000001375, ch4u:"tCH4/L",  n2o:0.0000001375, n2ou:"tN2O/L",
        ncv:35.26, ncvu:"MJ/L", ccf:0.840, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // 휘발유(승용차) L · NCV=32.04 MJ/L
      // IPCC 2006: CH4=30 kg/TJ, N2O=3.0 kg/TJ (도로 이동 휘발유 EURO4/5)
      {
        code:"S1-GASOLINE-MOBILE-KR-2024", scope:1, cat:"mobile", fuel:"Gasoline", stype:"mobile",
        country:"KR", year:2024,
        sname:"국립환경과학원 국가 온실가스 배출·흡수계수 (2023)", sver:"2023년판", src_code:"NIER-2023",
        vfrom:"2024-01-01", vto:null, method:"Tier1",
        co2:0.0022204, co2u:"tCO2/L",  ch4:0.0000009612, ch4u:"tCH4/L",  n2o:0.0000000961, n2ou:"tN2O/L",
        ncv:32.04, ncvu:"MJ/L", ccf:0.693, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // ── Scope 2 간접배출 ──────────────────────────────────────────
      // 전력 (한국 KPX 2022 최종) MWh
      {
        code:"S2-ELEC-KR-2022", scope:2, cat:"electricity", fuel:"Electricity", stype:"electricity",
        country:"KR", year:2022,
        sname:"한국전력거래소 전력 온실가스 배출계수 (2022년도 최종)", sver:"2022 최종", src_code:"KPX-2022",
        vfrom:"2022-01-01", vto:"2022-12-31", method:"Market Based",
        co2:0.4747, co2u:"tCO2/MWh",  ch4:0.000000000, ch4u:"tCH4/MWh",  n2o:0.000000000, n2ou:"tN2O/MWh",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // 전력 (한국 KPX 2023 잠정) MWh
      {
        code:"S2-ELEC-KR-2023", scope:2, cat:"electricity", fuel:"Electricity", stype:"electricity",
        country:"KR", year:2023,
        sname:"한국전력거래소 전력 온실가스 배출계수 (2023년도 잠정)", sver:"2023 잠정", src_code:"KPX-2023",
        vfrom:"2023-01-01", vto:"2023-12-31", method:"Market Based",
        co2:0.4386, co2u:"tCO2/MWh",  ch4:0.000000000, ch4u:"tCH4/MWh",  n2o:0.000000000, n2ou:"tN2O/MWh",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // 스팀/열에너지(지역난방) GJ — 한국지역난방공사 2023 평균
      {
        code:"S2-STEAM-KR-2024", scope:2, cat:"steam", fuel:"Steam", stype:"steam",
        country:"KR", year:2024,
        sname:"한국에너지공단 열에너지 온실가스 배출계수 고시 (2024)", sver:"2024년 고시", src_code:"KEA-2024",
        vfrom:"2024-01-01", vto:null, method:"Market Based",
        co2:0.0558, co2u:"tCO2/GJ",  ch4:0.000000000, ch4u:"tCH4/GJ",  n2o:0.000000000, n2ou:"tN2O/GJ",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // ── Scope 3 카테고리별 대표 계수 ──────────────────────────────
      // Cat 1 — 구입상품·서비스: 철강·강판 ton (worldsteel 2023 평균)
      {
        code:"S3-C1-STEEL-KR-2024", scope:3, cat:"u1", fuel:"강판(철강)", stype:"activity",
        country:"KR", year:2024,
        sname:"GHG Protocol Scope 3 Standard (Category 1) / worldsteel 2023 평균값", sver:"2023", src_code:"GHG-PROTOCOL-S3",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:1.7575, co2u:"tCO2/ton",  ch4:0.003800, ch4u:"tCH4/ton",  n2o:0.001900, n2ou:"tN2O/ton",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 1 — 구입상품·서비스: 알루미늄 ton
      {
        code:"S3-C1-ALUMINIUM-KR-2024", scope:3, cat:"u1", fuel:"알루미늄", stype:"activity",
        country:"KR", year:2024,
        sname:"GHG Protocol Scope 3 Standard (Category 1) / IAI 2023 평균값", sver:"2023", src_code:"GHG-PROTOCOL-S3",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:10.450, co2u:"tCO2/ton",  ch4:0.023800, ch4u:"tCH4/ton",  n2o:0.011900, n2ou:"tN2O/ton",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 4 — 상류 수송·유통: 화물트럭(도로) ton·km
      // IPCC 2006 / DEFRA 2023 기반
      {
        code:"S3-C4-TRUCK-KR-2024", scope:3, cat:"u4", fuel:"화물트럭(도로)", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — HGV freight (road)", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000092, co2u:"tCO2/ton·km",  ch4:0.0000000020, ch4u:"tCH4/ton·km",  n2o:0.0000000020, n2ou:"tN2O/ton·km",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 4 — 항공화물 ton·km
      {
        code:"S3-C4-AIRFREIGHT-KR-2024", scope:3, cat:"u4", fuel:"항공화물", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — Air freight", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000602, co2u:"tCO2/ton·km",  ch4:0.0000000140, ch4u:"tCH4/ton·km",  n2o:0.0000000053, n2ou:"tN2O/ton·km",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 6 — 출장: 국내선 항공 person-km
      {
        code:"S3-C6-FLIGHT-DOM-KR-2024", scope:3, cat:"u6", fuel:"국내선 항공", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — Domestic flight (economy class)", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000255, co2u:"tCO2/pkm",  ch4:0.0000000085, ch4u:"tCH4/pkm",  n2o:0.0000000038, n2ou:"tN2O/pkm",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 6 — 출장: 국제선 항공 장거리 person-km
      {
        code:"S3-C6-FLIGHT-INTL-KR-2024", scope:3, cat:"u6", fuel:"국제선 항공(장거리)", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — International flight long-haul economy", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000195, co2u:"tCO2/pkm",  ch4:0.0000000065, ch4u:"tCH4/pkm",  n2o:0.0000000029, n2ou:"tN2O/pkm",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 6 — 출장: 기차(KTX/무궁화) person-km
      {
        code:"S3-C6-TRAIN-KR-2024", scope:3, cat:"u6", fuel:"기차(KTX·일반열차)", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — National rail", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000041, co2u:"tCO2/pkm",  ch4:0.0000000003, ch4u:"tCH4/pkm",  n2o:0.0000000001, n2ou:"tN2O/pkm",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 7 — 직원 통근: 자가용(휘발유) person-km
      {
        code:"S3-C7-CAR-GASOLINE-KR-2024", scope:3, cat:"u7", fuel:"자가용(휘발유)", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — Car (average petrol)", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000170, co2u:"tCO2/pkm",  ch4:0.0000000054, ch4u:"tCH4/pkm",  n2o:0.0000000078, n2ou:"tN2O/pkm",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
      // Cat 7 — 직원 통근: 시내버스 person-km
      {
        code:"S3-C7-BUS-KR-2024", scope:3, cat:"u7", fuel:"대중버스", stype:"activity",
        country:"KR", year:2024,
        sname:"DEFRA UK GHG Conversion Factors 2023 — Local bus (average)", sver:"2023", src_code:"DEFRA-2023",
        vfrom:"2024-01-01", vto:null, method:"Activity Based",
        co2:0.000089, co2u:"tCO2/pkm",  ch4:0.0000000028, ch4u:"tCH4/pkm",  n2o:0.0000000006, n2ou:"tN2O/pkm",
        ncv:null, ncvu:null, ccf:null, oxf:1.0, gwp_ch4:28, gwp_n2o:265,
      },
    ];

    for (const f of factors) {
      // source_id 조회
      const srcR = pool.request();
      srcR.input("src_code", f.src_code);
      const srcResult = await srcR.query(`SELECT id FROM emission_factor_source WHERE source_code = @src_code`);
      const sourceId = srcResult.recordset[0]?.id ?? null;

      const r = pool.request();
      r.input("code",    f.code);
      r.input("scope",   f.scope);
      r.input("cat",     f.cat);
      r.input("fuel",    f.fuel);
      r.input("stype",   f.stype);
      r.input("country", f.country);
      r.input("year",    f.year);
      r.input("sname",   f.sname);
      r.input("sver",    f.sver);
      r.input("vfrom",   f.vfrom);
      r.input("vto",     f.vto);
      r.input("method",  f.method);
      r.input("co2",     f.co2);
      r.input("co2u",    f.co2u);
      r.input("ch4",     f.ch4);
      r.input("ch4u",    f.ch4u);
      r.input("n2o",     f.n2o);
      r.input("n2ou",    f.n2ou);
      r.input("ncv",     f.ncv);
      r.input("ncvu",    f.ncvu);
      r.input("ccf",     f.ccf);
      r.input("oxf",     f.oxf);
      r.input("gwp_ch4", f.gwp_ch4);
      r.input("gwp_n2o", f.gwp_n2o);
      r.input("src_id",  sourceId);

      await r.query(`
        IF NOT EXISTS (SELECT 1 FROM emission_factor_master WHERE factor_code = @code)
        INSERT INTO emission_factor_master
          (factor_code, scope, category_code, fuel_code, source_type, country, year,
           source_name, source_version, valid_from, valid_to, calculation_method,
           co2_factor, co2_factor_unit, ch4_factor, ch4_factor_unit,
           n2o_factor, n2o_factor_unit, ncv, ncv_unit, carbon_content_factor,
           oxidation_factor, gwp_ch4, gwp_n2o, source_id, active)
        VALUES
          (@code, @scope, @cat, @fuel, @stype, @country, @year,
           @sname, @sver, @vfrom, @vto, @method,
           @co2, @co2u, @ch4, @ch4u,
           @n2o, @n2ou, @ncv, @ncvu, @ccf,
           @oxf, @gwp_ch4, @gwp_n2o, @src_id, 1);
      `);
    }

    // ──────────────────────────────────────────────
    // 조직 테이블 (단일 조직)
    // ──────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'organizations')
      CREATE TABLE organizations (
        id                INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
        organization_name NVARCHAR(200)  NOT NULL DEFAULT '조직',
        created_at        DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at        DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // address, address_detail 컬럼 추가 (기존 테이블 대응 - idempotent)
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('organizations') AND name = 'address'
      )
      ALTER TABLE organizations ADD address NVARCHAR(500) NOT NULL DEFAULT '';
    `);
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('organizations') AND name = 'address_detail'
      )
      ALTER TABLE organizations ADD address_detail NVARCHAR(200) NULL;
    `);

    // 기본 조직 행 삽입 (없는 경우)
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM organizations)
        INSERT INTO organizations (organization_name) VALUES ('조직');
    `);

    // ──────────────────────────────────────────────
    // 사업장 테이블
    // ──────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'worksites')
      CREATE TABLE worksites (
        id               NVARCHAR(50)   NOT NULL PRIMARY KEY,
        organization_id  INT            NOT NULL
                           REFERENCES organizations(id) ON DELETE CASCADE,
        name             NVARCHAR(200)  NOT NULL,
        address          NVARCHAR(500)  NOT NULL DEFAULT '',
        address_detail   NVARCHAR(200)  NULL,
        is_default       BIT            NOT NULL DEFAULT 0,
        sort_order       INT            NOT NULL DEFAULT 0,
        created_at       DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at       DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // ──────────────────────────────────────────────
    // 직원명부 테이블
    // ──────────────────────────────────────────────
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'employees')
      CREATE TABLE employees (
        id                    NVARCHAR(50)   NOT NULL PRIMARY KEY,
        worksite_id           NVARCHAR(50)   NULL
                                REFERENCES worksites(id) ON DELETE SET NULL,
        department            NVARCHAR(100)  NULL,
        name                  NVARCHAR(100)  NOT NULL,
        job_title             NVARCHAR(100)  NULL,
        employee_id           NVARCHAR(50)   NULL,
        commute_transport     NVARCHAR(50)   NULL,
        fuel                  NVARCHAR(50)   NULL,
        address               NVARCHAR(500)  NULL,
        address_detail        NVARCHAR(200)  NULL,
        commute_distance_km   DECIMAL(10,3)  NULL,
        sort_order            INT            NOT NULL DEFAULT 0,
        created_at            DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at            DATETIME2      NOT NULL DEFAULT GETDATE()
      );
    `);

    // 기존 마이그레이션 (이전 테이블)
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'facilities')
      AND NOT EXISTS (SELECT TOP 1 1 FROM emission_facilities)
      BEGIN
        INSERT INTO emission_facilities
          (id, scope, facility_name, fuel_type, energy_type, activity_type, unit, data_method, sort_order, created_at, updated_at)
        SELECT id, scope, facility_name, fuel_type, energy_type, activity_type, unit, data_method, sort_order, created_at, updated_at
        FROM facilities;
      END
    `);

    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'monthly_activity')
      AND NOT EXISTS (SELECT TOP 1 1 FROM activity_data)
      BEGIN
        INSERT INTO activity_data (facility_id, year, month, activity_value, created_at, updated_at)
        SELECT ma.facility_id, ma.year, ma.month, ma.activity_value, ma.created_at, ma.updated_at
        FROM monthly_activity ma
        WHERE EXISTS (SELECT 1 FROM emission_facilities ef WHERE ef.id = ma.facility_id);
      END
    `);

    return NextResponse.json({
      ok: true,
      message: "테이블이 생성되었습니다.",
      tables: [
        "emission_facilities",
        "activity_data",
        "activity_attachments",
        "emission_references",
        "emission_factor_source",
        "emission_factor_master",
        "organizations",
        "worksites",
        "employees",
      ],
    });
  } catch (err: any) {
    console.error("[db-init]", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
