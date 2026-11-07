import React, { useState, useEffect } from 'react';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import { seriesApi, measurementsApi } from './api/client';

export default function App() {
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [seriesData, measurementsData] = await Promise.all([
          seriesApi.getAll(),
          measurementsApi.get()
        ]);
        setSeries(seriesData);
        setMeasurements(measurementsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="loading">Ładowanie pomiarów...</div>;
  if (error) return <div className="error-message">Błąd: {error}</div>;

  return (
    <div className="container">
      <header>
        <h1>Serie Pomiarowe IoT</h1>
      </header>

      <main>
        <section className="chart-section">
          <h2>Wykres w funkcji czasu</h2>
          <ChartView
            series={series}
            measurements={measurements}
            selectedId={selectedMeasurementId}
          />
        </section>
        <section className="table-section">
          <h2>Tabela wyników</h2>
          <DataTable
            series={series}
            measurements={measurements}
            selectedId={selectedMeasurementId}
            onSelectRecord={(id) => setSelectedMeasurementId(id)}
          />
        </section>
      </main>
    </div>
  );
}