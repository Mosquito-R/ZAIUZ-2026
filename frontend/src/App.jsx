import React, { useState, useEffect } from 'react';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import Filters from './components/Filters';
import LoginModal from './components/LoginModal';
import { seriesApi, measurementsApi,authApi, getToken } from './api/client';


export default function App() {
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));

  const loadMeasurements = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await measurementsApi.get(filters);
      setMeasurements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const seriesData = await seriesApi.getAll();
        setSeries(seriesData);
        await loadMeasurements();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    setIsLoggedIn(false);
  };

  return (
    <div className="container">
      <header>
        <h1>Serie Pomiarowe IoT</h1>
        <div className="no-print">
          {isLoggedIn ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Admin</span>
              <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                Wyloguj
              </button>
            </div>
          ) : (
            <button type="button" className="btn" onClick={() => setIsLoginOpen(true)}>
              Zaloguj jako Admin
            </button>
          )}
        </div>
      </header>

      <main>
        <Filters series={series} onFilterChange={loadMeasurements} />

        {loading ? (
          <div className="loading">Ładowanie pomiarów...</div>
        ) : error ? (
          <div className="error-message">Błąd: {error}</div>
        ) : (
          <>
            <section className="card chart-section">
              <h2>Wykres pomiarów</h2>
              <ChartView
                series={series.filter((s) =>
                  measurements.some((m) => m.seriesId === s.id)
                )}
                measurements={measurements}
                selectedId={selectedMeasurementId}
              />
            </section>

            <section className="card table-section">
              <h2>Tabela wyników</h2>
              <DataTable
                series={series}
                measurements={measurements}
                selectedId={selectedMeasurementId}
                onSelectRecord={(id) => setSelectedMeasurementId(id)}
              />
            </section>
          </>
        )}
      </main>
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
    </div>
  );
}