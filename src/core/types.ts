// ==========================================
// PassDiff - Type Definitions
// ==========================================

// 1. 基础数据模型 - 密码条目
export interface PasswordEntry {
    id: string;                      // UUID
    originalSource: 'A' | 'B';       // 来源文档标识
    domain: string;                  // 归一化后的主域名
    url: string;                     // 原始 URL
    username: string;                // 用户名
    password: string;                // 密码
    notes: string;                   // 聚合备注 (包含 TOTP 等额外字段)
}

// 2. 对比状态枚举
export type DiffStatus = 'SAME' | 'MODIFIED' | 'ONLY_A' | 'ONLY_B';

// 3. 对比分组 - 按域名分组
export interface DiffGroup {
    domain: string;                  // 分组标题（归一化域名）
    hasRisk: boolean;                // 是否包含风险子域 (dev/prod/admin 等)
    items: DiffItem[];               // 该域名下的条目
}

// 4. 对比条目
export interface DiffItem {
    key: string;                     // 唯一键: domain::username
    domain: string;                  // 归一化域名
    username: string;                // 用户名
    status: DiffStatus;              // 对比状态
    entryA?: PasswordEntry;          // 左侧文档的条目
    entryB?: PasswordEntry;          // 右侧文档的条目
}

// 5. 虚拟列表渲染行 - 扁平化结构
export type VirtualRowData =
    | { type: 'HEADER'; domain: string; count: number; hasRisk: boolean; expanded: boolean }
    | { type: 'ITEM'; item: DiffItem };

// 6. 应用设置
export interface AppSettings {
    privacyMode: PrivacyMode;        // 隐私模式
    mergeStrategy: MergeStrategy;    // 合并策略
    showSameEntries: boolean;        // 是否显示相同条目
}

export type PrivacyMode = 'SECURE' | 'PEEK' | 'PLAIN';
export type MergeStrategy = 'ROOT_DOMAIN' | 'KEEP_FIRST' | 'MANUAL';

// 7. CSV 解析相关类型
export type CsvFormat = 'CHROME' | 'BITWARDEN' | 'UNKNOWN';

export interface ParsedCsvResult {
    format: CsvFormat;
    entries: PasswordEntry[];
    errors: string[];
}

// 8. Chrome CSV 行格式
export interface ChromeCsvRow {
    name: string;
    url: string;
    username: string;
    password: string;
    note?: string;
}

// 9. BitWarden CSV 行格式
export interface BitWardenCsvRow {
    folder?: string;
    favorite?: string;
    type?: string;
    name?: string;
    notes?: string;
    fields?: string;
    reprompt?: string;
    login_uri?: string;
    login_username?: string;
    login_password?: string;
    login_totp?: string;
}

// 10. 域名归一化结果
export interface NormalizedUrlResult {
    domain: string;                  // 归一化后的域名
    hasRisk: boolean;                // 是否包含敏感子域
    riskReason?: string;             // 风险原因
}
