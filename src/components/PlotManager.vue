<script setup lang="ts">
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
</script>

<template>
    <Card class="h-full p-0 gap-0">
        <!-- Menubar -->
        <Menubar class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <MenubarMenu>
                <MenubarTrigger>Project</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                        New Project <MenubarShortcut>⌘N</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Open Project <MenubarShortcut>⌘O</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>
                        Save Project <MenubarShortcut>⌘S</MenubarShortcut>
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

</template>