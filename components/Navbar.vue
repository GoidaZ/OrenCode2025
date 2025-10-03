<template>
  <div class="navbar bg-base-300/50 shadow-sm">
    <div class="flex-none">
      <NuxtLink to="/" class="btn btn-ghost text-xl">SecretManager</NuxtLink>
    </div>
    <div class="flex grow">
      <div v-if="route.path === '/'">
        <input type="text" placeholder="Поиск секретов..." class="input input-bordered w-full m-auto max-w-150" />
      </div>
    </div>
    <div class="flex-none gap-2">
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost">
          Вася Пупкин
          <Icon name="fa6-solid:angle-down"/>
        </div>
        <ul class="menu dropdown-content bg-base-200 rounded-box mt-3 w-52 p-2 shadow">
          <li :class="{ 'menu-active': route.path === '/settings' } ">
            <NuxtLink to="/settings">Настройки <Icon name="fa6-solid:gear" class="ml-auto icon-sm"/></NuxtLink>
          </li>
          <li>
            <button>Выйти <Icon name="fa6-solid:right-from-bracket" class="ml-auto icon-sm"/></button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
</script>