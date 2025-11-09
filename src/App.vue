<script setup lang="ts">
import { ref } from 'vue';
import NavHeader from '@/components/NavHeader.vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PlotManager from '@/components/PlotManager.vue';
import LayerManager from '@/components/LayerManager.vue';
import ToolManager from '@/components/ToolManager.vue';
import AgentView from '@/components/AgentView.vue';
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from '@/components/ui/resizable';

</script>

<template>
    <div class="flex flex-col h-screen bg-gray-50">
        <!-- Row 1: Header - sticky to top -->
        <header class="sticky top-0 z-50 bg-white shadow-sm">
            <NavHeader />
        </header>

        <!-- Row 2: Main content area - fills available space -->
        <main class="flex-1 overflow-hidden w-full px-2 py-2">
            <ResizablePanelGroup direction="horizontal" class="gap-2 h-full">
                <!-- Left Panel: Tool Manager -->
                <ResizablePanel :default-size="25" :max-size="50" :min-size="10" :collapsible="true"
                    :collapsed-size="0">
                    <ToolManager />
                </ResizablePanel>

                <!-- Left Resize Handle -->
                <ResizableHandle with-handle />

                <!-- Center Panel: Data Visualization -->
                <ResizablePanel :default-size="50" :min-size="30">
                    <PlotManager />
                </ResizablePanel>

                <!-- Right Resize Handle -->
                <ResizableHandle with-handle />

                <!-- Right Panel: Layer Manager -->
                <ResizablePanel :default-size="25" :max-size="50" :min-size="10" :collapsible="true"
                    :collapsed-size="0">
                    <LayerManager />
                </ResizablePanel>
            </ResizablePanelGroup>
        </main>

        <!-- Row 3: Agent View - sticky to bottom, max height 250px -->
        <div class="sticky bottom-0 z-50 max-h-[250px] overflow-y-auto bg-gray-50 container mx-auto px-2 py-2">
            <AgentView />
        </div>
    </div>
</template>

<style scoped>
.container {
    width: 100%;
}
</style>
