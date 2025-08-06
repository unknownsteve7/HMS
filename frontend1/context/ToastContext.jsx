import React, { createContext, useContext, useState } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 5000) => {
        const id = Date.now() + Math.random();
        const newToast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);

        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const showSuccess = (message, duration) => addToast(message, 'success', duration);
    const showError = (message, duration) => addToast(message, 'error', duration);
    const showWarning = (message, duration) => addToast(message, 'warning', duration);
    const showInfo = (message, duration) => addToast(message, 'info', duration);

    return (
        <ToastContext.Provider value={{
            addToast,
            removeToast,
            showSuccess,
            showError,
            showWarning,
            showInfo
        }}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
                {toasts.map((toast, index) => (
                    <div
                        key={toast.id}
                        className="transform transition-all duration-300 ease-in-out"
                        style={{
                            transform: `translateY(${index * 4}px)`,
                            zIndex: 50 - index
                        }}
                    >
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
