<script setup lang="ts">
import { PopoverTrigger, type PopoverTriggerProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<PopoverTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PopoverTrigger v-bind="delegatedProps" :class="props.class">
    <slot />
  </PopoverTrigger>
</template>

