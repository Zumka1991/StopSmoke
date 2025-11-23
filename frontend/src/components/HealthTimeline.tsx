import { useTranslation } from 'react-i18next';

interface HealthTimelineProps {
    quitDate: string | null;
}

interface Milestone {
    id: string;
    minutes: number;
    translationKey: string;
}

const milestones: Milestone[] = [
    { id: 'm20', minutes: 20, translationKey: 'm20' },
    { id: 'h8', minutes: 8 * 60, translationKey: 'h8' },
    { id: 'h24', minutes: 24 * 60, translationKey: 'h24' },
    { id: 'h48', minutes: 48 * 60, translationKey: 'h48' },
    { id: 'h72', minutes: 72 * 60, translationKey: 'h72' },
    { id: 'w2', minutes: 14 * 24 * 60, translationKey: 'w2' },
    { id: 'm1', minutes: 30 * 24 * 60, translationKey: 'm1' },
    { id: 'm3', minutes: 90 * 24 * 60, translationKey: 'm3' },
    { id: 'y1', minutes: 365 * 24 * 60, translationKey: 'y1' },
    { id: 'y5', minutes: 5 * 365 * 24 * 60, translationKey: 'y5' },
    { id: 'y10', minutes: 10 * 365 * 24 * 60, translationKey: 'y10' },
    { id: 'y15', minutes: 15 * 365 * 24 * 60, translationKey: 'y15' },
];

export default function HealthTimeline({ quitDate }: HealthTimelineProps) {
    const { t } = useTranslation();

    if (!quitDate) return null;

    const quitDateTime = new Date(quitDate).getTime();
    const now = new Date().getTime();
    const minutesPassed = Math.max(0, (now - quitDateTime) / (1000 * 60));

    // Find current progress
    const nextMilestoneIndex = milestones.findIndex(m => m.minutes > minutesPassed);
    const currentMilestoneIndex = nextMilestoneIndex === -1 ? milestones.length - 1 : nextMilestoneIndex - 1;

    // If all completed
    if (nextMilestoneIndex === -1) {
        return (
            <div className="card" style={{ marginTop: '2rem', maxWidth: '100%' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>❤️ {t('health.title')}</h2>
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '1rem',
                    border: '1px solid var(--success-color)'
                }}>
                    <h3 style={{ color: 'var(--success-color)' }}>{t('tracker.congratulations')}</h3>
                    <p>{t('health.completed')}</p>
                </div>
            </div>
        );
    }

    const nextMilestone = milestones[nextMilestoneIndex];
    const prevMilestoneMinutes = currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex].minutes : 0;

    // Calculate percentage for current milestone
    const totalDuration = nextMilestone.minutes - prevMilestoneMinutes;
    const currentDuration = minutesPassed - prevMilestoneMinutes;
    const percentage = Math.min(100, Math.max(0, (currentDuration / totalDuration) * 100));

    return (
        <div className="card" style={{ marginTop: '2rem', maxWidth: '100%' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>❤️ {t('health.title')}</h2>

            {/* Next Milestone Card - Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <div>
                        <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('health.inProgress')}
                        </span>
                        <h3 style={{ margin: '0.5rem 0', fontSize: '1.75rem' }}>
                            {t(`health.milestones.${nextMilestone.translationKey}.title`)}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>
                            {t(`health.milestones.${nextMilestone.translationKey}.desc`)}
                        </p>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                        {Math.round(percentage)}%
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                    height: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))',
                        transition: 'width 1s ease-out',
                        borderRadius: '6px'
                    }} />
                </div>
            </div>

            {/* Timeline Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
            }}>
                {milestones.map((m, index) => {
                    const isCompleted = index < nextMilestoneIndex;
                    const isLocked = index > nextMilestoneIndex;

                    if (isLocked) return null;

                    return (
                        <div key={m.id} style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            padding: '1rem',
                            background: isCompleted ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '0.75rem',
                            border: isCompleted ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                            opacity: isCompleted ? 0.8 : 1
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isCompleted ? 'var(--success-color)' : 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: 'white'
                            }}>
                                {isCompleted ? '✓' : (index + 1)}
                            </div>
                            <div>
                                <div style={{
                                    fontWeight: '600',
                                    color: isCompleted ? 'var(--success-color)' : 'var(--text-primary)',
                                    marginBottom: '0.25rem'
                                }}>
                                    {t(`health.milestones.${m.translationKey}.title`)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {t(`health.milestones.${m.translationKey}.desc`)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
