/**
 * Główny komponent Alpine.js - Aplikacja IoT Dashboard (ZAIUZ)
 * Realizuje wymagania F1-F13, T2, T6, T7, UX F9
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('iotApp', () => ({
    // === Stan widoków & routingu ===
    currentView: 'dashboard', // 'dashboard' | 'login' | 'series' | 'sensors' | 'password'

    // === Autentykacja (F8) ===
    token: localStorage.getItem('jwt_token') || null,
    username: localStorage.getItem('auth_user') || '',
    loginForm: {
      username: '',
      password: '',
      loading: false,
    },
    passwordForm: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
    },

    // === Dane pomiarowe & serie (F1, F2, F5) ===
    series: [],
    seriesMap: {},
    selectedSeries: [], // wybrane ID serii
    measurements: [],
    dateFrom: '',
    dateTo: '',
    highlightedMeasurementId: null, // F6
    chartInstance: null,

    // === Zarządzanie seriami (F3, F4) ===
    seriesModalOpen: false,
    editingSeriesId: null,
    seriesForm: {
      name: '',
      minValue: '',
      maxValue: '',
      color: '#2563eb',
      icon: '',
      unit: '',
    },
    seriesFormLoading: false,

    // === Zarządzanie czujnikami (F12) ===
    sensors: [],
    sensorModalOpen: false,
    sensorForm: {
      name: '',
      seriesId: '',
    },
    sensorFormLoading: false,
    newSensorKeyModalOpen: false,
    newSensorData: {
      name: '',
      apiKey: '',
    },
    apiKeyCopied: false,

    // === Informacje UX (F9) ===
    globalLoading: false,
    toasts: [],

    // =========================================================================
    // Cykl życia (Lifecycle)
    // =========================================================================
    async init() {
      // Inicjalizuj domyślny zakres czasu (np. ostatnie 7 dni do teraz)
      const now = new Date();
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.dateTo = this.formatDatetimeInput(now);
      this.dateFrom = this.formatDatetimeInput(past);

      await this.loadSeries();
      
      // Domyślnie zaznacz wszystkie pobrane serie
      this.selectedSeries = this.series.map(s => s.id);

      // Inicjalizacja instancji wykresu
      this.$nextTick(() => {
        this.initChart();
        this.loadMeasurements();
      });

      if (this.token) {
        this.loadSensors();
      }
    },

    initChart() {
      if (typeof DashboardChart === 'undefined') return;
      this.chartInstance = new DashboardChart('mainChart', (measurementId) => {
        this.highlightRowFromChart(measurementId);
      });
      this.chartInstance.init();
    },

    // =========================================================================
    // Zarządzanie Danymi (API)
    // =========================================================================
    async loadSeries() {
      try {
        const data = await api.getSeries();
        this.series = Array.isArray(data) ? data : [];
        const map = {};
        for (const s of this.series) {
          map[s.id] = s;
        }
        this.seriesMap = map;
      } catch (err) {
        this.showToast(err.detail || 'Nie udało się pobrać serii pomiarowych', 'error');
      }
    },

    async loadMeasurements() {
      if (this.selectedSeries.length === 0) {
        this.measurements = [];
        if (this.chartInstance) {
          this.chartInstance.updateData(this.series, [], []);
        }
        return;
      }

      this.globalLoading = true;
      try {
        const data = await api.getMeasurements({
          series: this.selectedSeries,
          from: this.dateFrom,
          to: this.dateTo,
          sort: '-timestamp', // najnowsze pierwsze w tabeli
          limit: 1000,
        });

        this.measurements = Array.isArray(data) ? data : [];

        // Odśwież wykres
        if (this.chartInstance) {
          this.chartInstance.updateData(this.series, this.measurements, this.selectedSeries);
          if (this.highlightedMeasurementId) {
            this.chartInstance.highlightPoint(this.highlightedMeasurementId);
          }
        }
      } catch (err) {
        this.showToast(err.detail || 'Nie udało się pobrać pomiarów', 'error');
      } finally {
        this.globalLoading = false;
      }
    },

    async loadSensors() {
      if (!this.token) return;
      try {
        const data = await api.getSensors();
        this.sensors = Array.isArray(data) ? data : [];
      } catch (err) {
        if (err.status === 401) {
          this.logout();
        } else {
          this.showToast(err.detail || 'Nie udało się pobrać listy czujników', 'error');
        }
      }
    },

    // =========================================================================
    // Filtrowanie (F5) & Powiązanie Tabela-Wykres (F6)
    // =========================================================================
    toggleSeries(seriesId) {
      const id = Number(seriesId);
      const index = this.selectedSeries.indexOf(id);
      if (index === -1) {
        this.selectedSeries.push(id);
      } else {
        this.selectedSeries.splice(index, 1);
      }
      this.loadMeasurements();
    },

    selectAllSeries() {
      this.selectedSeries = this.series.map(s => s.id);
      this.loadMeasurements();
    },

    deselectAllSeries() {
      this.selectedSeries = [];
      this.measurements = [];
      if (this.chartInstance) {
        this.chartInstance.updateData(this.series, [], []);
      }
    },

    onRowClick(measurement) {
      if (!measurement) return;
      this.highlightedMeasurementId = measurement.id;
      if (this.chartInstance) {
        this.chartInstance.highlightPoint(measurement.id);
      }
    },

    highlightRowFromChart(measurementId) {
      this.highlightedMeasurementId = measurementId;
      this.$nextTick(() => {
        const row = document.getElementById(`row-${measurementId}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },

    // =========================================================================
    // Uwierzytelnianie (F8)
    // =========================================================================
    async handleLogin() {
      if (!this.loginForm.username.trim() || !this.loginForm.password) {
        this.showToast('Wprowadź nazwę użytkownika oraz hasło', 'error');
        return;
      }

      this.loginForm.loading = true;
      try {
        const res = await api.login(this.loginForm.username, this.loginForm.password);
        this.token = res.accessToken;
        this.username = this.loginForm.username;
        this.loginForm.password = '';
        this.showToast('Zalogowano pomyślnie!', 'success');
        this.currentView = 'dashboard';
        await this.loadSensors();
      } catch (err) {
        this.showToast(err.detail || 'Błędny login lub hasło', 'error');
      } finally {
        this.loginForm.loading = false;
      }
    },

    async handleLogout() {
      try {
        await api.logout();
      } catch {
        // Ignoruj błąd wylogowania
      } finally {
        this.token = null;
        this.username = '';
        this.sensors = [];
        this.currentView = 'dashboard';
        this.showToast('Wylogowano', 'success');
      }
    },

    async handleChangePassword() {
      if (!this.passwordForm.currentPassword) {
        this.showToast('Podaj aktualne hasło', 'error');
        return;
      }
      if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 8) {
        this.showToast('Nowe hasło musi mieć co najmniej 8 znaków', 'error');
        return;
      }
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.showToast('Nowe hasła nie są identyczne', 'error');
        return;
      }

      this.passwordForm.loading = true;
      try {
        await api.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword);
        this.showToast('Hasło zostało pomyślnie zmienione!', 'success');
        this.passwordForm.currentPassword = '';
        this.passwordForm.newPassword = '';
        this.passwordForm.confirmPassword = '';
        this.currentView = 'dashboard';
      } catch (err) {
        this.showToast(err.detail || 'Nie udało się zmienić hasła', 'error');
      } finally {
        this.passwordForm.loading = false;
      }
    },

    // =========================================================================
    // Zarządzanie Seriami (F3, F4)
    // =========================================================================
    openCreateSeries() {
      this.editingSeriesId = null;
      this.seriesForm = {
        name: '',
        minValue: '',
        maxValue: '',
        color: '#2563eb',
        icon: '',
        unit: '',
      };
      this.seriesModalOpen = true;
    },

    openEditSeries(s) {
      this.editingSeriesId = s.id;
      this.seriesForm = {
        name: s.name,
        minValue: s.minValue,
        maxValue: s.maxValue,
        color: s.color || '#2563eb',
        icon: s.icon || '',
        unit: s.unit || '',
      };
      this.seriesModalOpen = true;
    },

    async handleSaveSeries() {
      // Walidacja po stronie klienta (F4, F9)
      const name = this.seriesForm.name.trim();
      const min = parseFloat(this.seriesForm.minValue);
      const max = parseFloat(this.seriesForm.maxValue);
      const color = this.seriesForm.color.trim();

      if (!name) {
        this.showToast('Nazwa serii jest wymagana', 'error');
        return;
      }
      if (name.length > 100) {
        this.showToast('Nazwa serii może mieć maksymalnie 100 znaków', 'error');
        return;
      }
      if (isNaN(min) || isNaN(max)) {
        this.showToast('Wartości minimalna i maksymalna muszą być liczbami', 'error');
        return;
      }
      if (min >= max) {
        this.showToast('Wartość minimalna musi być ściśle mniejsza od maksymalnej', 'error');
        return;
      }
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        this.showToast('Kolor musi być w formacie #RRGGBB (np. #2563eb)', 'error');
        return;
      }

      const payload = {
        name,
        minValue: min,
        maxValue: max,
        color,
        icon: this.seriesForm.icon ? this.seriesForm.icon.trim() : undefined,
        unit: this.seriesForm.unit ? this.seriesForm.unit.trim() : undefined,
      };

      this.seriesFormLoading = true;
      try {
        if (this.editingSeriesId) {
          await api.updateSeries(this.editingSeriesId, payload);
          this.showToast('Zaktualizowano serię pomiarową', 'success');
        } else {
          await api.createSeries(payload);
          this.showToast('Utworzono nową serię pomiarową', 'success');
        }
        this.seriesModalOpen = false;
        await this.loadSeries();
        await this.loadMeasurements();
      } catch (err) {
        // Serwerowa walidacja (np. 409 Conflict przy wykluczeniu pomiarów)
        this.showToast(err.detail || 'Błąd zapisu serii', 'error');
      } finally {
        this.seriesFormLoading = false;
      }
    },

    async handleDeleteSeries(id) {
      if (!confirm('Czy na pewno chcesz usunąć tę serię? Spowoduje to kaskadowe usunięcie powiązanych czujników i pomiarów!')) {
        return;
      }
      try {
        await api.deleteSeries(id);
        this.showToast('Seria została usunięta', 'success');
        // Usuń z wybranych
        this.selectedSeries = this.selectedSeries.filter(sId => sId !== id);
        await this.loadSeries();
        await this.loadSensors();
        await this.loadMeasurements();
      } catch (err) {
        this.showToast(err.detail || 'Nie udało się usunąć serii', 'error');
      }
    },

    // =========================================================================
    // Zarządzanie Czujnikami (F12)
    // =========================================================================
    openCreateSensor() {
      this.sensorForm = {
        name: '',
        seriesId: this.series.length > 0 ? this.series[0].id : '',
      };
      this.sensorModalOpen = true;
    },

    async handleSaveSensor() {
      const name = this.sensorForm.name.trim();
      const seriesId = parseInt(this.sensorForm.seriesId, 10);

      if (!name) {
        this.showToast('Nazwa czujnika jest wymagana', 'error');
        return;
      }
      if (isNaN(seriesId) || seriesId <= 0) {
        this.showToast('Wybierz poprawną serię pomiarową', 'error');
        return;
      }

      this.sensorFormLoading = true;
      try {
        const res = await api.createSensor({ name, seriesId });
        this.sensorModalOpen = false;
        this.newSensorData = {
          name: res.name,
          apiKey: res.apiKey,
        };
        this.apiKeyCopied = false;
        this.newSensorKeyModalOpen = true;
        await this.loadSensors();
      } catch (err) {
        this.showToast(err.detail || 'Błąd rejestracji czujnika', 'error');
      } finally {
        this.sensorFormLoading = false;
      }
    },

    async copyApiKey() {
      if (!this.newSensorData.apiKey) return;
      try {
        await navigator.clipboard.writeText(this.newSensorData.apiKey);
        this.apiKeyCopied = true;
        this.showToast('Klucz API skopiowany do schowka!', 'success');
        setTimeout(() => { this.apiKeyCopied = false; }, 3000);
      } catch {
        this.showToast('Nie udało się skopiować automatycznie. Zaznacz i skopiuj ręcznie.', 'error');
      }
    },

    async handleDeleteSensor(id) {
      if (!confirm('Czy na pewno chcesz wyrejestrować ten czujnik? Klucz natychmiast przestanie działać, a zebrane wyniki pozostaną.')) {
        return;
      }
      try {
        await api.deleteSensor(id);
        this.showToast('Czujnik został pomyślnie wyrejestrowany', 'success');
        await this.loadSensors();
      } catch (err) {
        this.showToast(err.detail || 'Błąd wyrejestrowania czujnika', 'error');
      }
    },

    // =========================================================================
    // Formatowanie & Narzędzia pomocnicze
    // =========================================================================
    formatDate(isoString) {
      if (!isoString) return '—';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    },

    formatDatetimeInput(date) {
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    },

    formatNumber(val) {
      if (val === null || val === undefined || isNaN(val)) return '—';
      return Number(val).toLocaleString('pl-PL', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });
    },

    getSeriesName(seriesId) {
      return this.seriesMap[seriesId]?.name || `Seria #${seriesId}`;
    },

    getSeriesColor(seriesId) {
      return this.seriesMap[seriesId]?.color || '#9ca3af';
    },

    getSeriesUnit(seriesId) {
      return this.seriesMap[seriesId]?.unit ? ` [${this.seriesMap[seriesId].unit}]` : '';
    },

    // =========================================================================
    // Toast powiadomienia (UX F9)
    // =========================================================================
    showToast(message, type = 'error') {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 5000);
    },

    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },

    // =========================================================================
    // Wydruk (F7)
    // =========================================================================
    printDashboard() {
      window.print();
    },
  }));
});

