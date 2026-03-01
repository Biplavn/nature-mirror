import { useState, useEffect } from 'react';

const creatureEmojis = ['🐦', '🐠', '🐝', '🦋'];
const loadingMessages = [
    'Preparing creatures...',
    'Loading 3D models...',
    'Initializing hand tracking...',
    'Almost ready...',
];

interface Props {
    isReady: boolean;
}

export const ExperienceLoader: React.FC<Props> = ({ isReady }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [emojiIndex, setEmojiIndex] = useState(0);

    useEffect(() => {
        const msgTimer = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        }, 2000);

        const emojiTimer = setInterval(() => {
            setEmojiIndex(prev => (prev + 1) % creatureEmojis.length);
        }, 800);

        return () => {
            clearInterval(msgTimer);
            clearInterval(emojiTimer);
        };
    }, []);

    return (
        <div
            className={`fixed inset-0 z-[150] bg-gray-950 flex items-center justify-center transition-all duration-700 ${
                isReady ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
            }`}
        >
            <div className="text-center">
                {/* Cycling creature emoji */}
                <div className="text-7xl mb-8 transition-all duration-300" key={emojiIndex}>
                    {creatureEmojis[emojiIndex]}
                </div>

                {/* Title */}
                <h2 className="text-white/90 text-3xl font-display font-bold mb-6 tracking-wide">
                    BUGS
                </h2>

                {/* Progress bar */}
                <div className="w-56 h-1 bg-white/10 rounded-full mx-auto overflow-hidden mb-4">
                    <div
                        className="h-full bg-white/50 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: isReady ? '100%' : '60%' }}
                    />
                </div>

                {/* Loading message */}
                <p className="text-white/40 text-sm h-5 transition-opacity duration-300">
                    {isReady ? 'Ready!' : loadingMessages[messageIndex]}
                </p>
            </div>
        </div>
    );
};
