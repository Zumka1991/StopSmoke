import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface FB2Section {
    title?: string;
    paragraphs: string[];
}

interface FB2Content {
    bookTitle?: string;
    sections: FB2Section[];
}

interface FB2ReaderProps {
    fileUrl: string;
}

export default function FB2Reader({ fileUrl }: FB2ReaderProps) {
    const { t } = useTranslation();
    const [content, setContent] = useState<FB2Content | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAndParseFB2 = async () => {
            try {
                setLoading(true);
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error('Failed to fetch file');
                const text = await response.text();
                
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "application/xml");
                
                // Helper to get text from elements that might have nested structure
                const getCleanText = (el: Element) => el.textContent?.trim() || '';

                // Get Book Title
                const bookTitle = xmlDoc.querySelector('book-title')?.textContent || 
                                xmlDoc.querySelector('body > title > p')?.textContent || '';

                const sections: FB2Section[] = [];
                
                // Look for sections in the main body
                const body = xmlDoc.querySelector('body');
                if (body) {
                    const sectionElements = body.querySelectorAll('section');
                    
                    if (sectionElements.length > 0) {
                        sectionElements.forEach(sec => {
                            const title = sec.querySelector('title')?.textContent?.trim();
                            const paragraphs = Array.from(sec.querySelectorAll('p'))
                                .map(p => getCleanText(p))
                                .filter(p => p.length > 0);
                            
                            if (paragraphs.length > 0) {
                                sections.push({ title, paragraphs });
                            }
                        });
                    } else {
                        // Fallback: just get all paragraphs if no sections
                        const paragraphs = Array.from(body.querySelectorAll('p'))
                            .map(p => getCleanText(p))
                            .filter(p => p.length > 0);
                        if (paragraphs.length > 0) {
                            sections.push({ paragraphs });
                        }
                    }
                }

                if (sections.length === 0) throw new Error('No readable content found');

                setContent({ bookTitle, sections });
            } catch (err) {
                console.error('FB2 Parsing Error:', err);
                setError(t('books.parsingError'));
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseFB2();
    }, [fileUrl, t]);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('books.loadingFragment')}</div>;
    if (error) return <div style={{ color: '#ef4444', padding: '3rem', textAlign: 'center' }}>{error}</div>;

    return (
        <div style={{ 
            background: '#1a1f2e', 
            padding: '2.5rem', 
            borderRadius: '1.25rem', 
            maxHeight: '700px', 
            overflowY: 'auto',
            lineHeight: 1.8,
            fontSize: '1.15rem',
            color: '#e2e8f0',
            fontFamily: '"Georgia", "Times New Roman", serif',
            boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent'
        }}>
            {content?.bookTitle && (
                <h2 style={{ 
                    textAlign: 'center', 
                    marginBottom: '3rem', 
                    color: 'var(--accent-color)',
                    fontSize: '1.8rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '1rem'
                }}>
                    {content.bookTitle}
                </h2>
            )}

            {content?.sections.map((section, sIdx) => (
                <div key={sIdx} style={{ marginBottom: '3rem' }}>
                    {section.title && (
                        <h3 style={{ 
                            color: '#94a3b8', 
                            fontSize: '1.4rem', 
                            marginBottom: '1.5rem',
                            marginTop: '2rem',
                            fontStyle: 'italic',
                            textAlign: 'center'
                        }}>
                            {section.title}
                        </h3>
                    )}
                    {section.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} style={{ 
                            marginBottom: '1.25rem', 
                            textIndent: '2rem',
                            textAlign: 'justify',
                            hyphens: 'auto'
                        }}>
                            {p}
                        </p>
                    ))}
                </div>
            ))}

            <div style={{ 
                textAlign: 'center', 
                marginTop: '4rem', 
                padding: '2rem', 
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontStyle: 'italic',
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                letterSpacing: '1px'
            }}>
                --- {t('books.fragmentEnd').toUpperCase()} ---
            </div>
        </div>
    );
}
