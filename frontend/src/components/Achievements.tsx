import { useTranslation } from 'react-i18next';

interface AchievementsProps {
    daysClean: number;
    moneySaved: number;
    cigarettesNotSmoked: number;
    currency: string;
}

interface Achievement {
    id: string;
    icon: string;
    translationKey: string;
    condition: (props: AchievementsProps) => boolean;
}

const achievements: Achievement[] = [
    // Time based
    {
        id: 'time_24h',
        icon: '🌅',
        translationKey: 'time_24h',
        condition: (p) => p.daysClean >= 1
    },
    {
        id: 'time_3d',
        icon: '🌱',
        translationKey: 'time_3d',
        condition: (p) => p.daysClean >= 3
    },
    {
        id: 'time_1w',
        icon: '🌿',
        translationKey: 'time_1w',
        condition: (p) => p.daysClean >= 7
    },
    {
        id: 'time_1m',
        icon: '🌳',
        translationKey: 'time_1m',
        condition: (p) => p.daysClean >= 30
    },
    {
        id: 'time_3m',
        icon: '🦁',
        translationKey: 'time_3m',
        condition: (p) => p.daysClean >= 90
    },
    {
        id: 'time_6m',
        icon: '🦅',
        translationKey: 'time_6m',
        condition: (p) => p.daysClean >= 180
    },
    {
        id: 'time_1y',
        icon: '👑',
        translationKey: 'time_1y',
        condition: (p) => p.daysClean >= 365
    },

    // Cigarettes based
    {
        id: 'cigs_100',
        icon: '💨',
        translationKey: 'cigs_100',
        condition: (p) => p.cigarettesNotSmoked >= 100
    },
    {
        id: 'cigs_1000',
        icon: '🌬️',
        translationKey: 'cigs_1000',
        condition: (p) => p.cigarettesNotSmoked >= 1000
    },
    {
        id: 'cigs_5000',
        icon: '🏔️',
        translationKey: 'cigs_5000',
        condition: (p) => p.cigarettesNotSmoked >= 5000
    },

    // Money based (generic thresholds, assuming typical currency values or just count)
    // We might need to adjust this based on currency, but for now let's use some abstract units
    // or just check if moneySaved > X. Let's assume standard units.
    {
        id: 'money_1000',
        icon: '💰',
        translationKey: 'money_1000',
        condition: (p) => p.moneySaved >= 1000
    },
    {
        id: 'money_5000',
        icon: '💎',
        translationKey: 'money_5000',
        condition: (p) => p.moneySaved >= 5000
    },
    {
        id: 'money_10000',
        icon: '🏦',
        translationKey: 'money_10000',
        condition: (p) => p.moneySaved >= 10000
    }
];

export default function Achievements({ daysClean, moneySaved, cigarettesNotSmoked, currency }: AchievementsProps) {
    const { t } = useTranslation();

    // Calculate props for condition checking
    const checkProps = { daysClean, moneySaved, cigarettesNotSmoked, currency };

    const unlockedCount = achievements.filter(a => a.condition(checkProps)).length;
    const totalCount = achievements.length;
    const progress = Math.round((unlockedCount / totalCount) * 100);

    return (
        <div className="card" style={{ marginTop: '2rem', maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>🏆 {t('achievements.title')}</h2>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {unlockedCount} / {totalCount}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '2rem'
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #fbbf24, #d97706)',
                    transition: 'width 1s ease-out'
                }} />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem'
            }}>
                {achievements.map((achievement) => {
                    const isUnlocked = achievement.condition(checkProps);

                    return (
                        <div key={achievement.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: isUnlocked ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '0.75rem',
                            border: isUnlocked ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                            opacity: isUnlocked ? 1 : 0.5,
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                fontSize: '2rem',
                                filter: isUnlocked ? 'none' : 'grayscale(100%)'
                            }}>
                                {achievement.icon}
                            </div>
                            <div>
                                <div style={{
                                    fontWeight: '600',
                                    color: isUnlocked ? '#fbbf24' : 'var(--text-secondary)',
                                    marginBottom: '0.25rem'
                                }}>
                                    {t(`achievements.list.${achievement.translationKey}.title`)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {t(`achievements.list.${achievement.translationKey}.desc`)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
