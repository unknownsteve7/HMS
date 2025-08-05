import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import Button from './Button';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger", // danger, warning, info
    loading = false
}) => {
    if (!isOpen) return null;

    const getIconAndColors = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <Trash2 className="w-6 h-6" />,
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    confirmVariant: 'destructive'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-6 h-6" />,
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    confirmVariant: 'primary'
                };
            default:
                return {
                    icon: <AlertTriangle className="w-6 h-6" />,
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    confirmVariant: 'primary'
                };
        }
    };

    const { icon, iconBg, iconColor, confirmVariant } = getIconAndColors();

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-soft-ui p-6 transition-all duration-300 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                {/* Header with icon */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`${iconBg} ${iconColor} rounded-full p-3 mb-4`}>
                        {icon}
                    </div>
                    <h2 className="text-xl font-bold text-text-dark mb-2">{title}</h2>
                    <p className="text-text-medium leading-relaxed">{message}</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 order-2 sm:order-1"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={onConfirm}
                        className="flex-1 order-1 sm:order-2"
                        disabled={loading}
                        leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
