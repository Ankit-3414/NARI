import React from 'react';
import { Bell, X, Clock } from 'lucide-react';

const AlarmNotification = ({ alarm, onDismiss, onSnooze }) => {
    if (!alarm) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred Background */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={onDismiss}
            />

            {/* Notification Modal */}
            <div className="relative z-10 bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-bounce-in">
                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Alarm Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse" />
                        <div className="relative bg-blue-600 p-6 rounded-full">
                            <Bell size={48} className="text-white animate-ring" />
                        </div>
                    </div>
                </div>

                {/* Alarm Details */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Alarm</h2>
                    <p className="text-2xl font-semibold text-blue-300 mb-4">{alarm.name}</p>
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Clock size={16} />
                        <span className="text-sm">{alarm.time}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onSnooze}
                        className="flex-1 py-3 px-6 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 text-yellow-300 font-medium transition-all hover:scale-105"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock size={18} />
                            <span>Remind in 5 min</span>
                        </div>
                    </button>
                    <button
                        onClick={onDismiss}
                        className="flex-1 py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/50"
                    >
                        Dismiss
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes ring {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-ring {
          animation: ring 0.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default AlarmNotification;
