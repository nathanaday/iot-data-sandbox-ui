<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Menubar } from '@/components/ui/menubar';
import { Icon } from '@iconify/vue';
import { useToolsStore } from '@/stores/tools';
import type { ToolManifest } from '@/api';

const toolsStore = useToolsStore();

// Track expanded tools
const expandedTools = ref<Set<string>>(new Set());

// Get all tools
const tools = computed(() => toolsStore.tools);

const handleCardClick = (toolName: string) => {
    if (expandedTools.value.has(toolName)) {
        expandedTools.value.delete(toolName);
    } else {
        expandedTools.value.add(toolName);
    }
};

const isExpanded = (toolName: string): boolean => {
    return expandedTools.value.has(toolName);
};

const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
        'analysis': 'mdi:chart-line',
        'ai': 'mdi:creation',
        'filter': 'mdi:chart-sankey-variant',
        'transform': 'mdi:graph',
        'other': 'mdi:tools'
    };
    return icons[category] ?? icons['other'] ?? 'mdi:tools';
};

// Fetch tools on mount
onMounted(async () => {
    try {
        await toolsStore.fetchTools();
    } catch (error) {
        console.error('Failed to fetch tools:', error);
    }
});

// Watch for tool changes
watch(tools, (newTools) => {
    console.log(`Loaded ${newTools.length} tools`);
}, { immediate: true });
</script>

<template>
    <Card class="h-full p-0 gap-0">
        <!-- No layers selected (dummy menu bar)-->
        <Menubar class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
        </Menubar>
        <CardHeader>
            <CardDescription>
                Tool Manager - {{ tools.length }} tool{{ tools.length !== 1 ? 's' : '' }}
            </CardDescription>
        </CardHeader>

        <CardContent class="px-2 py-0 my-0 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
            <!-- Empty state -->
            <div v-if="tools.length === 0" class="text-center py-8 text-muted-foreground">
                <Icon icon="material-symbols:build-outline" class="mx-auto mb-2 text-4xl opacity-50" />
                <p class="text-sm">No tools available</p>
            </div>

            <!-- Tool cards -->
            <Card
                v-for="tool in tools"
                :key="tool.name"
                class="border-2 border-gray-200 hover:border-gray-300 transition-colors min-w-[240px] cursor-pointer"
                @click="handleCardClick(tool.name)"
            >
                <div class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <!-- Tool icon -->
                        <div class="flex-shrink-0">
                            <Icon
                                :icon="getCategoryIcon(tool.category)"
                                class="text-2xl text-gray-600"
                            />
                        </div>
                        <!-- Title -->
                        <div class="text-sm font-medium leading-tight">
                            {{ tool.name }}
                        </div>
                        <!-- Spacer -->
                        <div class="flex-grow"></div>
                        <!-- Parameter count badge -->
                        <Badge variant="secondary" class="text-xs">
                            {{ tool.parameters.length }} param{{ tool.parameters.length !== 1 ? 's' : '' }}
                        </Badge>
                        <!-- Expand/collapse icon -->
                        <div class="flex-shrink-0">
                            <Icon
                                :icon="isExpanded(tool.name) ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
                                class="text-xl text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                <!-- Expanded content -->
                <CardContent v-if="isExpanded(tool.name)" class="pt-0 space-y-0">

                    <!-- Description section -->
                    <div class="border-t pt-3 pb-2">
                        <div class="text-xs text-muted-foreground mb-1 font-medium">
                            Description
                        </div>
                        <div class="text-sm">
                            {{ tool.description }}
                        </div>
                    </div>

                    <!-- Examples section -->
                    <div v-if="tool.examples && tool.examples.length > 0" class="border-t pt-2 pb-2">
                        <div class="text-xs text-muted-foreground mb-1 font-medium">
                            Examples
                        </div>
                        <ul class="list-disc list-inside space-y-1">
                            <li
                                v-for="(example, index) in tool.examples"
                                :key="index"
                                class="text-xs text-muted-foreground"
                            >
                                {{ example }}
                            </li>
                        </ul>
                    </div>

                    <!-- Documentation section -->
                    <div v-if="tool.documentation" class="border-t pt-2 pb-2">
                        <div class="text-xs text-muted-foreground mb-1 font-medium">
                            Documentation
                        </div>
                        <div class="text-xs text-blue-600">
                            {{ tool.documentation }}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </CardContent>
    </Card>
</template>
