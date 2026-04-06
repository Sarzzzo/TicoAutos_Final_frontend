// Authentication logic (login and register)

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('status-message').innerHTML = '';

    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-section').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-section').classList.add('active');
    }
}

// Register handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cedula = document.getElementById('register-cedula').value; // Added
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const messageDiv = document.getElementById('status-message');

    messageDiv.innerHTML = '<span style="color: gray;">Creando cuenta...</span>';

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, cedula }) // Added cedula
        });
        const data = await response.json();
        if (response.ok) {
            messageDiv.innerHTML = '<span style="color: var(--accent);">Registro exitoso! Ya puedes iniciar sesion.</span>';
            document.getElementById('register-form').reset();
            setTimeout(() => switchTab('login'), 2000);
        } else {
            messageDiv.innerHTML = `<span style="color: #dc2626;">${data.message || 'Error'}</span>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Error en el servidor.</span>';
    }
});

// Cedula autocompletion logic
document.getElementById('register-cedula').addEventListener('input', async (e) => {
    const cedula = e.target.value;
    if (cedula.length === 9) {
        const firstnameInput = document.getElementById('register-firstname');
        const lastnameInput = document.getElementById('register-lastname');
        const messageDiv = document.getElementById('status-message');
        
        firstnameInput.value = 'Buscando...';
        lastnameInput.value = 'Buscando...';
        
        try {
            const response = await fetch(`http://localhost:3000/api/auth/validate-cedula/${cedula}`);
            const data = await response.json();
            
            if (response.ok) {
                firstnameInput.value = data.nombre;
                lastnameInput.value = `${data.primerApellido} ${data.segundoApellido}`;
                messageDiv.innerHTML = '<span style="color: var(--accent);">Cedula verificada!</span>';
            } else {
                firstnameInput.value = '';
                lastnameInput.value = '';
                messageDiv.innerHTML = '<span style="color: #dc2626;">Cedula no encontrada o invalida.</span>';
            }
        } catch (error) {
            console.error('Error validating cedula:', error);
            firstnameInput.value = '';
            lastnameInput.value = '';
        }
    }
});

// Login handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('status-message');

    // Support login with email or username
    const loginData = username.includes('@') ? { email: username, password } : { username, password };

    messageDiv.innerHTML = '<span style="color: gray;">Verificando credenciales...</span>';

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            messageDiv.innerHTML = '<span style="color: var(--accent);">Sesion iniciada! Redirigiendo...</span>';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            messageDiv.innerHTML = '<span style="color: #dc2626;">Credenciales incorrectas.</span>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Error critico de servidor.</span>';
    }
});

function enterAsGuest() {
    localStorage.removeItem('token'); // Ensure no old tokens are present
    window.location.href = 'dashboard.html';
}

// GOOGLE AUTH & PARAM CHECK
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const status = params.get('status');

    if (token) {
        localStorage.setItem('token', token);
        if (status === 'Pending') {
            // Show completion section
            document.getElementById('login-section').classList.remove('active');
            document.getElementById('register-section').classList.remove('active');
            document.getElementById('google-cedula-section').style.display = 'block';
            document.querySelector('.auth-tabs').style.display = 'none';
        } else {
            // Already active, go to dashboard
            window.location.href = 'dashboard.html';
        }
    }
});

// Google Cedula Autocomplete (identical to register)
document.getElementById('google-cedula').addEventListener('input', async (e) => {
    const cedula = e.target.value;
    if (cedula.length === 9) {
        const firstnameInput = document.getElementById('google-firstname');
        const lastnameInput = document.getElementById('google-lastname');
        try {
            const response = await fetch(`http://localhost:3000/api/auth/validate-cedula/${cedula}`);
            const data = await response.json();
            if (response.ok) {
                firstnameInput.value = data.nombre;
                lastnameInput.value = `${data.primerApellido} ${data.segundoApellido}`;
            }
        } catch (error) { console.error(error); }
    }
});

// Google completion handler
document.getElementById('google-cedula-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cedula = document.getElementById('google-cedula').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3000/api/auth/complete-google-profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cedula })
        });
        if (response.ok) {
            window.location.href = 'dashboard.html';
        } else {
            alert('Error al completar perfil. Intentalo de nuevo.');
        }
    } catch (error) {
        console.error(error);
    }
});
