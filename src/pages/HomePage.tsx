import { useState } from 'react';
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
        icon: HummingbirdSVG,
        color: 'text-ink/80',
        stats: ['40–80 wing beats/sec', 'Can fly backwards', '9 behavioral states'],
        description: 'Hummingbirds hover using a unique figure-8 wing pattern. They can fly backwards, sideways, and hover with incredible precision. The only birds that can.',
        fieldNotes: [
            'Hold your hand still. A curious one will hover right beside it',
            'Wave quickly to watch them dart away like tiny rockets',
            'Each bird has its own personality. Boldness, curiosity, and territoriality vary',
            'They chase each other in dramatic courtship dive displays',
        ],
    },
    {
        id: 'FISH',
        name: 'Clownfish',
        icon: ClownfishSVG,
        color: 'text-ink/80',
        stats: ['Schooling behavior', '7 behavioral states', 'Cascade startle response'],
        description: 'Fish swim in schools following three simple rules: stay close to friends, swim the same direction, don\'t bump into each other. These create mesmerizing collective motion.',
        fieldNotes: [
            'Move both hands and watch the whole school follow',
            'A sudden movement scares one fish, which panics them all',
            'Their bodies wiggle like a wave from head to tail',
            'The bravest fish becomes the leader that everyone follows',
        ],
    },
    {
        id: 'BEES',
        name: 'Honeybee',
        icon: BeeSVG,
        color: 'text-ink/80',
        stats: ['40-bee swarm', '230 Hz wing beat', 'Waggle dance communication'],
        description: 'When a bee discovers something interesting, it performs a waggle dance, a figure-8 recruitment pattern. Other bees see the dance and fly over to investigate.',
        fieldNotes: [
            'Hold your hand near the swarm. A scout will discover it and dance',
            'Other bees follow the dancer to your hand in a cascade',
            'They scatter when startled but recover faster than any other creature',
            'The waggle dance is one of the most sophisticated communication systems in nature',
        ],
    },
    {
        id: 'BUTTERFLIES',
        name: 'Ulysses Butterfly',
        icon: ButterflySVG,
        color: 'text-ink/80',
        stats: ['8–12 Hz wing beat', 'Flap-glide cycle', 'Extremely startle-sensitive'],
        description: 'Butterflies alternate between rapid wing flaps and graceful glides. They\'re the most sensitive creatures here. Even a slow hand gesture can cause them to scatter like leaves.',
        fieldNotes: [
            'Stay perfectly still. A butterfly might perch on your hand',
            'Move very slowly and they\'ll drift alongside you',
            'Two butterflies near each other will perform a spiral dance',
            'The most sensitive creatures. They notice the tiniest movements',
        ],
    },
];

/* ─── Section Components ─────────────────────────────── */

