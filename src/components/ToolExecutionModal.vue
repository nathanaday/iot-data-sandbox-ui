<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/vue';
import ToolParameterInput from '@/components/ToolParameterInput.vue';
import { useToolsStore } from '@/stores/tools';
import { useLayersStore } from '@/stores/layers';
import { useProjectsStore } from '@/stores/projects';
import type { ToolExecuteRequest } from '@/api';

const toolsStore = useToolsStore();
const layersStore = useLayersStore();
const projectsStore = useProjectsStore();

// Local form state
const selectedLayerId = ref<string>('');
const outputName = ref('');
const parameterValues = ref<Record<string, unknown>>({});

// Available layers for selection
const availableLayers = computed(() => {
    if (!projectsStore.selectedProjectId) return [];
    return layersStore.layers.filter(
        l => l.project_id === projectsStore.selectedProjectId
    );
});

// Current tool's user-configurable parameters (excluding dataset)
const configurableParameters = computed(() => {
    if (!toolsStore.selectedTool) return [];
    return toolsStore.selectedTool.parameters.filter(
        (p: { type: string; name: string }) => !p.type.includes('[]float64') && p.name !== 'dataset'
    );
});

// Generate default output name when tool or layer changes
watch(
    [() => toolsStore.selectedTool, selectedLayerId],
    ([tool, layerId]) => {
        if (tool && layerId) {
            const layer = layersStore.layers.find(
                l => l.data_layer_id === parseInt(layerId)
            );
            if (layer) {
                outputName.value = `${layer.name} - ${tool.name}`;
            }
        }
    }
);

// Reset form when modal opens
watch(
    () => toolsStore.isExecuteModalOpen,
    (isOpen) => {
        if (isOpen) {
            selectedLayerId.value = '';
            outputName.value = '';
            parameterValues.value = {};

            // Set default values for parameters
            if (toolsStore.selectedTool) {
                for (const param of toolsStore.selectedTool.parameters) {
                    if (param.name === 'window_size') {
                        parameterValues.value[param.name] = 5;
                    } else if (param.name === 'threshold') {
                        parameterValues.value[param.name] = 2.0;
                    } else if (param.name === 'alpha') {
                        parameterValues.value[param.name] = 0.3;
                    } else if (param.name === 'method') {
                        parameterValues.value[param.name] = 'sma';
                    }
                }
            }
        }
    }
);

// Handle form submission
async function handleExecute() {
    if (!toolsStore.selectedTool || !selectedLayerId.value || !projectsStore.selectedProjectId) {
        return;
    }

    const request: ToolExecuteRequest = {
        tool_name: toolsStore.selectedTool.name,
        source_layer_id: parseInt(selectedLayerId.value),
        project_id: projectsStore.selectedProjectId,
        output_name: outputName.value || `${toolsStore.selectedTool.name} Output`,
        parameters: { ...parameterValues.value },
    };

    try {
        const newLayer = await toolsStore.executeTool(request);

        if (newLayer) {
            // Add the new layer to the layers store
            layersStore.layers.push(newLayer);

            // Close the modal
            toolsStore.clearSelection();
        }
    } catch (err) {
        // Error is handled by the store
        console.error('Tool execution failed:', err);
    }
}

// Handle modal close
function handleClose() {
    toolsStore.clearSelection();
}

// Check if form is valid
const isFormValid = computed(() => {
    if (!selectedLayerId.value) return false;
    if (!outputName.value.trim()) return false;

    // Check required parameters
    for (const param of configurableParameters.value) {
        if (param.required && parameterValues.value[param.name] === undefined) {
            return false;
        }
    }

    return true;
});
</script>

<template>
    <Dialog :open="toolsStore.isExecuteModalOpen" @update:open="val => !val && handleClose()">
        <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <Icon icon="mdi:play-circle" class="text-xl" />
                    Execute Tool: {{ toolsStore.selectedTool?.name }}
                </DialogTitle>
                <DialogDescription>
                    {{ toolsStore.selectedTool?.description }}
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4 py-4">
                <!-- Source Layer Selection -->
                <div class="space-y-2">
                    <Label for="source-layer">Source Layer <span class="text-red-500">*</span></Label>
                    <Select v-model="selectedLayerId">
                        <SelectTrigger id="source-layer">
                            <SelectValue placeholder="Select a layer..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="layer in availableLayers"
                                :key="layer.data_layer_id"
                                :value="String(layer.data_layer_id)"
                            >
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-3 h-3 rounded-full"
                                        :style="{ backgroundColor: layer.color }"
                                    ></div>
                                    {{ layer.name }}
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p v-if="availableLayers.length === 0" class="text-xs text-muted-foreground">
                        No layers available. Load data into a layer first.
                    </p>
                </div>

                <!-- Tool Parameters -->
                <div v-if="configurableParameters.length > 0" class="space-y-4">
                    <div class="text-sm font-medium">Parameters</div>
                    <ToolParameterInput
                        v-for="param in configurableParameters"
                        :key="param.name"
                        :parameter="param"
                        v-model="parameterValues[param.name]"
                    />
                </div>

                <!-- Output Layer Name -->
                <div class="space-y-2">
                    <Label for="output-name">Output Layer Name <span class="text-red-500">*</span></Label>
                    <Input
                        id="output-name"
                        v-model="outputName"
                        placeholder="Enter a name for the output layer..."
                    />
                </div>

                <!-- Error Display -->
                <div
                    v-if="toolsStore.executionError"
                    class="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200"
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:alert-circle" class="text-lg" />
                        <span>{{ toolsStore.executionError }}</span>
                    </div>
                </div>

                <!-- Success Message -->
                <div
                    v-if="toolsStore.lastExecutionResult?.success && !toolsStore.isExecuting"
                    class="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200"
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:check-circle" class="text-lg" />
                        <span>{{ toolsStore.lastExecutionResult.result_summary.message }}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleClose" :disabled="toolsStore.isExecuting">
                    Cancel
                </Button>
                <Button
                    @click="handleExecute"
                    :disabled="!isFormValid || toolsStore.isExecuting"
                >
                    <Icon
                        v-if="toolsStore.isExecuting"
                        icon="mdi:loading"
                        class="mr-2 animate-spin"
                    />
                    <Icon v-else icon="mdi:play" class="mr-2" />
                    {{ toolsStore.isExecuting ? 'Executing...' : 'Execute' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
