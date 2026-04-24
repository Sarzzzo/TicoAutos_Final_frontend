<template>
  <div class="chat-layout">
    <ChatSidebar
      :conversations="conversations"
      :selectedChatId="selectedConversation ? selectedConversation._id : null"
      :isLoading="isLoading"
      :currentUserId="currentUserId"
      @select-chat="openConversation"
    />

    <ChatConversation
      :conversation="selectedConversation"
      :currentUserId="currentUserId"
      :token="token"
      @message-sent="handleMessageSent"
    />
  </div>
</template>

<script>
import ChatSidebar from './ChatSidebar.vue';
import ChatConversation from './ChatConversation.vue';

export default {
  name: 'MessagesMain',
  components: {
    ChatSidebar,
    ChatConversation
  },
  data() {
    return {
      conversations: [],
      selectedConversation: null,
      currentUserId: null,
      token: null,
      isLoading: true
    };
  },
  mounted() {
    this.token = localStorage.getItem('token');
    if (!this.token) {
      alert('Debes iniciar sesion.');
      window.location.href = '/';
      return;
    }

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      this.currentUserId = payload.user.id;
    } catch {
      alert('Token invalido.');
      window.location.href = '/';
      return;
    }

    this.loadChatList();
  },
  methods: {
    async loadChatList() {
      this.isLoading = true;
      try {
        const res = await fetch('http://localhost:3000/api/chat/my', {
          headers: { 'Authorization': `Bearer ${this.token}` },
        });
        this.conversations = await res.json();

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
    openConversation(conv) {
      this.selectedConversation = conv;
    },
    async handleMessageSent() {
      await this.loadChatList();
      if (this.selectedConversation) {
        const updated = this.conversations.find(c => c._id === this.selectedConversation._id);
        if (updated) this.selectedConversation = updated;
      }
    }
  }
}
</script>
