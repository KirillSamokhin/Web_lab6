<template>
  <router-view/>
</template>

<script lang="ts" setup>
import {UserService} from "@/services/userService";
import {onMounted} from "vue";

onMounted(() => {
  const savedUserInstance = localStorage.getItem('userInstance');

  if (savedUserInstance) {
    UserService.setInstance(JSON.parse(savedUserInstance));
  }

})
</script>