// ==========================================
// PassDiff - File Uploader Component
// ==========================================

import { useCallback, useState, useRef } from 'react';
import type { ParsedCsvResult } from '../core/types';
import { parseFile } from '../core/parser';

interface FileUploaderProps {
    fileA: ParsedCsvResult | null;
    fileB: ParsedCsvResult | null;
    onFileALoaded: (result: ParsedCsvResult) => void;
    onFileBLoaded: (result: ParsedCsvResult) => void;
    onSwap: () => void;
}

interface UploadZoneProps {
    label: string;
    hint: string;
    result: ParsedCsvResult | null;
    source: 'A' | 'B';
    onFileLoaded: (result: ParsedCsvResult) => void;
}

function UploadZone({ label, hint, result, source, onFileLoaded }: UploadZoneProps) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        const parsed = await parseFile(file, source);
        onFileLoaded(parsed);
    }, [source, onFileLoaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const hasFile = result !== null && result.entries.length > 0;

    return (
        <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${hasFile ? 'has-file' : ''}`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                style={{ display: 'none' }}
            />

            {hasFile ? (
                <div className="file-info">
                    <span className="icon">✓</span>
                    <span className="file-name">{result.format} 格式</span>
                    <span className="file-stats">
                        {result.entries.length} 条密码记录
                        {result.errors.length > 0 && ` (${result.errors.length} 个警告)`}
                    </span>
                </div>
            ) : (
                <>
                    <span className="icon">📁</span>
                    <span className="label">{label}</span>
                    <span className="hint">{hint}</span>
                </>
            )}
        </div>
    );
}

export function FileUploader({
    fileA,
    fileB,
    onFileALoaded,
    onFileBLoaded,
    onSwap
}: FileUploaderProps) {
    const canSwap = fileA !== null || fileB !== null;

    return (
        <div className="uploader-container">
            <UploadZone
                label="基准文档 (A)"
                hint="拖拽或点击上传 Chrome/BitWarden CSV"
                result={fileA}
                source="A"
                onFileLoaded={onFileALoaded}
            />

            <button
                className="swap-button"
                onClick={onSwap}
                disabled={!canSwap}
                title="交换文档"
            >
                🔁
            </button>

            <UploadZone
                label="新文档 (B)"
                hint="拖拽或点击上传 Chrome/BitWarden CSV"
                result={fileB}
                source="B"
                onFileLoaded={onFileBLoaded}
            />
        </div>
    );
}
