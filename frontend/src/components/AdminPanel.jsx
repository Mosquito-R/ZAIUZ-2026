import React, { useState } from 'react';
import AdminSeries from './AdminSeries';
import AdminSensors from './AdminSensors';

export default function AdminPanel({ seriesList, onSeriesUpdated, onBack }) {
  const [activeTab, setActiveTab] = useState('series'); 

  return (
    <div className="admin-screen no-print">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Panel Administratora</h2>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Powrót do widoku głównego
        </button>
      </div>

      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'series' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('series')}
        >
          Serie pomiarowe
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'sensors' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sensors')}
        >
          Czujniki IoT 
        </button>
      </div>

      
      {activeTab === 'series' ? (
        <AdminSeries
          seriesList={seriesList}
          onSeriesUpdated={onSeriesUpdated}
          onBack={null}
        />
      ) : (
        <AdminSensors
          seriesList={seriesList}
          onBack={null}
        />
      )}
    </div>
  );
}