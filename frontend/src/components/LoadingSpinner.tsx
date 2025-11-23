export default function LoadingSpinner({ size = '40px' }: { size?: string }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                border: '4px solid rgba(59, 130, 246, 0.2)',
                borderTop: '4px solid var(--accent-color)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }}
        >
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
