<template>
  <div class="form-section active">
    <h1 class="auth-title">Verificación de Seguridad</h1>
    <p class="auth-subtitle">Ingresa el código de 6 dígitos enviado a tu celular</p>

    <form @submit.prevent="handle2FA">
      <div class="input-group">
        <label>Código de Seguridad</label>
        <input type="text" v-model="code" placeholder="123456" maxlength="6" :disabled="timerExpired" style="text-align: center; font-size: 24px; letter-spacing: 8px;" required>
      </div>

      <div style="text-align: center; margin: 16px 0; font-size: 18px; font-weight: bold;" :style="{ color: timerColor }">
        ⏱ {{ timerDisplay }}
      </div>

      <button type="submit" class="btn-primary" :disabled="timerExpired || isLoading">
        VERIFICAR E INGRESAR
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'TwoFactorForm',
  props: ['userId', 'isLoading'],
  emits: ['set-loading', 'set-status', 'verify-success'],
  data() {
    return {
      code: '',
      timerSeconds: 300, // 5 min
      timerInterval: null,
      timerExpired: false
    }
  },
  computed: {
    timerDisplay() {
      if (this.timerExpired) return 'Código expirado';
      const m = Math.floor(this.timerSeconds / 60);
      const s = this.timerSeconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    },
    timerColor() {
      return this.timerSeconds <= 60 ? '#ef4444' : '#3b82f6';
    }
  },
  mounted() {
    this.startTimer();
  },
  unmounted() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  },
  methods: {
    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerSeconds = 300;
      this.timerExpired = false;

      this.timerInterval = setInterval(() => {
        this.timerSeconds--;
        if (this.timerSeconds <= 0) {
          clearInterval(this.timerInterval);
          this.timerExpired = true;
          this.$emit('set-status', '<span style="color: #dc2626;">El código ha expirado.</span>');
        }
      }, 1000);
    },
    async handle2FA() {
      this.$emit('set-loading', true);
      this.$emit('set-status', '<span style="color: gray;">Verificando código...</span>');
      try {
        const res = await fetch('http://localhost:3000/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, code: this.code }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          clearInterval(this.timerInterval);
          this.$emit('set-status', '<span style="color: #4ade80;">Código verificado! Entrando...</span>');
          this.$emit('verify-success');
          
        } else {
          this.$emit('set-status', `<span style="color: #dc2626;">${data.message || 'Código incorrecto.'}</span>`);
        }
      } catch {
        this.$emit('set-status', '<span style="color: #dc2626;">Error en servidor.</span>');
      } finally {
        this.$emit('set-loading', false);
      }
    }
  }
}
</script>
