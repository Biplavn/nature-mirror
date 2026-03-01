import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { HummingbirdSVG } from '../components/illustrations/HummingbirdSVG';
import { ClownfishSVG } from '../components/illustrations/ClownfishSVG';
import { BeeSVG } from '../components/illustrations/BeeSVG';
import { ButterflySVG } from '../components/illustrations/ButterflySVG';

/* ─── Creature Data ──────────────────────────────────── */

const creatures = [
    {
        id: 'BIRDS',
        name: 'Hummingbird',
        latin: 'Trochilidae',
        icon: HummingbirdSVG,
        color: 'text-sky-700',
        borderColor: 'border-sky-200',
        bgColor: 'bg-sky-50/50',
        stats: [
            { label: 'Wing beats', value: '40–80/sec' },
            { label: 'Behaviors', value: '9 states' },
            { label: 'Max speed', value: '60 mph' },
        ],
        description: 'Hummingbirds hover using a unique figure-8 wing pattern, generating 75% lift on the downstroke and 25% on the upstroke. They can fly backwards, sideways, and hover with incredible precision.',
        behaviors: [
            'Hover near your hand with subtle figure-8 oscillations',
            'Dart away when startled by fast hand movements',
            'Chase each other in territorial displays',
            'Perform dramatic courtship dive displays',
        ],
        annotation: 'Each bird has a unique personality — boldness, curiosity, and territoriality are randomized',
    },
    {
        id: 'FISH',
        name: 'Clownfish',
        latin: 'Amphiprioninae',
        icon: ClownfishSVG,
        color: 'text-teal-700',
        borderColor: 'border-teal-200',
        bgColor: 'bg-teal-50/50',
        stats: [
            { label: 'Algorithm', value: 'Boids schooling' },
            { label: 'Behaviors', value: '7 states' },
            { label: 'Forces', value: '3 (sep/align/cohesion)' },
        ],
        description: 'Fish swim in schools using Craig Reynolds\' Boids algorithm — three simple forces (separation, alignment, cohesion) create mesmerizing collective motion from individual decision-making.',
        behaviors: [
            'School together using separation, alignment, and cohesion',
            'Cascade startle: one scared fish triggers tight-school for all',
            'Body undulation propagates as a wave from head to tail',
            'Follow a leader fish determined by boldness',
        ],
        annotation: 'The wave-like body motion uses real BCF propulsion research',
    },
    {
        id: 'BEES',
        name: 'Honeybee',
        latin: 'Apis mellifera',
        icon: BeeSVG,
        color: 'text-amber-700',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50/50',
        stats: [
            { label: 'Swarm size', value: '40 bees' },
            { label: 'Wing beat', value: '230 Hz' },
            { label: 'Behaviors', value: '6 states' },
        ],
        description: 'A swarm of 40 bees maintains cohesion while foraging. When a bee discovers your hand, it performs a waggle dance — a figure-8 recruitment pattern that attracts other bees to the location.',
        behaviors: [
            'Perform waggle dances near your hand to recruit others',
            'Zigzag flight pattern at 3 Hz frequency',
            'Swarm with separation, alignment, and cohesion forces',
            'Quick 0.6-second startle recovery (faster than other creatures)',
        ],
        annotation: 'Waggle dance recruitment creates a cascade of collective intelligence',
    },
    {
        id: 'BUTTERFLIES',
        name: 'Ulysses Butterfly',
        latin: 'Papilio ulysses',
        icon: ButterflySVG,
        color: 'text-violet-700',
        borderColor: 'border-violet-200',
        bgColor: 'bg-violet-50/50',
        stats: [
            { label: 'Wing beat', value: '8–12 Hz' },
            { label: 'Behaviors', value: '8 states' },
            { label: 'Startle threshold', value: 'Very low' },
        ],
        description: 'Butterflies alternate between rapid wing flaps and graceful glides in a 0.8-second cycle. They are extremely sensitive to movement — even slow hand gestures can cause them to scatter.',
        behaviors: [
            'Perch delicately on your hand when still (within 3 units)',
            'Perform paired spiral dances — two butterflies orbit each other',
            'Follow each other in chain formations',
            'Drift like leaves in the wind between flap-glide cycles',
        ],
        annotation: 'The most sensitive creatures — startle threshold is only 4 (vs 10+ for others)',
    },
];

/* ─── Section Components ─────────────────────────────── */

