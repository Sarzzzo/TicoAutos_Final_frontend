<!--
  ╔══════════════════════════════════════════════════════════════════╗
  ║  MessagesApp.vue  —  TicoAutos | Chat estilo WhatsApp           ║
  ╚══════════════════════════════════════════════════════════════════╝

  PROPÓSITO:
  Este componente reemplaza messages.js. El problema central de messages.js
  era que reconstruía TODO el HTML del chat cada vez que abría una
  conversación (chatMain.innerHTML = `<div>...500 líneas de template string...`).

  Con Vue, el HTML vive en <template> de forma declarativa: define UNA VEZ
  cómo se ve el chat. Cuando los datos cambian, Vue actualiza solo lo necesario.

  CONCEPTOS VUE CLAVE AQUÍ:
  ─────────────────────────────
  · v-for       → Itera sobre listas (conversaciones, mensajes)
  · v-if/v-else → Muestra el placeholder vs. el chat activo
  · :class      → Aplica clases CSS condicionalmente
  · :style      → Estilos inline condicionalmente
  · @click      → Manejador de clic
  · @keyup.enter → Equivalente a keydown Enter
  · v-model     → Enlaza el input de mensaje con newMessage
  · watch       → Observa cambios en selectedConversation para hacer scroll
-->

<template>
  <div class="chat-layout">

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- SIDEBAR IZQUIERDO: Lista de conversaciones           -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="chat-sidebar">
      <div class="chat-sidebar-header">
        <h2>Mensajes</h2>
      </div>

      <div class="chat-list">

        <!-- Estado: cargando -->
        <div v-if="isLoading" class="chat-empty" style="padding: 40px 20px;">
          <h3>Cargando chats...</h3>
        </div>

        <!-- Estado: sin conversaciones -->
        <!--
          v-else-if  →  Solo se evalúa si el v-if anterior fue falso.
          Es la cadena: if → else if → else
        -->
        <div v-else-if="conversations.length === 0" style="padding: 40px 24px; text-align: center; color: var(--text-muted);">
          <p style="font-size: 15px;">No tienes conversaciones aun.</p>
          <p style="font-size: 13px; margin-top: 8px;">Ve a un vehiculo y envia un mensaje al vendedor.</p>
        </div>

        <!-- Lista de conversaciones -->
        <template v-else>
          <!--
            v-for="conv in conversations"  →  Itera cada conversación del array.
            :key="conv._id"               →  Vue necesita un ID único por elemento
                                             para actualizar solo lo que cambió (optimización).
            @click="openConversation(conv)" → Al hacer clic, llama openConversation con ESTE conv.
            :class="{ active: selectedConversation && selectedConversation._id === conv._id }"
                                          → Añade clase 'active' si es la conv. seleccionada.
          -->
          <div
            v-for="conv in conversations"
            :key="conv._id"
            class="chat-item"
            :class="{ active: selectedConversation && selectedConversation._id === conv._id }"
            @click="openConversation(conv)"
          >
            <!--
              :style  →  Objeto de estilos calculado. En JS vanilla era:
                          div.style.backgroundImage = url(...)
              Aquí se calcula en el template directamente.
            -->
            <div
              class="chat-item-avatar"
              :style="getAvatarStyle(conv)"
            ></div>

            <div class="chat-item-info">
              <!-- otherUsername(conv) es un método que decide qué nombre mostrar -->
              <div class="chat-item-name">{{ otherUsername(conv) }} - {{ vehicleName(conv) }}</div>
              <div class="chat-item-preview">{{ lastMessagePreview(conv) }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- PANEL DERECHO: Conversación activa                   -->
    <!-- ══════════════════════════════════════════════════════ -->
    <div class="chat-main">

      <!-- Placeholder cuando no hay conversación seleccionada -->
      <div class="chat-empty" v-if="!selectedConversation">
        <h3>Selecciona una conversacion</h3>
        <p>Elige un chat de la lista para ver los mensajes</p>
      </div>

      <!-- Conversación activa -->
      <template v-else>

        <!-- Header del chat -->
        <div class="chat-main-header">
          <div class="chat-header-avatar" :style="getAvatarStyle(selectedConversation)"></div>
          <div>
            <div class="chat-header-name">{{ otherUsername(selectedConversation) }}</div>
            <div class="chat-header-sub">{{ vehicleName(selectedConversation) }}</div>
          </div>
        </div>

        <!-- Área de mensajes -->
        <!--
          ref="messagesContainer"  →  Permite acceder a este div desde JS con
                                       this.$refs.messagesContainer para hacer scroll.
                                       Es la alternativa Vue a document.getElementById().
        -->
        <div class="chat-messages" ref="messagesContainer">

          <!-- Sin mensajes -->
          <div v-if="selectedConversation.messages.length === 0" style="text-align: center; color: var(--text-muted); margin-top: 40px;">
            <p>No hay mensajes. Inicia la conversacion!</p>
          </div>

          <!--
            v-for sobre mensajes: renderiza cada burbuja de chat.
            La clase 'sent' o 'received' se aplica según si el sender soy yo.
          -->
          <div
            v-for="(msg, index) in selectedConversation.messages"
            :key="index"
            class="chat-bubble"
            :class="isMine(msg) ? 'sent' : 'received'"
          >
            {{ msg.content }}
            <div class="bubble-time">{{ formatTime(msg.createdAt) }}</div>
          </div>
        </div>

        <!-- Barra de entrada de mensaje -->
        <div class="chat-input-bar">
          <!--
            v-model="newMessage"  →  Enlaza el texto del input con la variable newMessage.
            @keyup.enter="sendMessage"  →  Envía con Enter.
            :disabled="!canSend"  →  Deshabilitado si no es mi turno.
            :placeholder  →  El texto de placeholder cambia según si puedo enviar.
          -->
          <input
            type="text"
            v-model="newMessage"
            :placeholder="canSend ? 'Escribe un mensaje...' : 'Espera a que la otra persona responda...'"
            :disabled="!canSend || isSending"
            @keyup.enter="sendMessage"
          >
          <button @click="sendMessage" :disabled="!canSend || isSending">
            {{ isSending ? '...' : 'Enviar' }}
          </button>
        </div>

      </template>
    </div>

  </div>
</template>


<script>
export default {
  name: 'MessagesApp',

  data() {
    return {
      // Lista completa de conversaciones del usuario
      conversations: [],
      // La conversación actualmente abierta en el panel derecho
      selectedConversation: null,
      // El texto que el usuario está escribiendo en el input
      newMessage: '',
      // ID del usuario logueado (extraído del JWT)
      currentUserId: null,
      // Token JWT
      token: null,
      // Flags de estado
      isLoading: true,
      isSending: false,
    };
  },

  // ──────────────────────────────────────────────────────────────
  // COMPUTED: Se recalculan automáticamente cuando cambia el estado.
  // ──────────────────────────────────────────────────────────────
  computed: {
    /*
      canSend: determina si el usuario puede enviar un mensaje.
      Regla del sistema: deben alternarse. Si el último mensaje lo envié yo,
      debo esperar.

      En JS vanilla (messages.js líneas 131-139), esto era:
        let canSend = true;
        if (conv.messages.length > 0) {
          const lastMsg = conv.messages[conv.messages.length - 1];
          if (lastMsg.senderId._id === currentUserId) canSend = false;
        }
      ...y luego se usaba canSend para construir el HTML del input manualmente.

      Con computed, Vue lo recalcula solo cuando selectedConversation cambia.
    */
    canSend() {
      if (!this.selectedConversation) return false;
      const msgs = this.selectedConversation.messages;
      if (msgs.length === 0) return true;
      const lastMsg = msgs[msgs.length - 1];
      return lastMsg.senderId._id !== this.currentUserId;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // WATCH: Observa cambios en variables y ejecuta código
  // ──────────────────────────────────────────────────────────────
  watch: {
    /*
      Cuando selectedConversation cambia (el usuario abre otro chat),
      queremos hacer scroll al fondo de los mensajes.

      nextTick() garantiza que Vue ya actualizó el DOM antes de hacer scroll.
      En JS vanilla: messagesDiv.scrollTop = messagesDiv.scrollHeight
    */
    selectedConversation() {
      this.$nextTick(() => {
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
        }
      });
    },
  },

  mounted() {
    // Verificar autenticación
    this.token = localStorage.getItem('token');
    if (!this.token) {
      alert('Debes iniciar sesion.');
      window.location.href = '/';
      return;
    }

    // Decodificar el JWT para obtener el userId
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      this.currentUserId = payload.user.id;
    } catch {
      alert('Token invalido.');
      window.location.href = '/';
      return;
    }

    // Cargar lista de chats
    this.loadChatList();
  },

  methods: {
    // ── CARGA DE CONVERSACIONES ───────────────────────────────────
    async loadChatList() {
      this.isLoading = true;
      try {
        const res = await fetch('http://localhost:3000/api/chat/my', {
          headers: { 'Authorization': `Bearer ${this.token}` },
        });
        this.conversations = await res.json();

        // Si venimos de la página de detalle con ?chat=ID, abrir ese chat
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get('chat');
        if (chatId) {
          const conv = this.conversations.find(c => c._id === chatId);
          if (conv) this.openConversation(conv);
        }
      } catch (err) {
        console.error('Error loading chats:', err);
      } finally {
        this.isLoading = false;
      }
    },

    // ── ABRIR CONVERSACIÓN ───────────────────────────────────────
    /*
      En JS vanilla (messages.js), openConversation() reconstruía
      CIENTO TREINTA líneas de innerHTML. Con Vue, solo asignamos
      el objeto al estado y el template se actualiza solo.
    */
    openConversation(conv) {
      this.selectedConversation = conv;
      this.newMessage = '';
    },

    // ── ENVIAR MENSAJE ───────────────────────────────────────────
    async sendMessage() {
      const content = this.newMessage.trim();
      if (!content || !this.selectedConversation) return;

      this.newMessage = '';
      this.isSending = true;
      try {
        const res = await fetch(`http://localhost:3000/api/chat/${this.selectedConversation._id}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          // Recargar para obtener el mensaje actualizado
          await this.loadChatList();
          // Volver a seleccionar la misma conversación (actualizada)
          const updated = this.conversations.find(c => c._id === this.selectedConversation._id);
          if (updated) this.selectedConversation = updated;
        } else {
          const data = await res.json();
          alert(data.message || 'Error al enviar el mensaje');
        }
      } catch {
        alert('Error de conexion');
      } finally {
        this.isSending = false;
      }
    },

    // ── HELPERS (funciones de ayuda para el template) ─────────────
    /*
      Estos métodos se llaman desde el <template> para calcular valores
      específicos de cada conversación. Separan la lógica del HTML.
    */

    // ¿Es este mensaje mío?
    isMine(msg) {
      return msg.senderId._id === this.currentUserId;
    },

    // Nombre del otro usuario en la conversación
    otherUsername(conv) {
      return conv.buyerId._id === this.currentUserId
        ? conv.sellerId.username
        : conv.buyerId.username;
    },

    // Nombre del vehículo de la conversación
    vehicleName(conv) {
      return conv.vehicleId
        ? `${conv.vehicleId.brand} ${conv.vehicleId.model} ${conv.vehicleId.year || ''}`
        : 'Vehiculo';
    },

    // Preview del último mensaje (máx 45 chars)
    lastMessagePreview(conv) {
      const lastMsg = conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content
        : 'Sin mensajes aun';
      return lastMsg.length > 45 ? lastMsg.substring(0, 45) + '...' : lastMsg;
    },

    // Estilo del avatar (imagen del vehículo o gradiente)
    getAvatarStyle(conv) {
      return conv.vehicleId && conv.vehicleId.image
        ? { backgroundImage: `url('http://localhost:3000${conv.vehicleId.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--primary), var(--celeste))' };
    },

    // Formatear timestamp como "14:35"
    formatTime(createdAt) {
      return new Date(createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    },
  },
};
</script>
