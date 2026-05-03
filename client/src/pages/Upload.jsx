import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { UploadCloud, FileSpreadsheet, Trash2, Download, Share2, X } from 'lucide-react';

const Upload = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [agents, setAgents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [batchName, setBatchName] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handover state
  const [handoverBatch, setHandoverBatch] = useState(null);
  const [targetAgentId, setTargetAgentId] = useState('');

  const fetchData = async () => {
    try {
      const usersEndpoint = user?.role === 'admin' ? '/users' : '/users/my-agents';
      const [usersRes, batchesRes] = await Promise.all([
        api.get(usersEndpoint),
        api.get('/upload/batches')
      ]);
      setAgents(usersRes.data.filter(u => u.role === 'agent' && u.active));
      setBatches(batchesRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('batch_uploaded', fetchData);
      socket.on('users_updated', fetchData);
      socket.on('contacts_updated', fetchData);
    }
    return () => {
      if (socket) {
        socket.off('batch_uploaded', fetchData);
        socket.off('users_updated', fetchData);
        socket.off('contacts_updated', fetchData);
      }
    };
  }, [socket, user]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.csv') || selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls'))) {
      if (selected.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selected);
    } else {
      alert('Please select a valid CSV or Excel file');
    }
  };

  const handleUpload = async () => {
    if (!selectedAgent || !file) {
      alert('Please select an agent and a file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', selectedAgent);
    if (batchName) formData.append('batchName', batchName);

    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setBatchName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('File uploaded successfully!');
      // fetchData() will be called via socket event
    } catch (error) {
      alert(error.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch and ALL its contacts? This cannot be undone.')) {
      try {
        await api.delete(`/contacts/batch/${batchId}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.error || 'Delete failed');
      }
    }
  };

  const handleHandover = async () => {
    try {
      await api.put(`/contacts/batch/${handoverBatch._id}/handover`, { agentId: targetAgentId });
      setHandoverBatch(null);
      setTargetAgentId('');
      fetchData();
      alert('Batch handed over successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Handover failed');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crm-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download template');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UploadCloud className="text-primary" size={32} /> Data Import
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload CSV/Excel contacts and assign them to agents in real-time</p>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Upload Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} /> New Upload
          </h2>
          
          <div className="input-group">
            <label>Assign to Agent *</label>
            <select className="input-field" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
              <option value="">-- Select Recipient (TL or Agent) --</option>
              {agents.map(a => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Batch Name (Optional)</label>
            <input type="text" className="input-field" placeholder="e.g. Q3 Premium Leads" value={batchName} onChange={e => setBatchName(e.target.value)} />
          </div>

          <div className="input-group" style={{ marginTop: '24px' }}>
            <label>Select File *</label>
            <div 
              style={{ 
                border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '32px 20px', 
                textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface-hover)',
                transition: 'all 0.2s',
                borderColor: file ? 'var(--primary)' : 'var(--border-color)'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              {file ? (
                <div>
                  <FileSpreadsheet size={32} className="text-success" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: '600', color: 'var(--success)' }}>{file.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <UploadCloud size={32} style={{ margin: '0 auto 12px', color: 'var(--text-secondary)' }} />
                  <div style={{ fontWeight: '500' }}>Click to browse file</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>CSV or Excel files only (Max 10MB)</div>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '24px', padding: '14px' }}
            onClick={handleUpload}
            disabled={isUploading || !file || !selectedAgent}
          >
            {isUploading ? 'Uploading & Processing...' : 'Upload Data'}
          </button>
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={downloadTemplate}>
              <Download size={14} /> Download CSV Template
            </button>
          </div>
        </div>

        {/* Batch History */}
        <div className="glass-panel" style={{ padding: '0' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Upload History</h2>
            <div className="badge badge-primary">{batches.length} Batches</div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--bg-surface-hover)' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontWeight: '600' }}>Batch Details</th>
                  <th style={{ padding: '16px 24px', fontWeight: '600' }}>Agent</th>
                  <th style={{ padding: '16px 24px', fontWeight: '600' }}>Records</th>
                  <th style={{ padding: '16px 24px', fontWeight: '600' }}>Date</th>
                  {['admin', 'tl'].includes(user?.role) && <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No uploads yet</td></tr>
                ) : (
                  batches.map(b => (
                    <tr key={b._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '600' }}>{b.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.fileName}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className="badge badge-success">{b.agentName}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: '600' }}>{b.totalContacts}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div>{new Date(b.uploadedAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(b.uploadedAt).toLocaleTimeString()}</div>
                      </td>
                      {['admin', 'tl'].includes(user?.role) && (
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {user.role === 'tl' && (
                              <button className="btn btn-primary" style={{ padding: '6px' }} title="Handover to Agent" onClick={() => {
                                setHandoverBatch(b);
                                setTargetAgentId('');
                              }}>
                                <Share2 size={16} />
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDeleteBatch(b._id)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Handover Modal */}
      {handoverBatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '32px', background: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Handover Batch to Agent</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setHandoverBatch(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Batch: <strong>{handoverBatch.name}</strong><br/>
                Records: <strong>{handoverBatch.totalContacts}</strong>
              </p>
            </div>

            <div className="input-group">
              <label>Select Target Agent</label>
              <select className="input-field" value={targetAgentId} onChange={e => setTargetAgentId(e.target.value)}>
                <option value="">-- Choose Agent --</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className="btn btn-outline" onClick={() => setHandoverBatch(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleHandover} disabled={!targetAgentId}>Confirm Handover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
