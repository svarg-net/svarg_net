"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import "@/styles/post-form.css";

export type Tab = {
  id: string;
  label: string;
  icon?: string;
  /** Показывает индикатор незаполненности/ошибки на вкладке */
  hasIssue?: boolean;
};

type Props = {
  tabs: Tab[];
  /** Базовый URL для параметров (по умолчанию текущий pathname) */
  basePath?: string;
};

export default function AdminTabs({ tabs, basePath }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = searchParams.get("tab") || tabs[0]?.id || "";
  const base = basePath ?? pathname;

  return (
    <div className="admin-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const href = `${base}?tab=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={"admin-tab" + (isActive ? " admin-tab--active" : "")}
          >
            {tab.icon && <span className="admin-tab-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.hasIssue && <span className="admin-tab-dot" aria-label="требует внимания" />}
          </Link>
        );
      })}
    </div>
  );
}

export function useActiveTab(tabs: Tab[]): string {
  const searchParams = useSearchParams();
  const current = searchParams.get("tab");
  if (current && tabs.some((t) => t.id === current)) return current;
  return tabs[0]?.id || "";
}
