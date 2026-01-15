// ==========================================
// PassDiff - Diff Engine
// ==========================================

import type {
    PasswordEntry,
    DiffStatus,
    DiffGroup,
    DiffItem,
    VirtualRowData
} from './types';
import { generateKey, normalizeUrl } from './normalization';

/**
 * 对比两个密码列表
 * 返回按域名分组的对比结果
 */
export function diffPasswords(
    entriesA: PasswordEntry[],
    entriesB: PasswordEntry[]
): DiffGroup[] {
    // 创建 Map: key -> entry
    const mapA = new Map<string, PasswordEntry>();
    const mapB = new Map<string, PasswordEntry>();

    entriesA.forEach(entry => {
        const key = generateKey(entry.domain, entry.username);
        mapA.set(key, entry);
    });

    entriesB.forEach(entry => {
        const key = generateKey(entry.domain, entry.username);
        mapB.set(key, entry);
    });

    // 收集所有唯一键
    const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

    // 生成 DiffItem 列表
    const diffItems: DiffItem[] = [];

    allKeys.forEach(key => {
        const entryA = mapA.get(key);
        const entryB = mapB.get(key);

        let status: DiffStatus;

        if (entryA && entryB) {
            // 两边都有
            status = entryA.password === entryB.password ? 'SAME' : 'MODIFIED';
        } else if (entryA) {
            // 仅左侧有
            status = 'ONLY_A';
        } else {
            // 仅右侧有
            status = 'ONLY_B';
        }

        const domain = entryA?.domain || entryB?.domain || '';
        const username = entryA?.username || entryB?.username || '';

        diffItems.push({
            key,
            domain,
            username,
            status,
            entryA,
            entryB
        });
    });

    // 按域名分组
    const groupMap = new Map<string, DiffItem[]>();

    diffItems.forEach(item => {
        const domain = item.domain;
        if (!groupMap.has(domain)) {
            groupMap.set(domain, []);
        }
        groupMap.get(domain)!.push(item);
    });

    // 转换为 DiffGroup 数组
    const groups: DiffGroup[] = [];

    groupMap.forEach((items, domain) => {
        // 检查该域名下是否有风险条目
        const hasRisk = items.some(item => {
            const url = item.entryA?.url || item.entryB?.url || '';
            return normalizeUrl(url).hasRisk;
        });

        // 按用户名排序
        items.sort((a, b) => a.username.localeCompare(b.username));

        groups.push({
            domain,
            hasRisk,
            items
        });
    });

    // 按域名排序
    groups.sort((a, b) => a.domain.localeCompare(b.domain));

    return groups;
}

/**
 * 将分组数据扁平化为虚拟列表可用的行数据
 * @param groups 分组数据
 * @param expandedDomains 已展开的域名集合
 * @param showSame 是否显示相同条目
 */
export function flattenGroups(
    groups: DiffGroup[],
    expandedDomains: Set<string>,
    showSame: boolean = false
): VirtualRowData[] {
    const rows: VirtualRowData[] = [];

    groups.forEach(group => {
        // 过滤条目
        const filteredItems = showSame
            ? group.items
            : group.items.filter(item => item.status !== 'SAME');

        // 如果没有可显示的条目，跳过该组
        if (filteredItems.length === 0) {
            return;
        }

        const expanded = expandedDomains.has(group.domain);

        // 添加分组头
        rows.push({
            type: 'HEADER',
            domain: group.domain,
            count: filteredItems.length,
            hasRisk: group.hasRisk,
            expanded
        });

        // 如果展开，添加条目行
        if (expanded) {
            filteredItems.forEach(item => {
                rows.push({
                    type: 'ITEM',
                    item
                });
            });
        }
    });

    return rows;
}

/**
 * 统计对比结果
 */
export function getDiffStats(groups: DiffGroup[]): {
    total: number;
    same: number;
    modified: number;
    onlyA: number;
    onlyB: number;
    riskCount: number;
} {
    let total = 0;
    let same = 0;
    let modified = 0;
    let onlyA = 0;
    let onlyB = 0;
    let riskCount = 0;

    groups.forEach(group => {
        if (group.hasRisk) {
            riskCount++;
        }

        group.items.forEach(item => {
            total++;
            switch (item.status) {
                case 'SAME':
                    same++;
                    break;
                case 'MODIFIED':
                    modified++;
                    break;
                case 'ONLY_A':
                    onlyA++;
                    break;
                case 'ONLY_B':
                    onlyB++;
                    break;
            }
        });
    });

    return { total, same, modified, onlyA, onlyB, riskCount };
}
