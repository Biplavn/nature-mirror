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
        emoji: '🐦',
        icon: HummingbirdSVG,
        color: 'text-sky-700',
        borderColor: 'border-sky-200',
        bgColor: 'bg-sky-50/50',
        accentColor: 'bg-sky-100',
        funFacts: [
            { emoji: '💨', text: 'They flap their wings 40–80 times every second!' },
            { emoji: '⏪', text: 'They can fly backwards — the only birds that can!' },
            { emoji: '🏎️', text: 'They zoom around at up to 60 mph!' },
        ],
        description: 'Hummingbirds are tiny acrobats! They beat their wings in a figure-8 pattern so fast that they can hover in mid-air like magic. They can even fly backwards and upside-down!',
        tryThis: [
            'Hold your hand still — a curious one might hover right next to it!',
            'Wave quickly — watch them zip away like tiny rockets!',
            'Move slowly — they\'ll chase your fingers around the screen!',
        ],
        didYouKnow: 'Every hummingbird has its own personality — some are brave, some are shy, and some are super competitive!',
    },
    {
        id: 'FISH',
        name: 'Clownfish',
        emoji: '🐠',
        icon: ClownfishSVG,
        color: 'text-teal-700',
        borderColor: 'border-teal-200',
        bgColor: 'bg-teal-50/50',
        accentColor: 'bg-teal-100',
        funFacts: [
            { emoji: '🐟', text: 'They swim together in a school — like best friends!' },
            { emoji: '😱', text: 'If one gets scared, they ALL get scared!' },
            { emoji: '🌊', text: 'Their bodies wiggle like a wave from head to tail!' },
        ],
        description: 'Clownfish love to swim together! They follow three simple rules: stay close to friends, swim the same way, and don\'t bump into each other. That\'s how they make those beautiful swirling patterns!',
        tryThis: [
            'Move both hands — watch the whole school follow!',
            'Make a sudden move — one scared fish panics them ALL!',
            'Stay still — they\'ll relax and swim in peaceful circles.',
        ],
        didYouKnow: 'The bravest fish becomes the leader, and everyone else follows along!',
    },
    {
        id: 'BEES',
        name: 'Honeybee',
        emoji: '🐝',
        icon: BeeSVG,
        color: 'text-amber-700',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50/50',
        accentColor: 'bg-amber-100',
        funFacts: [
            { emoji: '🐝', text: 'A whole swarm of 40 bees buzzes around together!' },
            { emoji: '💃', text: 'They do a "waggle dance" to tell friends where the good stuff is!' },
            { emoji: '⚡', text: 'Their wings beat 230 times per second — bzzzzz!' },
        ],
        description: 'Honeybees are the best communicators in nature! When a bee finds something interesting (like your hand!), it does a special wiggle dance in a figure-8 shape. Other bees see the dance and fly over to check it out!',
        tryThis: [
            'Hold your hand near the bees — one will discover it and do a dance!',
            'Watch the other bees — they\'ll follow the dancer to your hand!',
            'Move fast — they scatter but recover super quickly!',
        ],
        didYouKnow: 'The waggle dance is one of the coolest things in nature — bees are basically giving each other directions by dancing!',
    },
    {
        id: 'BUTTERFLIES',
        name: 'Ulysses Butterfly',
        emoji: '🦋',
        icon: ButterflySVG,
        color: 'text-violet-700',
        borderColor: 'border-violet-200',
        bgColor: 'bg-violet-50/50',
        accentColor: 'bg-violet-100',
        funFacts: [
            { emoji: '🪶', text: 'They\'re super gentle — flap, then glide, flap, then glide!' },
            { emoji: '😳', text: 'They\'re the shyest creatures — even a tiny move can startle them!' },
            { emoji: '💫', text: 'Two butterflies will spiral dance together in the air!' },
        ],
        description: 'Butterflies are the gentle poets of the sky! They float through the air in a beautiful rhythm — flap flap flap, then gliiiide. They\'re very sensitive, so even a small movement can make them flutter away like leaves in the wind.',
        tryThis: [
            'Stay perfectly still — a butterfly might land right on your hand!',
            'Move veeeery slowly — they\'ll drift alongside you!',
            'Watch two butterflies near each other — they\'ll do a magical spiral dance!',
        ],
        didYouKnow: 'These are the most sensitive creatures in BUGS — they notice the tiniest movements!',
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
                <div className="flex items-center justify-center gap-4 mb-6 text-5xl">
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
                    Wave your hands to play with hummingbirds, fish, bees, and butterflies!
                    Watch how they move, react, and behave — just like in real nature. 🌿
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/experience"
                        className="group px-8 py-4 bg-field-green text-cream rounded-xl text-lg font-medium hover:bg-field-green-dark transition-all shadow-lg shadow-field-green/20 hover:shadow-xl hover:shadow-field-green/30 hover:-translate-y-0.5"
                    >
                        <span className="inline-block group-hover:animate-float">🖐️</span> Let's Play!
                    </Link>
                    <a
                        href="#meet-the-creatures"
                        className="px-8 py-4 text-ink-light border border-field-amber/30 rounded-xl text-lg font-medium hover:bg-parchment/50 transition-all"
                    >
                        Meet the Creatures ↓
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
            title: 'Turn on your camera',
            desc: 'Stand in front of your webcam so the screen can see your hands. That\'s all you need!',
        },
        {
            icon: '🤚',
            title: 'Wave your hands!',
            desc: 'Move slowly to attract curious creatures. Move fast to watch them scatter! Try different speeds and see what happens.',
        },
        {
            icon: '🤩',
            title: 'Watch the magic!',
            desc: 'Every creature has its own personality! Some are brave, some are shy. They\'ll react differently to everything you do.',
        },
    ];

    return (
        <section className="py-20 px-6" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="font-display text-4xl font-bold text-ink mb-3">How to Play</h2>
                    <p className="text-ink-light text-lg">It's super easy — just three steps!</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`text-center p-8 rounded-2xl bg-warm-white/50 border border-field-amber/10 transition-all duration-700 hover:shadow-md hover:-translate-y-1 ${
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
    const [expandedFact, setExpandedFact] = useState<number | null>(null);
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
            <div className={`flex-shrink-0 w-64 h-64 md:w-80 md:h-80 rounded-3xl ${creature.bgColor} border ${creature.borderColor} flex items-center justify-center p-8 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default`}>
                <IconComponent
                    className={`w-full h-full ${creature.color} group-hover:scale-105 transition-transform duration-500`}
                    animated={isVisible}
                />
            </div>

            {/* Content */}
            <div className="flex-1 max-w-lg">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{creature.emoji}</span>
                    <h3 className="font-display text-3xl font-bold text-ink">{creature.name}</h3>
                </div>

                <p className="text-ink-light leading-relaxed mb-5">
                    {creature.description}
                </p>

                {/* Fun Facts - clickable */}
                <div className="space-y-2 mb-5">
                    <h4 className="font-hand text-lg text-field-amber">Fun facts:</h4>
                    {creature.funFacts.map((fact, i) => (
                        <button
                            key={i}
                            onClick={() => setExpandedFact(expandedFact === i ? null : i)}
                            className={`w-full text-left flex items-start gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                                expandedFact === i
                                    ? `${creature.accentColor} border-${creature.borderColor.replace('border-', '')} shadow-sm`
                                    : 'bg-warm-white/60 border-field-amber/10 hover:bg-warm-white'
                            }`}
                        >
                            <span className="text-xl flex-shrink-0 mt-0.5">{fact.emoji}</span>
                            <span className="text-sm text-ink-light leading-relaxed">{fact.text}</span>
                        </button>
                    ))}
                </div>

                {/* Try This! */}
                <div className="mb-5">
                    <h4 className="font-hand text-lg text-field-green mb-2">Try this!</h4>
                    <ul className="space-y-1.5">
                        {creature.tryThis.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                                <span className="text-field-green mt-0.5 font-bold">→</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Did you know? */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-parchment/50 border-l-2 border-field-amber/40">
                    <span className="text-sm">💡</span>
                    <p className="font-hand text-sm text-ink-light"><strong>Did you know?</strong> {creature.didYouKnow}</p>
                </div>

                <Link
                    to={`/experience?mode=${creature.id}`}
                    className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl text-sm font-medium text-cream bg-field-green hover:bg-field-green-dark transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                    Play with {creature.name}s! →
                </Link>
            </div>
        </div>
    );
}

