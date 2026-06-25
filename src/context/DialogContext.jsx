/* eslint-disable react/only-export-components */
import { createContext, useContext, useState } from 'react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null); // { type: 'alert'|'confirm', title, message, resolve }

  const alert = (title, message = '') => {
    const actualTitle = message ? title : 'Alert';
    const actualMessage = message || title;

    return new Promise((resolve) => {
      setDialogState({
        type: 'alert',
        title: actualTitle,
        message: actualMessage,
        resolve
      });
    });
  };

  const confirm = (title, message = '') => {
    const actualTitle = message ? title : 'Confirm';
    const actualMessage = message || title;

    return new Promise((resolve) => {
      setDialogState({
        type: 'confirm',
        title: actualTitle,
        message: actualMessage,
        resolve
      });
    });
  };

  const handleClose = (value) => {
    if (dialogState && dialogState.resolve) {
      dialogState.resolve(value);
    }
    setDialogState(null);
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialogState && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 12, 28, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div style={{
            background: '#0e2246',
            border: '1px solid rgba(147, 197, 253, 0.25)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            textAlign: 'center',
            animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#93c5fd', fontSize: '1.25rem', fontWeight: 700 }}>
              {dialogState.title}
            </h4>
            <p style={{ margin: '0 0 1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {dialogState.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {dialogState.type === 'confirm' && (
                <button
                  onClick={() => handleClose(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                style={{
                  padding: '8px 24px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.target.style.transform = 'none'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
