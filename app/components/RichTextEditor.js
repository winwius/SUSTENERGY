"use client";

import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, className = "" }) => {
    const editorRef = useRef(null);

    // Update innerHTML only when value changes externally and is different from current content
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className={`rich-editor-container ${className}`}>
            <div
                className="rich-editor-toolbar flex flex-row items-center gap-0.5 p-1 border-b border-slate-200 bg-slate-50 rounded-t-xl overflow-x-auto no-scrollbar"
                suppressHydrationWarning={true}
            >
                {/* ... buttons ... */}
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Italic"
                >
                    <Italic size={16} />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1 self-center shrink-0" />
                <button
                    type="button"
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Bullets"
                >
                    <List size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1 self-center shrink-0" />
                <button
                    type="button"
                    onClick={() => execCommand('justifyLeft')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Align Left"
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('justifyCenter')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Align Center"
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('justifyRight')}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 shrink-0"
                    title="Align Right"
                >
                    <AlignRight size={16} />
                </button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressHydrationWarning={true}
                onInput={handleInput}
                className="rich-editor-content p-4 h-[200px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white rounded-b-xl"
                style={{ height: '200px' }}
                data-placeholder={placeholder}
            />
        </div>
    );
};

export default RichTextEditor;
