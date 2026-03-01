interface Props {
    className?: string;
    animated?: boolean;
}

export const ClownfishSVG: React.FC<Props> = ({ className = '', animated = true }) => (
    <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className={animated ? 'animate-float-slow' : ''}>
            {/* Body */}
            <ellipse cx="100" cy="60" rx="55" ry="30" stroke="currentColor" strokeWidth="1.5" />
            {/* Stripes */}
            <path d="M70 35 C72 50 72 70 70 85" stroke="currentColor" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
            <path d="M105 32 C107 50 107 70 105 88" stroke="currentColor" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
            <path d="M135 40 C136 50 136 70 135 80" stroke="currentColor" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="60" cy="52" r="6" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="61" cy="51" r="2.5" fill="currentColor" />
            <circle cx="62" cy="50" r="1" fill="white" opacity="0.6" />
            {/* Mouth */}
            <path d="M46 58 C48 62 50 62 52 60" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            {/* Dorsal fin */}
            <path d="M75 32 C80 15 95 10 110 12 C120 14 125 25 125 32" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
            <path d="M85 28 L87 18 M95 25 L96 14 M105 25 L107 15 M115 28 L117 18" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
            {/* Tail fin */}
            <path
                d="M150 45 C170 30 175 25 178 28 C180 32 175 50 170 60 C175 70 180 88 178 92 C175 95 170 90 150 75"
                stroke="currentColor" strokeWidth="1.2" opacity="0.7"
                className={animated ? '' : ''}
            />
            {/* Tail detail */}
            <path d="M155 50 L168 35 M155 70 L168 85 M153 60 L172 60" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
            {/* Pectoral fin */}
            <path d="M80 65 C75 80 70 85 68 82 C66 78 72 72 80 65Z" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            {/* Lower fin */}
            <path d="M95 85 C93 95 100 100 108 95 C110 90 105 85 95 85Z" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            {/* Scale texture */}
            <path d="M80 50 Q85 48 88 52" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            <path d="M85 58 Q90 56 93 60" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            <path d="M110 50 Q115 48 118 52" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            <path d="M115 60 Q120 58 123 62" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        </g>
    </svg>
);
