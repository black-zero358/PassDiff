// ==========================================
// PassDiff - Settings Panel Component
// ==========================================

import type { PrivacyMode, MergeStrategy, AppSettings } from '../core/types';

interface SettingsPanelProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
    const handlePrivacyModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSettingsChange({
            ...settings,
            privacyMode: e.target.value as PrivacyMode
        });
    };

    const handleMergeStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSettingsChange({
            ...settings,
            mergeStrategy: e.target.value as MergeStrategy
        });
    };

    const handleShowSameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({
            ...settings,
            showSameEntries: e.target.checked
        });
    };

    return (
        <div className="settings-panel">
            <div className="setting-group">
                <label htmlFor="privacyMode">隐私模式</label>
                <select
                    id="privacyMode"
                    value={settings.privacyMode}
                    onChange={handlePrivacyModeChange}
                >
                    <option value="SECURE">安全 (隐藏)</option>
                    <option value="PEEK">预览 (点击查看)</option>
                    <option value="PLAIN">明文</option>
                </select>
            </div>

            <div className="setting-group">
                <label htmlFor="mergeStrategy">合并策略</label>
                <select
                    id="mergeStrategy"
                    value={settings.mergeStrategy}
                    onChange={handleMergeStrategyChange}
                >
                    <option value="ROOT_DOMAIN">根域名</option>
                    <option value="KEEP_FIRST">保留第一条</option>
                    <option value="MANUAL">手动处理</option>
                </select>
            </div>

            <div className="setting-group">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.showSameEntries}
                        onChange={handleShowSameChange}
                    />
                    {' '}显示相同条目
                </label>
            </div>
        </div>
    );
}
