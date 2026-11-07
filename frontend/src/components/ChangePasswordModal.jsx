import React, { useState } from 'react';
import { authApi } from '../api/client';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są identyczne.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nowe hasło powinno mieć co najmniej 6 znaków.');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccessMsg('Hasło zostało pomyślnie zmienione.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Nie udało się zmienić hasła.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div
        className="card modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-password-title"
        aria-modal="true"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="modal-password-title" style={{ margin: 0 }}>Zmiana hasła</h2>
          <button type="button" className="btn btn-secondary" onClick={onClose} aria-label="Zamknij modal">
            ✕
          </button>
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}
        {successMsg && (
          <div className="api-key-modal" role="status" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac', color: '#166534', marginBottom: '1rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="modal-current-password">Obecne hasło:</label>
            <input
              id="modal-current-password"
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-new-password">Nowe hasło:</label>
            <input
              id="modal-new-password"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-confirm-password">Powtórz nowe hasło:</label>
            <input
              id="modal-confirm-password"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Anuluj
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zmień hasło'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}