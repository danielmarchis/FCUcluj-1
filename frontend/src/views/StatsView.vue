<script setup>
import {
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy
} from 'lucide-vue-next'

const players = [
  { id: 1, name: 'Juan Bauza', position: 'MID', matches: 12, score: 92.4, trend: 'up' },
  { id: 2, name: 'Vlad Achim', position: 'MID', matches: 14, score: 88.1, trend: 'flat' },
  { id: 3, name: 'William Baeten', position: 'FWD', matches: 10, score: 84.5, trend: 'down' },
]
</script>

<template>
  <div class="p-6 lg:p-10">

    <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-white">Squad Stats</h1>
        <p class="text-slate-400 text-sm mt-1">Overall performance metrics across all analyzed matches.</p>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative w-full md:w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search player..."
            class="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <button class="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm px-4 py-2 rounded-lg transition-all text-white">
          <Filter class="w-4 h-4 text-slate-400" />
          <span>Filters</span>
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-800/50 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p class="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">Top Performer</p>
          <h3 class="text-xl font-bold text-white">Juan Bauza</h3>
        </div>
        <div class="bg-blue-500/20 p-3 rounded-full">
          <Trophy class="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs font-semibold">
          <tr>
            <th scope="col" class="px-6 py-4 w-16">Rank</th>
            <th scope="col" class="px-6 py-4">Player</th>
            <th scope="col" class="px-6 py-4">Position</th>
            <th scope="col" class="px-6 py-4 text-center">Matches</th>
            <th scope="col" class="px-6 py-4 text-right">Smart Score</th>
            <th scope="col" class="px-6 py-4 text-center">Form</th>
            <th scope="col" class="px-6 py-4 w-12"></th>
          </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
          <tr
            v-for="(player, index) in players"
            :key="player.id"
            class="hover:bg-slate-800/50 transition-colors group cursor-pointer"
          >
            <td class="px-6 py-4 text-slate-500 font-medium">#{{ index + 1 }}</td>
            <td class="px-6 py-4 font-medium text-slate-200">{{ player.name }}</td>
            <td class="px-6 py-4">
                <span class="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-700">
                  {{ player.position }}
                </span>
            </td>
            <td class="px-6 py-4 text-center text-slate-400">{{ player.matches }}</td>
            <td class="px-6 py-4 text-right">
              <span class="text-base font-bold text-blue-400">{{ player.score.toFixed(1) }}</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex justify-center">
                <TrendingUp v-if="player.trend === 'up'" class="w-5 h-5 text-emerald-500" />
                <TrendingDown v-else-if="player.trend === 'down'" class="w-5 h-5 text-rose-500" />
                <Minus v-else class="w-5 h-5 text-slate-500" />
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <ChevronRight class="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