function HeroSection() {
    return (
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden">
            {/* Single subtle background illustration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03]">
                    <ButterflySVG animated={true} className="w-full h-full text-field-green" />
                </div>
            </div>

            <div className="relative text-center max-w-3xl mx-auto">
                <h1 className="font-display text-7xl md:text-9xl font-bold text-ink tracking-tight mb-6">
                    BUGS
                </h1>
                <p className="font-hand text-xl md:text-2xl text-field-green/70 mb-8">
                    Behavioral Understanding through Gesture Simulation (Totally Made up)
                </p>
                <p className="font-sans text-ink-light text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-12">
                    Wave your hands to interact with hummingbirds, fish, bees, and butterflies.
                    Each creature behaves just like in nature, responding to your movements in real time.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <Link
                        to="/experience"
                        className="px-8 py-4 bg-field-green text-cream rounded-lg font-sans text-sm font-medium tracking-wide uppercase hover:bg-field-green-dark transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                    >
                        Enter Experience
                    </Link>
                    <a
                        href="#creatures"
                        className="font-sans text-sm text-ink-light/60 hover:text-ink-light transition-colors tracking-wide"
                    >
                        Learn more ↓
                    </a>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-light animate-pulse-soft">
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
            num: '01',
            title: 'Face your camera',
            desc: 'Stand in front of your webcam so it can see your hands. That\'s all you need.',
        },
        {
            num: '02',
            title: 'Move your hands',
            desc: 'Slow movements attract curious creatures. Fast movements trigger startle responses. Experiment.',
        },
        {
            num: '03',
            title: 'Observe',
            desc: 'Each creature has unique personality traits. They react to your proximity, speed, and gestures differently.',
        },
    ];

    return (
        <section className="py-28 px-6" ref={ref}>
            <div className="max-w-4xl mx-auto">
                <div className={`text-center mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">How It Works</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`text-center transition-all duration-700 ${
                                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                            style={{ transitionDelay: `${i * 120}ms` }}
                        >
                            <div className="font-sans text-4xl font-semibold text-field-green/20 mb-4 tracking-tight">
                                {step.num}
                            </div>
                            <h3 className="font-sans text-base font-semibold text-ink mb-3 tracking-wide">{step.title}</h3>
                            <p className="font-sans text-sm text-ink-light/70 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CreatureCard({ creature, index }: { creature: typeof creatures[0]; index: number }) {
    const { ref, isVisible } = useScrollReveal(0.15);
    const [showNotes, setShowNotes] = useState(false);
    const isEven = index % 2 === 0;
    const IconComponent = creature.icon;

    return (
        <div
            ref={ref}
            className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-10 md:gap-16 items-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
        >
            {/* Illustration — clean, no colored background frame */}
            <div className="flex-shrink-0 w-56 h-56 md:w-72 md:h-72 flex items-center justify-center group cursor-default">
                <IconComponent
                    className={`w-full h-full ${creature.color} group-hover:scale-105 transition-transform duration-700 ease-out`}
                    animated={isVisible}
                />
            </div>

            {/* Content — layered info hierarchy */}
            <div className="flex-1 max-w-lg">
                <h3 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">{creature.name}</h3>

                {/* Stats — clean, inline */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
                    {creature.stats.map((stat, i) => (
                        <span key={i} className="font-sans text-xs text-ink-light/50 tracking-wide uppercase">
                            {stat}{i < creature.stats.length - 1 && <span className="ml-4 text-field-amber/30">|</span>}
                        </span>
                    ))}
                </div>

                <p className="font-body text-ink-light leading-relaxed mb-6">
                    {creature.description}
                </p>

                {/* Collapsible Field Notes */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="font-sans text-sm text-field-green hover:text-field-green-dark transition-colors tracking-wide"
                    >
                        {showNotes ? '— Hide field notes' : '+ Read field notes'}
                    </button>

                    <div className={`overflow-hidden transition-all duration-500 ease-out ${
                        showNotes ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                    }`}>
                        <div className="border-l border-field-amber/20 pl-4 space-y-2">
                            {creature.fieldNotes.map((note, i) => (
                                <p key={i} className="font-sans text-sm text-ink-light/70 leading-relaxed">{note}</p>
                            ))}
                        </div>
                    </div>
                </div>

                <Link
                    to={`/experience?mode=${creature.id}`}
                    className="font-sans text-sm text-field-green hover:text-field-green-dark transition-colors tracking-wide"
                >
                    Explore {creature.name.toLowerCase()}s →
                </Link>
            </div>
        </div>
    );
}

function CreaturesSection() {
    const { ref, isVisible } = useScrollReveal(0.1);

    return (
        <section id="creatures" className="py-28 px-6 scroll-mt-20" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <div className={`text-center mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">The Creatures</h2>
                    <p className="font-sans text-sm text-ink-light/60 max-w-md mx-auto leading-relaxed">
                        Each creature's behavior is modeled from biological research.
                        Explore how they move, interact, and respond.
                    </p>
                </div>

                <div className="space-y-24 md:space-y-32">
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
        <section className="py-28 px-6" ref={ref}>
            <div className={`max-w-2xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">More Coming Soon</h2>
                <p className="font-sans text-sm text-ink-light/60 leading-relaxed mb-8">
                    Dragonflies, beetles, ladybugs, fireflies, and more are being studied.
                    Each brings unique behavioral patterns.
                </p>

                <div className="flex items-center justify-center gap-6 my-10 text-4xl opacity-20">
                    <span>🪲</span>
                    <span>🐞</span>
                    <span>🦟</span>
                </div>

                <Link
                    to="/feedback"
                    className="font-sans text-sm text-field-green hover:text-field-green-dark transition-colors tracking-wide"
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
        <section className="py-32 px-6" ref={ref}>
            <div className={`max-w-2xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mb-6">
                    Ready to explore?
                </h2>
                <p className="font-sans text-ink-light/60 text-base mb-10">
                    Step in front of your camera and watch creatures respond to your every movement.
                </p>

                <Link
                    to="/experience"
                    className="inline-block px-10 py-4 bg-field-green text-cream rounded-lg font-sans text-sm font-medium tracking-wide uppercase hover:bg-field-green-dark transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                >
                    Enter Experience
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
            <div className="max-w-4xl mx-auto"><hr className="border-t border-ink/[0.04]" /></div>
            <HowItWorksSection />
            <div className="max-w-4xl mx-auto"><hr className="border-t border-ink/[0.04]" /></div>
            <CreaturesSection />
            <div className="max-w-4xl mx-auto"><hr className="border-t border-ink/[0.04]" /></div>
            <ComingSoonSection />
            <div className="max-w-4xl mx-auto"><hr className="border-t border-ink/[0.04]" /></div>
            <FinalCTASection />
        </div>
    );
};
