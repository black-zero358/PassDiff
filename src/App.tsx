// ==========================================
// PassDiff - Main Application
// ==========================================

import { useState, useCallback, useMemo } from 'react';
import './App.css';

import type {
  ParsedCsvResult,
  DiffGroup,
  VirtualRowData,
  AppSettings
} from './core/types';
import { diffPasswords, flattenGroups, getDiffStats } from './core/diff';
import { downloadCSV } from './core/exporter';

import { FileUploader } from './components/FileUploader';
import { VirtualDiffList } from './components/VirtualDiffList';
import { SettingsPanel } from './components/SettingsPanel';

// 默认设置
const defaultSettings: AppSettings = {
  privacyMode: 'PEEK',
  mergeStrategy: 'ROOT_DOMAIN',
  showSameEntries: false
};

function App() {
  // 文件状态
  const [fileA, setFileA] = useState<ParsedCsvResult | null>(null);
  const [fileB, setFileB] = useState<ParsedCsvResult | null>(null);

  // 设置状态
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // 展开的分组
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // 计算对比结果
  const diffGroups: DiffGroup[] = useMemo(() => {
    if (!fileA || !fileB) return [];
    return diffPasswords(fileA.entries, fileB.entries);
  }, [fileA, fileB]);

  // 计算统计数据
  const stats = useMemo(() => {
    return getDiffStats(diffGroups);
  }, [diffGroups]);

  // 生成虚拟列表数据
  const virtualRows: VirtualRowData[] = useMemo(() => {
    return flattenGroups(diffGroups, expandedDomains, settings.showSameEntries);
  }, [diffGroups, expandedDomains, settings.showSameEntries]);

  // 默认展开所有非相同的分组
  useMemo(() => {
    if (diffGroups.length > 0 && expandedDomains.size === 0) {
      const nonEmptyDomains = diffGroups
        .filter(g => g.items.some(i => i.status !== 'SAME'))
        .map(g => g.domain);
      setExpandedDomains(new Set(nonEmptyDomains));
    }
  }, [diffGroups]);

  // 处理分组展开/折叠
  const handleToggleGroup = useCallback((domain: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

  // 交换文件
  const handleSwap = useCallback(() => {
    setFileA(fileB);
    setFileB(fileA);
    setExpandedDomains(new Set());
  }, [fileA, fileB]);

  // 导出合并结果
  const handleExport = useCallback(() => {
    if (!fileA && !fileB) return;

    // 简单导出：合并两边的条目，优先使用 B 的密码
    const mergedEntries = new Map();

    fileA?.entries.forEach(entry => {
      const key = `${entry.domain}::${entry.username}`;
      mergedEntries.set(key, entry);
    });

    fileB?.entries.forEach(entry => {
      const key = `${entry.domain}::${entry.username}`;
      mergedEntries.set(key, entry);
    });

    downloadCSV(Array.from(mergedEntries.values()), 'merged_passwords.csv');
  }, [fileA, fileB]);

  // 全部展开
  const handleExpandAll = useCallback(() => {
    const allDomains = diffGroups.map(g => g.domain);
    setExpandedDomains(new Set(allDomains));
  }, [diffGroups]);

  // 全部折叠
  const handleCollapseAll = useCallback(() => {
    setExpandedDomains(new Set());
  }, []);

  const hasData = fileA !== null && fileB !== null;
  const hasDiff = stats.total > 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-title">
          <h1>🔐 PassDiff</h1>
          <span className="badge">本地对比</span>
        </div>
        <SettingsPanel settings={settings} onSettingsChange={setSettings} />
      </header>

      {/* File Uploader */}
      <FileUploader
        fileA={fileA}
        fileB={fileB}
        onFileALoaded={setFileA}
        onFileBLoaded={setFileB}
        onSwap={handleSwap}
      />

      {/* Stats Bar */}
      {hasData && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">总条目</span>
          </div>
          <div className="stat-item modified">
            <span className="stat-value">{stats.modified}</span>
            <span className="stat-label">已修改</span>
          </div>
          <div className="stat-item only-a">
            <span className="stat-value">{stats.onlyA}</span>
            <span className="stat-label">仅基准</span>
          </div>
          <div className="stat-item only-b">
            <span className="stat-value">{stats.onlyB}</span>
            <span className="stat-label">新增</span>
          </div>
          {stats.riskCount > 0 && (
            <div className="stat-item risk">
              <span className="stat-value">{stats.riskCount}</span>
              <span className="stat-label">⚠️ 风险域名</span>
            </div>
          )}
        </div>
      )}

      {/* Actions Bar */}
      {hasDiff && (
        <div className="actions-bar">
          <div className="left">
            <button onClick={handleExpandAll}>展开全部</button>
            <button onClick={handleCollapseAll}>折叠全部</button>
          </div>
          <div className="right">
            <button className="primary" onClick={handleExport}>
              导出合并结果
            </button>
          </div>
        </div>
      )}

      {/* Diff List */}
      <div className="diff-list-container">
        <VirtualDiffList
          rows={virtualRows}
          privacyMode={settings.privacyMode}
          onToggleGroup={handleToggleGroup}
        />
      </div>
    </div>
  );
}

export default App;
