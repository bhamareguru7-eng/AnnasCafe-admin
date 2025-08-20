"use client"

import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, BarChart3, ShoppingCart, Search, Bell, User, Menu, X } from 'lucide-react';
import LiveOrders from './LiveOrders';
import UpdateItem from './UpdateItem';
import Analysis from './Analytics';

const TabsLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("live-orders");

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // Auto-close sidebar when resizing to desktop
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const tabs = [
    { id: "live-orders", label: "Live Orders", icon: ShoppingCart },
    { id: "update-item", label: "Update Item", icon: ChefHat },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-4">
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
            <h1 className="text-xl font-bold text-orange-500">
              Restaurant Dashboard
            </h1>
          </div>
          
          
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg
                      transition-colors duration-200
                      ${activeTab === tab.id 
                        ? 'bg-orange-500 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-transperant bg-opacity-10 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`
          flex-1 min-h-screen
          ${!isMobile ? 'ml-64' : ''}
          transition-all duration-300 ease-in-out
          ${isMobile ? 'p-3' : 'p-6'}
        `}>
          {activeTab === "live-orders" && <LiveOrders />}
          {activeTab === "update-item" && <UpdateItem />}
          {activeTab === "analytics" && <Analysis/>}
        </main>
      </div>
    </div>
  );
};

export default TabsLayout;