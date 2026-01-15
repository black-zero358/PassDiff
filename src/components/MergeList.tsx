// ==========================================
// PassDiff - Merge List Component
// 支持单项选择和合并策略
// ==========================================

import type { MergeGroup } from '../core/merge';
import type { PrivacyMode, MergeStrategy } from '../core/types';
import { PasswordCell } from './PasswordCell';

interface MergeListProps {
    groups: MergeGroup[];
    privacyMode: PrivacyMode;
    mergeStrategy: MergeStrategy;
    selectedGroups: Set<string>;  // 选中的组 key
    selectedUrls: Map<string, string>;  // 手动模式下选择的 URL
    onToggleGroup: (groupKey: string) => void;
    onSelectUrl: (groupKey: string, url: string) => void;
}

// 生成组的唯一 key
function getGroupKey(group: MergeGroup): string {
    return `${group.domain}::${group.username}`;
}

// 根据策略获取目标 URL
function getTargetUrl(group: MergeGroup, strategy: MergeStrategy, selectedUrl?: string): string {
    switch (strategy) {
        case 'ROOT_DOMAIN':
            return `https://${group.domain}/`;
        case 'KEEP_FIRST':
            return group.entries[0]?.url || '';
        case 'MANUAL':
            return selectedUrl || group.entries[0]?.url || '';
        default:
            return `https://${group.domain}/`;
    }
}

export function MergeList({
    groups,
    privacyMode,
    mergeStrategy,
    selectedGroups,
    selectedUrls,
    onToggleGroup,
    onSelectUrl
}: MergeListProps) {
    if (groups.length === 0) {
        return null;
    }

    return (
        <>
            {groups.map((group) => {
                const groupKey = getGroupKey(group);
                const isSelected = selectedGroups.has(groupKey);
                const selectedUrl = selectedUrls.get(groupKey);
                const targetUrl = getTargetUrl(group, mergeStrategy, selectedUrl);

                return (
                    <div key={groupKey} className={`merge-group ${isSelected ? 'selected' : ''}`}>
                        {/* 组头 */}
                        <div className="merge-group-header" onClick={() => onToggleGroup(groupKey)}>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleGroup(groupKey)}
                                onClick={e => e.stopPropagation()}
                                className="merge-checkbox"
                            />
                            <span className="domain">{group.domain}</span>
                            <span className="username">{group.username}</span>
                            <span className="count">{group.entries.length} → 1</span>
                            {group.hasRisk && <span className="risk-icon" title="包含敏感子域">⚠️</span>}
                        </div>

                        {/* 展开的详情 */}
                        <div className="merge-details">
                            {/* 原始 URL 列表 */}
                            <div className="merge-urls">
                                <div className="merge-urls-label">原始 URL:</div>
                                {group.entries.map((entry, i) => (
                                    <div key={i} className="merge-url-item">
                                        {mergeStrategy === 'MANUAL' && (
                                            <input
                                                type="radio"
                                                name={`url-${groupKey}`}
                                                checked={selectedUrl === entry.url || (!selectedUrl && i === 0)}
                                                onChange={() => onSelectUrl(groupKey, entry.url)}
                                                className="merge-radio"
                                            />
                                        )}
                                        <span className="url">{entry.url}</span>
                                    </div>
                                ))}
                            </div>

                            {/* 目标 URL */}
                            <div className="merge-target">
                                <span className="merge-target-label">合并为:</span>
                                <span className="merge-target-url">{targetUrl}</span>
                            </div>

                            {/* 密码 */}
                            <div className="merge-password">
                                <PasswordCell password={group.password} privacyMode={privacyMode} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
