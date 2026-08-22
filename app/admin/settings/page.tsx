"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VodSource } from "@/types/drama";
import { Toast, ConfirmDialog } from "@/components/Toast";
import type { PlayerConfig } from "@/app/api/player-config/route";
import { VodSourcesTab } from "@/components/admin/VodSourcesTab";
import { PlayerConfigTab } from "@/components/admin/PlayerConfigTab";
import { DatabaseSettingsTab } from "@/components/admin/DatabaseSettingsTab";
import type {
  ToastState,
  ConfirmState,
} from "@/components/admin/types";
import { Tv, Settings, Database } from "lucide-react";

type TabType = "sources" | "player" | "database";

const VALID_TABS: TabType[] = ["sources", "player", "database"];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从 URL 读取初始 tab
  const getInitialTab = (): TabType => {
    const urlTab = searchParams.get("tab");
    if (urlTab && VALID_TABS.includes(urlTab as TabType)) {
      return urlTab as TabType;
    }
    return "sources";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [sources, setSources] = useState<VodSource[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // 切换 tab 时更新 URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const vodResponse = await fetch("/api/vod-sources");
        const vodResult = await vodResponse.json();

        if (vodResult.code === 200 && vodResult.data) {
          setSources(vodResult.data.sources || []);
          setSelectedKey(vodResult.data.selected?.key || "");
        }

        // 加载播放器配置
        const playerResponse = await fetch("/api/player-config");
        const playerResult = await playerResponse.json();

        if (playerResult.code === 200 && playerResult.data) {
          setPlayerConfig(playerResult.data);
        }
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : "加载配置失败",
          type: "error",
        });
      }
    };

    loadSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const tabs = [
    { id: "sources" as TabType, name: "视频源管理", icon: Tv },
    { id: "player" as TabType, name: "播放器设置", icon: Settings },
    { id: "database" as TabType, name: "数据库", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Header - Netflix Style */}
      <div className="bg-[#141414] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-[#E50914]">壳儿</h1>
            <span className="text-white text-lg">系统设置</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Tabs Navigation - Netflix Style */}
      <div className="bg-[#181818] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-4 text-sm font-medium transition-all relative ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-[#808080] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={18} strokeWidth={1.5} />
                    <span>{tab.name}</span>
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E50914]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "sources" && (
          <VodSourcesTab
            sources={sources}
            selectedKey={selectedKey}
            onSourcesChange={setSources}
            onSelectedKeyChange={setSelectedKey}
            onShowToast={setToast}
            onShowConfirm={setConfirm}
          />
        )}

        {activeTab === "player" && playerConfig && (
          <PlayerConfigTab
            playerConfig={playerConfig}
            onConfigChange={setPlayerConfig}
            onShowToast={setToast}
            onShowConfirm={setConfirm}
          />
        )}

        {activeTab === "database" && (
          <DatabaseSettingsTab
            onShowToast={setToast}
          />
        )}
      </div>

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 确认对话框 */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          danger={confirm.danger}
        />
      )}
    </div>
  );
}

// 加载占位符
function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-red-600 mx-auto mb-4" />
        <p className="text-gray-400">加载中...</p>
      </div>
    </div>
  );
}

// 主页面组件 - 用 Suspense 包装
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
