<script setup lang="ts">
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ParameterDefinition } from '@/api';

const props = defineProps<{
    parameter: ParameterDefinition;
    modelValue: unknown;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void;
}>();

// Determine input type based on parameter type
const inputType = computed(() => {
    const type = props.parameter.type.toLowerCase();
    if (type.includes('float') || type.includes('int') || type === 'number') {
        return 'number';
    }
    if (type === 'boolean' || type === 'bool') {
        return 'boolean';
    }
    if (type === 'string' && props.parameter.name === 'method') {
        return 'select';
    }
    return 'text';
});

// Get select options for method parameter
const selectOptions = computed(() => {
    if (props.parameter.name === 'method') {
        return [
            { value: 'sma', label: 'Simple Moving Average' },
            { value: 'ema', label: 'Exponential Moving Average' },
            { value: 'median', label: 'Median Filter' },
        ];
    }
    return [];
});

// Handle input changes
function handleNumberChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value === '' ? undefined : parseFloat(target.value);
    emit('update:modelValue', value);
}

function handleTextChange(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.value || undefined);
}

function handleBooleanChange(checked: boolean) {
    emit('update:modelValue', checked);
}

function handleSelectChange(value: unknown) {
    emit('update:modelValue', value ?? undefined);
}

// Check if this parameter should be hidden (dataset is auto-injected)
const isHidden = computed(() => {
    return props.parameter.type.includes('[]float64') || props.parameter.name === 'dataset';
});
</script>

<template>
    <div v-if="!isHidden" class="space-y-2">
        <Label :for="parameter.name" class="text-sm font-medium">
            {{ parameter.name }}
            <span v-if="parameter.required" class="text-red-500">*</span>
        </Label>

        <!-- Number input -->
        <Input
            v-if="inputType === 'number'"
            :id="parameter.name"
            type="number"
            :value="modelValue as number"
            :placeholder="parameter.description"
            :required="parameter.required"
            step="any"
            @input="handleNumberChange"
        />

        <!-- Text input -->
        <Input
            v-else-if="inputType === 'text'"
            :id="parameter.name"
            type="text"
            :value="modelValue as string"
            :placeholder="parameter.description"
            :required="parameter.required"
            @input="handleTextChange"
        />

        <!-- Boolean switch -->
        <div v-else-if="inputType === 'boolean'" class="flex items-center space-x-2">
            <Switch
                :id="parameter.name"
                :checked="modelValue as boolean"
                @update:checked="handleBooleanChange"
            />
            <span class="text-sm text-muted-foreground">{{ parameter.description }}</span>
        </div>

        <!-- Select dropdown -->
        <Select
            v-else-if="inputType === 'select'"
            :model-value="modelValue as string"
            @update:model-value="handleSelectChange"
        >
            <SelectTrigger>
                <SelectValue :placeholder="parameter.description" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem
                    v-for="option in selectOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </SelectItem>
            </SelectContent>
        </Select>

        <!-- Description -->
        <p v-if="inputType !== 'boolean'" class="text-xs text-muted-foreground">
            {{ parameter.description }}
        </p>
    </div>
</template>
