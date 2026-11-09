import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const STORAGE_KEY = 'oposiciones-ts-cam-2026';
const readSavedData = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

function Root() {
  const [initialData] = useState(readSavedData);
  const saveData = useCallback((data) => {
    // La clave de Gemini se mantiene solo en memoria y nunca se guarda en el navegador.
    const { customApiKey, ...safeData } = data;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData)); } catch (error) {
      console.error('No se pudieron guardar los datos localmente:', error);
    }
  }, []);
  return <App initialData={initialData} onSave={saveData} onSignOut={() => {
    if (window.confirm('¿Quieres borrar los datos guardados en este navegador?')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>);