function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -left-20 w-72 h-72 opacity-[0.04]">
                    <ButterflySVG animated={true} className="w-full h-full text-field-green" />
                </div>
                <div className="absolute -bottom-10 -right-10 w-56 h-56 opacity-[0.04]">
                    <HummingbirdSVG animated={true} className="w-full h-full text-field-amber" />
                </div>
                <div className="absolute top-1/4 right-10 w-40 h-40 opacity-[0.03]">
                    <BeeSVG animated={true} className="w-full h-full text-field-red" />
                </div>
            </div>

            <div className="relative text-center max-w-3xl mx-auto">
                {/* Bug emoji cluster */}
                <div className="flex items-center justify-center gap-3 mb-6 text-4xl">
                    <span className="animate-float" style={{ animationDelay: '0s' }}>🦋</span>
                    <span className="animate-float" style={{ animationDelay: '0.5s' }}>🐝</span>
                    <span className="animate-float" style={{ animationDelay: '1s' }}>🐦</span>
                    <span className="animate-float" style={{ animationDelay: '1.5s' }}>🐠</span>
                </div>

                <h1 className="font-display text-6xl md:text-8xl font-bold text-ink tracking-tight mb-4">
                    BUGS
                </h1>
                <p className="font-hand text-2xl md:text-3xl text-field-green mb-6">
                    Behavioral Understanding through Gesture Simulation
                </p>
                <p className="text-ink-light text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
                    Explore how hummingbirds, fish, bees, and butterflies behave in nature —
                    then control them with your hands using AI-powered tracking.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/experience"
                        className="px-8 py-4 bg-field-green text-cream rounded-xl text-lg font-medium hover:bg-field-green-dark transition-all shadow-lg shadow-field-green/20 hover:shadow-xl hover:shadow-field-green/30 hover:-translate-y-0.5"
                    >
                        Start Exploring →
                    </Link>
                    <a
                        href="#field-notes"
                        className="px-8 py-4 text-ink-light border border-field-amber/30 rounded-xl text-lg font-medium hover:bg-parchment/50 transition-all"
                    >
                        Read Field Notes
                    </a>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-light/40">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
            </div>
        </section>
    );
}

