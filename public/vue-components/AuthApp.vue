<!--
  ╔══════════════════════════════════════════════════════════════════╗
  ║  AuthApp.vue  —  TicoAutos | Flujo de Autenticación Completo   ║
  ╚══════════════════════════════════════════════════════════════════╝

  PROPÓSITO:
  Este componente maneja TODO el flujo de autenticación en UNA sola
  pieza de código reactiva. Reemplaza el app.js original que usaba
  getElementById + classList.add/remove para cambiar "pantallas".

  ¿QUÉ FLUJOS CUBRE?
  1. Login  →  credenciales → si require2FA → pantalla SMS → dashboard
  2. Registro  →  cédula → autocompletar nombre → enviar → login
  3. Google OAuth  →  si status=Pending → completar perfil con cédula

  CONCEPTOS VUE USADOS AQUÍ:
  ─────────────────────────────
  · data()         → variables reactivas (el "estado" de la app)
  · methods        → funciones que responden a eventos
  · computed       → valores calculados automáticamente desde data()
  · v-if / v-else  → muestra u oculta secciones según estado
  · v-model        → enlaza el input con una variable (doble vía)
  · @click / @submit → equivalente a addEventListener
  · mounted()      → se ejecuta cuando el HTML ya está listo (= DOMContentLoaded)
-->

