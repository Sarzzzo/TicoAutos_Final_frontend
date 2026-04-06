// Common logic for all pages (e.g., notifications, logout)

async function updateUnreadCount() {
    const token = localStorage.getItem('token');
    if (!token) {
        const badge = document.getElementById('unread-count');
        if (badge) badge.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/chat/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        const badge = document.getElementById('unread-count');
        
        if (badge) {
            if (data.unreadCount > 0) {
                badge.innerText = data.unreadCount > 9 ? '9+' : data.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Error fetching unread count:', err);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

function setupNavbar() {
    const token = localStorage.getItem('token');
    const authNav = document.getElementById('auth-nav');
    const noAuthNav = document.getElementById('noauth-nav');
    const publishLink = document.getElementById('nav-publish-link');
    const publishHero = document.getElementById('hero-publish-action');

    if (token) {
        if (authNav) authNav.style.display = 'flex';
        if (noAuthNav) noAuthNav.style.display = 'none';
        if (publishLink) publishLink.style.display = 'inline';
        if (publishHero) publishHero.style.display = 'block';
        updateUnreadCount();
    } else {
        if (authNav) authNav.style.display = 'none';
        if (noAuthNav) noAuthNav.style.display = 'flex';
        if (publishHero) publishHero.style.display = 'none';
    }
}

// Initial check and periodic refresh
document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
    setInterval(updateUnreadCount, 10000); // 10 seconds
});
