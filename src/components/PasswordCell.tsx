// ==========================================
// PassDiff - Password Cell Component
// ==========================================

import { useState, useCallback } from 'react';
import type { PrivacyMode } from '../core/types';

interface PasswordCellProps {
    password: string;
    privacyMode: PrivacyMode;
}

export function PasswordCell({ password, privacyMode }: PasswordCellProps) {
    const [peeking, setPeeking] = useState(false);

    const handlePeek = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setPeeking(true);
    }, []);

    const handleHide = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setPeeking(false);
    }, []);

    // 根据隐私模式决定显示内容
    const getDisplayValue = (): string => {
        if (privacyMode === 'PLAIN') {
            return password;
        }
        if (privacyMode === 'PEEK' && peeking) {
            return password;
        }
        return '••••••••';
    };

    const showPeekButton = privacyMode === 'PEEK' && !peeking;
    const showHideButton = privacyMode === 'PEEK' && peeking;

    return (
        <span className="password-cell">
            <input
                type="text"
                value={getDisplayValue()}
                readOnly
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
            />
            {showPeekButton && (
                <button className="peek-btn" onClick={handlePeek} title="查看密码">
                    👁️
                </button>
            )}
            {showHideButton && (
                <button className="peek-btn" onClick={handleHide} title="隐藏密码">
                    🙈
                </button>
            )}
        </span>
    );
}
