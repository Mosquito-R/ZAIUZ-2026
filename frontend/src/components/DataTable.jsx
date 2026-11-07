import React from 'react';

export default function DataTable({ series, measurements, selectedId, onSelectRecord }) {
  if (!measurements || measurements.length === 0) {
    return <div className="loading">Brak pomiarów do wyświetlenia w tabeli.</div>;
  }

  // Pobranie unikalnych znaczników czasu i posortowanie ich rosnąco
  const timestamps = Array.from(new Set(measurements.map((m) => m.timestamp))).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  return (
    <div className="table-responsive" tabIndex="0" role="region" aria-label="Tabela wyników pomiarów">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Czas</th>
            {series.map((s) => (
              <th key={s.id} scope="col" style={{ color: s.color }}>
                {s.name} {s.unit ? `(${s.unit})` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timestamps.map((ts) => {
            const rowMeasurements = measurements.filter((m) => m.timestamp === ts);
            const isSelected = rowMeasurements.some((m) => m.id === selectedId);

            const handleRowClick = () => {
              if (rowMeasurements.length > 0) {
                onSelectRecord(rowMeasurements[0].id);
              }
            };

            const handleKeyDown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRowClick();
              }
            };

            return (
              <tr
                key={ts}
                className={isSelected ? 'selected-row' : ''}
                onClick={handleRowClick}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                role="button"
                aria-pressed={isSelected}
              >
                <td>{new Date(ts).toLocaleString('pl-PL')}</td>
                {series.map((s) => {
                  const meas = rowMeasurements.find((m) => m.seriesId === s.id);
                  return <td key={s.id}>{meas ? meas.value : '-'}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}