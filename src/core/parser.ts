// ==========================================
// PassDiff - CSV Parser
// ==========================================

import Papa from 'papaparse';
import type {
    PasswordEntry,
    ParsedCsvResult,
    CsvFormat,
    ChromeCsvRow,
    BitWardenCsvRow
} from './types';
import { normalizeUrl } from './normalization';

/**
 * 生成 UUID
 */
function generateId(): string {
    return crypto.randomUUID();
}

/**
 * 检测 CSV 格式 (Chrome 或 BitWarden)
 */
function detectFormat(headers: string[]): CsvFormat {
    const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));

    // BitWarden 格式特征: login_uri, login_username, login_password
    if (headerSet.has('login_uri') || headerSet.has('login_username') || headerSet.has('login_password')) {
        return 'BITWARDEN';
    }

    // Chrome 格式特征: name, url, username, password
    if (headerSet.has('url') && headerSet.has('username') && headerSet.has('password')) {
        return 'CHROME';
    }

    return 'UNKNOWN';
}

/**
 * 解析 Chrome CSV 行
 */
function parseChromeRow(row: ChromeCsvRow, source: 'A' | 'B'): PasswordEntry | null {
    if (!row.url && !row.username) {
        return null;
    }

    const normalized = normalizeUrl(row.url || '');

    return {
        id: generateId(),
        originalSource: source,
        domain: normalized.domain,
        url: row.url || '',
        username: row.username || '',
        password: row.password || '',
        notes: row.note || ''
    };
}

/**
 * 解析 BitWarden CSV 行
 * 将 totp, favorite, reprompt 等字段追加到 notes
 */
function parseBitWardenRow(row: BitWardenCsvRow, source: 'A' | 'B'): PasswordEntry | null {
    // 跳过非登录类型
    if (row.type && row.type.toLowerCase() !== 'login') {
        return null;
    }

    if (!row.login_uri && !row.login_username) {
        return null;
    }

    const normalized = normalizeUrl(row.login_uri || '');

    // 构建聚合备注
    let notes = row.notes || '';

    if (row.login_totp) {
        notes += `\n[TOTP: ${row.login_totp}]`;
    }
    if (row.favorite && row.favorite !== '') {
        notes += `\n[Favorite: ${row.favorite}]`;
    }
    if (row.reprompt && row.reprompt !== '0') {
        notes += `\n[Reprompt: ${row.reprompt}]`;
    }
    if (row.folder) {
        notes += `\n[Folder: ${row.folder}]`;
    }
    if (row.fields) {
        notes += `\n[Fields: ${row.fields}]`;
    }

    return {
        id: generateId(),
        originalSource: source,
        domain: normalized.domain,
        url: row.login_uri || '',
        username: row.login_username || '',
        password: row.login_password || '',
        notes: notes.trim()
    };
}

/**
 * 解析 CSV 文件内容
 */
export function parseCsv(
    content: string,
    source: 'A' | 'B'
): ParsedCsvResult {
    const errors: string[] = [];
    const entries: PasswordEntry[] = [];

    // 使用 PapaParse 解析
    const result = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
    });

    if (result.errors.length > 0) {
        result.errors.forEach(err => {
            errors.push(`行 ${err.row}: ${err.message}`);
        });
    }

    if (result.data.length === 0) {
        return { format: 'UNKNOWN', entries: [], errors: ['CSV 文件为空或格式不正确'] };
    }

    // 检测格式
    const headers = result.meta.fields || [];
    const format = detectFormat(headers);

    if (format === 'UNKNOWN') {
        return {
            format: 'UNKNOWN',
            entries: [],
            errors: ['无法识别 CSV 格式，请确保是 Chrome 或 BitWarden 导出的文件']
        };
    }

    // 解析每一行
    result.data.forEach((row, index) => {
        try {
            let entry: PasswordEntry | null = null;

            if (format === 'CHROME') {
                entry = parseChromeRow(row as unknown as ChromeCsvRow, source);
            } else if (format === 'BITWARDEN') {
                entry = parseBitWardenRow(row as unknown as BitWardenCsvRow, source);
            }

            if (entry) {
                entries.push(entry);
            }
        } catch (err) {
            errors.push(`行 ${index + 2}: 解析失败 - ${err instanceof Error ? err.message : '未知错误'}`);
        }
    });

    return { format, entries, errors };
}

/**
 * 从 File 对象读取并解析 CSV
 */
export async function parseFile(
    file: File,
    source: 'A' | 'B'
): Promise<ParsedCsvResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = parseCsv(content, source);
            resolve(result);
        };

        reader.onerror = () => {
            resolve({
                format: 'UNKNOWN',
                entries: [],
                errors: ['文件读取失败']
            });
        };

        // 强制使用 UTF-8 编码
        reader.readAsText(file, 'UTF-8');
    });
}
