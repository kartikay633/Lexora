import React, { useState, useRef } from 'react';
import { Upload, FileCode, ArrowRight, Check } from 'lucide-react';
import './HomeView.css';

export default function HomeView({ onStartWriting, onUploadFiles }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (fileList) => {
    const readers = fileList.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            content: event.target.result,
          });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readers).then((newFiles) => {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    });
  };

  const handleOpenUploaded = () => {
    if (uploadedFiles.length > 0) {
      onUploadFiles(uploadedFiles);
    }
  };

  return (
    <div className="home-container">
      <header className="home-nav">
        <div className="home-brand">
          <span className="brand-dot"></span>
          <span className="brand-title">Lexora</span>
        </div>
      </header>

      <main className="home-hero">
        <div className="hero-text-block">
          <h1>Compiler Workbench</h1>
          <p>
            A dedicated platform to build, execute, and analyze compiler design programs.
            Write your own Flex and Bison specifications or import existing source code.
          </p>
          <div className="hero-prompt-label">Choose an option to begin:</div>
        </div>

        <div className="entry-grid two-options-grid">
          {/* Option 1: Write Lex / Yacc Code */}
          <div className="entry-card" onClick={onStartWriting}>
            <div className="card-icon-wrapper">
              <FileCode size={24} className="card-icon" />
            </div>
            <div className="card-content">
              <h3>Write Lex / Yacc Code</h3>
              <p>
                Open a clean workspace. Create your Lex (.l), Yacc (.y), and input files
                with complete freedom.
              </p>
            </div>
            <div className="card-action">
              <span>Start Writing</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Option 2: Upload Files */}
          <div className="entry-card upload-card" onClick={() => setIsUploading(true)}>
            <div className="card-icon-wrapper">
              <Upload size={24} className="card-icon" />
            </div>
            <div className="card-content">
              <h3>Upload Files</h3>
              <p>
                Import your existing .l, .y, or test input files from your computer to
                compile and inspect them.
              </p>
            </div>
            <div className="card-action">
              <span>Browse or Drop Files</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>

        {/* Upload Modal Dialog */}
        {isUploading && (
          <div className="home-modal-backdrop" onClick={() => setIsUploading(false)}>
            <div className="home-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Your Files</h2>
                <button className="btn-close" onClick={() => setIsUploading(false)}>✕</button>
              </div>

              <div
                className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".l,.y,.txt,.c,.h"
                  onChange={handleFileInputChange}
                />
                <Upload size={32} className="dropzone-icon" />
                <span className="dropzone-primary-text">Click to choose files or drag and drop</span>
                <span className="dropzone-sub-text">Upload your .l, .y, or input text files</span>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="uploaded-list">
                  <div className="uploaded-list-title">Files ready to open ({uploadedFiles.length}):</div>
                  {uploadedFiles.map((f) => (
                    <div key={f.id} className="uploaded-item ready">
                      <FileCode size={16} />
                      <span className="file-slot-name">{f.name}</span>
                      <Check size={16} className="check-icon" />
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsUploading(false)}>Cancel</button>
                <button
                  className="btn-primary"
                  disabled={uploadedFiles.length === 0}
                  onClick={handleOpenUploaded}
                >
                  Open in Workbench
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
