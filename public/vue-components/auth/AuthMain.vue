<template>
  <div class="auth-card">
    <!-- Pestañas (visibles solo cuando currentView es 'tabs') -->
    <div class="auth-tabs" v-if="currentView === 'tabs'">
      <button class="tab-btn" :class="{ active: activeTab === 'login' }" @click="activeTab = 'login'">Ingresar</button>
      <button class="tab-btn" :class="{ active: activeTab === 'register' }" @click="activeTab = 'register'">Crear Cuenta</button>
    </div>

    <!-- Login Form -->
    <LoginForm 
      v-if="currentView === 'tabs' && activeTab === 'login'"
      :isLoading="isLoading"
      @set-loading="setLoading"
      @set-status="setStatus"
      @require-2fa="handleRequire2FA"
      @login-success="handleSuccess"
    />

    <!-- Register Form -->
    <RegisterForm 
      v-if="currentView === 'tabs' && activeTab === 'register'"
      :isLoading="isLoading"
      @set-loading="setLoading"
      @set-status="setStatus"
      @switch-tab="activeTab = 'login'"
    />

    <!-- 2FA Form -->
    <TwoFactorForm
      v-if="currentView === '2fa'"
      :userId="twoFAUserId"
      :isLoading="isLoading"
      @set-loading="setLoading"
      @set-status="setStatus"
      @verify-success="handleSuccess"
    />

    <!-- Google Complete Form -->
    <GoogleCompleteForm
      v-if="currentView === 'google-complete'"
      :isLoading="isLoading"
      @set-loading="setLoading"
      @set-status="setStatus"
      @complete-success="handleSuccess"
    />

    <!-- Invitado -->
    <div class="guest-access" v-if="currentView === 'tabs'">
      <p>¿Solo quieres explorar? 
        <button @click="enterAsGuest" class="btn-link">Ingresar como invitado</button>
      </p>
    </div>

    <!-- Mensaje de estado -->
    <div class="status-box" v-if="statusMessage" v-html="statusMessage"></div>
  </div>
</template>

<script>
// Imporamos los subcomponentes. Envue3-sfc-loader esto se resuelve en tiempo de ejecución.
import LoginForm from './LoginForm.vue';
import RegisterForm from './RegisterForm.vue';
import TwoFactorForm from './TwoFactorForm.vue';
import GoogleCompleteForm from './GoogleCompleteForm.vue';

export default {
  name: 'AuthMain',
  components: {
    LoginForm,
    RegisterForm,
    TwoFactorForm,
    GoogleCompleteForm
  },
  data() {
    return {
      currentView: 'tabs',
      activeTab: 'login',
      statusMessage: '',
      isLoading: false,
      twoFAUserId: null,
    };
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const status = params.get('status');

    if (token) {
      localStorage.setItem('token', token);
      if (status === 'Pending') {
        this.currentView = 'google-complete';
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  },
  methods: {
    setLoading(value) {
      this.isLoading = value;
    },
    setStatus(htmlMessage) {
      this.statusMessage = htmlMessage;
    },
    handleRequire2FA(userId) {
      this.twoFAUserId = userId;
      this.currentView = '2fa';
    },
    handleSuccess() {
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    },
    enterAsGuest() {
      localStorage.removeItem('token');
      window.location.href = 'dashboard.html';
    }
  }
}
</script>
