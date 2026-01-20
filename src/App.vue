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
    <div class="flex flex-col h-screen bg-background">
        <!-- Row 1: Header - sticky to top -->
        <header class="shrink-0 bg-card shadow-sm border-b border-border">
            <NavHeader />
        </header>

        <!-- Row 2: Main content area with resizable bottom panel -->
        <ResizablePanelGroup direction="vertical" class="flex-1 overflow-hidden">
            <!-- Top: Main panels area -->
            <ResizablePanel :default-size="75" :min-size="30">
                <div class="h-full w-full px-2 py-2">
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
                </div>
            </ResizablePanel>

            <!-- Vertical Resize Handle for Agent View -->
            <ResizableHandle with-handle />

            <!-- Bottom: Agent View -->
            <ResizablePanel :default-size="25" :min-size="10" :max-size="60" :collapsible="true" :collapsed-size="0">
                <div class="h-full w-full px-2 py-2 overflow-hidden">
                    <AgentView />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    </div>
</template>