function HowItWorksSection() {
    const { ref, isVisible } = useScrollReveal(0.2);

    const steps = [
        {
            icon: '📷',
            title: 'Position yourself',
            desc: 'Stand in front of your webcam. The AI detects your hands using MediaPipe\'s neural network with 21 landmarks per hand.',
        },
        {
            icon: '🤚',
            title: 'Move naturally',
            desc: 'Move your hands at different speeds. Slow movements attract curious creatures; fast movements trigger startle responses.',
        },
        {
            icon: '✨',
            title: 'Watch them respond',
            desc: 'Each creature has unique personality traits and behavioral states. They react to your proximity, speed, and gestures.',
        },
    ];

    return (
        <section className="py-20 px-6" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="font-display text-4xl font-bold text-ink mb-3">How It Works</h2>
                    <p className="text-ink-light text-lg">Real-time hand tracking meets biological behavior simulation</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`text-center p-8 rounded-2xl bg-warm-white/50 border border-field-amber/10 transition-all duration-700 ${
                                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                            style={{ transitionDelay: `${i * 150}ms` }}
                        >
                            <div className="text-5xl mb-4">{step.icon}</div>
                            <div className="font-hand text-sm text-field-amber mb-2">Step {i + 1}</div>
                            <h3 className="font-display text-xl font-semibold text-ink mb-3">{step.title}</h3>
                            <p className="text-ink-light text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CreatureCard({ creature, index }: { creature: typeof creatures[0]; index: number }) {
    const { ref, isVisible } = useScrollReveal(0.15);
    const isEven = index % 2 === 0;
    const IconComponent = creature.icon;

    return (
        <div
            ref={ref}
            className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-12 items-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
        >
            {/* Illustration */}
            <div className={`flex-shrink-0 w-64 h-64 md:w-80 md:h-80 rounded-3xl ${creature.bgColor} border ${creature.borderColor} flex items-center justify-center p-8 group hover:shadow-lg transition-shadow`}>
                <IconComponent
                    className={`w-full h-full ${creature.color} group-hover:scale-105 transition-transform duration-500`}
                    animated={isVisible}
                />
            </div>

            {/* Content */}
            <div className="flex-1 max-w-lg">
                <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="font-display text-3xl font-bold text-ink">{creature.name}</h3>
                    <span className="font-body text-sm italic text-ink-light">({creature.latin})</span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 mb-4 mt-3">
                    {creature.stats.map((stat) => (
                        <span key={stat.label} className="px-3 py-1 rounded-full bg-parchment text-xs text-ink-light border border-field-amber/10">
                            <strong className="text-ink">{stat.value}</strong> · {stat.label}
                        </span>
                    ))}
                </div>

                <p className="text-ink-light leading-relaxed mb-4">
                    {creature.description}
                </p>

                {/* Behaviors */}
                <div className="mb-4">
                    <h4 className="font-hand text-lg text-field-green mb-2">Observed behaviors:</h4>
                    <ul className="space-y-1.5">
                        {creature.behaviors.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                                <span className="text-field-amber mt-0.5">•</span>
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Annotation */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-parchment/50 border-l-2 border-field-amber/40">
                    <span className="text-sm">📝</span>
                    <p className="font-hand text-sm text-ink-light">{creature.annotation}</p>
                </div>

                <Link
                    to={`/experience?mode=${creature.id}`}
                    className={`inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium text-cream bg-field-green hover:bg-field-green-dark transition-colors`}
                >
                    See them live →
                </Link>
            </div>
        </div>
    );
}

function FieldNotesSection() {
    const { ref, isVisible } = useScrollReveal(0.1);

    return (
        <section id="field-notes" className="py-20 px-6 scroll-mt-20" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="font-hand text-xl text-field-amber">Research Journal</span>
                    <h2 className="font-display text-4xl font-bold text-ink mt-1">Field Notes</h2>
                    <p className="text-ink-light mt-3 max-w-xl mx-auto">
                        Each creature's behavior is modeled from peer-reviewed biological research.
                        Explore our digital specimens below.
                    </p>
                </div>

                <div className="space-y-20">
                    {creatures.map((creature, i) => (
                        <CreatureCard key={creature.id} creature={creature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ComingSoonSection() {
    const { ref, isVisible } = useScrollReveal(0.2);

    return (
        <section className="py-20 px-6" ref={ref}>
            <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="font-hand text-xl text-field-amber">Work in Progress</span>
                <h2 className="font-display text-4xl font-bold text-ink mt-1 mb-6">More Creatures Coming</h2>

                <div className="flex items-center justify-center gap-8 my-10 text-6xl opacity-30">
                    <span className="animate-pulse-soft" style={{ animationDelay: '0s' }}>🪲</span>
                    <span className="animate-pulse-soft" style={{ animationDelay: '0.5s' }}>🦗</span>
                    <span className="animate-pulse-soft" style={{ animationDelay: '1s' }}>🪰</span>
                    <span className="animate-pulse-soft" style={{ animationDelay: '1.5s' }}>🐞</span>
                    <span className="animate-pulse-soft" style={{ animationDelay: '2s' }}>🦟</span>
                </div>

                <p className="text-ink-light leading-relaxed mb-8">
                    We're studying dragonflies, beetles, ladybugs, fireflies, and more.
                    Each new creature brings unique behavioral patterns and interactions.
                </p>

                <Link
                    to="/feedback"
                    className="px-6 py-3 border border-field-amber/30 rounded-xl text-ink-light font-medium hover:bg-parchment/50 transition-all"
                >
                    Suggest a creature →
                </Link>
            </div>
        </section>
    );
}

function FinalCTASection() {
    const { ref, isVisible } = useScrollReveal(0.2);

    return (
        <section className="py-24 px-6" ref={ref}>
            <div className={`max-w-2xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Decorative border */}
                <div className="flex items-center justify-center mb-8">
                    <svg width="300" height="20" viewBox="0 0 300 20" className="text-field-amber/20">
                        <path d="M0 10 Q37.5 0 75 10 Q112.5 20 150 10 Q187.5 0 225 10 Q262.5 20 300 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </div>

                <h2 className="font-display text-4xl font-bold text-ink mb-4">
                    Ready to explore?
                </h2>
                <p className="text-ink-light text-lg mb-8">
                    Step into the nature mirror and watch creatures respond to your every movement.
                </p>

                <Link
                    to="/experience"
                    className="inline-block px-10 py-5 bg-field-green text-cream rounded-2xl text-xl font-medium hover:bg-field-green-dark transition-all shadow-lg shadow-field-green/20 hover:shadow-xl hover:shadow-field-green/30 hover:-translate-y-1"
                >
                    🐛 Enter the Experience
                </Link>
            </div>
        </section>
    );
}

/* ─── Page ────────────────────────────────────────────── */

export const HomePage: React.FC = () => {
    return (
        <div className="bg-cream">
            <HeroSection />
            <HowItWorksSection />
            <FieldNotesSection />
            <ComingSoonSection />
            <FinalCTASection />
        </div>
    );
};
