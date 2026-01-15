// ==========================================
// PassDiff - Merge List Component
// ==========================================

import type { MergeGroup } from '../core/merge';
import type { PrivacyMode } from '../core/types';
import { PasswordCell } from './PasswordCell';

interface MergeListProps {
    groups: MergeGroup[];
    privacyMode: PrivacyMode;
}

export function MergeList({ groups, privacyMode }: MergeListProps) {
    if (groups.length === 0) {
        return null;
    }

    return (
        <>
            {groups.map((group, index) => (
                <div key={`${group.domain}-${group.username}-${index}`} className="merge-group">
                    <div className="merge-group-header">
                        <span className="domain">{group.domain}</span>
                        <span className="count">{group.entries.length} 条可合并</span>
                        {group.hasRisk && <span className="risk-icon">⚠️</span>}
                    </div>

                    <div className="merge-item">
                        <div className="urls">
                            {group.entries.map((entry, i) => (
                                <span key={i} className="url">{entry.url}</span>
                            ))}
                        </div>
                        <span className="username">{group.username}</span>
                        <PasswordCell password={group.password} privacyMode={privacyMode} />
                    </div>
                </div>
            ))}
        </>
    );
}
