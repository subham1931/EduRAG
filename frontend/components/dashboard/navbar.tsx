"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, GraduationCap, Plus, LogOut, Sun, Moon, Monitor, Search } from "lucide-react";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";

interface NavbarProps {
  onSubjectCreated: () => void;
}

export function Navbar({ onSubjectCreated }: NavbarProps) {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const { subjects, quizTitle } = useDashboard();

  const currentSubject = subjects.find(s => s.id === subjectId);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/subjects", { name, description: description || null });
      setName("");
      setDescription("");
      setIsOpen(false);
      onSubjectCreated();
    } catch (err) {
      console.error("Failed to create subject:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline-block text-sm font-semibold">
              EduRAG
            </span>
          </Link>

          {currentSubject && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/dashboard/${subjectId}`}
                className={`font-medium truncate max-w-[150px] sm:max-w-[250px] transition-colors hover:text-foreground ${params.quizId ? "" : "text-foreground"}`}
              >
                {currentSubject.name}
              </Link>
              {params.quizId && quizTitle && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[250px]">
                    {quizTitle}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center relative text-muted-foreground hover:text-foreground transition-colors mr-2">
            <Search className="h-4 w-4 absolute left-3" />
            <input
              placeholder="Search subjects..."
              className="h-9 w-[200px] xl:w-[300px] rounded-md border bg-muted/50 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full px-3 sm:px-4">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Subject</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to organize your teaching materials.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Physics 101"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className="h-11 w-full rounded-lg text-base"
                >
                  {loading ? "Creating..." : "Create Subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {mounted ? (
                  theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
