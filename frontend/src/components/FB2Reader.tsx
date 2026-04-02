import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface FB2Fragment {
    title?: string;
    paragraphs: string[];
}

interface FB2ReaderProps {
    fileUrl: string;
}

export default function FB2Reader({ fileUrl }: FB2ReaderProps) {
    const { t } = useTranslation();
    const [fragment, setFragment] = useState<FB2Fragment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAndParseFB2 = async () => {
            try {
                setLoading(true);
                const response = await fetch(fileUrl);
                const text = await response.text();
                
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");
                
                // Basic FB2 parsing logic
                // Find <section> or <body>
                const section = xmlDoc.querySelector('section') || xmlDoc.querySelector('body');
                if (!section) throw new Error('Could not find content in FB2 file');

                const title = xmlDoc.querySelector('title')?.textContent || '';
                const pElements = section.querySelectorAll('p');
                const paragraphs = Array.from(pElements).map(p => p.textContent || '').filter(p => p.trim().length > 0);

                setFragment({ title, paragraphs });
            } catch (err) {
                console.error('FB2 Parsing Error:', err);
                setError(t('books.parsingError'));
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseFB2();
    }, [fileUrl]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>{t('books.loadingFragment')}</div>;
    if (error) return <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>{error}</div>;

    return (
        <div style={{ 
            background: 'rgba(15, 23, 42, 0.5)', 
            padding: '2rem', 
            borderRadius: '1rem', 
            maxHeight: '600px', 
            overflowY: 'auto',
            lineHeight: 1.8,
            fontSize: '1.1rem',
            color: 'var(--text-primary)',
            fontFamily: '"Georgia", serif',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
        }}>
            {fragment?.title && <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'inherit' }}>{fragment.title}</h3>}
            {fragment?.paragraphs.map((p, i) => (
                <p key={i} style={{ marginBottom: '1.5rem', textIndent: '1.5rem' }}>{p}</p>
            ))}
            <div style={{ 
                textAlign: 'center', 
                marginTop: '3rem', 
                padding: '1rem', 
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontStyle: 'italic',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
            }}>
                {t('books.fragmentEnd')}
            </div>
        </div>
    );
}
