<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { LayoutDashboard, Users, Activity } from 'lucide-vue-next'
</script>

<template>
  <div class="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

    <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-10">
      <div class="p-6 border-b border-slate-800">
        <h1 class="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
          <Activity class="text-blue-500 w-6 h-6" />
          FC U Cluj Hub
        </h1>
      </div>

      <nav class="flex-1 p-4 space-y-2">
        <RouterLink
          to="/"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          exact-active-class="bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner"
        >
          <LayoutDashboard class="w-5 h-5" />
          Dashboard
        </RouterLink>

        <RouterLink
          to="/stats"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          exact-active-class="bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner"
        >
          <Users class="w-5 h-5" />
          Player Stats
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v2.0.0 - Smart Match Engine
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto bg-[#020617]">
      <RouterView />
    </main>

  </div>
</template>
