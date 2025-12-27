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
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
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
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    zoomPlugin
);

const showNewProjectModal = ref(false);
const showOpenProjectModal = ref(false);
const showManageProjectsModal = ref(false);

// IGNORE FOR NOW - NEXT PHASE OF IMPROVEMENTS WILL MAKE USE OF THIS
// Dummy variables for View options layout
const showXAxisGrid = ref(true);
const showYAxisGrid = ref(true);
const showLegend = ref(true);
const showTooltip = ref(true);
const lineStyle = ref('solid');
const lineWidth = ref(2);
const tension = ref(0.1);
// END OF IGNORE FOR NOW - NEXT PHASE OF IMPROVEMENTS WILL MAKE USE OF THIS


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
                footer: (items) => {
                    if (isDecimationActive.value) {
                        return [`Downsampled: ${renderedDataPoints.value.toLocaleString()}/${rawDataPoints.value.toLocaleString()} pts (${((renderedDataPoints.value / rawDataPoints.value) * 100).toFixed(1)}%)`];
                    }
                    return [];
                },
            },
        },
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true,
                },
                mode: 'xy',
                onZoomComplete: () => {
                    isZoomed.value = true;
                },
            },
            pan: {
                enabled: true,
                mode: 'xy',
                onPanComplete: () => {
                    isZoomed.value = true;
                },
            },
        },
    },
    scales: {
        x: {
            type: 'time',
            time: {
                displayFormats: {
                    millisecond: 'HH:mm:ss.SSS',
                    second: 'HH:mm:ss',
                    minute: 'HH:mm',
                    hour: 'MMM d, HH:mm',
                    day: 'MMM d',
                    week: 'MMM d',
                    month: 'MMM yyyy',
                    quarter: 'MMM yyyy',
                    year: 'yyyy',
                },
                tooltipFormat: 'MMM d, yyyy HH:mm:ss',
            },
            title: {
                display: true,
                text: 'Time',
            },
            ticks: {
                autoSkip: true,
                maxTicksLimit: 10,
            },
        },
        y: {
            title: {
                display: true,
                text: 'Value',
            },
            ticks: {
                callback: function(value) {
                    return value.toLocaleString();
                },
            },
        },
    },
});

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const hasData = computed(() => chartData.value.datasets.length > 0);
const chartRef = ref<any>(null);
const isZoomed = ref(false);

// Track raw vs rendered data points
const rawDataPoints = ref(0);
const renderedDataPoints = ref(0);

// Sampling rate control (points per layer)
const samplingRate = ref([500]); // Slider component needs array format
const samplingRateValue = computed(() => samplingRate.value[0] ?? 500);

// Presets for quick selection
const samplingPresets = [
    { label: 'Low', value: 250, description: '250 pts/layer' },
    { label: 'Medium', value: 500, description: '500 pts/layer' },
    { label: 'High', value: 1000, description: '1,000 pts/layer' },
    { label: 'Max', value: 2500, description: '2,500 pts/layer' },
];

// Compute total data points across all visible layers
const totalDataPoints = computed(() => {
    return chartData.value.datasets.reduce((sum, dataset) => {
        return sum + (dataset.data?.length || 0);
    }, 0);
});

// Check if decimation is active
const isDecimationActive = computed(() => {
    return rawDataPoints.value > renderedDataPoints.value;
});

// LTTB (Largest Triangle Three Buckets) downsampling algorithm
function downsampleLTTB(data: Array<{x: number, y: number}>, threshold: number): Array<{x: number, y: number}> {
    if (data.length === 0 || data.length <= threshold) {
        return data;
    }

    const sampled: Array<{x: number, y: number}> = [];
    const bucketSize = (data.length - 2) / (threshold - 2);

    // Always add the first point
    sampled.push(data[0]!);

    let a = 0;
    for (let i = 0; i < threshold - 2; i++) {
        const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
        const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
        const avgRangeLength = avgRangeEnd - avgRangeStart;

        let avgX = 0;
        let avgY = 0;

        for (let j = avgRangeStart; j < avgRangeEnd && j < data.length; j++) {
            avgX += data[j]!.x;
            avgY += data[j]!.y;
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;

        const rangeStart = Math.floor(i * bucketSize) + 1;
        const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

        const pointA = data[a]!;
        let maxArea = -1;
        let maxAreaPoint = data[rangeStart]!;

        for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
            const area = Math.abs(
                (pointA.x - avgX) * (data[j]!.y - pointA.y) -
                (pointA.x - data[j]!.x) * (avgY - pointA.y)
            ) * 0.5;

            if (area > maxArea) {
                maxArea = area;
                maxAreaPoint = data[j]!;
                a = j;
            }
        }

        sampled.push(maxAreaPoint);
    }

    // Always add the last point
    sampled.push(data[data.length - 1]!);

    return sampled;
}

