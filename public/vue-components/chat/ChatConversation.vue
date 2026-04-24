<template>
  <div class="chat-main">
    <div class="chat-empty" v-if="!conversation">
      <h3>Selecciona una conversacion</h3>
      <p>Elige un chat de la lista para ver los mensajes</p>
    </div>

    <template v-else>
      <div class="chat-main-header">
        <div class="chat-header-avatar" :style="getAvatarStyle(conversation)"></div>
        <div>
          <div class="chat-header-name">{{ otherUsername(conversation) }}</div>
          <div class="chat-header-sub">{{ vehicleName(conversation) }}</div>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div v-if="conversation.messages.length === 0" style="text-align: center; color: var(--text-muted); margin-top: 40px;">
          <p>No hay mensajes. Inicia la conversacion!</p>
        </div>

        <div
          v-for="(msg, index) in conversation.messages"
          :key="index"
          class="chat-bubble"
          :class="isMine(msg) ? 'sent' : 'received'"
        >
          {{ msg.content }}
          <div class="bubble-time">{{ formatTime(msg.createdAt) }}</div>
        </div>
      </div>

      <div class="chat-input-bar">
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
</template>

<script>
export default {
  name: 'ChatConversation',
  props: ['conversation', 'currentUserId', 'token'],
  emits: ['message-sent'],
  data() {
    return {
      newMessage: '',
      isSending: false
    }
  },
  computed: {
    canSend() {
      if (!this.conversation) return false;
      const msgs = this.conversation.messages;
      if (msgs.length === 0) return true;
      const lastMsg = msgs[msgs.length - 1];
      return lastMsg.senderId._id !== this.currentUserId;
    }
  },
  watch: {
    conversation() {
      this.$nextTick(() => {
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
        }
      });
      // limpiar el area cuando cambia el chat
      this.newMessage = '';
    }
  },
  methods: {
    async sendMessage() {
      const content = this.newMessage.trim();
      if (!content || !this.conversation) return;

      this.newMessage = '';
      this.isSending = true;
      try {
        const res = await fetch(`http://localhost:3000/api/chat/${this.conversation._id}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          this.$emit('message-sent');
        } else {
          const data = await res.json();
          alert(data.message || 'Error al enviar el mensaje');
        }
      } catch {
        alert('Error de conexion');
      } finally {
        this.isSending = false;
        this.$nextTick(() => {
          if (this.$refs.messagesContainer) {
            this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
          }
        });
      }
    },
    isMine(msg) {
      return msg.senderId._id === this.currentUserId;
    },
    otherUsername(conv) {
      return conv.buyerId._id === this.currentUserId
        ? conv.sellerId.username
        : conv.buyerId.username;
    },
    vehicleName(conv) {
      return conv.vehicleId
        ? `${conv.vehicleId.brand} ${conv.vehicleId.model}`
        : 'Vehiculo';
    },
    getAvatarStyle(conv) {
      return conv.vehicleId && conv.vehicleId.image
        ? { backgroundImage: `url('http://localhost:3000${conv.vehicleId.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--primary), var(--celeste))' };
    },
    formatTime(createdAt) {
      return new Date(createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
  }
}
</script>
