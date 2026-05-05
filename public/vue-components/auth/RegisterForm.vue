<template>
  <div class="form-section active">
    <h1 class="auth-title">Crea tu cuenta</h1>
    <p class="auth-subtitle">Únete a la mayor comunidad automotriz</p>

    <form @submit.prevent="handleRegister">
      <div class="input-group">
        <label>Número de Cédula</label>
        <div class="input-with-button">
          <input type="text" v-model="form.cedula" placeholder="9 dígitos sin guiones" maxlength="9" @input="onCedulaInput" required>
          <button type="button" class="btn-search" @click="lookupCedula" :disabled="isSearching">
            {{ isSearching ? '...' : 'FIND' }}
          </button>
        </div>
      </div>

      <div class="row">
        <div class="input-group">
          <label>Nombre</label>
          <input type="text" v-model="form.firstName" placeholder="Nombre completo" :readonly="cedulaVerified">
        </div>
        <div class="input-group">
          <label>Apellidos</label>
          <input type="text" v-model="form.lastName" placeholder="Apellidos" :readonly="cedulaVerified">
        </div>
      </div>

      <div class="input-group">
        <label>Usuario</label>
        <input type="text" v-model="form.username" placeholder="Nombre de usuario" required>
      </div>
      <div class="input-group">
        <label>Número de Teléfono</label>
        <input type="tel" v-model="form.phoneNumber" placeholder="+506 8888 8888" required>
      </div>
      <div class="input-group">
        <label>Correo Electrónico</label>
        <input type="email" v-model="form.email" placeholder="correo@ejemplo.com" required>
      </div>
      <div class="input-group">
        <label>Contraseña</label>
        <input type="password" v-model="form.password" placeholder="Mínimo 6 caracteres" required>
      </div>
      <button type="submit" class="btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Creando cuenta...' : 'CREAR CUENTA' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'RegisterForm',
  props: ['isLoading'],
  emits: ['set-loading', 'set-status', 'switch-tab'],
  data() {
    return {
      form: { cedula: '', firstName: '', lastName: '', username: '', phoneNumber: '', email: '', password: '' },
      isSearching: false,
      cedulaVerified: false
    }
  },
  methods: {
    async lookupCedula() {
      const cedula = this.form.cedula.replace(/\D/g, '');
      if (cedula.length < 5) return alert('Número de cédula inválido.');

      this.isSearching = true;
      this.form.firstName = 'Buscando...';
      this.form.lastName = 'Buscando...';

      try {
        const res = await fetch(`http://localhost:3000/api/cedula/validate/${cedula}`);
        const data = await res.json();
        if (res.ok) {
          this.form.firstName = data.nombre;
          this.form.lastName = `${data.primerApellido} ${data.segundoApellido}`;
          this.cedulaVerified = true;
          this.$emit('set-status', '<span style="color: #4ade80;">Cédula verificada.</span>');
        } else {
          this.form.firstName = '';
          this.form.lastName = '';
          this.cedulaVerified = false;
          this.$emit('set-status', `<span style="color: #fbbf24;">${data.message || 'Cédula no encontrada.'}</span>`);
        }
      } catch {
        this.$emit('set-status', '<span style="color: #ef4444;">Error intern.</span>');
      } finally {
        this.isSearching = false;
      }
    },
    onCedulaInput() {
      if (this.form.cedula.replace(/\D/g, '').length === 9) this.lookupCedula();
    },
    async handleRegister() {
      this.$emit('set-loading', true);
      this.$emit('set-status', '<span style="color: gray;">Creando cuenta...</span>');
      try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        });
        const data = await res.json();
        if (res.ok) {
          this.$emit('set-status', '<span style="color: var(--accent);">Registro exitoso! Ya puedes iniciar sesion.</span>');
          setTimeout(() => { this.$emit('switch-tab'); }, 2000);
        } else {
          this.$emit('set-status', `<span style="color: #dc2626;">${data.message || 'Error'}</span>`);
        }
      } catch {
        this.$emit('set-status', '<span style="color: #dc2626;">Error en el servidor.</span>');
      } finally {
        this.$emit('set-loading', false);
      }
    }
  }
}
</script>
