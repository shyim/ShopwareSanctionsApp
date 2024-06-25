<script setup>
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'

import { onMounted, reactive, ref } from 'vue'

let sanctions = ref([]);

onMounted(async () => {
  const resp = await (await fetch('/app-widget/my-reports')).json();

  sanctions = resp;
})

</script>

<template>
  <main>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                                <th>Reason</th>
                <th>Created at</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="sanction in sanctions" :key="sanction.id">
                <td>{{ sanction.id }}</td>
                                <td>{{ sanction.text }}</td>
                <td>{{ sanction.created_at }}</td>
            </tr>
        </tbody>
    </table>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
