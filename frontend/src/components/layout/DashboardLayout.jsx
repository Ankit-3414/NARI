import React from 'react';

const DashboardLayout = ({ children, connected = false, showWarning = false }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* Background Gradient Mesh */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none z-0" />

            {/* Warning Banner */}
            {showWarning && (
                <div className="fixed top-0 left-0 w-full bg-red-600/90 text-white text-center py-2 z-50 animate-pulse font-bold tracking-wider">
                    ⚠️ CONNECTION LOST - ATTEMPTING TO RECONNECT
                </div>
            )}

            <div className="relative z-10 w-full h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
                    {/* Header Area */}
                    <header className="mb-8 flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            NARI <span className="text-xs font-mono text-gray-500 ml-2">v0.3</span>
                        </h1>
                        <div className="flex items-center space-x-4">
                            {/* Status Indicator */}
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs font-mono ${connected ? 'text-green-500' : 'text-red-500'}`}>
                                    {connected ? 'ONLINE' : 'OFFLINE'}
                                </span>
                                <div className={`h-2 w-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-300 ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-ping'
                                    }`}></div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Grid */}
                    <main className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {children}
                    </main>

                    <footer className="mt-12 text-center text-gray-600 text-sm py-4">
                        NARI System • LAN Control • v0.3
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
