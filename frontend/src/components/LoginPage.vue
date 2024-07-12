<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import websocketService from "@/services/websocketService";
import { Broker } from "@/models/broker";
import { UserService } from "@/services/userService";
import router from '@/router/router'

const rules = {
  required: value => !!value || 'Field is required',
};

const totalUsers = ref<Broker[]>([]);
const userName = ref('')
const isValid = ref(true);
const isError = ref(false);

const emits = defineEmits(['loginSuccessEvent']);

onMounted(async () => {
  if (UserService.getCreatedInstance() !== null) {
    await router.push('/brokers');
  }

  websocketService.emit('brokers');

  await websocketService.on('brokers', data => {
    totalUsers.value = data;
  })
})

const handleLogin = () => {
  websocketService.emit('login', userName.value)

  websocketService.on('loginSuccess', loginedUser => {
    UserService.setInstance(loginedUser);
    emits('loginSuccessEvent');
    router.push('/brokers');
  })

  websocketService.on('loginFailure', loginedUser => {
    isError.value = true;
    alert('Неправильный логин');
  })
}
</script>

<template>
  <v-container style="margin-left: 30%; width:40%; margin-top:10%">
    <h1 style="text-align:center">Sign in</h1>
    <v-form v-model="isValid" style="width: 100%">
      <v-container>
        <v-row>
          <v-col
              style="text-align: center"
          >

            <v-text-field
                :error="isError"
                v-model="userName"
                :counter="10"
                label="Введите имя"
                :rules="[rules.required]"
                required
                hide-details
                style="width: 70%; margin-left: 15%"
            ></v-text-field>
            <v-btn id="loginButton" variant="outlined" style="margin-top: 10px" @click="handleLogin">Войти</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-container>
</template>

<style>

</style>