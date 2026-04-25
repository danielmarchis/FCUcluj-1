<script setup>
import { BarChart3 } from 'lucide-vue-next'
</script>

<template>
  <div class="p-6 lg:p-10">
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-white">Team Dashboard</h1>
      <p class="text-slate-400 text-sm mt-1">Welcome back. Here is the overview for FC U Cluj.</p>
    </header>

    <div class="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
      <BarChart3 class="w-12 h-12 text-slate-600 mb-4" />
      <h2 class="text-lg font-medium text-slate-300">Overview widgets will go here</h2>
      <p class="text-sm text-slate-500 mt-1">Connect your Java backend to populate overall team stats.</p>
    </div>
  </div>
</template>
