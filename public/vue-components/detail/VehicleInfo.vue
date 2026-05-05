<template>
  <div>
    <div class="detail-image" :style="imageStyle"></div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
      <h1 class="detail-title">{{ vehicle.brand }} {{ vehicle.model }}</h1>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="detail-price">₡{{ vehicle.price.toLocaleString('es-CR') }}</div>
        <button class="icon-btn" @click="shareVehicle" title="Compartir Vehiculo"
          style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px;">
          <!-- SVG Copiado temporalmente del original -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="detail-tags">
      <span class="detail-tag">Año: {{ vehicle.year }}</span>
      <span class="detail-tag status" :style="statusStyle">{{ statusLabel }}</span>
      <span class="detail-tag">Vendedor: {{ vehicle.ownerId.username }}</span>
    </div>

    <h3 style="margin: 24px 0 12px; color: #222; font-size: 20px;">Descripcion</h3>
    <p style="color: #555; line-height: 1.8; font-size: 16px;">
      {{ vehicle.description || 'Sin descripcion detallada.' }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'VehicleInfo',
  props: ['vehicle'],
  computed: {
    imageStyle() {
      if (!this.vehicle) return {};
      const url = this.vehicle.image
        ? `http://localhost:3000${this.vehicle.image}`
        : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';
      return { backgroundImage: `url('${url}')` };
    },
    statusLabel() {
      return this.vehicle?.status === 'sold' ? 'Vendido' : 'Disponible';
    },
    statusStyle() {
      if (this.vehicle?.status === 'sold') {
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        };
      }
      return {};
    }
  },
  methods: {
    async shareVehicle() {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles!');
      } catch {
        alert('No se pudo copiar el enlace automáticamente.');
      }
    }
  }
}
</script>
