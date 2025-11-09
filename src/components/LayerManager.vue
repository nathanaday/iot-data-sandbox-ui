<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from '@/components/ui/menubar';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/vue';
import { useLayersStore } from '@/stores/layers';
import { useProjectsStore } from '@/stores/projects';
import type { LayerResponse, DataSourceMetadata } from '@/api';
import { format } from 'date-fns';

const layersStore = useLayersStore();
const projectsStore = useProjectsStore();
const { selectedProjectId } = storeToRefs(projectsStore);

const cardRef = ref<any>(null);
const isNarrow = ref(false);
const MIN_WIDTH = 178;

// Store metadata for each layer
const layerMetadata = ref<Map<number, DataSourceMetadata>>(new Map());
const loadingMetadata = ref<Set<number>>(new Set());
const failedMetadata = ref<Set<number>>(new Set());

let resizeObserver: ResizeObserver | null = null;

// Get layers for the current project, sorted by z_index
const projectLayers = computed(() => {
    if (!selectedProjectId.value) return [];
    
    const layers = layersStore.getLayersByProjectId(selectedProjectId.value);
    return [...layers].sort((a, b) => a.z_index - b.z_index);
});

const handleAddLayer = () => {
    // TODO
    console.log('Add Layer clicked');
};

const handleSelectLayers = () => {
    // TODO
    console.log('Select Layers clicked');
};

const handleColorChange = async (layer: LayerResponse, event: Event) => {
    const target = event.target as HTMLInputElement;
    const newColor = target.value;
    
    try {
        await layersStore.updateLayerColor(layer.data_layer_id, newColor);
    } catch (error) {
        console.error('Failed to update layer color:', error);
    }
};

const handleVisibilityToggle = async (layer: LayerResponse, checked: boolean) => {
    try {
        await layersStore.updateLayerVisibility(layer.data_layer_id, checked);
    } catch (error) {
        console.error('Failed to update layer visibility:', error);
    }
};

// Fetch metadata for a layer
const fetchMetadata = async (layerId: number) => {
    if (loadingMetadata.value.has(layerId) || layerMetadata.value.has(layerId) || failedMetadata.value.has(layerId)) {
        return; // Already loading, loaded, or failed
    }
    
    loadingMetadata.value.add(layerId);
    
    try {
        const metadata = await layersStore.fetchLayerDataMetadata(layerId);
        layerMetadata.value.set(layerId, metadata);
        failedMetadata.value.delete(layerId); // Clear any previous failure
    } catch (error: any) {
        // Mark as failed (likely 404 - data source doesn't exist)
        failedMetadata.value.add(layerId);
        // Only log non-404 errors
        if (error?.status !== 404) {
            console.error(`Failed to fetch metadata for layer ${layerId}:`, error);
        }
    } finally {
        loadingMetadata.value.delete(layerId);
    }
};

// Format date for display
const formatDate = (dateString: string): string => {
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
        return dateString;
    }
};

// Format number with commas
const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

// Check if metadata is loaded for a layer
const getMetadata = (layerId: number): DataSourceMetadata | undefined => {
    return layerMetadata.value.get(layerId);
};

const checkWidth = (width: number) => {
    isNarrow.value = width < MIN_WIDTH;
};

// Watch for layer changes and fetch metadata
watch(projectLayers, (newLayers) => {
    newLayers.forEach(layer => {
        fetchMetadata(layer.data_layer_id);
    });
}, { immediate: true });

onMounted(() => {
    if (cardRef.value) {
        const element = cardRef.value.$el as HTMLElement;
        if (element) {
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    checkWidth(entry.contentRect.width);
                }
            });
            resizeObserver.observe(element);
            
            // Initial check
            checkWidth(element.offsetWidth);
        }
    }
});

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});
</script>

