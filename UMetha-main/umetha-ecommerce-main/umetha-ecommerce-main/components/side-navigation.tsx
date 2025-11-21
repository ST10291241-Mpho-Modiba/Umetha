"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shirt,
  Baby,
  Brush,
  Home,
  Cpu,
  Gamepad2,
  Sparkles,
  Percent,
  UserCircle,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Category {
  name: string;
  href: string;
  icon: React.ElementType;
  color?: string;
}

const getCategories = (): Category[] => [
  { name: "Fashion", href: "/category/fashion", icon: Shirt, color: "from-indigo-500 to-violet-500" },
  { name: "Beauty", href: "/category/beauty", icon: Brush, color: "from-indigo-500 to-violet-500" },
  { name: "Baby Products", href: "/category/baby", icon: Baby, color: "from-indigo-500 to-violet-500" },
  { name: "Home Decor", href: "/category/home-decor", icon: Home, color: "from-indigo-500 to-violet-500" },
  { name: "Electronics", href: "/category/electronics", icon: Cpu, color: "from-indigo-500 to-violet-500" },
  { name: "Gaming", href: "/category/gaming", icon: Gamepad2, color: "from-indigo-500 to-violet-500" },
  { name: "Influencer Hub", href: "/category/influencerhub", icon: UserCircle, color: "from-indigo-500 to-blue-400" },
  { name: "Deals & Bargains", href: "/category/deals-bargains", icon: Percent, color: "from-indigo-500 to-blue-400" },
  { name: "Unique Finds", href: "/category/unique-finds", icon: Sparkles, color: "from-indigo-500 to-blue-400" },
  { name: "Virtual Try-On", href: "/virtual-tryon", icon: Camera, color: "from-pink-500 to-rose-500" },
];

interface SideNavigationProps {
  onExpandChange?: (expanded: boolean) => void;
  onClose?: () => void;
}

export default function SideNavigation({ onExpandChange, onClose }: SideNavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);

  const categories = getCategories();

  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded, onExpandChange]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const activeCategory = categories.findIndex(category => pathname.includes(category.href));
    if (activeCategory >= 0) setActiveIndex(activeCategory);
  }, [categories]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = () => {
    if (onClose) onClose();
  };

  return (
    <motion.nav
      className={cn(
        "sticky left-0 transition-all duration-300",
        expanded ? "w-[280px] px-4" : "w-[80px] px-2",
        "bg-white dark:bg-gray-900 overflow-hidden"
      )}
      animate={{ width: expanded ? 280 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="relative">
        {/* Categories */}
        <div className="space-y-1.5">
          {categories.map((category, index) => {
            const isActive = activeIndex === index;
            const isInfluencer = category.name === "Influencer Hub";

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <Link
                  href={category.href}
                  onClick={handleCategoryClick}
                  className={cn(
                    "flex items-center gap-3 w-full p-1 rounded-lg transition-all duration-300",
                    isActive
                      ? "bg-indigo-50 dark:bg-violet-900/20"
                      : "hover:bg-indigo-50/50 dark:hover:bg-violet-900/10"
                  )}
                >
                  {/* Icon container */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-full",
                      `bg-gradient-to-br ${category.color}`
                    )}
                  >
                    <category.icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Category name */}
                  {expanded && (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-indigo-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-200"
                      )}
                    >
                      {category.name}
                    </span>
                  )}
                </Link>

                {isInfluencer && <SparklesEffect color={category.color || ""} />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

function SparklesEffect({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 pointer-events-none"
    >
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute w-1 h-1 rounded-full", `bg-gradient-to-r ${color}`)}
          initial={{ x: "50%", y: "50%", scale: 0, opacity: 0 }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1, delay: i * 0.1, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
    </motion.div>
  );
}
