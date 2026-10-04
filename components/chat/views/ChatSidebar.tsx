"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useChat } from "@/components/chat/context/ChatProvider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Trash2, Search, LayoutDashboard, Map, CloudSun, MessageSquare, PhoneCall, LogOut, Settings, Plus } from "lucide-react"


const DIRECTORIES = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Map", href: "/map", icon: Map },
  { label: "Radar", href: "/pagasa", icon: CloudSun },
  { label: "Call", href: "/emergency", icon: PhoneCall },
  { label: "Chat", href: "/chat", icon: MessageSquare }
]
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"

export function ChatSidebar() {
  const {
    conversations,
    activeId,
    setActiveId,
    createNewConversation,
    deleteConversation,
    user,
    checkingAuth,
    handleLogout,
    hasMessages
  } = useChat()
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations
    .filter(c => c.messages.length > 0)
    .filter(c => searchQuery.trim() === "" || c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Sidebar className="font-sans border-r border-sidebar-border">
      {/* Top Header */}
      <SidebarHeader className="px-3 py-4 flex flex-col gap-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          id="chat-sidebar-brand-link"
        >
          <span className="text-sm font-sans font-semibold tracking-wide text-sidebar-foreground group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:inline-block">
            ResilientPH
          </span>
          <span className="hidden group-data-[state=collapsed]:block group-data-[state=collapsed]:group-hover:hidden text-sm font-bold text-primary">
            R
          </span>
        </Link>

        {/* Search input */}
        <div className="relative group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id="chat-sidebar-search"
            name="search"
            placeholder="Search chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-muted/50 border-border/50 rounded-lg focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* New Chat Button (Mobile Only) */}
        <div className="group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block mt-1 md:hidden">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9 text-xs font-semibold cursor-pointer rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
            onClick={() => {
              createNewConversation()
              setOpenMobile(false)
              if (pathname !== "/chat") {
                router.push("/chat")
              }
            }}
          >
            <Plus className="size-3.5" />
            New Chat
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4 space-y-6">
        {/* Portal Navigation */}
        <SidebarGroup className="p-0 hidden md:flex">
          <SidebarGroupLabel className="px-3 text-micro text-sidebar-muted-foreground mb-1.5 group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DIRECTORIES.map((item, index) => {
                const isActive =
                  item.href === "/chat"
                    ? pathname === "/chat" && !hasMessages
                    : pathname === item.href
                const Icon = item.icon

                // Calculate transition type dynamically based on current route index
                const currentNavIndex = DIRECTORIES.findIndex((nav) => nav.href === pathname)
                const transitionType = currentNavIndex !== -1 && index < currentNavIndex ? "nav-back" : "nav-forward"

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      asChild
                      className="text-sm font-medium"
                      onClick={() => {
                        if (item.href === "/chat" && pathname === "/chat") {
                          createNewConversation()
                        }
                      }}
                    >
                      <Link
                        href={item.href}
                        transitionTypes={[transitionType]}
                        id={`chat-sidebar-nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        aria-label={`Go to ${item.label}`}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recents */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-micro text-sidebar-muted-foreground mb-1.5 group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">
            Recents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredConversations.length === 0 ? (
                <div className="px-3 py-2 text-xs text-sidebar-muted-foreground group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">
                  {searchQuery.trim() ? "No matching chats" : "No recent chats"}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = pathname === "/chat" && conv.id === activeId
                  return (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => {
                          setActiveId(conv.id)
                          setOpenMobile(false)
                          if (pathname !== "/chat") {
                            router.push("/chat")
                          }
                        }}
                        className="text-sm"
                      >
                        <span className="flex-1 min-w-0 truncate text-left group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">{conv.title}</span>
                      </SidebarMenuButton>

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <SidebarMenuAction
                                showOnHover
                                onClick={(e) => e.stopPropagation()}
                                className="text-sidebar-muted-foreground hover:text-destructive transition-colors focus-visible:ring-1 focus-visible:ring-sidebar-ring focus:outline-none"
                                aria-label="Delete chat"
                              >
                                <Trash2 className="size-3.5" />
                              </SidebarMenuAction>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Delete chat</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this conversation? This will permanently delete all messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id, e);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom Profile Section */}
      <SidebarFooter className="p-3 border-t border-sidebar-border shrink-0">
        {checkingAuth ? (
          <div className="flex items-center justify-center p-2 text-xs text-sidebar-muted-foreground">
            <Spinner />
          </div>
        ) : user ? (
          <div className="flex items-center justify-between w-full p-2 rounded-xl group">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 select-none">
              <Avatar className="size-7 bg-primary text-primary-foreground font-sans text-xs font-bold uppercase shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground font-sans text-xs font-bold uppercase">
                  {user.user_metadata?.username?.slice(0, 1) || user.email?.slice(0, 1) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:flex">
                <span className="text-sm font-medium truncate text-sidebar-foreground">
                  {user.user_metadata?.username || "Authorized User"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMobile(false);
                      router.push("/profile");
                    }}
                    className="h-7 w-7 rounded-full text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors opacity-100 focus-visible:ring-1 focus-visible:ring-sidebar-ring focus:outline-none group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:inline-flex"
                    aria-label="Profile Settings"
                    id="sidebar-profile-settings-btn"
                  >
                    <Settings className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="h-7 w-7 rounded-full text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors opacity-100 focus-visible:ring-1 focus-visible:ring-sidebar-ring focus:outline-none group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:inline-flex"
                    aria-label="Log out"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          <Card className="p-3 border-none bg-sidebar-accent/50 rounded-xl shadow-none group-data-[state=collapsed]:hidden group-data-[state=collapsed]:group-hover:block">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-medium text-sidebar-foreground">Sign in to save your chats</CardTitle>
              <CardDescription className="text-sm text-sidebar-muted-foreground mt-1">
                Once you&apos;re signed in, you can access your recent chats here.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-3">
              <Button asChild size="sm" className="w-full rounded-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 font-sans h-9">
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
