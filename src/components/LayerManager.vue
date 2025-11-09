<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from '@/components/ui/menubar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icon } from '@iconify/vue';

const cardRef = ref<any>(null);
const isNarrow = ref(false);
const MIN_WIDTH = 178;

let resizeObserver: ResizeObserver | null = null;

const handleAddLayer = () => {
    // Add your layer creation logic here
    console.log('Add Layer clicked');
};

const handleSelectLayers = () => {
    // Add your layer selection logic here
    console.log('Select Layers clicked');
};

const checkWidth = (width: number) => {
    isNarrow.value = width < MIN_WIDTH;
};

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

        <CardHeader>
            <CardTitle>Layer Manager</CardTitle>
            <CardDescription>
                Layer management
            </CardDescription>
        </CardHeader>
        <CardContent>
            <!-- Tool manager content will go here -->
        </CardContent>
    </Card>

</template>