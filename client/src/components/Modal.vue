<template>
  <div class="modal" @mousedown.self="$emit('close')"><div class="card"><slot /></div></div>
</template>
