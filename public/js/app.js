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
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const phoneNumber = document.getElementById('register-phone').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const messageDiv = document.getElementById('status-message');

    messageDiv.innerHTML = '<span style="color: gray;">Creando cuenta...</span>';

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, cedula, firstName, lastName, phoneNumber }) 
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
// --- Cédula Lookup Logic ---
async function handleCedulaLookup(cedulaInputId, firstnameId, lastnameId) {
    const cedulaInput = document.getElementById(cedulaInputId);
    let cedula = cedulaInput.value.trim().replace(/\D/g, ''); // Convert to numeric only
    
    // We only alert if it's very short, otherwise we let the backend handle it
    if (cedula.length < 5) {
        alert('Por favor ingresa un número de cédula válido.');
        return;
    }

    const firstnameInput = document.getElementById(firstnameId);
    const lastnameInput = document.getElementById(lastnameId);
    const messageDiv = document.getElementById('status-message');
    
    firstnameInput.value = 'Buscando...';
    lastnameInput.value = 'Buscando...';
    
    try {
        const response = await fetch(`http://localhost:3000/api/cedula/validate/${cedula}`);
        const data = await response.json();
        
        if (response.ok) {
            firstnameInput.value = data.nombre;
            lastnameInput.value = `${data.primerApellido} ${data.segundoApellido}`;
            firstnameInput.readOnly = true;
            lastnameInput.readOnly = true;
            firstnameInput.style.background = 'rgba(255,255,255,0.05)';
            lastnameInput.style.background = 'rgba(255,255,255,0.05)';
            messageDiv.innerHTML = `<span style="color: #4ade80;">Cédula verificada con éxito.</span>`;
        } else {
            firstnameInput.value = '';
            lastnameInput.value = '';
            firstnameInput.readOnly = false;
            lastnameInput.readOnly = false;
            firstnameInput.style.background = 'rgba(255,255,255,0.1)';
            lastnameInput.style.background = 'rgba(255,255,255,0.1)';
            // Show the actual message from backend (e.g. "Cédula no encontrada" or "Debe ser de 9 dígitos")
            messageDiv.innerHTML = `<span style="color: #fbbf24;">${data.message || 'Cédula no encontrada.'} Por favor, ingresa tus datos manualmente.</span>`;
        }
    } catch (error) {
        console.error('Error validating cedula:', error);
        firstnameInput.value = '';
        lastnameInput.value = '';
        messageDiv.innerHTML = '<span style="color: #ef4444;">Error consultando la base de datos local.</span>';
    }
}

// Event Listeners for Search Buttons
document.getElementById('btn-search-register')?.addEventListener('click', () => {
    handleCedulaLookup('register-cedula', 'register-firstname', 'register-lastname');
});

document.getElementById('btn-search-google')?.addEventListener('click', () => {
    handleCedulaLookup('google-cedula', 'google-firstname', 'google-lastname');
});

// Also keep auto-search on 9 digits for convenience
document.getElementById('register-cedula').addEventListener('input', (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length === 9) {
        handleCedulaLookup('register-cedula', 'register-firstname', 'register-lastname');
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
            if (data.require2FA) {
                // Show 2FA section
                document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
                document.getElementById('2fa-section').style.display = 'block';
                document.getElementById('2fa-userid').value = data.userId;
                messageDiv.innerHTML = '<span style="color: #4ade80;">Clave correcta. Ingresa el código SMS.</span>';
            } else {
                localStorage.setItem('token', data.token);
                messageDiv.innerHTML = '<span style="color: var(--accent);">Sesion iniciada! Redirigiendo...</span>';
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            }
        } else {
            messageDiv.innerHTML = `<span style="color: #dc2626;">${data.message || 'Credenciales incorrectas.'}</span>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Error critico de servidor.</span>';
    }
});

// 2FA Form Handler
document.getElementById('2fa-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('2fa-code').value;
    const userId = document.getElementById('2fa-userid').value;
    const messageDiv = document.getElementById('status-message');

    messageDiv.innerHTML = '<span style="color: gray;">Verificando código...</span>';

    try {
        const response = await fetch('http://localhost:3000/api/auth/verify-2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, code })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            messageDiv.innerHTML = '<span style="color: #4ade80;">Código verificado! Entrando...</span>';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            messageDiv.innerHTML = `<span style="color: #dc2626;">${data.message || 'Código incorrecto.'}</span>`;
        }
    } catch (error) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Error en servidor.</span>';
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
            document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
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
            const response = await fetch(`http://localhost:3000/api/cedula/validate/${cedula}`);
            const data = await response.json();
            if (response.ok) {
                firstnameInput.value = data.nombre;
                lastnameInput.value = `${data.primerApellido} ${data.segundoApellido}`;
                firstnameInput.readOnly = true;
                lastnameInput.readOnly = true;
                firstnameInput.style.background = 'rgba(255,255,255,0.05)';
                lastnameInput.style.background = 'rgba(255,255,255,0.05)';
            } else {
                firstnameInput.value = '';
                lastnameInput.value = '';
                firstnameInput.readOnly = false;
                lastnameInput.readOnly = false;
                firstnameInput.style.background = 'rgba(255,255,255,0.1)';
                lastnameInput.style.background = 'rgba(255,255,255,0.1)';
            }
        } catch (error) { console.error(error); }
    }
});

// Google completion handler
document.getElementById('google-cedula-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cedula = document.getElementById('google-cedula').value;
    const firstName = document.getElementById('google-firstname').value;
    const lastName = document.getElementById('google-lastname').value;
    const phoneNumber = document.getElementById('google-phone').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3000/api/auth/complete-google-profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cedula, firstName, lastName, phoneNumber })
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
