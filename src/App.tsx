// ==========================================
// PassDiff - Main Application
// 简约、克制、高效
// ==========================================

import { useState, useCallback, useMemo } from 'react';
import './App.css';

import type {
  ParsedCsvResult,
  DiffGroup,
  VirtualRowData,
  AppSettings,
  PasswordEntry
} from './core/types';
import { diffPasswords, flattenGroups, getDiffStats } from './core/diff';
import { downloadCSV } from './core/exporter';
import { findMergeCandidates, type MergeGroup } from './core/merge';

import { FileUploader } from './components/FileUploader';
import { VirtualDiffList } from './components/VirtualDiffList';
import { MergeList } from './components/MergeList';

type AppMode = 'COMPARE' | 'MERGE';

// 默认设置
const defaultSettings: AppSettings = {
  privacyMode: 'PEEK',
  mergeStrategy: 'ROOT_DOMAIN',
  showSameEntries: false
};

function App() {
  // 应用模式
  const [mode, setMode] = useState<AppMode>('COMPARE');

  // 文件状态
  const [fileA, setFileA] = useState<ParsedCsvResult | null>(null);
  const [fileB, setFileB] = useState<ParsedCsvResult | null>(null);
  const [mergeFile, setMergeFile] = useState<ParsedCsvResult | null>(null);

  // 设置状态
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // 展开的分组
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // 对比模式: 计算对比结果
  const diffGroups: DiffGroup[] = useMemo(() => {
    if (mode !== 'COMPARE' || !fileA || !fileB) return [];
    return diffPasswords(fileA.entries, fileB.entries);
  }, [mode, fileA, fileB]);

  // 对比模式: 统计数据
  const stats = useMemo(() => getDiffStats(diffGroups), [diffGroups]);

  // 对比模式: 虚拟列表数据
  const virtualRows: VirtualRowData[] = useMemo(() => {
    return flattenGroups(diffGroups, expandedDomains, settings.showSameEntries);
  }, [diffGroups, expandedDomains, settings.showSameEntries]);

  // 合并模式: 查找可合并项
  const mergeGroups: MergeGroup[] = useMemo(() => {
    if (mode !== 'MERGE' || !mergeFile) return [];
    return findMergeCandidates(mergeFile.entries);
  }, [mode, mergeFile]);

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
    if (mode === 'COMPARE') {
      if (!fileA && !fileB) return;
      const mergedEntries = new Map<string, PasswordEntry>();
      fileA?.entries.forEach(entry => {
        const key = `${entry.domain}::${entry.username}`;
        mergedEntries.set(key, entry);
      });
      fileB?.entries.forEach(entry => {
        const key = `${entry.domain}::${entry.username}`;
        mergedEntries.set(key, entry);
      });
      downloadCSV(Array.from(mergedEntries.values()), 'merged_passwords.csv');
    }
  }, [mode, fileA, fileB]);

  // 全部展开/折叠
  const handleExpandAll = useCallback(() => {
    const allDomains = diffGroups.map(g => g.domain);
    setExpandedDomains(new Set(allDomains));
  }, [diffGroups]);

  const handleCollapseAll = useCallback(() => {
    setExpandedDomains(new Set());
  }, []);

  // 切换隐私模式
  const handlePrivacyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(s => ({ ...s, privacyMode: e.target.value as AppSettings['privacyMode'] }));
  }, []);

  const hasCompareData = fileA !== null && fileB !== null;
  const hasMergeData = mergeFile !== null && mergeGroups.length > 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">🔐 PassDiff</div>

          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'COMPARE' ? 'active' : ''}`}
              onClick={() => setMode('COMPARE')}
            >
              对比
            </button>
            <button
              className={`mode-tab ${mode === 'MERGE' ? 'active' : ''}`}
              onClick={() => setMode('MERGE')}
            >
              合并
            </button>
          </div>
        </div>

        <div className="header-right">
          <div className="setting-group">
            <label>隐私</label>
            <select value={settings.privacyMode} onChange={handlePrivacyChange}>
              <option value="SECURE">隐藏</option>
              <option value="PEEK">预览</option>
              <option value="PLAIN">明文</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Compare Mode */}
        {mode === 'COMPARE' && (
          <>
            <div className="upload-section">
              <FileUploader
                mode="compare"
                fileA={fileA}
                fileB={fileB}
                onFileALoaded={setFileA}
                onFileBLoaded={setFileB}
                onSwap={handleSwap}
              />
            </div>

            {hasCompareData && (
              <div className="stats-bar">
                <div className="stat">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">总计</span>
                </div>
                <div className="stat modified">
                  <span className="stat-value">{stats.modified}</span>
                  <span className="stat-label">修改</span>
                </div>
                <div className="stat only-a">
                  <span className="stat-value">{stats.onlyA}</span>
                  <span className="stat-label">仅A</span>
                </div>
                <div className="stat only-b">
                  <span className="stat-value">{stats.onlyB}</span>
                  <span className="stat-label">仅B</span>
                </div>
              </div>
            )}

            <div className="results">
              {hasCompareData && (
                <div className="results-toolbar">
                  <div className="results-toolbar-left">
                    <button onClick={handleExpandAll}>展开全部</button>
                    <button onClick={handleCollapseAll}>折叠全部</button>
                  </div>
                  <div className="results-toolbar-right">
                    <button className="primary" onClick={handleExport}>导出</button>
                  </div>
                </div>
              )}

              {hasCompareData ? (
                <div className="results-list">
                  <VirtualDiffList
                    rows={virtualRows}
                    privacyMode={settings.privacyMode}
                    onToggleGroup={handleToggleGroup}
                  />
                </div>
              ) : (
                <div className="results-empty">
                  <span className="icon">📋</span>
                  <p>上传两个 CSV 文件开始对比</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Merge Mode */}
        {mode === 'MERGE' && (
          <>
            <div className="upload-section">
              <FileUploader
                mode="merge"
                mergeFile={mergeFile}
                onMergeFileLoaded={setMergeFile}
              />
            </div>

            <div className="results">
              {hasMergeData && (
                <div className="results-toolbar">
                  <div className="results-toolbar-left">
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      发现 {mergeGroups.length} 组可合并项
                    </span>
                  </div>
                  <div className="results-toolbar-right">
                    <button className="primary">应用合并</button>
                  </div>
                </div>
              )}

              {hasMergeData ? (
                <div className="results-list">
                  <MergeList groups={mergeGroups} privacyMode={settings.privacyMode} />
                </div>
              ) : (
                <div className="results-empty">
                  <span className="icon">🔄</span>
                  <p>上传 CSV 文件进行去重优化</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
