import SiteLinkCard from "@/components/portal/site-link-card"
import { Button } from "@heroui/button"
import { PiGearDuotone } from "react-icons/pi"
import SettingsModal, { Settings } from "@/components/portal/settings-modal"
import useApi from "@/hooks/useApi"
import { useEffect, useState } from "react"
import { IResponseSchema } from "@/types/api/i"

export default function PortalPage() {
  const siteLinks: Parameters<typeof SiteLinkCard>[0][] = [
    {
      siteName: "さざなみスタンプラリー",
      siteUrl: "srally.nem.one",
      siteIconUrl: "https://github.com/r-ca.png",
      siteDescription: "すたんぷらりー",
      siteTags: [
        { label: "さざなみ開発", color: "primary", variant: "bordered" },
        { label: "要認証", color: "warning", variant: "dot" },
      ],
      linkUrl: "https://srally.nem.one",
    },
    {
      siteName: "さざなみスタンプラリー",
      siteUrl: "srally.nem.one",
      siteIconUrl: "https://github.com/r-ca.png",
      siteDescription: "すたんぷらりー",
      siteTags: [
        { label: "さざなみ開発", color: "primary", variant: "bordered" },
        { label: "要認証", color: "warning", variant: "dot" },
      ],
      linkUrl: "https://srally.nem.one",
    },
    {
      siteName: "さざなみスタンプラリー",
      siteUrl: "srally.nem.one",
      siteIconUrl: "https://github.com/r-ca.png",
      siteDescription: "すたんぷらりー",
      siteTags: [
        { label: "さざなみ開発", color: "primary", variant: "bordered" },
        { label: "要認証", color: "warning", variant: "dot" },
      ],
      linkUrl: "https://srally.nem.one",
    },
    {
      siteName: "さざなみスタンプラリー",
      siteUrl: "srally.nem.one",
      siteIconUrl: "https://github.com/r-ca.png",
      siteDescription: "すたんぷらりー",
      siteTags: [
        { label: "さざなみ開発", color: "primary", variant: "bordered" },
        { label: "要認証", color: "warning", variant: "dot" },
      ],
      linkUrl: "https://srally.nem.one",
    },
    {
      siteName: "さざなみスタンプラリー",
      siteUrl: "srally.nem.one",
      siteIconUrl: "https://github.com/r-ca.png",
      siteDescription: "すたんぷらりー",
      siteTags: [
        { label: "さざなみ開発", color: "primary", variant: "bordered" },
        { label: "要認証", color: "warning", variant: "dot" },
      ],
      linkUrl: "https://srally.nem.one",
    }
  ]

  const [settings, setSettings] = useState<Settings>({ displayName: "" });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Modal
  useEffect(() => {
    const api = useApi();
    api.get("/i").then((response) => {
      const data = IResponseSchema.parse(response.data);
      setSettings({ displayName: data.displayName || "" });
    }).catch((error) => {
      console.error("Failed to fetch user info:", error);
    });
  }, []);

  async function updateSettings(newSettings: Settings) {
    const api = useApi();
    try {
      await api.put("/i", {
        displayName: newSettings.displayName,
      });
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  }


  return <>
    <div className="container mx-auto p-4">
      <header className="flex flex-row justify-between items-center mb-4">
        <h1 className="text-2xl">ポータル</h1>
        <Button isIconOnly variant="bordered" size="md" onPress={() => setIsSettingsModalOpen(true)}>
          <PiGearDuotone className="text-xl" />
        </Button>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center w-full">
        {siteLinks.map((siteLink, index) => (
          <SiteLinkCard key={index} {...siteLink} />
        ))}
      </div>
    </div>
    <SettingsModal
      isOpen={isSettingsModalOpen}
      currentSettings={settings}
      onSave={updateSettings}
      onClose={() => setIsSettingsModalOpen(false)}
    />
  </>
}
