<template>
  <meta http-equiv=“Content-Security-Policy” content=“upgrade-insecure-requests”>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedViews">
        <component :is="Component" :key="$route.meta.cacheKey || $route.path" />
      </keep-alive>
    </router-view>
  </div>
</template>
<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  setup() {
    const route = useRoute()
    const cachedViews = computed(() => {
      return route.matched
        .filter(item => item.meta.keepAlive)
        .map(item => item.meta.cacheKey || item.name)
    })

    return { cachedViews }
  }
}
</script>

<style></style>
