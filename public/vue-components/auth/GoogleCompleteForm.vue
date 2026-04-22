<template>
  <div class="form-section active">
    <h1 class="auth-title">Completar Perfil</h1>
    <p class="auth-subtitle">Necesitamos validar tu identidad para finalizar</p>

    <form @submit.prevent="handleComplete">
      <div class="input-group">
        <label>Número de Cédula</label>
        <div class="input-with-button">
          <input type="text" v-model="form.cedula" placeholder="9 dígitos" maxlength="9" @input="onCedulaInput" required>
          <button type="button" class="btn-search" @click="lookupCedula">FIND</button>
        </div>
      </div>
      <div class="row">
        <div class="input-group">
          <label>Nombre</label>
          <input type="text" v-model="form.firstName" placeholder="Nombre" :readonly="cedulaVerified">
        </div>
        <div class="input-group">
          <label>Apellidos</label>
          <input type="text" v-model="form.lastName" placeholder="Apellidos" :readonly="cedulaVerified">
        </div>
      </div>
      <div class="input-group">
        <label>Número de Teléfono</label>
        <input type="tel" v-model="form.phoneNumber" placeholder="+506 8888 8888" required>
      </div>
      <button type="submit" class="btn-primary" :disabled="isLoading">FINALIZAR REGISTRO</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'GoogleCompleteForm',
  props: ['isLoading'],
  emits: ['set-loading', 'set-status', 'complete-success'],
  data() {
    return {
      form: { cedula: '', firstName: '', lastName: '', phoneNumber: '' },
      cedulaVerified: false
    }
  },
  methods: {
    async lookupCedula() {
      const cedula = this.form.cedula.replace(/\D/g, '');
      if (cedula.length < 5) return alert('Por favor ingresa un número de cédula válido.');

      this.form.firstName = 'Buscando...';
      this.form.lastName = 'Buscando...';

      try {
        const res = await fetch(`http://localhost:3000/api/cedula/validate/${cedula}`);
        const data = await res.json();

        if (res.ok) {
          this.form.firstName = data.nombre;
          this.form.lastName = `${data.primerApellido} ${data.segundoApellido}`;
          this.cedulaVerified = true;
          this.$emit('set-status', '<span style="color: #4ade80;">Cédula verificada con éxito.</span>');
        } else {
          this.form.firstName = '';
          this.form.lastName = '';
          this.cedulaVerified = false;
          this.$emit('set-status', `<span style="color: #fbbf24;">${data.message || 'Cédula no encontrada.'}</span>`);
        }
      } catch {
        this.$emit('set-status', '<span style="color: #ef4444;">Error consultando la base de datos local.</span>');
      }
    },
    onCedulaInput() {
      if (this.form.cedula.replace(/\D/g, '').length === 9) this.lookupCedula();
    },
    async handleComplete() {
      if (!this.form.cedula) {
        this.$emit('set-status', '<span style="color: #dc2626;">Debes ingresar tu número de cédula.</span>');
        return;
      }
      this.$emit('set-loading', true);
      this.$emit('set-status', '<span style="color: gray;">Completando perfil...</span>');
      
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/api/auth/complete-google-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(this.form),
        });
        const data = await res.json();
        if (res.ok) {
          this.$emit('set-status', '<span style="color: #4ade80;">Perfil completado! Entrando...</span>');
          this.$emit('complete-success');
        } else {
          this.$emit('set-status', `<span style="color: #dc2626;">${data.message || 'Error al completar perfil.'}</span>`);
        }
      } catch {
        this.$emit('set-status', '<span style="color: #dc2626;">Error de conexión con el servidor.</span>');
      } finally {
        this.$emit('set-loading', false);
      }
    }
  }
}
</script>
