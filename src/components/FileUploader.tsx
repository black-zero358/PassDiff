// ==========================================
// PassDiff - File Uploader Component
// ==========================================

import { useCallback, useState, useRef } from 'react';
import type { ParsedCsvResult } from '../core/types';
import { parseFile } from '../core/parser';

// Compare mode props
interface CompareModeProps {
    mode: 'compare';
    fileA: ParsedCsvResult | null;
    fileB: ParsedCsvResult | null;
    onFileALoaded: (result: ParsedCsvResult) => void;
    onFileBLoaded: (result: ParsedCsvResult) => void;
    onSwap: () => void;
}

// Merge mode props
interface MergeModeProps {
    mode: 'merge';
    mergeFile?: ParsedCsvResult | null;
    onMergeFileLoaded?: (result: ParsedCsvResult) => void;
}

type FileUploaderProps = CompareModeProps | MergeModeProps;

interface UploadZoneProps {
    label: string;
    hint: string;
    result: ParsedCsvResult | null;
    source: 'A' | 'B';
    onFileLoaded: (result: ParsedCsvResult) => void;
    className?: string;
}

function UploadZone({ label, hint, result, source, onFileLoaded, className = '' }: UploadZoneProps) {
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
            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${hasFile ? 'has-file' : ''} ${className}`}
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
                <>
                    <span className="file-name">{result.format}</span>
                    <span className="file-stats">{result.entries.length} 条记录</span>
                </>
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

export function FileUploader(props: FileUploaderProps) {
    if (props.mode === 'compare') {
        const { fileA, fileB, onFileALoaded, onFileBLoaded, onSwap } = props;
        const canSwap = fileA !== null || fileB !== null;

        return (
            <>
                <UploadZone
                    label="基准文档 (A)"
                    hint="拖拽或点击上传"
                    result={fileA}
                    source="A"
                    onFileLoaded={onFileALoaded}
                />

                <div className="upload-actions">
                    <button
                        className="swap-btn"
                        onClick={onSwap}
                        disabled={!canSwap}
                        title="交换"
                    >
                        ⇄
                    </button>
                </div>

                <UploadZone
                    label="新文档 (B)"
                    hint="拖拽或点击上传"
                    result={fileB}
                    source="B"
                    onFileLoaded={onFileBLoaded}
                />
            </>
        );
    }

    // Merge mode
    const { mergeFile, onMergeFileLoaded } = props;

    return (
        <UploadZone
            label="密码文档"
            hint="拖拽或点击上传 CSV"
            result={mergeFile || null}
            source="A"
            onFileLoaded={onMergeFileLoaded || (() => { })}
            className="single"
        />
    );
}
