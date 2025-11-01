<script setup lang="ts">
import type { SplitterPanelEmits, SplitterPanelProps } from "reka-ui"
import { SplitterPanel, useForwardPropsEmits } from "reka-ui"
import { ref } from "vue"

const props = defineProps<SplitterPanelProps>()
const emits = defineEmits<SplitterPanelEmits>()

const forwarded = useForwardPropsEmits(props, emits)
const panelRef = ref()

defineExpose({
  collapse: () => panelRef.value?.collapse(),
  expand: () => panelRef.value?.expand(),
  resize: (size: number) => panelRef.value?.resize(size),
  getSize: () => panelRef.value?.getSize(),
  isCollapsed: () => panelRef.value?.isCollapsed,
  isExpanded: () => panelRef.value?.isExpanded,
})
</script>

<template>
  <SplitterPanel
    ref="panelRef"
    data-slot="resizable-panel"
    v-bind="forwarded"
  >
    <slot />
  </SplitterPanel>
</template>
