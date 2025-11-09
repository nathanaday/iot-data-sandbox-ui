<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from '@/components/ui/menubar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ModalNewProject from '@/components/ModalNewProject.vue';
import ModalManageProjects from '@/components/ModalManageProjects.vue';
import { useProjectsStore } from '@/stores/projects';
import { useLayersStore } from '@/stores/layers';
import { Line } from 'vue-chartjs';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    type ChartOptions,
    type ChartData,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const showNewProjectModal = ref(false);
const showOpenProjectModal = ref(false);
const showManageProjectsModal = ref(false);

// Store access
const projectsStore = useProjectsStore();
const layersStore = useLayersStore();

// Computed properties
const currentProject = computed(() => projectsStore.currentProject);
const projectLayers = computed(() => {
    if (!currentProject.value) return [];
    return layersStore.getLayersByProjectId(currentProject.value.project_id);
});

// Chart state
const chartData = ref<ChartData<'line'>>({
    datasets: [],
});

const chartOptions = ref<ChartOptions<'line'>>({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            display: true,
            position: 'top',
        },
        title: {
            display: false,
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y !== null ? context.parsed.y.toFixed(2) : 'N/A';
                    return `${label}: ${value}`;
                },
            },
        },
    },
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'month',
                displayFormats: {
                    month: 'MMM yyyy',
                },
            },
            title: {
                display: true,
                text: 'Time',
            },
        },
        y: {
            title: {
                display: true,
                text: 'Value',
            },
        },
    },
});

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const hasData = computed(() => chartData.value.datasets.length > 0);

// Fetch and load chart data
async function loadChartData() {
    if (!currentProject.value || projectLayers.value.length === 0) {
        chartData.value = { datasets: [] };
        return;
    }

    isLoading.value = true;
    errorMessage.value = null;

    try {
        const datasets = await Promise.all(
            projectLayers.value.map(async (layer) => {
                try {
                    // Try to get cached data first, fetch if not available
                    let response = layersStore.getCachedLayerData(layer.data_layer_id);
                    if (!response) {
                        response = await layersStore.fetchLayerData(layer.data_layer_id);
                    }
                    
                    // Transform data to Chart.js format
                    const data = response.data.map((point) => ({
                        x: new Date(point.timestamp).getTime(),
                        y: point.value,
                    }));

                    return {
                        label: layer.name,
                        data: data,
                        borderColor: layer.color,
                        backgroundColor: layer.color + '33', // Add transparency
                        borderWidth: 2,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        tension: 0.1,
                        hidden: !layer.is_visible,
                    };
                } catch (error: any) {
                    // Only log non-404 errors (404 means data source doesn't exist)
                    if (error?.status !== 404) {
                        console.error(`Failed to load data for layer ${layer.name}:`, error);
                    }
                    return null;
                }
            })
        );

        // Filter out any failed layer data fetches
        chartData.value = {
            datasets: datasets.filter((ds) => ds !== null) as any[],
        };
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Failed to load chart data';
        console.error('Error loading chart data:', error);
    } finally {
        isLoading.value = false;
    }
}

// Watch for project or layer changes (including visibility)
watch([currentProject, projectLayers], () => {
    loadChartData();
}, { deep: true });

// Watch for layer visibility changes and update chart without reloading data
watch(
    () => projectLayers.value.map(l => ({ id: l.data_layer_id, name: l.name, visible: l.is_visible })),
    () => {
        // Update chart dataset visibility without reloading data
        if (chartData.value.datasets.length > 0) {
            chartData.value.datasets.forEach((dataset) => {
                // Match dataset to layer by label (layer name)
                const layer = projectLayers.value.find(l => l.name === dataset.label);
                if (layer) {
                    dataset.hidden = !layer.is_visible;
                }
            });
            // Force chart update by creating new reference
            chartData.value = { ...chartData.value };
        }
    },
    { deep: true }
);

// Load data on mount
onMounted(() => {
    loadChartData();
});
</script>

<template>
    <Card class="h-full p-0 gap-0">
        <!-- Menubar -->
        <Menubar class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <MenubarMenu>
                <MenubarTrigger>Project</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem @click="showNewProjectModal = true">
                        New Project <MenubarShortcut><Icon icon="material-symbols:add" /></MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem @click="showOpenProjectModal = true">
                        Open Project <MenubarShortcut><Icon icon="material-symbols:folder-open" /></MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem @click="showManageProjectsModal = true">
                        Manage Projects <MenubarShortcut><Icon icon="material-symbols:settings" /></MenubarShortcut>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                        Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Export</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>Export raw data<MenubarShortcut>.CSV</MenubarShortcut></MenubarItem>
                    <MenubarItem>Export plot<MenubarShortcut>.PNG</MenubarShortcut></MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
        <CardHeader>
            <CardDescription>
                {{ currentProject ? `Visualizing ${projectLayers.length} layer${projectLayers.length !== 1 ? 's' : ''}` : 'No project selected' }}
            </CardDescription>
        </CardHeader>
        <CardContent class="flex-1 min-h-0">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center h-96">
                <div class="text-center">
                    <Icon icon="svg-spinners:ring-resize" class="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p class="text-muted-foreground">Loading chart data...</p>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="errorMessage" class="flex items-center justify-center h-96">
                <div class="text-center text-destructive">
                    <Icon icon="material-symbols:error-outline" class="w-12 h-12 mx-auto mb-4" />
                    <p class="font-semibold">Error loading chart</p>
                    <p class="text-sm">{{ errorMessage }}</p>
                </div>
            </div>

            <!-- No Project State -->
            <div v-else-if="!currentProject" class="flex items-center justify-center h-96">
                <div class="text-center text-muted-foreground">
                    <Icon icon="material-symbols:folder-open-outline" class="w-16 h-16 mx-auto mb-4" />
                    <p class="font-semibold">No project selected</p>
                    <p class="text-sm">Open or create a project to start visualizing data</p>
                </div>
            </div>

            <!-- No Layers State -->
            <div v-else-if="projectLayers.length === 0" class="flex items-center justify-center h-96">
                <div class="text-center text-muted-foreground">
                    <Icon icon="material-symbols:layers-outline" class="w-16 h-16 mx-auto mb-4" />
                    <p class="font-semibold">No layers in project</p>
                    <p class="text-sm">Add layers to this project to visualize data</p>
                </div>
            </div>

            <!-- Chart Display -->
            <div v-else-if="hasData" class="h-96">
                <Line :data="chartData" :options="chartOptions" />
            </div>

            <!-- No Data State (layers exist but no data loaded) -->
            <div v-else class="flex items-center justify-center h-96">
                <div class="text-center text-muted-foreground">
                    <Icon icon="material-symbols:bar-chart" class="w-16 h-16 mx-auto mb-4" />
                    <p class="font-semibold">No data available</p>
                    <p class="text-sm">Layers exist but contain no data</p>
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- New Project Modal -->
    <ModalNewProject v-model:open="showNewProjectModal" />
    
    <!-- Open Project Modal (Select Mode) -->
    <ModalManageProjects v-model:open="showOpenProjectModal" mode="select" />
    
    <!-- Manage Projects Modal (Manage Mode) -->
    <ModalManageProjects v-model:open="showManageProjectsModal" mode="manage" />
</template>