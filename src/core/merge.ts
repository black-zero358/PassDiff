// ==========================================
// PassDiff - Merge Logic
// 查找同域名同密码但不同 URL 的可合并条目
// ==========================================

import type { PasswordEntry } from './types';
import { normalizeUrl } from './normalization';

// 合并组
export interface MergeGroup {
    domain: string;
    username: string;
    password: string;
    entries: PasswordEntry[];  // 可合并的条目列表
    hasRisk: boolean;
}

/**
 * 查找可合并的密码条目
 * 条件: 同一域名 + 同一用户名 + 同一密码，但 URL 不同
 */
export function findMergeCandidates(entries: PasswordEntry[]): MergeGroup[] {
    // 按 domain::username::password 分组
    const groupMap = new Map<string, PasswordEntry[]>();

    entries.forEach(entry => {
        const key = `${entry.domain}::${entry.username}::${entry.password}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, []);
        }
        groupMap.get(key)!.push(entry);
    });

    // 只保留有多个不同 URL 的组
    const mergeGroups: MergeGroup[] = [];

    groupMap.forEach((groupEntries) => {
        // 提取唯一 URL
        const uniqueUrls = new Set(groupEntries.map(e => e.url));

        // 如果有多个不同的 URL，才是可合并的
        if (uniqueUrls.size > 1) {
            const first = groupEntries[0];

            // 检查是否有风险子域
            const hasRisk = groupEntries.some(e => {
                const result = normalizeUrl(e.url);
                return result.hasRisk;
            });

            mergeGroups.push({
                domain: first.domain,
                username: first.username,
                password: first.password,
                entries: groupEntries,
                hasRisk
            });
        }
    });

    // 按域名排序
    mergeGroups.sort((a, b) => a.domain.localeCompare(b.domain));

    return mergeGroups;
}

/**
 * 执行合并 - 保留每组的第一个 URL
 */
export function applyMerge(
    entries: PasswordEntry[],
    strategy: 'ROOT_DOMAIN' | 'KEEP_FIRST'
): PasswordEntry[] {
    const groupMap = new Map<string, PasswordEntry>();

    entries.forEach(entry => {
        const key = `${entry.domain}::${entry.username}::${entry.password}`;

        if (!groupMap.has(key)) {
            // 第一次见到这个组合
            if (strategy === 'ROOT_DOMAIN') {
                // 使用根域名作为 URL
                const rootUrl = `https://${entry.domain}/`;
                groupMap.set(key, { ...entry, url: rootUrl });
            } else {
                // 保留第一个
                groupMap.set(key, entry);
            }
        }
        // 如果已存在，跳过（保留第一个）
    });

    return Array.from(groupMap.values());
}

/**
 * 获取合并统计
 */
export function getMergeStats(groups: MergeGroup[]): {
    totalGroups: number;
    totalEntries: number;
    canMerge: number;
    riskCount: number;
} {
    let totalEntries = 0;
    let riskCount = 0;

    groups.forEach(g => {
        totalEntries += g.entries.length;
        if (g.hasRisk) riskCount++;
    });

    return {
        totalGroups: groups.length,
        totalEntries,
        canMerge: totalEntries - groups.length,  // 可以减少的条目数
        riskCount
    };
}
