import React, { useState } from 'react';

export default function Filters({ series, onFilterChange }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(
    series.map((s) => String(s.id))
  );

  const handleSeriesToggle = (seriesId) => {
    const idStr = String(seriesId);
    setSelectedSeries((prev) =>
      prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      from: fromDate ? new Date(fromDate).toISOString() : '',
      to: toDate ? new Date(toDate).toISOString() : '',
      series: selectedSeries.join(',')
    });
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    const allIds = series.map((s) => String(s.id));
    setSelectedSeries(allIds);
    onFilterChange({ from: '', to: '', series: allIds.join(',') });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="card filters-card no-print">
      <h2>Filtrowanie danych</h2>
      <form onSubmit={handleSubmit} className="filters-grid">
        <div className="form-group">
          <label htmlFor="filter-from">Data od:</label>
          <input
            id="filter-from"
            type="datetime-local"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="filter-to">Data do:</label>
          <input
            id="filter-to"
            type="datetime-local"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <span className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Widoczne serie:</span>
          <div className="checkbox-group">
            {series.map((s) => (
              <label key={s.id} className="checkbox-label" style={{ color: s.color }}>
                <input
                  type="checkbox"
                  checked={selectedSeries.includes(String(s.id))}
                  onChange={() => handleSeriesToggle(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn">
            Filtruj
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Resetuj
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            Drukuj
          </button>
        </div>
      </form>
    </div>
  );
}