function CreaturesSection() {
    const { ref, isVisible } = useScrollReveal(0.1);

    return (
        <section id="meet-the-creatures" className="py-20 px-6 scroll-mt-20" ref={ref}>
            <div className="max-w-5xl mx-auto">
                <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="font-hand text-xl text-field-amber">Explorer's Guide</span>
                    <h2 className="font-display text-4xl font-bold text-ink mt-1">Meet the Creatures!</h2>
                    <p className="text-ink-light mt-3 max-w-xl mx-auto">
                        Each creature moves and acts just like in real life.
                        Get to know them before you jump in!
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
                <span className="font-hand text-xl text-field-amber">Shhh... sneak peek!</span>
                <h2 className="font-display text-4xl font-bold text-ink mt-1 mb-6">More Friends Coming Soon!</h2>

                <div className="flex items-center justify-center gap-8 my-10 text-6xl opacity-30">
                    <span className="animate-pulse-soft hover:opacity-100 hover:scale-125 transition-all cursor-default" style={{ animationDelay: '0s' }}>🪲</span>
                    <span className="animate-pulse-soft hover:opacity-100 hover:scale-125 transition-all cursor-default" style={{ animationDelay: '0.5s' }}>🦗</span>
                    <span className="animate-pulse-soft hover:opacity-100 hover:scale-125 transition-all cursor-default" style={{ animationDelay: '1s' }}>🪰</span>
                    <span className="animate-pulse-soft hover:opacity-100 hover:scale-125 transition-all cursor-default" style={{ animationDelay: '1.5s' }}>🐞</span>
                    <span className="animate-pulse-soft hover:opacity-100 hover:scale-125 transition-all cursor-default" style={{ animationDelay: '2s' }}>🦟</span>
                </div>

                <p className="text-ink-light leading-relaxed mb-4">
                    We're working on dragonflies, beetles, ladybugs, fireflies, and more!
                </p>
                <p className="font-hand text-field-green text-lg mb-8">
                    Which creature do YOU want to see next? Tell us! 👇
                </p>

                <Link
                    to="/feedback"
                    className="px-6 py-3 border border-field-amber/30 rounded-xl text-ink-light font-medium hover:bg-parchment/50 hover:-translate-y-0.5 transition-all"
                >
                    🦎 Suggest a Creature!
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
                    Ready to jump in? 🎉
                </h2>
                <p className="text-ink-light text-lg mb-8">
                    Your hands become magic wands! Wave them around and
                    watch creatures come to life. What are you waiting for?
                </p>

                <Link
                    to="/experience"
                    className="inline-block px-10 py-5 bg-field-green text-cream rounded-2xl text-xl font-medium hover:bg-field-green-dark transition-all shadow-lg shadow-field-green/20 hover:shadow-xl hover:shadow-field-green/30 hover:-translate-y-1"
                >
                    🖐️ Start Playing!
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
            <CreaturesSection />
            <ComingSoonSection />
            <FinalCTASection />
        </div>
    );
};
