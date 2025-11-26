interface LogoProps {
    size?: number;
    showText?: boolean;
    onClick?: () => void;
}

export default function Logo({ size = 40, showText = true, onClick }: LogoProps) {
    const fontSize = size > 50 ? 'clamp(1.8rem, 3vw, 2.2rem)' : size > 30 ? '1.4rem' : '1.1rem';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: showText ? '0.6rem' : '0',
                cursor: onClick ? 'pointer' : 'default',
                userSelect: 'none'
            }}
            onClick={onClick}
        >
            {/* Icon Container */}
            <div style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                position: 'relative',
                flexShrink: 0
            }}>
                <svg
                    width={size * 0.65}
                    height={size * 0.65}
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Cigarette - centered horizontally */}
                    <g>
                        {/* Cigarette body */}
                        <rect
                            x="10"
                            y="17"
                            width="20"
                            height="5"
                            rx="2.5"
                            fill="white"
                            opacity="0.95"
                        />
                        {/* Filter (orange tip) */}
                        <rect
                            x="10"
                            y="17"
                            width="5"
                            height="5"
                            rx="2.5"
                            fill="#fb923c"
                        />
                        {/* Small smoke */}
                        <circle cx="31" cy="19" r="1.2" fill="white" opacity="0.6" />
                        <circle cx="33.5" cy="17.5" r="1" fill="white" opacity="0.4" />
                    </g>

                    {/* Prohibition Symbol */}
                    <circle
                        cx="20"
                        cy="20"
                        r="15"
                        stroke="#ef4444"
                        strokeWidth="3.5"
                        fill="none"
                    />
                    <line
                        x1="8"
                        y1="8"
                        x2="32"
                        y2="32"
                        stroke="#ef4444"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            {showText && (
                <span style={{
                    fontSize: fontSize,
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
                }}>
                    StopSmoke
                </span>
            )}
        </div>
    );
}
