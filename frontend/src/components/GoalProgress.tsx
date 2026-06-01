import { useTranslation } from 'react-i18next';

interface GoalProgressProps {
    quitDate: string | null;
}

interface DayTarget {
    days: number;
}

const dayTargets: DayTarget[] = [
    { days: 7 },
    { days: 14 },
    { days: 30 },
    { days: 60 },
    { days: 90 },
    { days: 120 },
    { days: 180 },
    { days: 360 },
    { days: 720 },
];

export default function GoalProgress({ quitDate }: GoalProgressProps) {
    const { t } = useTranslation();

    if (!quitDate) return null;

    const quitDateTime = new Date(quitDate).getTime();
    const now = new Date().getTime();
    const daysPassed = Math.max(0, (now - quitDateTime) / (1000 * 60 * 60 * 24));

    return (
        <div className="card" style={{ marginTop: '2rem', maxWidth: '100%' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'baseline',
                marginBottom: '1.25rem',
                flexWrap: 'wrap'
            }}>
                <h2 style={{ margin: 0 }}>🎯 {t('goals.title')}</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {t('goals.hint')}
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.85rem'
            }}>
                {dayTargets.map((target) => {
                    const targetPercentage = Math.min(100, Math.max(0, (daysPassed / target.days) * 100));
                    const isTargetCompleted = targetPercentage >= 100;

                    return (
                        <div key={target.days} style={{
                            padding: '0.9rem',
                            borderRadius: '0.75rem',
                            background: isTargetCompleted ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.035)',
                            border: isTargetCompleted ? '1px solid rgba(34, 197, 94, 0.22)' : '1px solid rgba(255, 255, 255, 0.07)',
                            minHeight: '112px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                                alignItems: 'center',
                                marginBottom: '0.65rem'
                            }}>
                                <span style={{
                                    color: isTargetCompleted ? 'var(--success-color)' : 'var(--text-primary)',
                                    fontWeight: 700,
                                    fontSize: '0.95rem'
                                }}>
                                    {t('goals.dayGoal', { count: target.days })}
                                </span>
                                <span style={{
                                    color: isTargetCompleted ? 'var(--success-color)' : 'var(--accent-color)',
                                    fontWeight: 800,
                                    fontSize: '1.05rem'
                                }}>
                                    {Math.floor(targetPercentage)}%
                                </span>
                            </div>

                            <div style={{
                                height: '8px',
                                background: 'rgba(0, 0, 0, 0.22)',
                                borderRadius: '999px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${targetPercentage}%`,
                                    height: '100%',
                                    background: isTargetCompleted
                                        ? 'linear-gradient(90deg, var(--success-color), #86efac)'
                                        : 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))',
                                    borderRadius: '999px',
                                    transition: 'width 1s ease-out'
                                }} />
                            </div>

                            <div style={{
                                marginTop: '0.55rem',
                                color: 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                lineHeight: 1.35
                            }}>
                                {isTargetCompleted
                                    ? t('goals.completed')
                                    : t('goals.remaining', {
                                        count: Math.max(1, Math.ceil(target.days - daysPassed))
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
