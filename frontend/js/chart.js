/**
 * Moduł Wykresu - Chart.js (F2, F5, F6, T6)
 * Spełnia WCAG 2.2 AA (rozróżnienie serii nie tylko kolorem, lecz także kształtem punktu i stylem linii)
 */

const POINT_STYLES = ['circle', 'triangle', 'rect', 'crossRot', 'star', 'rectRot'];
const BORDER_DASHES = [[], [6, 4], [2, 2], [10, 3, 2, 3], [8, 8]];

class DashboardChart {
  constructor(canvasId, onPointClick) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.chart = null;
    this.onPointClick = onPointClick;
    this.rawDatasets = [];
  }

  init() {
    if (!this.ctx) return;

    // Sprawdź czy dostępny jest adapter czasu Chart.js
    const hasTimeAdapter = typeof Chart._adapters?._date?.prototype?.init === 'function' || 
                           window.dateFns !== undefined ||
                           Chart.registry.scales.get('time') !== undefined;

    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: {
          mode: 'nearest',
          intersect: true,
        },
        onClick: (event, elements) => {
          if (!elements || elements.length === 0) return;
          const el = elements[0];
          const dataset = this.chart.data.datasets[el.datasetIndex];
          const point = dataset?.data[el.index];
          if (point && point.measurementId && typeof this.onPointClick === 'function') {
            this.onPointClick(point.measurementId);
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
              displayFormats: {
                millisecond: 'HH:mm:ss.SSS',
                second: 'HH:mm:ss',
                minute: 'HH:mm',
                hour: 'dd.MM HH:mm',
                day: 'dd.MM.yyyy',
              },
            },
            title: {
              display: true,
              text: 'Czas pomiaru',
              font: { weight: 'bold' },
            },
            grid: { color: '#f3f4f6' },
          },
          y: {
            title: {
              display: true,
              text: 'Wartość',
              font: { weight: 'bold' },
            },
            grid: { color: '#f3f4f6' },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 16,
              font: { size: 12 },
            },
          },
          tooltip: {
            padding: 10,
            callbacks: {
              label: (context) => {
                const point = context.raw;
                const unit = point?.unit ? ` ${point.unit}` : '';
                return ` ${context.dataset.label}: ${context.parsed.y}${unit}`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Aktualizacja danych wykresu
   * @param {Array} seriesList - lista aktywnych definicji serii
   * @param {Array} measurements - pobrane pomiary
   * @param {Array} selectedSeriesIds - wybrane ID serii do wyświetlenia
   */
  updateData(seriesList, measurements, selectedSeriesIds = []) {
    if (!this.chart) {
      this.init();
    }
    if (!this.chart) return;

    const selectedSet = new Set(selectedSeriesIds.map(Number));

    // Grupuj pomiary po seriesId
    const grouped = {};
    for (const m of measurements) {
      if (!selectedSet.has(Number(m.seriesId))) continue;
      if (!grouped[m.seriesId]) grouped[m.seriesId] = [];

      grouped[m.seriesId].push({
        x: new Date(m.timestamp).getTime(),
        y: Number(m.value),
        measurementId: m.id,
      });
    }

    // Tworzenie zestawów danych dla Chart.js
    const datasets = [];
    let styleIdx = 0;

    for (const s of seriesList) {
      if (!selectedSet.has(Number(s.id))) continue;

      const seriesPoints = (grouped[s.id] || []).sort((a, b) => a.x - b.x);
      const pointShape = POINT_STYLES[styleIdx % POINT_STYLES.length];
      const borderDash = BORDER_DASHES[styleIdx % BORDER_DASHES.length];
      styleIdx++;

      // Dodaj jednostkę do etykiety jeśli istnieje
      const labelText = s.unit ? `${s.name} [${s.unit}]` : s.name;

      datasets.push({
        label: labelText,
        seriesId: s.id,
        data: seriesPoints.map(p => ({ ...p, unit: s.unit })),
        borderColor: s.color || '#2563eb',
        backgroundColor: (s.color || '#2563eb') + '33',
        pointStyle: pointShape,
        borderDash: borderDash,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: s.color || '#2563eb',
        tension: 0.2,
      });
    }

    this.chart.data.datasets = datasets;
    this.chart.update();
  }

  /**
   * F6: Wyróżnienie punktu na wykresie po kliknięciu rekordu w tabeli
   * @param {number|string} measurementId
   */
  highlightPoint(measurementId) {
    if (!this.chart) return;

    let targetDatasetIndex = -1;
    let targetIndex = -1;

    // Resetuj promienie wszystkich punktów
    this.chart.data.datasets.forEach((ds, dsIdx) => {
      const count = ds.data.length;
      ds.pointRadius = new Array(count).fill(4);
      ds.pointBackgroundColor = new Array(count).fill(ds.borderColor);
      ds.pointBorderColor = new Array(count).fill(ds.borderColor);
      ds.pointBorderWidth = new Array(count).fill(1);

      ds.data.forEach((p, pIdx) => {
        if (p.measurementId === measurementId) {
          targetDatasetIndex = dsIdx;
          targetIndex = pIdx;
        }
      });
    });

    if (targetDatasetIndex !== -1 && targetIndex !== -1) {
      const ds = this.chart.data.datasets[targetDatasetIndex];
      // Wyróżnij wybrany punkt: duży promień, złoty kontrastowy kolor, gruba ramka
      ds.pointRadius[targetIndex] = 12;
      ds.pointBackgroundColor[targetIndex] = '#eab308'; // Złoty
      ds.pointBorderColor[targetIndex] = '#000000';
      ds.pointBorderWidth[targetIndex] = 3;

      this.chart.update();

      // Pokaż tooltip dla tego punktu
      if (this.chart.tooltip) {
        this.chart.tooltip.setActiveElements([
          { datasetIndex: targetDatasetIndex, index: targetIndex }
        ], { x: 0, y: 0 });
        this.chart.update();
      }
    } else {
      this.chart.update();
    }
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

