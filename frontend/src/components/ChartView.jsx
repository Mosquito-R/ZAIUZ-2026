import React from 'react';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

//POINT_STYLES = ['circle', 'triangle', 'rect', 'rectRot', 'star', 'crossRot'];

export default function ChartView({ series, measurements, selectedId }) {
  const datasets = series.map((s) => {
    const seriesMeasurements = measurements.filter((m) => m.seriesId === s.id);

    return {
      label: s.unit ? `${s.name} (${s.unit})` : s.name,
      data: seriesMeasurements.map((m) => ({
        x: new Date(m.timestamp),
        y: m.value,
        id: m.id
      })),
      borderColor: s.color,
      backgroundColor: s.color,
      pointStyle: s.icon || 'circle',
      pointRadius: seriesMeasurements.map((m) => (m.id === selectedId ? 9 : 3)),
      pointHoverRadius: 8,
      pointBackgroundColor: seriesMeasurements.map((m) => (m.id === selectedId ? '#ff0000' : s.color))
    };
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          usePointStyle: true
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: { minute: 'HH:mm:ss', hour: 'yyyy-MM-dd HH:mm' }
        }
      },
      y: { type: 'linear' }
    }
  };

  return (
    <div className="chart-container" style={{ position: 'relative', height: '400px' }}>
      <Line data={{ datasets }} options={options} />
    </div>
  );
}