<template>
  <!--
    <template> es el HTML del componente.
    Todo lo que escribamos aquí es HTML normal + directivas Vue (v-if, v-model, etc.)
  -->
  <div class="auth-card">

    <!-- ── TABS: Solo visibles en modo login/register ──────────────── -->
    <!--
      v-if="currentView === 'tabs'"
      → Solo muestra las pestañas si estamos en la vista de login/registro.
        Si el usuario ya pasó a 2FA o completar Google, estas se ocultan.
    -->
    <div class="auth-tabs" v-if="currentView === 'tabs'">
      <!--
        @click="activeTab = 'login'"
        → Cuando se hace clic, cambia la variable "activeTab" a 'login'.
          Vue automáticamente actualiza el DOM (no hay className manipulation).
        :class="{ active: activeTab === 'login' }"
        → Añade la clase CSS 'active' solo si activeTab es 'login'.
      -->
      <button class="tab-btn" :class="{ active: activeTab === 'login' }" @click="activeTab = 'login'">Ingresar</button>
      <button class="tab-btn" :class="{ active: activeTab === 'register' }" @click="activeTab = 'register'">Crear Cuenta</button>
    </div>


    <!-- ── SECCIÓN: LOGIN ────────────────────────────────────────────── -->
    <!--
      v-if="currentView === 'tabs' && activeTab === 'login'"
      → Doble condición: solo visible si estamos en tabs Y en la pestaña login.
      Si cualquiera de las dos es falsa, el elemento NO existe en el DOM.
    -->
    <div class="form-section active" v-if="currentView === 'tabs' && activeTab === 'login'">
      <h1 class="auth-title">Bienvenido de vuelta</h1>
      <p class="auth-subtitle">Ingresa tus credenciales para continuar</p>

      <!--
        @submit.prevent="handleLogin"
        → Al enviar el formulario, llama a handleLogin().
          El .prevent evita que la página se recargue (= e.preventDefault()).
      -->
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>Usuario o Correo</label>
          <!--
            v-model="loginForm.username"
            → Enlaza BIDIRECCIONAL: si el usuario escribe, loginForm.username cambia.
              Si loginForm.username cambia por código, el input se actualiza.
              En JS vanilla esto eran 2 líneas: addEventListener + value.
          -->
          <input type="text" v-model="loginForm.username" placeholder="tu@email.com o usuario" required>
        </div>
        <div class="input-group">
          <label>Contraseña</label>
          <input type="password" v-model="loginForm.password" placeholder="••••••••" required>
        </div>
        <div class="form-footer">
          <label class="checkbox-container">
            <input type="checkbox" v-model="loginForm.remember">
            <span class="checkmark"></span>
            Recordarme
          </label>
          <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
        </div>
        <!--
          :disabled="isLoading"
          → Deshabilita el botón mientras se hace la petición HTTP.
            En JS vanilla había que hacer: btn.disabled = true/false manualmente.
        -->
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Verificando...' : 'INGRESAR' }}
        </button>
      </form>

      <div class="divider"><span>o continúa con</span></div>
      <div class="social-login">
        <button @click="window.location.href='/api/auth/google'" class="btn-social">
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google">
          Google
        </button>
      </div>
    </div>


    <!-- ── SECCIÓN: REGISTER ─────────────────────────────────────────── -->
    <div class="form-section active" v-if="currentView === 'tabs' && activeTab === 'register'">
      <h1 class="auth-title">Crea tu cuenta</h1>
      <p class="auth-subtitle">Únete a la mayor comunidad automotriz</p>

      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label>Número de Cédula</label>
          <div class="input-with-button">
            <!--
              @input="onCedulaInput"
              → Cada vez que el usuario escribe en el campo, se llama onCedulaInput.
                Si llegó a 9 dígitos, busca automáticamente.
            -->
            <input
              type="text"
              v-model="registerForm.cedula"
              placeholder="9 dígitos sin guiones"
              maxlength="9"
              @input="onCedulaInput"
              required
            >
            <button type="button" class="btn-search" @click="lookupCedula('register')" :disabled="isSearching">
              {{ isSearching ? '...' : 'FIND' }}
            </button>
          </div>
        </div>

        <div class="row">
          <div class="input-group">
            <label>Nombre</label>
            <!--
              :readonly="cedulaVerified"
              → Si la cédula fue verificada, el campo nombre es de solo lectura.
                En JS vanilla: firstnameInput.readOnly = true;
            -->
            <input type="text" v-model="registerForm.firstName" placeholder="Nombre completo" :readonly="cedulaVerified">
          </div>
          <div class="input-group">
            <label>Apellidos</label>
            <input type="text" v-model="registerForm.lastName" placeholder="Apellidos" :readonly="cedulaVerified">
          </div>
        </div>

        <div class="input-group">
          <label>Usuario</label>
          <input type="text" v-model="registerForm.username" placeholder="Nombre de usuario" required>
        </div>
        <div class="input-group">
          <label>Número de Teléfono</label>
          <input type="tel" v-model="registerForm.phoneNumber" placeholder="+506 8888 8888" required>
        </div>
        <div class="input-group">
          <label>Correo Electrónico</label>
          <input type="email" v-model="registerForm.email" placeholder="correo@ejemplo.com" required>
        </div>
        <div class="input-group">
          <label>Contraseña</label>
          <input type="password" v-model="registerForm.password" placeholder="Mínimo 6 caracteres" required>
        </div>
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Creando cuenta...' : 'CREAR CUENTA' }}
        </button>
      </form>
    </div>


    <!-- ── SECCIÓN: 2FA ──────────────────────────────────────────────── -->
    <!--
      currentView === '2fa'
      → Vue cambia esta vista cuando el backend responde con require2FA: true.
        En JS vanilla se hacía:
          document.getElementById('2fa-section').style.display = 'block';
          document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        Aquí simplemente: currentView = '2fa' y Vue hace el resto.
    -->
    <div class="form-section active" v-if="currentView === '2fa'">
      <h1 class="auth-title">Verificación de Seguridad</h1>
      <p class="auth-subtitle">Ingresa el código de 6 dígitos enviado a tu celular</p>

      <form @submit.prevent="handle2FA">
        <div class="input-group">
          <label>Código de Seguridad</label>
          <input
            type="text"
            v-model="twoFACode"
            placeholder="123456"
            maxlength="6"
            :disabled="timerExpired"
            style="text-align: center; font-size: 24px; letter-spacing: 8px;"
            required
          >
        </div>

        <!--
          El timer es reactivo: cuando timerSeconds cambia (en el setInterval),
          Vue actualiza automáticamente este texto sin necesidad de:
            document.getElementById('2fa-timer').textContent = ...
        -->
        <div
          id="2fa-timer"
          style="text-align: center; margin: 16px 0; font-size: 18px; font-weight: bold;"
          :style="{ color: timerColor }"
        >
          ⏱ {{ timerDisplay }}
        </div>

        <button type="submit" class="btn-primary" :disabled="timerExpired || isLoading" id="2fa-submit-btn">
          VERIFICAR E INGRESAR
        </button>
      </form>
    </div>


    <!-- ── SECCIÓN: COMPLETAR PERFIL GOOGLE ─────────────────────────── -->
    <div class="form-section active" v-if="currentView === 'google-complete'">
      <h1 class="auth-title">Completar Perfil</h1>
      <p class="auth-subtitle">Necesitamos validar tu identidad para finalizar</p>

      <form @submit.prevent="handleGoogleComplete">
        <div class="input-group">
          <label>Número de Cédula</label>
          <div class="input-with-button">
            <input
              type="text"
              v-model="googleForm.cedula"
              placeholder="9 dígitos"
              maxlength="9"
              @input="onGoogleCedulaInput"
              required
            >
            <button type="button" class="btn-search" @click="lookupCedula('google')">FIND</button>
          </div>
        </div>
        <div class="row">
          <div class="input-group">
            <label>Nombre</label>
            <input type="text" v-model="googleForm.firstName" placeholder="Nombre" :readonly="googleCedulaVerified">
          </div>
          <div class="input-group">
            <label>Apellidos</label>
            <input type="text" v-model="googleForm.lastName" placeholder="Apellidos" :readonly="googleCedulaVerified">
          </div>
        </div>
        <div class="input-group">
          <label>Número de Teléfono</label>
          <input type="tel" v-model="googleForm.phoneNumber" placeholder="+506 8888 8888" required>
        </div>
        <button type="submit" class="btn-primary" :disabled="isLoading">FINALIZAR REGISTRO</button>
      </form>
    </div>


    <!-- ── ACCESO COMO INVITADO ──────────────────────────────────────── -->
    <div class="guest-access" v-if="currentView === 'tabs'">
      <p>¿Solo quieres explorar?
        <button @click="enterAsGuest" class="btn-link">Ingresar como invitado</button>
      </p>
    </div>

    <!-- ── MENSAJE DE ESTADO ─────────────────────────────────────────── -->
    <!--
      v-html="statusMessage"
      → Renderiza HTML dentro del div.
        statusMessage puede contener <span style="color:green">Éxito</span>
        y Vue lo insertará como HTML real (equivalente a innerHTML=).

      v-if="statusMessage"
      → Solo muestra el div si hay mensaje (no muestra div vacío).
    -->
    <div class="status-box" v-if="statusMessage" v-html="statusMessage"></div>
  </div>
