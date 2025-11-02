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
    <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm">
            <NavHeader />
        </header>

        <main class="container mx-auto px-2 py-2">
            <ResizablePanelGroup direction="horizontal" class="gap-2 min-h-[600px]">
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

            <!-- Agent View -->
            <div class="mt-2 w-full h-full">
                <AgentView />
            </div>
        </main>
    </div>
</template>

<style scoped>
.container {
    max-width: 1400px;
}
</style>
