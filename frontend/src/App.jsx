import React, { useEffect } from 'react';
import { seriesApi, measurementsApi, authApi } from './api/client';

export default function App() {
  useEffect(() => {
    async function runTest() {
      console.log('--- TEST API CLIENT ---');
      try {
        const series = await seriesApi.getAll();
        console.log('✅ Serie:', series);
        
        const meas = await measurementsApi.get({ limit: 5 });
        console.log('✅ Pomiary:', meas);
      } catch (err) {
        console.error('❌ Błąd testu:', err);
      }
    }
    runTest();
  }, []);

  return <h1>Testowanie Client API w przeglądarce...</h1>;
}