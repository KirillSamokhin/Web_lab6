<script lang="ts" setup>
import {Broker} from "@/models/broker";
import {UserService} from "@/services/userService";
import websocketService from "@/services/websocketService";
import {onMounted, reactive, ref} from "vue";
import router from '@/router/router'
import BrokerCard from "@/components/BrokerCard.vue";

const loginedUser = ref<Broker | undefined>(undefined);
loginedUser.value = UserService.getCreatedInstance()?.getLoginedUser();

const stocks = ref();
const brokers = ref();

onMounted(() => {
  websocketService.emit('stocks');
  websocketService.emit('brokers');

  websocketService.on('stocks', data => {
    stocks.value = data;
  })

  websocketService.on('updateStocks', () => {
    websocketService.emit('stocks');
  })

  websocketService.on('brokers', data => {
    brokers.value = data;
  })
})

const handleLogout = () => {
  localStorage.clear();
  UserService.exit();
  router.push('/');
}
</script>

<template>
  <div style="display: flex">
    <v-btn @click="handleLogout" color="error" style="margin-left: 10px; margin-top: 10px; width: 10%">Выход</v-btn>
    <router-link to="/trade" style="margin-left: 10px; margin-top: 10px; width: 10%">
      <v-btn id="trade">Торги</v-btn>
    </router-link>
    <div style="width: 80%; text-align: right">
      <h2 style="margin: 10px">{{loginedUser.name}}</h2>
    </div>
  </div>
  <v-container>
    <BrokerCard v-for="broker in brokers" :broker="broker" :stocks="stocks" class="my-2"/>
  </v-container>
</template>

<style scoped>

</style>