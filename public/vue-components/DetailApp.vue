<!--
  ╔══════════════════════════════════════════════════════════════════╗
  ║  DetailApp.vue  —  TicoAutos | Detalle del Vehículo            ║
  ╚══════════════════════════════════════════════════════════════════╝

  PROPÓSITO:
  Reemplaza detail.js. El código original tenía el problema de que
  mezclaba: fetch HTTP + lógica de roles (¿soy dueño? ¿soy comprador?)
  + manipulación del DOM (show/hide de secciones) en un solo blob de código.

  Con Vue, cada responsabilidad está separada en secciones:
  · data()    → qué datos tengo
  · computed  → qué rol tengo (owner/buyer/guest)
  · methods   → qué puedo hacer
  · template  → cómo se ve según el rol (v-if por sección)

  CONCEPTOS VUE CLAVE AQUÍ:
  ─────────────────────────────
  · computed   → "isOwner", "isBuyer", "isGuest" se calculan solos
  · v-if       → Cada sección de acciones aparece según el rol
  · :style     → La imagen de fondo se aplica reactivamente
  · :class     → El tag de estado cambia de color según vehicle.status
-->

<template>
  <div>
    <!-- NAVBAR (igual que el original, sin cambios) -->
    <nav class="navbar">
      <a href="dashboard.html" class="back-arrow" title="Volver al catálogo"
         style="color: #fff; text-decoration: none; font-size: 22px; margin-right: 10px; opacity: 0.7; transition: opacity 0.2s;"
         onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">←</a>
      <a href="dashboard.html" class="navbar-logo">
        <img src="./assets/img/ImageProy.png" alt="Logo TicoAutos" class="logo-img">
      </a>
      <div class="navbar-center">
        <span class="navbar-link" @click="$router ? $router.push('/dashboard') : window.location.href='dashboard.html'">Volver al Catalogo</span>
        <span v-if="token" class="navbar-link" @click="window.location.href='publicar.html'">Publicar</span>
      </div>
      <div class="navbar-right">
        <div v-if="token" style="display: flex; align-items: center; gap: 16px;">
          <button class="icon-btn" @click="window.location.href='mensajes.html'" title="Mensajes">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <div class="user-avatar" @click="logout" title="Cerrar Sesion">U</div>
        </div>
        <div v-else style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-primary" @click="window.location.href='/'">Iniciar Sesion</button>
        </div>
      </div>
    </nav>

    <!-- ESTADO: CARGANDO -->
    <!--
      v-if="isLoading"  →  Muestra el spinner mientras se hace el fetch.
      En JS vanilla:
        document.getElementById('loading').style.display = 'none';
        document.getElementById('vehicle-container').style.display = 'block';
      Aquí: simplemente isLoading = false y Vue actualiza todo.
    -->
    <div v-if="isLoading" style="text-align: center; margin-top: 100px; font-size: 20px; color: #888;">
      Cargando vehiculo...
    </div>

    <!-- ESTADO: ERROR -->
    <div v-else-if="error" style="text-align: center; margin-top: 100px; color: #ef4444;">
      {{ error }}
    </div>

    <!-- ESTADO: VEHÍCULO CARGADO -->
    <div class="detail-container" v-else-if="vehicle">
      <div class="detail-card">

        <!-- IMAGEN DEL VEHÍCULO -->
        <!--
          :style="imageStyle"  →  imageStyle es una propiedad computed.
          Vue re-aplica el estilo automáticamente cuando vehicle cambia.
          En JS vanilla: detailImg.style.backgroundImage = `url(...)`;
        -->
        <div class="detail-image" :style="imageStyle"></div>

        <!-- TÍTULO Y PRECIO -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
          <h1 class="detail-title">{{ vehicle.brand }} {{ vehicle.model }}</h1>
          <div style="display: flex; align-items: center; gap: 16px;">
            <!--
              .toLocaleString() formatea el precio con separadores de miles.
              "₡" es el símbolo del Colón costarricense.
            -->
            <div class="detail-price">₡{{ vehicle.price.toLocaleString('es-CR') }}</div>
            <button class="icon-btn" @click="shareVehicle" title="Compartir Vehiculo"
              style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- TAGS: AÑO, ESTADO, VENDEDOR -->
        <div class="detail-tags">
          <span class="detail-tag">Año: {{ vehicle.year }}</span>
          <!--
            :class="statusClass"  →  Computed que devuelve el objeto de clases CSS
                                     según el status del vehículo.
            En JS vanilla (lines 43-50 del detail.js original):
              if (vehicle.status === 'sold') {
                statusTag.style.background = 'rgba(239, 68, 68, 0.1)';
                statusTag.style.color = '#ef4444';
                ...
              }
          -->
          <span class="detail-tag status" :style="statusStyle">{{ statusLabel }}</span>
          <span class="detail-tag">Vendedor: {{ vehicle.ownerId.username }}</span>
        </div>

        <!-- DESCRIPCIÓN -->
        <h3 style="margin: 24px 0 12px; color: #222; font-size: 20px;">Descripcion</h3>
        <p style="color: #555; line-height: 1.8; font-size: 16px;">
          {{ vehicle.description || 'Sin descripcion detallada.' }}
        </p>

        <!-- ── SECCIÓN DUEÑO: Marcar como vendido ─────────────────── -->
        <!--
          v-if="isOwner"  →  Esta sección SOLO aparece si soy el dueño del vehículo
                              y el vehículo está disponible.

          isOwner es una propiedad computed que calcula:
            token && currentUserId && currentUserId === vehicle.ownerId._id && vehicle.status === 'available'

          En JS vanilla (detail.js lines 66-91):
            if (token && currentUserId && currentUserId === ownerId && vehicle.status === 'available') {
              document.getElementById('owner-section').style.display = 'block';
              ...addEventListener...
            }

          Con Vue:
            1. No hay getElementById.
            2. No hay addEventListener manual.
            3. La condición está en el template, visible para todos.
        -->
        <div v-if="isOwner" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #eee;">
          <button class="btn-primary" @click="markAsSold"
            style="width: 100%; padding: 16px; font-size: 16px; background: #EF4444;">
            Marcar como Vendido
          </button>
          <p style="text-align: center; margin-top: 10px; color: #888; font-size: 13px;">
            Una vez vendido, el estado no se puede revertir
          </p>
        </div>

        <!-- ── SECCIÓN COMPRADOR: Enviar mensaje ──────────────────── -->
        <!--
          v-if="isBuyer"  →  Solo aparece si soy un usuario logueado que NO es el dueño
                              y el vehículo está disponible.
        -->
        <div v-if="isBuyer" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #eee;">
          <button class="btn-primary" @click="contactSeller"
            style="width: 100%; padding: 16px; font-size: 16px;">
            Enviar Mensaje al Vendedor
          </button>
          <p style="text-align: center; margin-top: 10px; color: #888; font-size: 13px;">Se abrira un chat privado con el vendedor</p>
        </div>

        <!-- ── SECCIÓN INVITADO: Prompt de login ──────────────────── -->
        <!--
          v-if="isGuest"  →  Solo aparece si no hay token (no autenticado)
                              y el vehículo está disponible.
        -->
        <div v-if="isGuest" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #888; margin-bottom: 14px; font-size: 15px;">Inicia sesion para contactar al vendedor.</p>
          <button class="btn-secondary" @click="window.location.href='/'"
            style="width: 100%; padding: 14px; font-size: 15px;">
            Iniciar Sesion / Registrarse
          </button>
        </div>

      </div>
    </div>
  </div>
