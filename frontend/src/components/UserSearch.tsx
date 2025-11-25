import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import type { UserSearchResult } from '../types/chatTypes';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface UserSearchProps {
    onCreateConversation: (email: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onCreateConversation }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (query.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5216/api/messages/search-users?query=${encodeURIComponent(query)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateConversation = (email: string) => {
        onCreateConversation(email);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="user-search">
            <div className="user-search-input">
                <Search size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={t('messages.searchUsers')}
                />
            </div>

            {searchResults.length > 0 && (
                <div className="user-search-results">
                    {searchResults.map((user) => (
                        <div
                            key={user.id}
                            className="user-search-result-item"
                            onClick={() => handleCreateConversation(user.email)}
                        >
                            <div className="user-search-result-avatar">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-search-result-info">
                                <span className="user-search-result-name">{user.name}</span>
                                <span className="user-search-result-email">{user.email}</span>
                            </div>
                            <UserPlus size={20} className="user-search-result-icon" />
                        </div>
                    ))}
                </div>
            )}

            {isSearching && (
                <div className="user-search-loading">{t('messages.searching')}</div>
            )}
        </div>
    );
};

export default UserSearch;
