<template>
  <div class="navbar bg-base-200 shadow-sm backdrop-blur-md sticky z-100 top-0 p-0 px-4 gap-1">
    <div class="flex-none" :class="{'!flex-1': route.path !== '/wallet'}">
      <NuxtLink to="/wallet" class="btn btn-ghost text-xl p-2">SecretManager</NuxtLink>
    </div>
    <div class="flex grow" v-if="route.path === '/wallet'">
      <input type="text" placeholder="Поиск секретов..." class="input input-bordered w-full max-w-150" v-model="search" />
    </div>
    <div class="flex-none gap-2">
      <button v-if="!loggedIn" class="btn btn-outline btn-success mr-2" @click="login">Войти</button>
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost px-3">
          <a v-if="loggedIn">
            {{ user.name }}
          </a>
          <Icon name="fa6-solid:angle-down" class="icon-md"/>
        </div>
        <ul class="menu dropdown-content bg-base-200 rounded-box w-52 p-2 shadow">
          <li :class="{ 'menu-active': route.path === '/settings' } ">
            <NuxtLink to="/settings">Настройки <Icon name="fa6-solid:gear" class="ml-auto icon-sm"/></NuxtLink>
          </li>
          <li>
            <button @click="doLock">Заблокировать <Icon name="fa6-solid:lock" class="ml-auto icon-sm"/></button>
          </li>
          <li v-if="loggedIn">
            <div class="divider divider-start m-0"></div>
          </li>
          <li v-if="loggedIn">
            <button @click="logout">Выйти из аккаунта <Icon name="fa6-solid:right-from-bracket" class="ml-auto icon-sm"/></button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { lock } = await useVault()
const { loggedIn, user, login, logout } = await useAuth()
const { search } = useNavbarSearch()

async function doLock() {
  lock();
  await navigateTo('/');
}
</script>