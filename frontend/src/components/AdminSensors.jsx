import React, { useState, useEffect } from 'react';
import { sensorsApi } from '../api/client';

export default function AdminSensors({ seriesList, onBack }) {
  const [sensors, setSensors] = useState([]);
  const [name, setName] = useState('');
  const [seriesId, setSeriesId] = useState('');
  
  const [generatedApiKey, setGeneratedApiKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSensors = async () => {
    try {
      setLoading(true);
      const data = await sensorsApi.getAll();
      setSensors(data);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać listy czujników.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSensors();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setGeneratedApiKey(null);

    if (!seriesId) {
      setError('Wybierz serię pomiarową dla czujnika.');
      return;
    }

    setLoading(true);

    try {
      const result = await sensorsApi.create(name, Number(seriesId));
      setGeneratedApiKey(result.apiKey || result.key || 'BRAK_KLUCZA');
      setName('');
      setSeriesId('');
      await loadSensors();
    } catch (err) {
      setError(err.message || 'Błąd podczas rejestracji czujnika.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz wyrejestrować ten czujnik?')) return;
    setLoading(true);
    try {
      await sensorsApi.delete(id);
      await loadSensors();
    } catch (err) {
      setError(err.message || 'Nie udało się usunąć czujnika.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-screen no-print">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Zarządzanie czujnikami IoT</h2>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}

      {generatedApiKey && (
        <div className="api-key-modal" style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#166534' }}>
            Czujnik został pomyślnie zarejestrowany!
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Zapisz poniższy klucz API. Został wygenerowany <strong>jednorazowo</strong> i nie będzie można go ponownie odczytać:
          </p>
          <div className="api-key-code">{generatedApiKey}</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Rejestracja nowego czujnika</h3>
        <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="sensor-name">Nazwa czujnika:</label>
            <input
              id="sensor-name"
              type="text"
              className="form-control"
              placeholder="np. Stacja Północ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sensor-series">Przypisana seria:</label>
            <select
              id="sensor-series"
              className="form-control"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              required
            >
              <option value="">-- Wybierz serię --</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.unit ? `(${s.unit})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Rejestrowanie...' : 'Zarejestruj czujnik'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Zarejestrowane czujniki</h3>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nazwa czujnika</th>
                <th>Przypisana seria</th>
                <th>Ostatnia aktywność</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {sensors.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    Brak zarejestrowanych czujników.
                  </td>
                </tr>
              ) : (
                sensors.map((sensor) => {
                  const sInfo = seriesList.find((s) => s.id === sensor.seriesId);
                  return (
                    <tr key={sensor.id}>
                      <td>{sensor.id}</td>
                      <td style={{ fontWeight: 600 }}>{sensor.name}</td>
                      <td>{sInfo ? sInfo.name : `Seria #${sensor.seriesId}`}</td>
                      <td>
                        {sensor.lastMeasurementAt
                          ? new Date(sensor.lastMeasurementAt).toLocaleString('pl-PL')
                          : 'Brak pomiarów'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          onClick={() => handleDelete(sensor.id)}
                        >
                          Wyrejestruj
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}