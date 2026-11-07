import React, { useState, useEffect } from 'react';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import Filters from './components/Filters';
import { seriesApi, measurementsApi } from './api/client';

export default function App() {
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="container">
      <header>
        <h1>Serie Pomiarowe IoT</h1>
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
    </div>
  );
}