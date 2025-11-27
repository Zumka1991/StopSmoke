import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const { t } = useTranslation();

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5; // Number of page buttons to show

        if (totalPages <= showPages + 2) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
        }}>
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    padding: '0.5rem 1rem',
                    background: currentPage === 1
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: currentPage === 1
                        ? 'var(--text-secondary)'
                        : 'var(--accent-color)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    opacity: currentPage === 1 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }}
            >
                ← {t('pagination.previous')}
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
                <span key={index}>
                    {page === '...' ? (
                        <span style={{
                            padding: '0.5rem',
                            color: 'var(--text-secondary)'
                        }}>
                            ...
                        </span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
                            style={{
                                padding: '0.5rem 0.875rem',
                                background: currentPage === page
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.2))'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: currentPage === page
                                    ? '2px solid rgba(59, 130, 246, 0.5)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                color: currentPage === page
                                    ? 'var(--accent-color)'
                                    : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: currentPage === page ? '600' : '500',
                                transition: 'all 0.2s',
                                minWidth: '2.5rem'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }
                            }}
                        >
                            {page}
                        </button>
                    )}
                </span>
            ))}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    padding: '0.5rem 1rem',
                    background: currentPage === totalPages
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: currentPage === totalPages
                        ? 'var(--text-secondary)'
                        : 'var(--accent-color)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    opacity: currentPage === totalPages ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }}
            >
                {t('pagination.next')} →
            </button>
        </div>
    );
}
