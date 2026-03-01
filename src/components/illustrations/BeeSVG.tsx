interface Props {
    className?: string;
    animated?: boolean;
}

export const BeeSVG: React.FC<Props> = ({ className = '', animated = true }) => (
    <svg viewBox="0 0 160 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className={animated ? 'animate-float' : ''} style={animated ? { animationDelay: '0.5s' } : undefined}>
            {/* Wings */}
            <g opacity="0.5">
                <ellipse cx="65" cy="40" rx="30" ry="18" stroke="currentColor" strokeWidth="1"
                    className={animated ? 'animate-wing-left' : ''}
                    style={{ transformOrigin: '80px 50px' }}
                />
                <ellipse cx="95" cy="38" rx="28" ry="16" stroke="currentColor" strokeWidth="1"
                    className={animated ? 'animate-wing-right' : ''}
                    style={{ transformOrigin: '80px 50px' }}
                />
                {/* Wing veins */}
                <path d="M45 40 L65 40 M55 35 L65 42 M55 45 L65 40" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
                <path d="M115 38 L95 38 M105 33 L95 40 M105 43 L95 38" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
            </g>
            {/* Head */}
            <circle cx="55" cy="65" r="14" stroke="currentColor" strokeWidth="1.5" />
            {/* Eyes */}
            <ellipse cx="50" cy="62" rx="4" ry="5" fill="currentColor" opacity="0.7" />
            <ellipse cx="60" cy="62" rx="4" ry="5" fill="currentColor" opacity="0.7" />
            {/* Antennae */}
            <path d="M50 52 C48 42 42 36 38 34" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="37" cy="33" r="2" fill="currentColor" opacity="0.5" />
            <path d="M58 52 C60 42 66 36 70 34" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="71" cy="33" r="2" fill="currentColor" opacity="0.5" />
            {/* Thorax */}
            <ellipse cx="75" cy="72" rx="18" ry="14" stroke="currentColor" strokeWidth="1.5" />
            {/* Fuzz on thorax */}
            <path d="M65 65 Q68 62 70 65 M72 63 Q75 60 78 63 M80 65 Q83 62 85 65" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
            {/* Abdomen */}
            <ellipse cx="105" cy="75" rx="25" ry="16" stroke="currentColor" strokeWidth="1.5" />
            {/* Stripes */}
            <path d="M92 62 C93 72 93 78 92 88" stroke="currentColor" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
            <path d="M102 60 C103 72 103 78 102 90" stroke="currentColor" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
            <path d="M112 62 C113 72 113 78 112 88" stroke="currentColor" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
            {/* Stinger */}
            <path d="M128 75 L138 75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            {/* Legs */}
            <g opacity="0.5" strokeWidth="0.8" stroke="currentColor" strokeLinecap="round">
                <path d="M62 78 L55 95 L50 100" />
                <path d="M70 82 L65 100 L60 106" />
                <path d="M80 82 L80 100 L78 108" />
                <path d="M88 80 L92 98 L95 105" />
                <path d="M95 78 L100 95 L105 100" />
                <path d="M100 76 L108 92 L114 96" />
            </g>
            {/* Proboscis */}
            <path d="M52 72 C50 78 48 82 46 80" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        </g>
    </svg>
);
