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
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

// Track selected layers
const selectedLayers = ref<Set<number>>(new Set());

// Delete confirmation dialog
const showDeleteDialog = ref(false);

// Color palettes
const colorThemes = [
    {
        name: 'Theme 1',
        colors: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600']
    },
    {
        name: 'Theme 2',
        colors: ['#009eba', '#149cd1', '#5296df', '#8a8be1', '#bb7cd4', '#e26cb7', '#f96090', '#ff6363']
    },
    {
        name: 'Theme 3',
        colors: ['#bababa', '#9d9d9d', '#818181', '#666666', '#4c4c4c', '#343434', '#1d1d1d', '#000000']
    }
];

let resizeObserver: ResizeObserver | null = null;

// Get layers for the current project, sorted by z_index
const projectLayers = computed(() => {
    if (!selectedProjectId.value) return [];
    
    const layers = layersStore.getLayersByProjectId(selectedProjectId.value);
    return [...layers].sort((a, b) => a.z_index - b.z_index);
});

const handleDeleteLayers = () => {
    // Show confirmation dialog
    showDeleteDialog.value = true;
};

const confirmDeleteLayers = async () => {
    const layerIds = Array.from(selectedLayers.value);
    console.log('Deleting layers:', layerIds);
    
    try {
        // Delete all selected layers
        await Promise.all(
            layerIds.map(layerId => layersStore.deleteLayer(layerId))
        );
        
        // Clear selection after successful deletion
        selectedLayers.value.clear();
        showDeleteDialog.value = false;
        console.log('Layers deleted successfully');
    } catch (error) {
        console.error('Failed to delete layers:', error);
        showDeleteDialog.value = false;
    }
};

const cancelDeleteLayers = () => {
    showDeleteDialog.value = false;
};

const handleFlattenLayers = () => {
    console.log('Flatten layers selected');
};

const handleColorChange = async (layer: LayerResponse, newColor: string) => {
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
        // Revert optimistic update on error by refetching the layer
        await layersStore.fetchLayer(layer.data_layer_id);
    }
};

const handleCardClick = (layerId: number) => {
    if (selectedLayers.value.has(layerId)) {
        selectedLayers.value.delete(layerId);
        console.log(`Layer ${layerId} deselected`);
    } else {
        selectedLayers.value.add(layerId);
        console.log(`Layer ${layerId} selected`);
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

        <!-- No layers selected (dummy menu bar)-->
        <Menubar v-if="selectedLayers.size == 0" class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
        </Menubar>

        <!-- Layers selected and not narrow -->
        <Menubar v-if="selectedLayers.size > 0 && !isNarrow" class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <!-- Selection count display (non-interactive) -->
            <div class="flex items-center px-3 text-sm font-medium text-muted-foreground">
                <Icon icon="material-symbols:checklist" class="mr-1.5" />
                {{ selectedLayers.size }} selected
            </div>
            <!-- Delete Layers -->
            <MenubarMenu>
                <MenubarTrigger @click="handleDeleteLayers">
                    <Icon icon="material-symbols:delete-outline" class="mr-1" />
                    Delete
                </MenubarTrigger>
            </MenubarMenu>
            <!-- Flatten Layers (only when 2+ layers selected) -->
            <MenubarMenu v-if="selectedLayers.size >= 2">
                <MenubarTrigger @click="handleFlattenLayers">
                    <Icon icon="material-symbols:layers-outline" class="mr-1" />
                    Flatten
                </MenubarTrigger>
            </MenubarMenu>
        </Menubar>

        <!-- Mobile MenuBar with dropdown (visible when width < 178px and layers selected) -->
        <Menubar v-else-if="selectedLayers.size > 0 && isNarrow" class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <!-- Selection count display (non-interactive) -->
            <div class="flex items-center px-2 text-sm font-medium text-muted-foreground">
                <Icon icon="material-symbols:checklist" class="mr-1" />
                {{ selectedLayers.size }}
            </div>
            <MenubarMenu>
                <MenubarTrigger>
                    <Icon icon="material-symbols:menu" />
                </MenubarTrigger>
                <MenubarContent>
                    <MenubarItem @click="handleDeleteLayers">
                        <Icon icon="material-symbols:delete-outline" class="mr-2" />
                        Delete
                    </MenubarItem>
                    <MenubarItem v-if="selectedLayers.size >= 2" @click="handleFlattenLayers">
                        <Icon icon="material-symbols:layers-outline" class="mr-2" />
                        Flatten
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
        <CardHeader>
            <CardDescription>
                <!-- Layer count -->
                Layer Manager - {{ projectLayers.length }} layer{{ projectLayers.length !== 1 ? 's' : '' }}
            </CardDescription>
        </CardHeader>

        <CardContent class="px-2 py-0 my-0 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
            <!-- Empty state -->
            <div v-if="projectLayers.length === 0" class="text-center py-8 text-muted-foreground">
                <Icon icon="material-symbols:layers-outline" class="mx-auto mb-2 text-4xl opacity-50" />
                <p class="text-sm">No layers in this project</p>
            </div>

            <!-- Layer cards -->
            <Card 
                v-for="layer in projectLayers" 
                :key="layer.data_layer_id"
                class="border-2 transition-colors min-w-[240px] cursor-pointer"
                :class="selectedLayers.has(layer.data_layer_id) ? 'border-blue-500 hover:border-blue-600' : 'border-gray-200 hover:border-gray-300'"
                @click="handleCardClick(layer.data_layer_id)"
            >
                <div class="px-4 py-0">
                    <div class="flex items-center gap-2">
                        <!-- Color picker -->
                        <Popover>
                            <PopoverTrigger as-child @click.stop>
                                <button
                                    :style="{ backgroundColor: layer.color }"
                                    class="w-6 h-6 rounded-sm cursor-pointer flex-shrink-0 border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                    :title="`Change color for ${layer.name}`"
                                />
                            </PopoverTrigger>
                            <PopoverContent class="w-auto p-3" :align="'start'">
                                <div class="space-y-3">
                                    <div v-for="theme in colorThemes" :key="theme.name" class="space-y-1.5">
                                        <div class="text-xs font-medium text-muted-foreground">
                                            {{ theme.name }}
                                        </div>
                                        <div class="grid grid-cols-8 gap-1.5">
                                            <button
                                                v-for="color in theme.colors"
                                                :key="color"
                                                :style="{ backgroundColor: color }"
                                                @click="handleColorChange(layer, color)"
                                                class="w-7 h-7 rounded-sm cursor-pointer border-2 transition-all hover:scale-110"
                                                :class="layer.color.toLowerCase() === color.toLowerCase() ? 'border-white ring-2 ring-gray-400' : 'border-gray-300 hover:border-gray-400'"
                                                :title="color"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
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
                        <!-- Visibility toggle -->
                        <div class="flex items-center gap-2 flex-shrink-0" @click.stop>
                            <Switch
                                :id="`visibility-${layer.data_layer_id}`"
                                :model-value="layer.is_visible"
                                @update:model-value="(checked: boolean) => handleVisibilityToggle(layer, checked)"
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

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Layer{{ selectedLayers.size > 1 ? 's' : '' }}?</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete {{ selectedLayers.size > 1 ? 'these' : 'this' }} 
                 layer{{ selectedLayers.size > 1 ? 's' : '' }}? 
                    This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" @click="cancelDeleteLayers">
                    Cancel
                </Button>
                <Button variant="destructive" @click="confirmDeleteLayers">
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

</template>