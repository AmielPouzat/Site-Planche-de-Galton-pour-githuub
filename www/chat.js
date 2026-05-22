(function initPouzatChat() {
    const config = {
        apiKey: 'AIzaSyBmS9Qr2LAwcbIprXWw-wJr06Vp49P6j9o',
        authDomain: 'pouzat-fr.firebaseapp.com',
        databaseURL: 'https://pouzat-fr.firebaseio.com',
        storageBucket: 'pouzat-fr.appspot.com',
        messagingSenderId: '916177954118'
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeMessage(snapshotValue) {
        if (typeof snapshotValue === 'string') {
            return {
                author: 'Ancien message',
                text: snapshotValue,
                createdAt: null,
                type: 'message'
            };
        }

        return {
            author: snapshotValue.author || 'Anonyme',
            text: snapshotValue.text || '',
            createdAt: snapshotValue.createdAt || null,
            type: snapshotValue.type || 'message'
        };
    }

    function formatDate(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function createMessageElement(message) {
        const article = document.createElement('article');
        article.className = 'chat-message';
        article.innerHTML = `
            <header>
                <strong>${escapeHtml(message.author)}</strong>
                <time>${escapeHtml(formatDate(message.createdAt))}</time>
            </header>
            <p>${escapeHtml(message.text)}</p>
        `;
        return article;
    }

    function setupChat() {
        const messagesElement = document.getElementById('chat-messages');
        const statusElement = document.getElementById('chat-status');
        const form = document.getElementById('chat-form');
        const nameInput = document.getElementById('chat-name');
        const messageInput = document.getElementById('chat-message');
        const clearButton = document.getElementById('clear_chat');

        if (!messagesElement || !form || typeof firebase === 'undefined') return;

        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }

        const ref = firebase.database().ref('messages');
        const savedName = localStorage.getItem('pouzat-chat-name');
        if (savedName) nameInput.value = savedName;

        ref.limitToLast(80).on('child_added', (dataSnapshot) => {
            const message = normalizeMessage(dataSnapshot.val());
            if (!message.text.trim()) return;
            messagesElement.appendChild(createMessageElement(message));
            messagesElement.scrollTop = messagesElement.scrollHeight;
            statusElement.textContent = 'Connecté';
        });

        ref.on('value', (dataSnapshot) => {
            if (!dataSnapshot.exists()) {
                messagesElement.innerHTML = '';
                statusElement.textContent = 'Aucun message';
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const author = nameInput.value.trim() || 'Anonyme';
            const text = messageInput.value.trim();
            if (!text) return;

            localStorage.setItem('pouzat-chat-name', author);

            ref.push({
                type: 'message',
                author,
                text,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            messageInput.value = '';
            messageInput.focus();
        });

        clearButton.addEventListener('click', () => {
            const confirmed = window.confirm('Vider tous les messages du chat ?');
            if (confirmed) ref.set(null);
        });
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', setupChat);
    }
})();
