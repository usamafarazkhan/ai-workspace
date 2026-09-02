'use client';

import React, { useState, useEffect } from 'react';
import { getFiles, uploadFile } from '../../lib/api';

export default function KnowledgeBase({ project }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (project?.id) {
      loadFiles();
    }
  }, [project?.id]);

  const loadFiles = async () => {
    try {
      const res = await getFiles(project.id);
      setFiles(res.data);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadFile(project.id, file);
      await loadFiles();
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dark-card p-4 p-lg-5">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="text-white mb-1 fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-folder-fill text-amber"></i>
            Project Knowledge Base & RAG Engine
          </h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.88rem' }}>
            Upload PDFs, Markdown specs, Python/JS source files, or database schemas. Automatic chunking & vector indexing.
          </p>
        </div>
        <div>
          <label className="btn btn-cyan d-flex align-items-center gap-2 px-4 py-2 mb-0 cursor-pointer shadow">
            <i className="bi bi-cloud-upload"></i>
            <span>{uploading ? 'Processing RAG Chunks...' : 'Upload Document'}</span>
            <input type="file" onChange={handleFileUpload} hidden disabled={uploading} />
          </label>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-5 text-secondary border border-dashed border-secondary border-opacity-30 rounded-3 p-5">
          <i className="bi bi-file-earmark-arrow-up fs-1 d-block mb-3 text-amber opacity-75"></i>
          <h5 className="text-white">No Project Documents Uploaded Yet</h5>
          <p className="small text-secondary mx-auto mb-4" style={{ maxWidth: '480px' }}>
            Upload project manuals, API documentation, or architecture blueprints to empower the RAG Slave Agent with domain context.
          </p>
          <label className="btn btn-outline-cyan px-4 py-2 cursor-pointer">
            <i className="bi bi-upload me-1"></i> Choose File to Upload
            <input type="file" onChange={handleFileUpload} hidden disabled={uploading} />
          </label>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
            <thead>
              <tr className="text-secondary border-secondary border-opacity-25">
                <th>Filename</th>
                <th>Type</th>
                <th>Size</th>
                <th>Chunks</th>
                <th>Summary</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-secondary border-opacity-25">
                  <td className="fw-bold text-white">
                    <i className="bi bi-file-earmark-code text-cyan me-2"></i>
                    {file.filename}
                  </td>
                  <td><span className="badge bg-secondary bg-opacity-40 text-light">{file.file_type}</span></td>
                  <td className="text-secondary">{(file.file_size / 1024).toFixed(1)} KB</td>
                  <td><span className="badge bg-amber bg-opacity-20 text-amber border border-warning">{file.chunk_count} Chunks</span></td>
                  <td className="text-secondary" style={{ fontSize: '0.84rem', maxWidth: '300px' }}>
                    {file.summary || 'Chunked & indexed for RAG vector search.'}
                  </td>
                  <td className="text-secondary" style={{ fontSize: '0.78rem' }}>
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
