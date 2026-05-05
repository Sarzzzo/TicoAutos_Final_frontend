<template>
  <div>
    <!-- NAVBAR -->
    <nav class="navbar">
      <a href="dashboard.html" class="back-arrow" title="Volver al catálogo"
         style="color: #fff; text-decoration: none; font-size: 22px; margin-right: 10px; opacity: 0.7; transition: opacity 0.2s;"
         onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">←</a>
      <a href="dashboard.html" class="navbar-logo">
        <img src="/assets/img/ImageProy.png" alt="Logo TicoAutos" class="logo-img">
      </a>
      <div class="navbar-center">
        <span class="navbar-link" @click="goTo('dashboard.html')">Volver al Catalogo</span>
        <span v-if="token" class="navbar-link" @click="goTo('publicar.html')">Publicar</span>
      </div>
      <div class="navbar-right">
        <div v-if="token" style="display: flex; align-items: center; gap: 16px;">
          <button class="icon-btn" @click="goTo('mensajes.html')" title="Mensajes">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <div class="user-avatar" @click="logout" title="Cerrar Sesion">U</div>
        </div>
        <div v-else style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-primary" @click="goTo('/')">Iniciar Sesion</button>
        </div>
      </div>
    </nav>

    <!-- LOADING / ERROR -->
    <div v-if="isLoading" style="text-align: center; margin-top: 100px; font-size: 20px; color: #888;">
      Cargando vehiculo...
    </div>
    <div v-else-if="error" style="text-align: center; margin-top: 100px; color: #ef4444;">
      {{ error }}
    </div>

    <!-- MAIN CONTENT -->
    <div class="detail-container" v-else-if="vehicle">
      <div class="detail-card">
        
        <VehicleInfo 
          :vehicle="vehicle" 
        />

        <ActionPanel 
          :vehicle="vehicle"
          :token="token"
          :currentUserId="currentUserId"
          @update-status="updateVehicleStatus"
        />

      </div>
    </div>
  </div>
</template>

<script>
import VehicleInfo from './VehicleInfo.vue';
import ActionPanel from './ActionPanel.vue';

export default {
  name: 'DetailMain',
  components: {
    VehicleInfo,
    ActionPanel
  },
  data() {
    return {
      vehicle: null,
      currentUserId: null,
      token: null,
      isLoading: true,
      error: null
    };
  },
  async mounted() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        this.currentUserId = payload.user.id;
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');

    if (!vehicleId) {
      this.error = 'Vehículo no especificado.';
      this.isLoading = false;
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}`);
      const data = await res.json();
      if (res.ok) {
        this.vehicle = data;
      } else {
        this.error = data.message || 'Error al cargar el vehiculo';
      }
    } catch {
      this.error = 'Error de conexion al cargar el vehiculo.';
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    goTo(url) { window.location.href = url; },
    logout() {
      localStorage.removeItem('token');
      window.location.href = '/';
    },
    updateVehicleStatus(status) {
      if (this.vehicle) {
        this.vehicle.status = status;
      }
    }
  }
}
</script>
