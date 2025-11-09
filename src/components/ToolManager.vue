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
import { Icon } from '@iconify/vue';
</script>

<template>
    <Card class="h-full p-0 gap-0">
        <!-- Menubar -->
        <Menubar class="border-0 rounded-t-xl rounded-b-none border-b mb-4">
            <MenubarMenu>
                
            </MenubarMenu>
        </Menubar>
        <CardHeader>
            <CardTitle>Tool Manager</CardTitle>
            <CardDescription>
                Available analysis tools
            </CardDescription>
        </CardHeader>
        <CardContent>
            <!-- Tool manager content will go here -->
        </CardContent>
    </Card>

</template>