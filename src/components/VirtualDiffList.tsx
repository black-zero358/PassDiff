// ==========================================
// PassDiff - Virtual Diff List Component
// Using simple CSS-based scrolling for reliability
// ==========================================

import { useMemo } from 'react';
import type { VirtualRowData, PrivacyMode, DiffItem } from '../core/types';
import { PasswordCell } from './PasswordCell';

interface VirtualDiffListProps {
    rows: VirtualRowData[];
    privacyMode: PrivacyMode;
    onToggleGroup: (domain: string) => void;
}

// 分组头组件
interface DiffHeaderRowProps {
    domain: string;
    count: number;
    hasRisk: boolean;
    expanded: boolean;
    onClick: () => void;
}

function DiffHeaderRow({ domain, count, hasRisk, expanded, onClick }: DiffHeaderRowProps) {
    return (
        <div className="diff-header" onClick={onClick}>
            <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
                ▶
            </span>
            <span className="domain">{domain}</span>
            <span className="count">{count} 条变更</span>
            {hasRisk && <span className="risk-icon" title="包含敏感子域">⚠️</span>}
        </div>
    );
}

// 条目行组件
interface DiffItemRowProps {
    item: DiffItem;
    privacyMode: PrivacyMode;
}

function DiffItemRow({ item, privacyMode }: DiffItemRowProps) {
    const statusClass = `status-${item.status.toLowerCase().replace('_', '-')}`;

    const getStatusLabel = () => {
        switch (item.status) {
            case 'MODIFIED': return '已修改';
            case 'ONLY_A': return '仅基准';
            case 'ONLY_B': return '新增';
            default: return '相同';
        }
    };

    const getStatusBadgeClass = () => {
        switch (item.status) {
            case 'MODIFIED': return 'modified';
            case 'ONLY_A': return 'only-a';
            case 'ONLY_B': return 'only-b';
            default: return '';
        }
    };

    return (
        <div className={`diff-item ${statusClass}`}>
            <span className="username" title={item.username}>
                {item.username || '(无用户名)'}
            </span>

            <div className="password-diff">
                {item.entryA && (
                    <PasswordCell password={item.entryA.password} privacyMode={privacyMode} />
                )}
                {item.status === 'MODIFIED' && (
                    <>
                        <span className="arrow">→</span>
                        {item.entryB && (
                            <PasswordCell password={item.entryB.password} privacyMode={privacyMode} />
                        )}
                    </>
                )}
                {item.status === 'ONLY_B' && item.entryB && (
                    <PasswordCell password={item.entryB.password} privacyMode={privacyMode} />
                )}
            </div>

            <span className={`status-badge ${getStatusBadgeClass()}`}>
                {getStatusLabel()}
            </span>
        </div>
    );
}

// 主组件 - 使用原生滚动，对于中等数据量（<5000条）足够高效
export function VirtualDiffList({ rows, privacyMode, onToggleGroup }: VirtualDiffListProps) {
    const renderedRows = useMemo(() => {
        return rows.map((row, index) => {
            if (row.type === 'HEADER') {
                return (
                    <DiffHeaderRow
                        key={`header-${row.domain}`}
                        domain={row.domain}
                        count={row.count}
                        hasRisk={row.hasRisk}
                        expanded={row.expanded}
                        onClick={() => onToggleGroup(row.domain)}
                    />
                );
            }

            return (
                <DiffItemRow
                    key={`item-${row.item.key}-${index}`}
                    item={row.item}
                    privacyMode={privacyMode}
                />
            );
        });
    }, [rows, privacyMode, onToggleGroup]);

    if (rows.length === 0) {
        return (
            <div className="diff-list-empty">
                <span className="icon">📋</span>
                <p>上传两个 CSV 文件开始对比</p>
            </div>
        );
    }

    return (
        <div className="diff-list-scroll">
            {renderedRows}
        </div>
    );
}
