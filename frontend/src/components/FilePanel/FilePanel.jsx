import React, { useState } from 'react';
import { FileCode, FileText, Upload, Plus, Trash2, Edit2, Check, X, Target } from 'lucide-react';
import './FilePanel.css';

function TargetSelect({ kind, files, selectedId, onChange }) {
  const extension = kind === 'lexer' ? '.l' : '.y';
  const id = `compile-${kind}-target`;
  return <div className="target-row">
    <label className="target-label" htmlFor={id}>{kind === 'lexer' ? 'Lexer' : 'Parser'} ({extension})</label>
    <select
      id={id}
      className="target-dropdown"
      aria-label={`Compile ${kind}`}
      aria-describedby="compile-target-help"
      title={files.find(file => file.id === selectedId)?.name}
      value={selectedId || ''}
      disabled={files.length === 0}
      onChange={event => onChange(event.target.value)}
    >
      {files.length === 0 && <option value="">Add a {extension} file</option>}
      {files.map(file => <option key={file.id} value={file.id}>{file.name}</option>)}
    </select>
  </div>;
}

export default function FilePanel({
  files = [],
  activeFileId,
  compileMode = 'lex',
  selectedLexId,
  selectedYaccId,
  onSelectTargetLex = () => {},
  onSelectTargetYacc = () => {},
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onUploadFileClick,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const lexFiles = files.filter((f) => f.name.endsWith('.l'));
  const yaccFiles = files.filter((f) => f.name.endsWith('.y'));
  const usesLex = compileMode !== 'yacc';
  const usesYacc = compileMode !== 'lex';

  const handleCreateSubmit = (e) => {
    e?.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const handleStartRename = (file, e) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditName(file.name);
  };

  const handleRenameSubmit = (id, e) => {
    e?.stopPropagation();
    if (editName.trim()) {
      onRenameFile(id, editName.trim());
    }
    setEditingId(null);
  };

  const getFileCategory = (name) => {
    if (name.endsWith('.l')) return { type: 'Lexer', icon: <FileCode size={15} /> };
    if (name.endsWith('.y')) return { type: 'Parser', icon: <FileCode size={15} /> };
    return { type: 'Source', icon: <FileText size={15} /> };
  };

  return (
    <aside className="lexora-file-panel" id="file-panel">
      <div className="panel-header">
        <span className="panel-title">Project Files ({files.length})</span>
        <div className="header-actions">
          <button
            className="panel-icon-btn"
            onClick={() => setIsCreating(true)}
            title="Create new file"
          >
            <Plus size={15} />
          </button>
          <button
            className="panel-icon-btn"
            onClick={onUploadFileClick}
            title="Upload file into workspace"
          >
            <Upload size={14} />
          </button>
        </div>
      </div>

      {/* New File Inline Creator */}
      {isCreating && (
        <form className="new-file-form" onSubmit={handleCreateSubmit} noValidate>
          <input
            type="text"
            className="new-file-input"
            placeholder="e.g. scanner.l, parser.y"
            value={newFileName}
            autoFocus
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <div className="new-file-actions">
            <button type="submit" className="btn-confirm" title="Create">
              <Check size={13} />
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsCreating(false)}
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
        </form>
      )}

      {/* Quick Add Presets Bar (Lex and Yacc only, no input.txt) */}
      <div className="quick-add-bar">
        <span className="quick-label">Add:</span>
        <button
          className="quick-chip"
          onClick={() => onCreateFile(`lexer_${files.length + 1}.l`)}
          title="Create a new blank Lex file"
        >
          +.l (Lex)
        </button>
        <button
          className="quick-chip"
          onClick={() => onCreateFile(`parser_${files.length + 1}.y`)}
          title="Create a new blank Yacc file"
        >
          +.y (Yacc)
        </button>
      </div>

      <section className="target-selection-section" aria-label="Compile targets">
        <h2 className="target-heading">Compile targets</h2>
        {usesLex && <TargetSelect kind="lexer" files={lexFiles} selectedId={selectedLexId} onChange={onSelectTargetLex} />}
        {usesYacc && <TargetSelect kind="parser" files={yaccFiles} selectedId={selectedYaccId} onChange={onSelectTargetYacc} />}
        <p className="target-help" id="compile-target-help">Choose the files to run. Opening a file only changes the editor.</p>
      </section>

      {/* File List */}
      <nav className="file-list">
        {files.length === 0 ? (
          <div className="empty-files-placeholder">
            <p>No files in workspace.</p>
            <p className="sub">Click + above to create a file or upload one.</p>
          </div>
        ) : (
          files.map((file) => {
            const isActive = activeFileId === file.id;
            const category = getFileCategory(file.name);
            const lineCount = file.content ? file.content.split('\n').length : 0;
            const isTargetLex = usesLex && selectedLexId === file.id;
            const isTargetYacc = usesYacc && selectedYaccId === file.id;
            const targetKind = usesLex && file.name.endsWith('.l') ? 'lexer' : usesYacc && file.name.endsWith('.y') ? 'parser' : null;
            const isTarget = isTargetLex || isTargetYacc;

            return (
              <div
                key={file.id}
                id={`file-item-${file.id}`}
                className={`file-item ${isActive ? 'active' : ''}`}
              >
                {editingId === file.id ? (
                  <div className="file-item-main">
                    <span className="file-icon-box">{category.icon}</span>
                    <input
                      type="text"
                      className="inline-rename-input"
                      aria-label={`Rename ${file.name}`}
                      value={editName}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={(e) => handleRenameSubmit(file.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(file.id, e);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  </div>
                ) : (
                  <button type="button" className="file-item-main file-open-btn" aria-label={`Open ${file.name}`} title={file.name} onClick={() => onSelectFile(file.id)}>
                    <span className="file-icon-box">{category.icon}</span>
                    <span className="file-info-col">
                      <span className="file-name-row">
                        <span className="file-name">{file.name}</span>
                        {isTargetLex && (
                          <span className="target-tag" title="Selected Lexer for pipeline">TARGET</span>
                        )}
                        {isTargetYacc && (
                          <span className="target-tag" title="Selected Parser for pipeline">TARGET</span>
                        )}
                      </span>
                      <span className="file-subtext">{category.type}</span>
                    </span>
                  </button>
                )}

                <div className="file-item-right">
                  {targetKind && <button
                    type="button"
                    className={`file-target-btn ${isTarget ? 'is-target' : ''}`}
                    aria-label={isTarget ? `Current ${targetKind} target: ${file.name}` : `Use ${file.name} as ${targetKind} target`}
                    title={isTarget ? `Current ${targetKind} target` : `Use ${file.name} as ${targetKind} target`}
                    disabled={isTarget}
                    onClick={() => targetKind === 'lexer' ? onSelectTargetLex(file.id) : onSelectTargetYacc(file.id)}
                  >
                    {isTarget ? <Check size={13} /> : <Target size={13} />}
                    <span>{isTarget ? 'Set' : 'Use'}</span>
                  </button>}
                  <span className="file-lines">{lineCount}L</span>
                  <div className="item-hover-actions">
                    <button
                      className="item-action-btn"
                      onClick={(e) => handleStartRename(file, e)}
                      title="Rename"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="item-action-btn btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      title="Delete file"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </nav>

      <div className="panel-footer-guide">
        <div className="guide-title">Active Mode</div>
        <div className="guide-text">
          {compileMode === 'lex' ? 'Lex Only' : compileMode === 'yacc' ? 'Yacc Only' : 'Lex + Yacc'}
        </div>
      </div>
    </aside>
  );
}
