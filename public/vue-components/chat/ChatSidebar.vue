<template>
  <div class="chat-sidebar">
    <div class="chat-sidebar-header">
      <h2>Mensajes</h2>
    </div>

    <div class="chat-list">
      <div v-if="isLoading" class="chat-empty" style="padding: 40px 20px;">
        <h3>Cargando chats...</h3>
      </div>

      <div v-else-if="conversations.length === 0" style="padding: 40px 24px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 15px;">No tienes conversaciones aun.</p>
        <p style="font-size: 13px; margin-top: 8px;">Ve a un vehiculo y envia un mensaje al vendedor.</p>
      </div>

      <template v-else>
        <div
          v-for="conv in conversations"
          :key="conv._id"
          class="chat-item"
          :class="{ active: selectedChatId === conv._id }"
          @click="$emit('select-chat', conv)"
        >
          <div class="chat-item-avatar" :style="getAvatarStyle(conv)"></div>

          <div class="chat-item-info">
            <div class="chat-item-name">{{ otherUsername(conv) }} - {{ vehicleName(conv) }}</div>
            <div class="chat-item-preview">{{ lastMessagePreview(conv) }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatSidebar',
  props: ['conversations', 'selectedChatId', 'isLoading', 'currentUserId'],
  emits: ['select-chat'],
  methods: {
    otherUsername(conv) {
      return conv.buyerId._id === this.currentUserId
        ? conv.sellerId.username
        : conv.buyerId.username;
    },
    vehicleName(conv) {
      return conv.vehicleId
        ? `${conv.vehicleId.brand} ${conv.vehicleId.model} ${conv.vehicleId.year || ''}`
        : 'Vehiculo';
    },
    lastMessagePreview(conv) {
      const lastMsg = conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content
        : 'Sin mensajes aun';
      return lastMsg.length > 45 ? lastMsg.substring(0, 45) + '...' : lastMsg;
    },
    getAvatarStyle(conv) {
      return conv.vehicleId && conv.vehicleId.image
        ? { backgroundImage: `url('http://localhost:3000${conv.vehicleId.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, var(--primary), var(--celeste))' };
    }
  }
}
</script>
