<script setup lang="ts">
import { ref } from 'vue';
import DataSourceList from '@/components/DataSourceList.vue';
import DataSourceUpload from '@/components/DataSourceUpload.vue';
import NavHeader from '@/components/NavHeader.vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const listKey = ref(0);

// Force refresh the list when a new datasource is uploaded
const handleUploaded = () => {
    listKey.value++;
};
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm">
            <NavHeader />
        </header>

        <main class="container mx-auto px-2 py-4">
            <ResizablePanelGroup direction="horizontal" class="gap-2 min-h-[600px]">
                <!-- Left Panel: Tool Manager -->
                <ResizablePanel 
                    :default-size="25" 
                    :max-size="50"
                    :min-size="10"
                    :collapsible="true"
                    :collapsed-size="0"
                >
                    <Card class="h-full">
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
                </ResizablePanel>

                <!-- Left Resize Handle -->
                <ResizableHandle with-handle />

                <!-- Center Panel: Data Visualization -->
                <ResizablePanel :default-size="50" :min-size="30">
                    <div class="flex flex-col gap-2 h-full">
                        <!-- Menubar -->
                        <div class="bg-white rounded-lg border shadow-sm">
                            <Menubar class="border-0">
                                <MenubarMenu>
                                    <MenubarTrigger>File</MenubarTrigger>
                                    <MenubarContent>
                                        <MenubarItem>
                                            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarItem>
                                            New Window <MenubarShortcut>⌘N</MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarSeparator />
                                        <MenubarItem>
                                            Print... <MenubarShortcut>⌘P</MenubarShortcut>
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
                                        <MenubarSeparator />
                                        <MenubarItem>Cut</MenubarItem>
                                        <MenubarItem>Copy</MenubarItem>
                                        <MenubarItem>Paste</MenubarItem>
                                    </MenubarContent>
                                </MenubarMenu>
                                <MenubarMenu>
                                    <MenubarTrigger>View</MenubarTrigger>
                                    <MenubarContent>
                                        <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
                                        <MenubarCheckboxItem :model-value="true">
                                            Always Show Full URLs
                                        </MenubarCheckboxItem>
                                        <MenubarSeparator />
                                        <MenubarItem inset>
                                            Reload <MenubarShortcut>⌘R</MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarSeparator />
                                        <MenubarItem inset>
                                            Toggle Fullscreen
                                        </MenubarItem>
                                    </MenubarContent>
                                </MenubarMenu>
                            </Menubar>
                        </div>

                        <!-- Data Viewer Card -->
                        <Card class="flex-1">
                            <CardHeader>
                                <CardTitle>Data Viewer Area</CardTitle>
                                <CardDescription>
                                    View and interact with the data visualization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <!-- Data visualization content will go here -->
                            </CardContent>
                        </Card>
                    </div>
                </ResizablePanel>

                <!-- Right Resize Handle -->
                <ResizableHandle with-handle />

                <!-- Right Panel: Layer Manager -->
                <ResizablePanel 
                    :default-size="25" 
                    :max-size="50"
                    :min-size="10"
                    :collapsible="true"
                    :collapsed-size="0"
                >
                    <Card class="h-full">
                        <CardHeader>
                            <CardTitle>Layer Manager</CardTitle>
                            <CardDescription>
                                View and edit layers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <!-- Layer manager content will go here -->
                        </CardContent>
                    </Card>
                </ResizablePanel>
            </ResizablePanelGroup>
        </main>
    </div>
</template>

<style scoped>
.container {
    max-width: 1400px;
}
</style>
