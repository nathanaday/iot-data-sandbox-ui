<script setup lang="ts">
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { computed } from "vue"

import { Kbd } from "@/components/ui/kbd"
import githubMark from "@/assets/github-mark.svg"

import { useProjectsStore } from "@/stores/projects"
const projectsStore = useProjectsStore()
const currentProject = computed(() => projectsStore.currentProject?.name)

const contribute_links: { title: string, icon: string, href: string, description: string }[] = [
    {
        title: "iot-data-sandbox",
        icon: githubMark,
        href: "https://github.com/nathanaday/iot-data-sandbox",
        description:
            "Backend Source Code",
    },
    {
        title: "iot-data-sandbox-ui",
        icon: githubMark,
        href: "https://github.com/nathanaday/iot-data-sandbox-ui",
        description:
            "Frontend Source Code",
    }

]
</script>

<template>
    <NavigationMenu class="w-full max-w-full py-4 flex items-center justify-start">

        <NavigationMenuList class="flex h-full">

            <div class="flex items-center flex-1 h-full ml-4 mr-1">
                <img src="@/assets/Vector-3.svg" class="h-8 w-8">
            </div>

            <NavigationMenuItem class="flex">
                <!-- Title -->
                <NavigationMenuTrigger class="flex flex-1 h-full justify-center">Learn</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul class="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)]">
                        <li class="row-span-3">
                            <NavigationMenuItem as-child>
                                TODO
                            </NavigationMenuItem>
                        </li>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem class="flex">
                <NavigationMenuTrigger class="flex items-center flex-1 h-full !h-full">Contribute
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul class="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                        <li v-for="component in contribute_links" :key="component.title">
                            <NavigationMenuLink as-child>
                                <a :href="component.href"
                                    class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                    <div class="flex items-center">
                                        <img :src="component.icon" class="h-4 w-4">
                                        <div class="text-sm font-medium leading-none ml-1">{{ component.title }}</div>
                                    </div>
                                    <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                        {{ component.description }}
                                    </p>
                                </a>
                            </NavigationMenuLink>
                        </li>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </NavigationMenuList>


        <div class="px-4">
            <div class="text-sm font-medium leading-none text-gray-600">{{ currentProject ? currentProject : "No Project Selected" }}</div>
        </div>
        
        <div class="flex-1"></div>
        <div class="flex items-center h-full px-4 gap-4">
            <span class="text-2xl font-semibold text-gray-600">IoT Data Sandbox</span>
            <Kbd>v.0.1.0</Kbd>
        </div>
    </NavigationMenu>
</template>