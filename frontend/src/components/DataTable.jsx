import React from 'react';

export default function DataTable({ series, measurements, selectedId, onSelectRecord }) {
  if (!measurements || measurements.length === 0) {
    return <div className="loading">Brak pomiarów do wyświetlenia w tabeli.</div>;
  }

  return (
    <div className="table-responsive" tabIndex="0" role="region" aria-label="Tabela wyników pomiarów">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Czas</th>
            <th scope="col">Seria</th>
            <th scope="col">Wartość</th>
            <th scope="col">Jednostka</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((m) => {
            const seriesInfo = series.find((s) => s.id === m.seriesId);
            const isSelected = m.id === selectedId;

            const handleRowClick = () => {
              onSelectRecord(m.id);
            };

            const handleKeyDown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRowClick();
              }
            };

            return (
              <tr
                key={m.id}
                className={isSelected ? 'selected-row' : ''}
                onClick={handleRowClick}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                role="button"
                aria-pressed={isSelected}
              >
                <td>{new Date(m.timestamp).toLocaleString('pl-PL')}</td>
                <td style={{ color: seriesInfo?.color, fontWeight: 600 }}>
                  {seriesInfo ? seriesInfo.name : `Seria #${m.seriesId}`}
                </td>
                <td>{m.value}</td>
                <td>{seriesInfo?.unit || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}