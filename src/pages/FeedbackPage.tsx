import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ButterflySVG } from '../components/illustrations/ButterflySVG';

interface FeedbackData {
    name: string;
    email: string;
    category: 'bug' | 'feature' | 'creature' | 'general';
    message: string;
}

/* ─── Category Icons (inline SVG, minimal stroke) ─── */

const BugIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2l1.88 1.88M14.12 3.88L16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 116 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
);

const LightbulbIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
    </svg>
);

const BinocularsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 10h4" />
        <path d="M7 4h2v4" />
        <path d="M15 4h2v4" />
        <circle cx="7" cy="15" r="5" />
        <circle cx="17" cy="15" r="5" />
        <path d="M12 15h0" />
    </svg>
);

const MessageIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);

const categories = [
    { key: 'bug' as const, label: 'Bug Report', icon: <BugIcon /> },
    { key: 'feature' as const, label: 'Feature Idea', icon: <LightbulbIcon /> },
    { key: 'creature' as const, label: 'Suggest Creature', icon: <BinocularsIcon /> },
    { key: 'general' as const, label: 'General', icon: <MessageIcon /> },
];

export const FeedbackPage: React.FC = () => {
    const [form, setForm] = useState<FeedbackData>({
        name: '',
        email: '',
        category: 'general',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const categoryLabel = categories.find(c => c.key === form.category)?.label || 'General';
        try {
            await fetch('https://formsubmit.co/ajax/support@bartlabs.in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    name: form.name || 'Anonymous',
                    email: form.email || 'Not provided',
                    _subject: `[BUGS Feedback] ${categoryLabel}`,
                    category: categoryLabel,
                    message: form.message,
                }),
            });
            setSubmitted(true);
        } catch {
            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto px-6 py-24 text-center">
                <div className="w-24 h-24 mx-auto mb-6 text-field-green/60 animate-float">
                    <ButterflySVG animated={true} className="w-full h-full" />
                </div>
                <h2 className="font-display text-4xl font-bold text-ink mb-4">Thank You</h2>
                <p className="font-sans text-ink-light text-base mb-2">
                    Your observation has been recorded in our field journal.
                </p>
                <p className="font-sans text-ink-light/50 text-sm mb-10">
                    Every piece of feedback helps us create better creature experiences.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-field-green text-cream rounded-lg font-sans text-sm font-medium uppercase tracking-wide hover:bg-field-green-dark transition-colors"
                    >
                        Return Home
                    </Link>
                    <button
                        onClick={() => { setSubmitted(false); setForm({ name: '', email: '', category: 'general', message: '' }); }}
                        className="px-6 py-3 border border-ink/[0.08] text-ink-light rounded-lg font-sans text-sm font-medium hover:bg-parchment/50 transition-colors"
                    >
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto px-6 py-16">
            {/* Header */}
            <div className="mb-10">
                <span className="font-sans text-xs tracking-widest uppercase text-ink-light/50">Feedback</span>
                <h1 className="font-display text-4xl font-bold text-ink mt-2 mb-3">
                    Share Your Observations
                </h1>
                <p className="font-sans text-ink-light text-base leading-relaxed">
                    Help us improve the BUGS experience. Report bugs, suggest features, or recommend new creatures to study.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block font-sans text-sm font-medium text-ink-light mb-1.5">
                        Name <span className="text-ink-light/40">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-warm-white border border-ink/[0.06] rounded-lg font-sans text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-field-green/30 focus:border-field-green/30 transition-all"
                        placeholder="Your name"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block font-sans text-sm font-medium text-ink-light mb-1.5">
                        Email <span className="text-ink-light/40">(optional)</span>
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-warm-white border border-ink/[0.06] rounded-lg font-sans text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-field-green/30 focus:border-field-green/30 transition-all"
                        placeholder="you@example.com"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block font-sans text-sm font-medium text-ink-light mb-2">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, category: cat.key }))}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border font-sans text-sm font-medium transition-all ${
                                    form.category === cat.key
                                        ? 'bg-field-green text-cream border-field-green'
                                        : 'bg-warm-white text-ink-light border-ink/[0.06] hover:border-field-green/30 hover:bg-parchment/30'
                                }`}
                            >
                                <span className="opacity-70">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="block font-sans text-sm font-medium text-ink-light mb-1.5">
                        Message <span className="text-field-red">*</span>
                    </label>
                    <textarea
                        required
                        rows={6}
                        value={form.message}
                        onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3 bg-warm-white border border-ink/[0.06] rounded-lg font-sans text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-field-green/30 focus:border-field-green/30 transition-all resize-none"
                        placeholder={
                            form.category === 'creature'
                                ? "What creature would you like to see? Describe its interesting behaviors..."
                                : form.category === 'bug'
                                ? "Describe the issue you encountered..."
                                : "Share your thoughts, ideas, or observations..."
                        }
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-field-green text-cream rounded-lg font-sans text-sm font-medium uppercase tracking-wide hover:bg-field-green-dark transition-colors shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Sending...' : 'Submit Observation'}
                </button>
            </form>
        </div>
    );
};
