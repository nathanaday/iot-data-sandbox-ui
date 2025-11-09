<script setup lang="ts">
import { ref } from 'vue';
import {
    Menubar,
    MenubarCheckboxItem,
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

const showNewProjectModal = ref(false);
const showOpenProjectModal = ref(false);
const showManageProjectsModal = ref(false);
</script>

<template>
    <Card class="h-full p-0 gap-0">
        <!-- Menubar -->
        <Menubar class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <MenubarMenu>
                <MenubarTrigger>Project</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem @click="showNewProjectModal = true">
                        New Project <MenubarShortcut>⌘N</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem @click="showOpenProjectModal = true">
                        Open Project <MenubarShortcut>⌘O</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem @click="showManageProjectsModal = true">
                        Manage Projects <MenubarShortcut>⌘M</MenubarShortcut>
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
            <CardTitle>Plot Manager</CardTitle>
            <CardDescription>
                Plot vis 
            </CardDescription>
        </CardHeader>
        <CardContent>
            <!-- Tool manager content will go here -->
        </CardContent>
    </Card>

    <!-- New Project Modal -->
    <ModalNewProject v-model:open="showNewProjectModal" />
    
    <!-- Open Project Modal (Select Mode) -->
    <ModalManageProjects v-model:open="showOpenProjectModal" mode="select" />
    
    <!-- Manage Projects Modal (Manage Mode) -->
    <ModalManageProjects v-model:open="showManageProjectsModal" mode="manage" />
</template>