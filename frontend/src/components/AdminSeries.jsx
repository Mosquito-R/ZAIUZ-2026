import React, { useState } from 'react';
import { seriesApi } from '../api/client';

const SYMBOL_OPTIONS = [
  { value: 'circle', label: 'Koło (circle)' },
  { value: 'triangle', label: 'Trójkąt (triangle)' },
  { value: 'rect', label: 'Kwadrat (rect)' },
  { value: 'rectRot', label: 'Romb (rectRot)' },
  { value: 'star', label: 'Gwiazda (star)' },
  { value: 'crossRot', label: 'Krzyżyk (crossRot)' }
];

export default function AdminSeries({ seriesList, onSeriesUpdated, onBack }) {
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('circle');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setUnit('');
    setMinValue('');
    setMaxValue('');
    setColor('#2563eb');
    setIcon('circle');
    setError(null);
  };

  const handleEditClick = (s) => {
    setEditingId(s.id);
    setName(s.name || '');
    setUnit(s.unit || '');
    setMinValue(s.minValue !== null && s.minValue !== undefined ? s.minValue : '');
    setMaxValue(s.maxValue !== null && s.maxValue !== undefined ? s.maxValue : '');
    setColor(s.color || '#2563eb');
    setIcon(s.icon || 'circle');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const minNum = Number(minValue);
    const maxNum = Number(maxValue);

    if (isNaN(minNum) || isNaN(maxNum)) {
      setError('Wartości minimalne i maksymalne muszą być liczbami.');
      return;
    }

    if (minNum >= maxNum) {
      setError('Wartość minimalna musi być ściśle mniejsza od maksymalnej (min < max).');
      return;
    }

    const payload = { name, unit, minValue: minNum, maxValue: maxNum, color, icon };

    setLoading(true);

    try {
      if (editingId) {
        await seriesApi.update(editingId, payload);
      } else {
        await seriesApi.create(payload);
      }
      resetForm();
      onSeriesUpdated();
    } catch (err) {
      setError(err.message || 'Błąd podczas zapisywania serii.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę serię pomiarową?')) return;
    setLoading(true);
    try {
      await seriesApi.delete(id);
      if (editingId === id) resetForm();
      onSeriesUpdated();
    } catch (err) {
      setError(err.message || 'Nie udało się usunąć serii.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-screen no-print">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Zarządzanie seriami pomiarowymi</h2>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>{editingId ? `Edycja serii #${editingId}` : 'Dodaj nową serię'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="series-name">Nazwa serii:</label>
            <input
              id="series-name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="series-unit">Jednostka:</label>
            <input
              id="series-unit"
              type="text"
              className="form-control"
              placeholder="np. °C, %"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="series-min">Wartość min:</label>
            <input
              id="series-min"
              type="number"
              step="any"
              className="form-control"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="series-max">Wartość max:</label>
            <input
              id="series-max"
              type="number"
              step="any"
              className="form-control"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="series-color">Kolor:</label>
            <input
              id="series-color"
              type="color"
              className="form-control"
              style={{ height: '38px', padding: '2px' }}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="series-icon">Symbol:</label>
            <select
              id="series-icon"
              className="form-control"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            >
              {SYMBOL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Zapisywanie...' : editingId ? 'Zapisz zmiany' : 'Dodaj serię'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Anuluj edycję
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Lista istniejących serii</h3>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nazwa</th>
                <th>Jednostka</th>
                <th>Zakres (Min - Max)</th>
                <th>Kolor</th>
                <th>Symbol</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {seriesList.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td style={{ color: s.color, fontWeight: 600 }}>{s.name}</td>
                  <td>{s.unit || '-'}</td>
                  <td>{s.minValue} do {s.maxValue}</td>
                  <td>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: s.color, borderRadius: '4px', verticalAlign: 'middle' }} />
                  </td>
                  <td>{s.icon || 'circle'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => handleEditClick(s)}>
                        Edytuj
                      </button>
                      <button type="button" className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => handleDelete(s.id)}>
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}