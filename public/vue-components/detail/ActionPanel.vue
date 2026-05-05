<template>
  <div>
    <!-- OWNER ACTIONS: Marcar como vendido -->
    <div v-if="isOwner" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #eee;">
      <button class="btn-primary" @click="markAsSold"
        style="width: 100%; padding: 16px; font-size: 16px; background: #EF4444;">
        Marcar como Vendido
      </button>
      <p style="text-align: center; margin-top: 10px; color: #888; font-size: 13px;">
        Una vez vendido, el estado no se puede revertir
      </p>
    </div>

    <!-- BUYER ACTIONS: Contactar vendedor -->
    <div v-if="isBuyer" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #eee;">
      <button class="btn-primary" @click="contactSeller"
        style="width: 100%; padding: 16px; font-size: 16px;">
        Enviar Mensaje al Vendedor
      </button>
      <p style="text-align: center; margin-top: 10px; color: #888; font-size: 13px;">Se abrira un chat privado con el vendedor</p>
    </div>

    <!-- GUEST ACTIONS: Solicitud de Login -->
    <div v-if="isGuest" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #888; margin-bottom: 14px; font-size: 15px;">Inicia sesion para contactar al vendedor.</p>
      <button class="btn-secondary" @click="goTo('/')"
        style="width: 100%; padding: 14px; font-size: 15px;">
        Iniciar Sesion / Registrarse
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionPanel',
  props: ['vehicle', 'token', 'currentUserId'],
  emits: ['update-status'],
  computed: {
    isOwner() {
      if (!this.vehicle || !this.token || !this.currentUserId) return false;
      return this.currentUserId === this.vehicle.ownerId._id.toString()
        && this.vehicle.status === 'available';
    },
    isBuyer() {
      if (!this.vehicle || !this.token || !this.currentUserId) return false;
      return this.currentUserId !== this.vehicle.ownerId._id.toString()
        && this.vehicle.status === 'available';
    },
    isGuest() {
      return !this.token && this.vehicle && this.vehicle.status === 'available';
    }
  },
  methods: {
    goTo(url) { window.location.href = url; },
    async markAsSold() {
      if (!confirm('Seguro que quieres marcar este vehiculo como vendido? No se puede revertir.')) return;
      try {
        const res = await fetch(`http://localhost:3000/api/vehicles/${this.vehicle._id}/sold`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${this.token}` },
        });
        const data = await res.json();
        if (res.ok) {
          alert('Vehiculo marcado como vendido!');
          this.$emit('update-status', 'sold');
        } else {
          alert(data.message || 'Error al marcar como vendido');
        }
      } catch {
        alert('Error de conexion');
      }
    },
    async contactSeller() {
      try {
        const res = await fetch(`http://localhost:3000/api/chat/vehicle/${this.vehicle._id}`, {
          headers: { 'Authorization': `Bearer ${this.token}` },
        });
        const conversation = await res.json();
        if (res.ok) {
          window.location.href = `mensajes.html?chat=${conversation._id}`;
        } else {
          alert(conversation.message || 'Error al iniciar conversacion');
        }
      } catch {
        alert('Error de conexion');
      }
    }
  }
}
</script>
