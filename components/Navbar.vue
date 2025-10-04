<template>
  <div class="navbar bg-base-200 shadow-sm backdrop-blur-md sticky z-100 top-0 p-0 px-1">
    <div class="flex-none" :class="{'!flex-1': route.path !== '/wallet'}">
      <NuxtLink to="/wallet" class="btn btn-ghost text-xl">SecretManager</NuxtLink>
    </div>
    <div class="flex grow" v-if="route.path === '/wallet'">
      <input type="text" placeholder="Поиск секретов..." class="input input-bordered w-full m-auto max-w-150" v-model="search" />
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
            <button @click="doLock">Заблокировать <Icon name="fa6-solid:lock" class="ml-auto icon-sm"/></button>
          </li>
          <li>
            <div class="divider divider-start m-0"></div>
          </li>
          <li>
            <button>Выйти из аккаунта <Icon name="fa6-solid:right-from-bracket" class="ml-auto icon-sm"/></button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { lock } = await useVault()
const { search } = useNavbarSearch()

async function doLock() {
  lock();
  await navigateTo('/');
}
</script>