</template>


<script>
/*
  ═══════════════════════════════════════════════════════════════════
  SECCIÓN SCRIPT  —  La lógica del componente
  ═══════════════════════════════════════════════════════════════════

  En Vue 3 con Options API (que es lo que usamos aquí por ser más
  fácil de leer), la lógica se divide en secciones claras:

  · data()     → Estado (variables) del componente
  · computed   → Valores derivados del estado (calculados automáticamente)
  · methods    → Funciones
  · mounted()  → Se ejecuta cuando el componente aparece en pantalla
*/
export default {
  name: 'AuthApp',

  // ──────────────────────────────────────────────────────────────
  // DATA: El "almacén" de variables reactivas
  // Cada vez que una variable aquí cambia, Vue actualiza el HTML.
  // ──────────────────────────────────────────────────────────────
  data() {
    return {
      // ¿Qué sección del formulario mostrar?
      // Valores posibles: 'tabs' | '2fa' | 'google-complete'
      currentView: 'tabs',
      activeTab: 'login',     // 'login' o 'register'

      // Formulario de login
      loginForm: {
        username: '',
        password: '',
        remember: true,
      },

      // Formulario de registro
      registerForm: {
        cedula: '',
        firstName: '',
        lastName: '',
        username: '',
        phoneNumber: '',
        email: '',
        password: '',
      },

      // Formulario de completar perfil Google
      googleForm: {
        cedula: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
      },

      // Estado del flujo 2FA
      twoFACode: '',
      twoFAUserId: null,
      timerSeconds: 300,     // 5 minutos = 300 segundos
      timerInterval: null,
      timerExpired: false,

      // Flags de estado UI
      isLoading: false,
      isSearching: false,
      cedulaVerified: false,
      googleCedulaVerified: false,
      statusMessage: '',
    };
  },

  // ──────────────────────────────────────────────────────────────
  // COMPUTED: Propiedades calculadas automáticamente
  // Vue las recalcula cada vez que cambia una variable de data().
  // En JS vanilla, habría que recalcular y actualizar el DOM manualmente.
  // ──────────────────────────────────────────────────────────────
  computed: {
    // Formatea los segundos del timer como "4:59"
    timerDisplay() {
      const m = Math.floor(this.timerSeconds / 60);
      const s = this.timerSeconds % 60;
      if (this.timerExpired) return 'Código expirado';
      return `${m}:${s.toString().padStart(2, '0')}`;
    },
    // Color del timer: azul si hay tiempo, rojo si queda poco
    timerColor() {
      return this.timerSeconds <= 60 ? '#ef4444' : '#3b82f6';
    },
  },

  // ──────────────────────────────────────────────────────────────
  // MOUNTED: Equivalente a DOMContentLoaded
  // Se ejecuta automáticamente cuando el componente ya está en pantalla.
  // ──────────────────────────────────────────────────────────────
  mounted() {
    // Revisar si venimos de Google OAuth (hay token en la URL)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const status = params.get('status');

    if (token) {
      localStorage.setItem('token', token);
      if (status === 'Pending') {
        // El usuario de Google necesita completar su perfil
        this.currentView = 'google-complete';
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  },

  // ──────────────────────────────────────────────────────────────
  // METHODS: Las funciones del componente
  // ──────────────────────────────────────────────────────────────
  methods: {
    // ── LOGIN ────────────────────────────────────────────────────
    async handleLogin() {
      this.isLoading = true;
      this.statusMessage = '<span style="color: gray;">Verificando credenciales...</span>';

      // Si tiene @, es email; sino, es username
      const loginData = this.loginForm.username.includes('@')
        ? { email: this.loginForm.username, password: this.loginForm.password }
        : { username: this.loginForm.username, password: this.loginForm.password };

      try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });
        const data = await res.json();

        if (res.ok) {
          if (data.require2FA) {
            // ── Cambiar a vista 2FA ──
            // En JS vanilla: document.getElementById('2fa-section').style.display = 'block'
            // Aquí: una sola variable cambia todo el DOM automáticamente
            this.twoFAUserId = data.userId;
            this.currentView = '2fa';
            this.statusMessage = '<span style="color: #4ade80;">Clave correcta. Ingresa el código SMS.</span>';
            this.startTimer();
          } else {
            localStorage.setItem('token', data.token);
            this.statusMessage = '<span style="color: var(--accent);">Sesion iniciada! Redirigiendo...</span>';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
          }
        } else {
          this.statusMessage = `<span style="color: #dc2626;">${data.message || 'Credenciales incorrectas.'}</span>`;
        }
      } catch {
        this.statusMessage = '<span style="color: #dc2626;">Error crítico de servidor.</span>';
      } finally {
        this.isLoading = false;
      }
    },

    // ── REGISTER ─────────────────────────────────────────────────
    async handleRegister() {
      this.isLoading = true;
      this.statusMessage = '<span style="color: gray;">Creando cuenta...</span>';
      try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.registerForm),
        });
        const data = await res.json();
        if (res.ok) {
          this.statusMessage = '<span style="color: var(--accent);">Registro exitoso! Ya puedes iniciar sesion.</span>';
          // Limpiar formulario — en Vue es trivial, solo resetear el objeto
          this.registerForm = { cedula: '', firstName: '', lastName: '', username: '', phoneNumber: '', email: '', password: '' };
          this.cedulaVerified = false;
          setTimeout(() => { this.activeTab = 'login'; }, 2000);
        } else {
          this.statusMessage = `<span style="color: #dc2626;">${data.message || 'Error'}</span>`;
        }
      } catch {
        this.statusMessage = '<span style="color: #dc2626;">Error en el servidor.</span>';
      } finally {
        this.isLoading = false;
      }
    },

    // ── 2FA ──────────────────────────────────────────────────────
    async handle2FA() {
      this.isLoading = true;
      this.statusMessage = '<span style="color: gray;">Verificando código...</span>';
      try {
        const res = await fetch('http://localhost:3000/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.twoFAUserId, code: this.twoFACode }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          clearInterval(this.timerInterval);
          this.statusMessage = '<span style="color: #4ade80;">Código verificado! Entrando...</span>';
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
          this.statusMessage = `<span style="color: #dc2626;">${data.message || 'Código incorrecto.'}</span>`;
        }
      } catch {
        this.statusMessage = '<span style="color: #dc2626;">Error en servidor.</span>';
      } finally {
        this.isLoading = false;
      }
    },

    // ── GOOGLE COMPLETE ──────────────────────────────────────────
    async handleGoogleComplete() {
      if (!this.googleForm.cedula) {
        this.statusMessage = '<span style="color: #dc2626;">Debes ingresar tu número de cédula.</span>';
        return;
      }
      this.isLoading = true;
      this.statusMessage = '<span style="color: gray;">Completando perfil...</span>';
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/api/auth/complete-google-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(this.googleForm),
        });
        const data = await res.json();
        if (res.ok) {
          this.statusMessage = '<span style="color: #4ade80;">Perfil completado! Entrando...</span>';
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
          this.statusMessage = `<span style="color: #dc2626;">${data.message || 'Error al completar perfil.'}</span>`;
        }
      } catch {
        this.statusMessage = '<span style="color: #dc2626;">Error de conexión con el servidor.</span>';
      } finally {
        this.isLoading = false;
      }
    },

    // ── CEDULA LOOKUP ─────────────────────────────────────────────
    // Reutilizable para registro y Google
    async lookupCedula(mode) {
      const cedula = mode === 'register'
        ? this.registerForm.cedula.replace(/\D/g, '')
        : this.googleForm.cedula.replace(/\D/g, '');

      if (cedula.length < 5) {
        alert('Por favor ingresa un número de cédula válido.');
        return;
      }

      this.isSearching = true;
      const loadingMsg = 'Buscando...';
      if (mode === 'register') {
        this.registerForm.firstName = loadingMsg;
        this.registerForm.lastName = loadingMsg;
      } else {
        this.googleForm.firstName = loadingMsg;
        this.googleForm.lastName = loadingMsg;
      }

      try {
        const res = await fetch(`http://localhost:3000/api/cedula/validate/${cedula}`);
        const data = await res.json();

        if (res.ok) {
          if (mode === 'register') {
            this.registerForm.firstName = data.nombre;
            this.registerForm.lastName = `${data.primerApellido} ${data.segundoApellido}`;
            this.cedulaVerified = true;
          } else {
            this.googleForm.firstName = data.nombre;
            this.googleForm.lastName = `${data.primerApellido} ${data.segundoApellido}`;
            this.googleCedulaVerified = true;
          }
          this.statusMessage = '<span style="color: #4ade80;">Cédula verificada con éxito.</span>';
        } else {
          if (mode === 'register') {
            this.registerForm.firstName = '';
            this.registerForm.lastName = '';
            this.cedulaVerified = false;
          } else {
            this.googleForm.firstName = '';
            this.googleForm.lastName = '';
            this.googleCedulaVerified = false;
          }
          this.statusMessage = `<span style="color: #fbbf24;">${data.message || 'Cédula no encontrada.'} Por favor, ingresa tus datos manualmente.</span>`;
        }
      } catch {
        this.statusMessage = '<span style="color: #ef4444;">Error consultando la base de datos local.</span>';
      } finally {
        this.isSearching = false;
      }
    },

    // Auto-busca cuando se llegan a 9 dígitos en registro
    onCedulaInput() {
      const digits = this.registerForm.cedula.replace(/\D/g, '');
      if (digits.length === 9) this.lookupCedula('register');
    },

    onGoogleCedulaInput() {
      const digits = this.googleForm.cedula.replace(/\D/g, '');
      if (digits.length === 9) this.lookupCedula('google');
    },

    // ── TIMER 2FA ─────────────────────────────────────────────────
    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerSeconds = 300;
      this.timerExpired = false;

      this.timerInterval = setInterval(() => {
        this.timerSeconds--;
        // Vue detecta que timerSeconds cambió → actualiza timerDisplay y timerColor automáticamente
        if (this.timerSeconds <= 0) {
          clearInterval(this.timerInterval);
          this.timerExpired = true;
          this.statusMessage = '<span style="color: #dc2626;">El código ha expirado. Inicia sesión de nuevo.</span>';
        }
      }, 1000);
    },

    // ── GUEST ─────────────────────────────────────────────────────
    enterAsGuest() {
      localStorage.removeItem('token');
      window.location.href = 'dashboard.html';
    },
  },
};
</script>
