import { createContext, useContext, useMemo } from 'react';
import { ToastContainer, useToast as useToastState } from '../components/ui/Toast.jsx';

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const { toasts, toast, dismiss } = useToastState();
  const api = useMemo(() => ({
    success: (title, message) => toast({ type: 'success', title, message }),
    error: (title, message) => toast({ type: 'error', title, message, duration: 6000 }),
    info: (title, message) => toast({ type: 'info', title, message }),
    warning: (title, message) => toast({ type: 'warning', title, message }),
  }), [toast]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
