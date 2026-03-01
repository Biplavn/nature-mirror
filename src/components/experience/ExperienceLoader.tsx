import { useState, useEffect } from 'react';
import { HummingbirdSVG } from '../illustrations/HummingbirdSVG';
import { ClownfishSVG } from '../illustrations/ClownfishSVG';
import { BeeSVG } from '../illustrations/BeeSVG';
import { ButterflySVG } from '../illustrations/ButterflySVG';

const creatures = [
    { Component: HummingbirdSVG, message: 'Waking up the creatures...' },
    { Component: ClownfishSVG, message: 'Painting the world...' },
    { Component: BeeSVG, message: 'Warming up your camera...' },
    { Component: ButterflySVG, message: 'Almost there...' },
];

interface Props {
    isReady: boolean;
}

export const ExperienceLoader: React.FC<Props> = ({ isReady }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % creatures.length);
        }, 2000);

        return () => clearInterval(timer);
    }, []);

    const { Component, message } = creatures[index];

    return (
        <div
            className={`fixed inset-0 z-[150] bg-[#0a0a0a] flex items-center justify-center transition-all duration-700 ${
                isReady ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
            }`}
        >
            <div className="text-center">
                {/* Cycling creature SVG with wing animations */}
                <div
                    key={index}
                    className="w-20 h-20 mx-auto mb-8 text-white/25 animate-float animate-bounce-in"
                >
                    <Component animated={true} className="w-full h-full" />
                </div>

                {/* Title */}
                <h2 className="text-white/90 text-3xl font-display font-bold mb-6 tracking-widest">
                    BUGS
                </h2>

                {/* Progress bar */}
                <div className="w-56 h-1 bg-white/10 rounded-full mx-auto overflow-hidden mb-4">
                    <div
                        className="h-full bg-field-green/60 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: isReady ? '100%' : '60%' }}
                    />
                </div>

                {/* Loading message */}
                <p className={`font-sans text-sm h-5 transition-opacity duration-300 ${isReady ? 'text-field-green/60' : 'text-white/40'}`}>
                    {isReady ? 'Ready!' : message}
                </p>
            </div>
        </div>
    );
};
