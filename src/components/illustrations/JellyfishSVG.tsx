interface Props {
    className?: string;
    animated?: boolean;
}

export const JellyfishSVG: React.FC<Props> = ({ className = '', animated = true }) => (
    <svg viewBox="0 0 160 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className={animated ? 'animate-float-slow' : ''} style={animated ? { animationDelay: '0.5s' } : undefined}>
            {/* Bell dome */}
            <path
                d="M30 85 C30 35 130 35 130 85"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            />
            {/* Bell rim (slightly curved inward) */}
            <path
                d="M30 85 C40 95 120 95 130 85"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            />

            {/* Interior dome texture lines */}
            <path d="M50 55 Q80 42 110 55" stroke="currentColor" strokeWidth="0.7" opacity="0.25" />
            <path d="M42 68 Q80 56 118 68" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
            <path d="M38 78 Q80 70 122 78" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

            {/* Bioluminescence spots on bell */}
            <circle cx="60" cy="58" r="2.5" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
            <circle cx="80" cy="50" r="2" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
            <circle cx="100" cy="58" r="2.5" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
            <circle cx="72" cy="70" r="1.5" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            <circle cx="90" cy="68" r="1.5" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />

            {/* Oral arms (short wavy lines from center of rim) */}
            <path d="M65 90 C63 105 67 115 64 128" stroke="currentColor" strokeWidth="1" opacity="0.45" strokeLinecap="round" />
            <path d="M78 92 C80 108 76 118 79 132" stroke="currentColor" strokeWidth="1" opacity="0.45" strokeLinecap="round" />
            <path d="M92 90 C90 106 94 116 91 130" stroke="currentColor" strokeWidth="1" opacity="0.45" strokeLinecap="round" />

            {/* Long trailing tentacles */}
            <path d="M40 88 C38 110 42 135 36 165" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />
            <path d="M52 91 C48 118 54 142 50 175" stroke="currentColor" strokeWidth="0.7" opacity="0.25" strokeLinecap="round" />
            <path d="M108 91 C112 118 106 142 110 175" stroke="currentColor" strokeWidth="0.7" opacity="0.25" strokeLinecap="round" />
            <path d="M120 88 C122 110 118 135 124 165" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />

            {/* Extra thin tentacles for density */}
            <path d="M46 89 C44 112 48 138 42 170" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeLinecap="round" />
            <path d="M114 89 C116 112 112 138 118 170" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeLinecap="round" />
        </g>
    </svg>
);