</template>


<script>
export default {
  name: 'DetailApp',

  data() {
    return {
      vehicle: null,        // El objeto del vehículo cargado desde la API
      currentUserId: null,  // ID del usuario logueado
      token: null,          // JWT Token
      isLoading: true,
      error: null,
      shareLabel: null,     // Texto del botón compartir ('Copiado!' o null)
    };
  },

  // ──────────────────────────────────────────────────────────────
  // COMPUTED: Lógica de roles y estilos calculada automáticamente
  // ──────────────────────────────────────────────────────────────
  computed: {
    /*
      isOwner: ¿Soy el dueño de este vehículo?
      Se calcula AUTOMÁTICAMENTE cuando vehicle o currentUserId cambia.

      Equivalente JS vanilla:
        if (token && currentUserId && currentUserId === ownerId && vehicle.status === 'available') { ... }
      
      La diferencia: en Vue esto se evalúa reactivamente y el template
      responde. No hay que llamar a ninguna función manualmente.
    */
    isOwner() {
      if (!this.vehicle || !this.token || !this.currentUserId) return false;
      return this.currentUserId === this.vehicle.ownerId._id.toString()
        && this.vehicle.status === 'available';
    },

    // ¿Soy un comprador? (logueado, no es mi vehículo, está disponible)
    isBuyer() {
      if (!this.vehicle || !this.token || !this.currentUserId) return false;
      return this.currentUserId !== this.vehicle.ownerId._id.toString()
        && this.vehicle.status === 'available';
    },

    // ¿Soy un invitado? (no estoy logueado, vehículo disponible)
    isGuest() {
      return !this.token && this.vehicle && this.vehicle.status === 'available';
    },

    // Estilo de la imagen de fondo (computed porque depende de vehicle)
    imageStyle() {
      if (!this.vehicle) return {};
      const url = this.vehicle.image
        ? `http://localhost:3000${this.vehicle.image}`
        : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';
      return { backgroundImage: `url('${url}')` };
    },

    // Texto del tag de estado
    statusLabel() {
      return this.vehicle?.status === 'sold' ? 'Vendido' : 'Disponible';
    },

    // Estilo del tag de estado (rojo si vendido, normal si disponible)
    statusStyle() {
      if (this.vehicle?.status === 'sold') {
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        };
      }
      return {};
    },
  },

  // ──────────────────────────────────────────────────────────────
  // mounted(): Corre cuando el componente está listo en pantalla
  // ──────────────────────────────────────────────────────────────
  async mounted() {
    // Leer token del localStorage
    this.token = localStorage.getItem('token');
    if (this.token) {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        this.currentUserId = payload.user.id;
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    // Leer ID del vehículo desde la URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');

    if (!vehicleId) {
      this.error = 'Vehículo no especificado.';
      this.isLoading = false;
      return;
    }

    // Cargar datos del vehículo
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
    // ── MARCAR COMO VENDIDO ───────────────────────────────────────
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
          // Actualizar el estado local directamente sin recargar la página
          // Vue re-renderizará isOwner → false, isBuyer → false automáticamente
          this.vehicle.status = 'sold';
        } else {
          alert(data.message || 'Error al marcar como vendido');
        }
      } catch {
        alert('Error de conexion');
      }
    },

    // ── CONTACTAR VENDEDOR ────────────────────────────────────────
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
    },

    // ── COMPARTIR URL ─────────────────────────────────────────────
    async shareVehicle() {
      try {
        await navigator.clipboard.writeText(window.location.href);
        // En vez de cambiar innerHTML del botón, usamos un flag reactivo
        this.shareLabel = '¡Copiado!';
        setTimeout(() => { this.shareLabel = null; }, 2000);
      } catch {
        alert('No se pudo copiar el enlace automáticamente.');
      }
    },

    // ── LOGOUT ───────────────────────────────────────────────────
    logout() {
      localStorage.removeItem('token');
      window.location.href = '/';
    },
  },
};
</script>