<template>
    <Card ref="cardRef" class="h-full p-0 gap-0">
        <!-- Desktop Menubar (visible when width >= 178px) -->
        <Menubar v-if="!isNarrow" class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <MenubarMenu>
                <MenubarTrigger @click="handleAddLayer">
                    <Icon icon="material-symbols:add" class="mr-1" />
                    Add Layer
                </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger @click="handleSelectLayers">
                    <Icon icon="material-symbols:checklist" class="mr-1" />
                    Select
                </MenubarTrigger>
            </MenubarMenu>
        </Menubar>

        <!-- Mobile Hamburger Menu (visible when width < 178px) -->
        <Menubar v-else class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <MenubarMenu>
                <MenubarTrigger>
                    <Icon icon="material-symbols:menu" />
                </MenubarTrigger>
                <MenubarContent>
                    <MenubarItem @click="handleAddLayer">
                        <Icon icon="material-symbols:add" class="mr-2" />
                        Add Layer
                    </MenubarItem>
                    <MenubarItem @click="handleSelectLayers">
                        <Icon icon="material-symbols:checklist" class="mr-2" />
                        Select
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>

        <CardContent class="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
            <!-- Empty state -->
            <div v-if="projectLayers.length === 0" class="text-center py-8 text-muted-foreground">
                <Icon icon="material-symbols:layers-outline" class="mx-auto mb-2 text-4xl opacity-50" />
                <p class="text-sm">No layers in this project</p>
                <p class="text-xs mt-1">Click "Add Layer" to get started</p>
            </div>

            <!-- Layer cards -->
            <Card 
                v-for="layer in projectLayers" 
                :key="layer.data_layer_id"
                class="border-2 hover:border-primary/50 transition-colors min-w-[240px]"
            >
                <div class="px-4 py-0">
                    <div class="flex items-center gap-2">
                        <!-- Color picker -->
                        <input
                            type="color"
                            :value="layer.color"
                            @input="handleColorChange(layer, $event)"
                            class="w-5 h-5 rounded-sm cursor-pointer flex-shrink-0"
                            :title="`Change color for ${layer.name}`"
                        />
                        <!-- Title -->
                        <div class="text-sm leading-tight">
                            {{ layer.name }}
                        </div>
                        <!-- No data warning badge -->
                        <Badge v-if="failedMetadata.has(layer.data_layer_id)" variant="destructive" class="text-xs">
                            No Data
                        </Badge>
                        <!-- Spacer -->
                        <div class="flex-grow"></div>
                        <!-- Visibility toggle (Future / tentative) -->
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <Switch
                                :id="`visibility-${layer.data_layer_id}`"
                                :checked="layer.is_visible"
                                @update:checked="(checked: boolean) => handleVisibilityToggle(layer, checked)"
                                class="scale-75"
                            />
                        </div>
                    </div>
                </div>
                <CardContent class="pt-0 space-y-0">
                    
                    <!-- Metadata section -->
                    <div v-if="getMetadata(layer.data_layer_id)" class="border-t pt-0">

                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell class="py-1.5 px-2 text-xs font-medium text-muted-foreground">
                                        Rows
                                    </TableCell>
                                    <TableCell class="py-1.5 px-2 text-xs">
                                        {{ formatNumber(getMetadata(layer.data_layer_id)?.row_count || 0) }}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell class="py-1.5 px-2 text-xs font-medium text-muted-foreground">
                                        Start Date
                                    </TableCell>
                                    <TableCell class="py-1.5 px-2 text-xs">
                                        {{ formatDate(getMetadata(layer.data_layer_id)?.start_time || '') }}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell class="py-1.5 px-2 text-xs font-medium text-muted-foreground">
                                        End Date
                                    </TableCell>
                                    <TableCell class="py-1.5 px-2 text-xs">
                                        {{ formatDate(getMetadata(layer.data_layer_id)?.end_time || '') }}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <!-- No data source message -->
                    <div v-else-if="failedMetadata.has(layer.data_layer_id)" class="border-t pt-2">
                        <div class="flex items-center gap-2 text-xs text-muted-foreground py-2">
                            <Icon icon="material-symbols:warning-outline" class="text-destructive" />
                            <span>Data source not found</span>
                        </div>
                    </div>

                    <!-- Loading state for metadata -->
                    <div v-else-if="loadingMetadata.has(layer.data_layer_id)" class="border-t pt-0">
                        <div class="flex items-center gap-2 text-xs text-muted-foreground py-2">
                            <Icon icon="material-symbols:progress-activity" class="animate-spin" />
                            <span>Loading metadata...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </CardContent>
    </Card>

</template>