<template>
  <div>
    <div class="header">
      <h1>Routes overview</h1>
      <nuxt-link to="/">Go back to index</nuxt-link>
    </div>
    <div class="info">
      <h1>There are {{ $router.options.routes.length }} available routes by nuxtjs</h1>
    </div>
    <div class="wrapper">
      <table id="routes">
        <tr>
          <th class="text-lg text-center">route.name</th>
          <th class="text-lg text-center">route.path</th>
        </tr>
        <tr v-for="route in $router.options.routes">
          <td>
            <nuxt-link :to="route.path">{{ route.name }}</nuxt-link>
          </td>
          <td>
            <nuxt-link :to="route.path">{{ route.path }}</nuxt-link>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script>
export default {
  layout: "routes"
}
</script>
<style>
.header {
  padding: 30px;
  background-color: rgba(5, 150, 105, 1);
}

.header h1 {
  color: white;
  font-size: 2rem;
}

.header a {
  color: white;
  font-size: 1rem;
  text-decoration: underline;
}

.info {
  padding: 30px;
}

.info h1 {
  font-size: 1.2rem;
}

.wrapper {
  margin: 0 15px;
}

#routes {
  border-collapse: collapse;
  width: 100%;
}

#routes td,
#routes th {
  border: 1px solid #ddd;
  padding: 8px;
}

#routes tr:nth-child(even) {
  background-color: #f2f2f2;
}

#routes tr:hover {
  background-color: #ddd;
}

#routes th {
  background-color: rgba(5, 150, 105, 1);
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  color: white;
}</style>