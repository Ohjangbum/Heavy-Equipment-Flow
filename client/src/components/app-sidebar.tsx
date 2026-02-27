import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Receipt,
  ShoppingCart,
  Search,
  Users,
  Wrench,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Quotations", url: "/quotations", icon: FileText },
  { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
  { title: "Work Orders", url: "/work-orders", icon: ClipboardList },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Search", url: "/search", icon: Search },
  { title: "Users", url: "/users", icon: Users },
];

const technicianItems = [
  { title: "My Work Orders", url: "/", icon: Wrench },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const isAdmin = (user as any).role === "admin";
  const items = isAdmin ? adminItems : technicianItems;

  const initials = [
    (user as any).firstName?.[0] || "",
    (user as any).lastName?.[0] || "",
  ].join("").toUpperCase() || "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Workshop Manager</p>
            <p className="text-xs text-muted-foreground">CV USB DocFlow</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Management" : "Tasks"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={(user as any).profileImageUrl || ""} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {(user as any).firstName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {(user as any).role || "technician"}
            </p>
          </div>
          <a href="/api/logout" data-testid="button-logout">
            <Button size="icon" variant="ghost">
              <LogOut className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
