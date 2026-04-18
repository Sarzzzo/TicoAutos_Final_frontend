<template>
  <div class="form-section active">
    <h1 class="auth-title">Bienvenido de vuelta</h1>
    <p class="auth-subtitle">Ingresa tus credenciales para continuar</p>

    <form @submit.prevent="handleLogin">
      <div class="input-group">
        <label>Usuario o Correo</label>
        <input type="text" v-model="form.username" placeholder="tu@email.com o usuario" required>
      </div>
      <div class="input-group">
        <label>Contraseña</label>
        <input type="password" v-model="form.password" placeholder="••••••••" required>
      </div>
      <div class="form-footer">
        <label class="checkbox-container">
          <input type="checkbox" v-model="form.remember">
          <span class="checkmark"></span>
          Recordarme
        </label>
        <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
      </div>
      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Verificando...' : 'INGRESAR' }}
      </button>
    </form>

    <div class="divider"><span>o continúa con</span></div>
    <div class="social-login">
      <button @click="goTo('/api/auth/google')" class="btn-social">
        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google">
        Google
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginForm',
  props: ['isLoading'],
  emits: ['set-loading', 'set-status', 'require-2fa', 'login-success'],
  data() {
    return {
      form: { username: '', password: '', remember: true }
    }
  },
  methods: {
    goTo(url) { window.location.href = url; },
    async handleLogin() {
      this.$emit('set-loading', true);
      this.$emit('set-status', '<span style="color: gray;">Verificando credenciales...</span>');

      const loginData = this.form.username.includes('@')
        ? { email: this.form.username, password: this.form.password }
        : { username: this.form.username, password: this.form.password };

      try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });
        const data = await res.json();

        if (res.ok) {
          if (data.require2FA) {
            this.$emit('set-status', '<span style="color: #4ade80;">Clave correcta. Ingresa el código SMS.</span>');
            this.$emit('require-2fa', data.userId);
          } else {
            localStorage.setItem('token', data.token);
            this.$emit('set-status', '<span style="color: var(--accent);">Sesion iniciada! Redirigiendo...</span>');
            this.$emit('login-success');
          }
        } else {
          this.$emit('set-status', `<span style="color: #dc2626;">${data.message || 'Credenciales incorrectas.'}</span>`);
        }
      } catch {
        this.$emit('set-status', '<span style="color: #dc2626;">Error crítico de servidor.</span>');
      } finally {
        this.$emit('set-loading', false);
      }
    }
  }
}
</script>
