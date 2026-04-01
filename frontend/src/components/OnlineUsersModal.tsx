import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, User as UserIcon, Search } from 'lucide-react';
import type { UserSummary } from '../types/chatTypes';

interface OnlineUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: UserSummary[];
}

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ isOpen, onClose, users }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content online-users-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('messages.onlineUsers')}</h3>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-search">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder={t('messages.searchOnlineUsers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="modal-body online-users-list">
                    {filteredUsers.length === 0 ? (
                        <p className="no-users" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                            {searchTerm ? t('messages.noMessages') : t('messages.noMessages')}
                        </p>
                    ) : (
                        filteredUsers.map(user => (
                            <div 
                                key={user.id} 
                                className="online-user-item"
                                onClick={() => {
                                    navigate(`/profile/${user.id}`);
                                    onClose();
                                }}
                            >
                                <div className="user-avatar-container">
                                    {(user.avatarThumbnailUrl || user.avatarUrl) ? (
                                        <img 
                                            src={user.avatarThumbnailUrl || user.avatarUrl} 
                                            alt={user.name} 
                                            className="user-avatar-img"
                                        />
                                    ) : (
                                        <div className="user-avatar-placeholder">
                                            <UserIcon size={16} />
                                        </div>
                                    )}
                                    <div className="online-indicator-small" />
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{user.name}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnlineUsersModal;
