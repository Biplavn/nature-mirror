interface Props {
    className?: string;
    animated?: boolean;
}

export const ButterflySVG: React.FC<Props> = ({ className = '', animated = true }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className={animated ? 'animate-float-slow' : ''} style={animated ? { animationDelay: '1s' } : undefined}>
            {/* Body */}
            <line x1="100" y1="30" x2="100" y2="125" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Head */}
            <circle cx="100" cy="30" r="5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="99" cy="29" r="1.5" fill="currentColor" />
            {/* Antennae */}
            <path d="M97 26 C90 14 82 8 78 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="77" cy="5" r="2" fill="currentColor" opacity="0.5" />
            <path d="M103 26 C110 14 118 8 122 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="123" cy="5" r="2" fill="currentColor" opacity="0.5" />

            {/* Left upper wing */}
            <g style={{ transformOrigin: '100px 55px' }} className={animated ? 'animate-wing-left' : ''}>
                <path
                    d="M98 40 C80 25 50 15 30 25 C15 33 15 55 25 65 C35 75 65 78 98 70Z"
                    stroke="currentColor" strokeWidth="1.5"
                />
                {/* Wing patterns */}
                <path d="M90 42 C75 35 55 30 40 38" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                <circle cx="55" cy="45" r="8" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                <circle cx="42" cy="55" r="5" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                <path d="M85 50 C70 48 55 50 45 58" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            </g>

            {/* Right upper wing */}
            <g style={{ transformOrigin: '100px 55px' }} className={animated ? 'animate-wing-right' : ''}>
                <path
                    d="M102 40 C120 25 150 15 170 25 C185 33 185 55 175 65 C165 75 135 78 102 70Z"
                    stroke="currentColor" strokeWidth="1.5"
                />
                <path d="M110 42 C125 35 145 30 160 38" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                <circle cx="145" cy="45" r="8" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                <circle cx="158" cy="55" r="5" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                <path d="M115 50 C130 48 145 50 155 58" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            </g>

            {/* Left lower wing */}
            <g style={{ transformOrigin: '100px 85px' }} className={animated ? 'animate-wing-left' : ''}>
                <path
                    d="M98 78 C75 85 45 95 35 110 C28 120 35 132 50 130 C65 128 85 110 98 95Z"
                    stroke="currentColor" strokeWidth="1.5"
                />
                <circle cx="55" cy="108" r="5" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
                <path d="M90 82 C72 90 55 100 48 112" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            </g>

            {/* Right lower wing */}
            <g style={{ transformOrigin: '100px 85px' }} className={animated ? 'animate-wing-right' : ''}>
                <path
                    d="M102 78 C125 85 155 95 165 110 C172 120 165 132 150 130 C135 128 115 110 102 95Z"
                    stroke="currentColor" strokeWidth="1.5"
                />
                <circle cx="145" cy="108" r="5" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
                <path d="M110 82 C128 90 145 100 152 112" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            </g>

            {/* Body segments */}
            <path d="M98 50 L102 50 M98 60 L102 60 M98 70 L102 70 M98 80 L102 80 M98 90 L102 90 M98 100 L102 100 M98 110 L102 110"
                stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        </g>
    </svg>
);
