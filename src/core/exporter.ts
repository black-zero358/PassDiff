// ==========================================
// PassDiff - CSV Exporter
// ==========================================

import type { PasswordEntry } from './types';

/**
 * 将密码条目导出为 Chrome CSV 格式
 */
export function exportToChromeCSV(entries: PasswordEntry[]): string {
    const header = 'name,url,username,password,note';

    const rows = entries.map(entry => {
        // CSV 转义规则: 如果包含逗号、引号或换行，需要用引号包裹，内部引号加倍
        const escapeCsv = (value: string): string => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        // 从 URL 提取域名作为 name
        let name = entry.domain;

        return [
            escapeCsv(name),
            escapeCsv(entry.url),
            escapeCsv(entry.username),
            escapeCsv(entry.password),
            escapeCsv(entry.notes)
        ].join(',');
    });

    return [header, ...rows].join('\n');
}

/**
 * 触发 CSV 文件下载
 */
export function downloadCSV(entries: PasswordEntry[], filename: string = 'passwords.csv'): void {
    const csv = exportToChromeCSV(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
