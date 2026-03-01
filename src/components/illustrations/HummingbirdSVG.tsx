interface Props {
    className?: string;
    animated?: boolean;
}

export const HummingbirdSVG: React.FC<Props> = ({ className = '', animated = true }) => (
    <svg viewBox="0 0 180 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <g className={animated ? 'animate-float' : ''} style={animated ? { animationDelay: '0.2s' } : undefined}>
            {/* Torso */}
            <path
                d="M75 70 C75 55 95 45 105 50 C115 55 118 65 115 75 C112 85 100 95 88 92 C76 89 75 80 75 70Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className={animated ? 'animate-draw-in' : ''}
                style={{ strokeDasharray: 300, strokeDashoffset: animated ? undefined : 0 }}
            />
            {/* Head */}
            <circle cx="110" cy="55" r="10" stroke="currentColor" strokeWidth="1.5" />
            {/* Eye */}
            <circle cx="113" cy="53" r="2" fill="currentColor" />
            {/* Beak */}
            <path d="M120 55 L142 52 L120 57" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Throat feathers */}
            <path d="M105 60 Q108 65 104 68" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            <path d="M108 62 Q111 66 107 69" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        </g>
        {/* Left wing */}
        <g style={{ transformOrigin: '80px 65px' }} className={animated ? 'animate-wing-left' : ''}>
            <path
                d="M80 65 C65 45 40 35 30 42 C22 48 28 60 45 62 C55 63 70 62 80 65Z"
                stroke="currentColor" strokeWidth="1.2" opacity="0.7"
            />
            {/* Wing detail lines */}
            <path d="M75 62 C60 50 45 45 35 48" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
            <path d="M72 65 C58 55 45 52 38 55" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
        </g>
        {/* Right wing */}
        <g style={{ transformOrigin: '85px 75px' }} className={animated ? 'animate-wing-right' : ''}>
            <path
                d="M85 75 C70 90 50 100 42 95 C35 90 40 78 55 76 C65 75 78 75 85 75Z"
                stroke="currentColor" strokeWidth="1.2" opacity="0.7"
            />
        </g>
        {/* Tail feathers */}
        <path d="M78 88 C68 100 55 108 50 115" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M80 90 C72 102 62 110 58 118" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M82 90 C76 103 70 112 68 120" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        {/* Tiny feet */}
        <path d="M95 92 L93 100 M93 100 L90 103 M93 100 L96 103" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
);