// Fetch and load chart data
async function loadChartData() {
    if (!currentProject.value || projectLayers.value.length === 0) {
        chartData.value = { datasets: [] };
        rawDataPoints.value = 0;
        renderedDataPoints.value = 0;
        return;
    }

    isLoading.value = true;
    errorMessage.value = null;

    const MAX_POINTS_PER_LAYER = samplingRateValue.value; // Use dynamic sampling rate

    try {
        let totalRaw = 0;
        let totalRendered = 0;

        const datasets = await Promise.all(
            projectLayers.value.map(async (layer) => {
                try {
                    // Try to get cached data first, fetch if not available
                    let response = layersStore.getCachedLayerData(layer.data_layer_id);
                    if (!response) {
                        response = await layersStore.fetchLayerData(layer.data_layer_id);
                    }

                    // Transform data to Chart.js format
                    const rawData = response.data.map((point) => ({
                        x: new Date(point.timestamp).getTime(),
                        y: point.value,
                    }));

                    totalRaw += rawData.length;

                    // Apply LTTB downsampling
                    const data = downsampleLTTB(rawData, MAX_POINTS_PER_LAYER);
                    totalRendered += data.length;

                    console.log(`[Chart] Layer "${layer.name}": ${rawData.length} pts → ${data.length} pts (${((data.length / rawData.length) * 100).toFixed(1)}% retained)`);

                    return {
                        label: layer.name,
                        data: data,
                        borderColor: layer.color,
                        backgroundColor: layer.color + '33', // Add transparency
                        borderWidth: 2,
                        pointRadius: 1,
                        pointHoverRadius: 4,
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

        // Update tracking counters
        rawDataPoints.value = totalRaw;
        renderedDataPoints.value = totalRendered;

        // Filter out any failed layer data fetches
        chartData.value = {
            datasets: datasets.filter((ds) => ds !== null) as any[],
        };

        console.log(`[Chart] Total: ${totalRaw} pts → ${totalRendered} pts (${((totalRendered / totalRaw) * 100).toFixed(1)}% retained)`);
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Failed to load chart data';
        console.error('Error loading chart data:', error);
    } finally {
        isLoading.value = false;
    }
}

// Watch for project changes or layer count changes - reload all data
watch(
    () => ({
        projectId: currentProject.value?.project_id,
        layerCount: projectLayers.value.length,
    }),
    () => {
        loadChartData();
    },
    { deep: true }
);

// Watch for sampling rate changes - reload data
watch(samplingRateValue, () => {
    if (currentProject.value && projectLayers.value.length > 0) {
        loadChartData();
    }
});

// Watch for layer visibility changes and update chart without reloading data
watch(
    () => projectLayers.value.map(l => ({ 
        id: l.data_layer_id, 
        name: l.name, 
        visible: l.is_visible,
        color: l.color 
    })),
    (newLayers, oldLayers) => {
        // Only update visibility if data is already loaded
        if (chartData.value.datasets.length === 0) return;
        
        // Check if only visibility/color changed (not layer structure)
        const onlyVisibilityChanged = newLayers.length === oldLayers?.length &&
            newLayers.every((nl, i) => 
                nl.id === oldLayers[i]?.id && 
                nl.name === oldLayers[i]?.name
            );
        
        if (onlyVisibilityChanged) {
            // Update chart dataset visibility and colors without reloading data
            chartData.value.datasets.forEach((dataset) => {
                const layer = projectLayers.value.find(l => l.name === dataset.label);
                if (layer) {
                    dataset.hidden = !layer.is_visible;
                    dataset.borderColor = layer.color;
                    dataset.backgroundColor = layer.color + '33';
                }
            });
            // Force chart update by creating new reference
            chartData.value = { ...chartData.value };
        } else {
            // Layer structure changed, reload all data
            loadChartData();
        }
    },
    { deep: true }
);

// Reset zoom function
function resetZoom() {
    if (chartRef.value?.chart) {
        chartRef.value.chart.resetZoom();
        isZoomed.value = false;
    }
}

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
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                        X-Axis Grid <MenubarShortcut>{{ showXAxisGrid ? 'Hide' : 'Show' }}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Y-Axis Grid <MenubarShortcut>{{ showYAxisGrid ? 'Hide' : 'Show' }}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Legend <MenubarShortcut>{{ showLegend ? 'Hide' : 'Show' }}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Tooltip <MenubarShortcut>{{ showTooltip ? 'Hide' : 'Show' }}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>
                        Line Style <MenubarShortcut>{{ lineStyle }}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Line Width <MenubarShortcut>{{ lineWidth }}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Line Tension <MenubarShortcut>{{ tension }}</MenubarShortcut>
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
                Plot Visualization
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
                <div class="text-center text-muted-foreground space-y-6">
                    <div>
                        <Icon icon="material-symbols:folder-open-outline" class="text-muted-foreground w-16 h-16 mx-auto mb-4" />
                        <!-- <p class="font-semibold text-md">Open or create a project to start visualizing data</p> -->
                    </div>
                    <div class="flex gap-3 justify-center">
                        <Button @click="showNewProjectModal = true" variant="outline">
                            <Icon icon="material-symbols:add" class="w-4 h-4 mr-2" />
                            Create Project
                        </Button>
                        <Button @click="showOpenProjectModal = true" variant="outline">
                            <Icon icon="material-symbols:folder-open" class="w-4 h-4 mr-2" />
                            Open Project
                        </Button>
                    </div>
                    <div>
                        <p class="font-semibold text-md">Or try a demo project:</p>
                    </div>
                    <div class="flex flex-wrap gap-3 justify-center">
                        <Button variant="outline" style="border-color: #2F82E0; color: #2F82E0;">
                            <Icon icon="material-symbols:factory" class="w-4 h-4 mr-2" />
                            Power Utility Production
                        </Button>
                        <Button variant="outline" style="border-color: #927EF0; color: #927EF0;">
                            <Icon icon="material-symbols:eco" class="w-4 h-4 mr-2" />
                            CO2 Emissions
                        </Button>
                        <Button variant="outline" style="border-color: #F479FF; color: #F479FF;">
                            <Icon icon="material-symbols:wifi" class="w-4 h-4 mr-2" />
                            Smoke, Temp, Humidity Sensor
                        </Button>
                    </div>
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
            <div v-else-if="hasData" class="relative h-96 py-4">
                <!-- Bottom-left decimation indicator with popover -->
                <Popover v-if="isDecimationActive">
                    <PopoverTrigger as-child>
                        <button
                            class="absolute bottom-0 left-0 z-10 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-colors cursor-pointer"
                            :title="`Click to adjust sampling rate. Showing ${renderedDataPoints.toLocaleString()} of ${rawDataPoints.toLocaleString()} data points (${((renderedDataPoints / rawDataPoints) * 100).toFixed(1)}% retained)`">
                            <Icon icon="material-symbols:tune" class="w-3 h-3" />
                            <span>{{ renderedDataPoints.toLocaleString() }} / {{ rawDataPoints.toLocaleString() }} pts</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent class="w-80" side="top" align="start">
                        <div class="space-y-4">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <Label class="text-sm font-semibold">Sample Rate</Label>
                                    <span class="text-xs text-muted-foreground">{{ samplingRateValue.toLocaleString() }} pts/layer</span>
                                </div>
                                <!-- <Slider
                                    v-model="samplingRate"
                                    :min="100"
                                    :max="2000"
                                    :step="50"
                                    class="w-full"
                                /> -->
                                <p class="text-xs text-muted-foreground">
                                    Adjust the number of points displayed per layer. Lower values improve performance.
                                </p>
                            </div>

                            <div class="space-y-2 py-2">
                                <div class="grid grid-cols-2 gap-2">
                                    <Button
                                        v-for="preset in samplingPresets"
                                        :key="preset.value"
                                        variant="outline"
                                        size="sm"
                                        class="py-1 h-full"
                                        :class="{ 'border-primary bg-primary/10': samplingRateValue === preset.value }"
                                        @click="samplingRate = [preset.value]"
                                    >
                                        <div class="text-left">
                                            <div class="font-medium">{{ preset.label }}</div>
                                            <div class="text-xs text-muted-foreground">{{ preset.description }}</div>
                                        </div>
                                    </Button>
                                </div>
                            </div>

                            <div class="pt-2 border-t text-xs text-muted-foreground">
                                <div class="flex items-center gap-1">
                                    <Icon icon="material-symbols:info-outline" class="w-3 h-3" />
                                    <span>Current: {{ renderedDataPoints.toLocaleString() }} / {{ rawDataPoints.toLocaleString() }} total points</span>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <!-- Top-right reset zoom button -->
                <div v-if="isZoomed" class="absolute top-0 right-2 z-10">
                    <Button @click="resetZoom" variant="outline" size="sm">
                        <Icon icon="material-symbols:zoom-out-map" class="w-4 h-4 mr-1" />
                        Reset Zoom
                    </Button>
                </div>

                <Line ref="chartRef" :data="chartData" :options="chartOptions" />
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