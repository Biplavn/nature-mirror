import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FeedbackData {
    name: string;
    email: string;
    category: 'bug' | 'feature' | 'creature' | 'general';
    message: string;
}

const categories = [
    { key: 'bug' as const, label: 'Bug Report', icon: '🐛' },
    { key: 'feature' as const, label: 'Feature Idea', icon: '✨' },
    { key: 'creature' as const, label: 'Suggest Creature', icon: '🦎' },
    { key: 'general' as const, label: 'General', icon: '💬' },
];

export const FeedbackPage: React.FC = () => {
    const [form, setForm] = useState<FeedbackData>({
        name: '',
        email: '',
        category: 'general',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const existing = JSON.parse(localStorage.getItem('bugs-feedback') || '[]');
        existing.push({ ...form, timestamp: Date.now() });
        localStorage.setItem('bugs-feedback', JSON.stringify(existing));
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto px-6 py-24 text-center">
                <div className="text-7xl mb-6 animate-float">🦋</div>
                <h2 className="font-display text-4xl font-bold text-ink mb-4">Thank You!</h2>
                <p className="text-ink-light text-lg mb-2">
                    Your observation has been recorded in our field journal.
                </p>
                <p className="text-ink-light/60 text-sm mb-8">
                    Every piece of feedback helps us create better creature experiences.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-field-green text-cream rounded-lg font-medium hover:bg-field-green-dark transition-colors"
                    >
                        Return Home
                    </Link>
                    <button
                        onClick={() => { setSubmitted(false); setForm({ name: '', email: '', category: 'general', message: '' }); }}
                        className="px-6 py-3 border border-field-amber/30 text-ink-light rounded-lg font-medium hover:bg-parchment/50 transition-colors"
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
                <span className="font-hand text-lg text-field-amber">Field Journal Entry</span>
                <h1 className="font-display text-4xl font-bold text-ink mt-1 mb-2">
                    Share Your Observations
                </h1>
                <p className="text-ink-light">
                    Help us improve the BUGS experience. Report bugs, suggest features, or recommend new creatures to study.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">
                        Name <span className="text-ink-light/40">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-warm-white border border-field-amber/20 rounded-xl text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-field-green/40 focus:border-field-green/40 transition-all"
                        placeholder="Your name"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">
                        Email <span className="text-ink-light/40">(optional)</span>
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-warm-white border border-field-amber/20 rounded-xl text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-field-green/40 focus:border-field-green/40 transition-all"
                        placeholder="you@example.com"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-ink-light mb-2">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, category: cat.key }))}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                    form.category === cat.key
                                        ? 'bg-field-green text-cream border-field-green shadow-sm'
                                        : 'bg-warm-white text-ink-light border-field-amber/20 hover:border-field-green/30 hover:bg-parchment/30'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-sm font-medium text-ink-light mb-1.5">
                        Message <span className="text-field-red">*</span>
                    </label>
                    <textarea
                        required
                        rows={6}
                        value={form.message}
                        onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3 bg-warm-white border border-field-amber/20 rounded-xl text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-field-green/40 focus:border-field-green/40 transition-all resize-none"
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
                    className="w-full py-3.5 bg-field-green text-cream rounded-xl font-medium hover:bg-field-green-dark transition-colors shadow-sm hover:shadow-md"
                >
                    Submit Observation
                </button>
            </form>

            {/* Decorative footer */}
            <div className="mt-12 text-center">
                <p className="font-hand text-sm text-ink-light/40">
                    "Every observation contributes to our understanding of nature" 🌿
                </p>
            </div>
        </div>
    );
};
