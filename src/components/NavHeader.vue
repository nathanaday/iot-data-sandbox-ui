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

import githubMark from "@/assets/github-mark.svg"

const components: { title: string, icon: string, href: string, description: string }[] = [
    {
        title: "GitHub",
        icon: githubMark,
        href: "https://github.com/nathanaday/iot-data-sandbox",
        description:
            "Backend Source Code",
    },
    {
        title: "GitHub",
        icon: githubMark,
        href: "https://github.com/nathanaday/iot-data-sandbox-ui",
        description:
            "Frontend Source Code",
    },

]
</script>

<template>
    <NavigationMenu class="py-4">
        <NavigationMenuList class="flex h-full">

            <div class="flex items-center flex-1 h-full px-4">
                <img src="@/assets/Vector-3.svg" class="h-8 w-8 mr-2">
                <span class="text-2xl font-semibold text-gray-700">IoT Data Sandbox</span>
            </div>
            <NavigationMenuItem class="flex">

                <!-- Title -->
                <NavigationMenuTrigger class="flex items-center flex-1 h-full">Project Dataset</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul class="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)]">
                        <li class="row-span-3">
                            <NavigationMenuItem as-child>
                                <div
                                    class="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                                    <img src="@/assets/folder_code_24dp.svg" class="h-6 w-6">
                                </div>
                            </NavigationMenuItem>
                        </li>

                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem class="flex">
                <NavigationMenuTrigger class="flex items-center flex-1 h-full !h-full">Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul class="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                        <li v-for="component in components" :key="component.title">
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
    </NavigationMenu>
</template>