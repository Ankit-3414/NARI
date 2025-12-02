import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IntroAnimation = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Sequence:
        // 0: "Not A Random Intelligence" appears and holds (1.5s)
        // 1: Collapses to "NARI" and holds (1.5s)
        // 2: Fade out (0.8s)

        const timer1 = setTimeout(() => setStep(1), 1500);
        const timer2 = setTimeout(() => setStep(2), 4000);  // NARI now holds for 2.5s (4000ms - 1500ms)
        const timer3 = setTimeout(() => onComplete(), 4800); // Complete after fade (4000ms + 800ms fade out)

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div className="relative flex items-center justify-center h-20 overflow-hidden">
                <AnimatePresence mode='wait'>
                    {step === 0 && (
                        <motion.h1
                            key="full"
                            initial={{ opacity: 0, scale: 0.95, letterSpacing: "0.05em" }}
                            animate={{ opacity: 1, scale: 1, letterSpacing: "0.15em" }}
                            exit={{
                                opacity: 0,
                                scale: 0.9,
                                y: -15,
                                filter: "blur(8px)",
                                letterSpacing: "0.3em"
                            }}
                            transition={{
                                duration: 1.0,
                                ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for smoothness
                            }}
                            className="text-2xl md:text-4xl font-light text-center whitespace-nowrap text-gray-100"
                        >
                            Not A Random Intelligence
                        </motion.h1>
                    )}

                    {step === 1 && (
                        <motion.h1
                            key="short"
                            initial={{
                                opacity: 0,
                                scale: 1.8,
                                filter: "blur(12px)",
                                letterSpacing: "0.5em"
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: "blur(0px)",
                                letterSpacing: "0.2em"
                            }}
                            transition={{
                                duration: 0.8,
                                ease: [0.34, 1.56, 0.64, 1], // Smooth spring-like easing
                                filter: { duration: 0.6 }
                            }}
                            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600"
                        >
                            NARI
                        </motion.h1>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default IntroAnimation;
