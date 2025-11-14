import SiteLinkCard from "@/components/portal/site-link-card"
import { Button } from "@heroui/button"
import { PiGearDuotone } from "react-icons/pi"
import SettingsModal, { Settings } from "@/components/portal/settings-modal"
import useApi from "@/hooks/useApi"
import { useEffect, useState } from "react"
import { IResponseSchema } from "@/types/api/i"
import RequireAuthModal from "@/components/portal/require-auth-modal"
import useEnv from "@/hooks/useEnv"

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
      requireAuth: true,
    },
    {
      siteName: "学園祭オンラインパンフレット",
      siteUrl: "fes.sazanami.dev",
      siteIconUrl: "https://github.com/r-ca.png",
      siteDescription: "",
      siteTags: [
        { label: "さざなみ開発", color: "primary", variant: "bordered" },
        { label: "認証不要", color: "primary", variant: "bordered" },
      ],
      linkUrl: "https://fes.sazanami.dev",
      requireAuth: false,
    }
  ]

  const [settings, setSettings] = useState<Settings>({ displayName: "" });
  const [isLoggedInState, setIsLoggedInState] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRequireAuthModalOpen, setIsRequireAuthModalOpen] = useState(false);

  const baseUrl = useEnv('API_BASE_URL', 'http://localhost:3000'); // APIではないけどバックエンドのベースURLと同義なので

  // Modal
  useEffect(() => {
    fetchSettings();
    isLoggedIn().then((loggedIn) => {
      setIsLoggedInState(loggedIn);
    });
  }, []);

  async function fetchSettings() {
    if (!isLoggedInState) {
      return
    }
    const api = useApi();
    api.get("/i").then((response) => {
      const data = IResponseSchema.parse(response.data);
      setSettings({ displayName: data.displayName || "" });
    }).catch((error) => {
      console.error("Failed to fetch user info:", error);
    });
  }

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

    fetchSettings();
  }

  async function isLoggedIn(): Promise<boolean> {
    const api = useApi();
    try {
      const response = await api.get("/check");
      if (response.status === 200) {
        return true;
      } else if (response.status === 401) {
        return false;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  function jumpToPage(url: string) {
    window.open(url, "_blank");
  }

  const [authWaitingUrl, setAuthWaitingUrl] = useState<string | null>(null);

  function handleSiteLinkClick(url: string, requireAuth: boolean) {
    if (requireAuth && !isLoggedInState) {
      setAuthWaitingUrl(url);
      setIsRequireAuthModalOpen(true);
    } else {
      jumpToPage(url);
    }
  }

  return <>
    <div className="container mx-auto p-4">
      <header className="flex flex-row justify-between items-center mb-4">
        <h1 className="text-2xl">ポータル</h1>
        {isLoggedInState &&
          <Button isIconOnly variant="bordered" size="md" onPress={() => setIsSettingsModalOpen(true)}>
            <PiGearDuotone className="text-xl" />
          </Button>
        }
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center w-full">
        {siteLinks.map((siteLink, index) => (
          <SiteLinkCard key={index} {...siteLink} onJumpClicked={(url) => handleSiteLinkClick(url, siteLink.requireAuth)} />
        ))}
      </div>
    </div>
    <SettingsModal
      isOpen={isSettingsModalOpen}
      currentSettings={settings}
      onSave={updateSettings}
      onClose={() => setIsSettingsModalOpen(false)}
    />
    <RequireAuthModal
      isOpen={isRequireAuthModalOpen}
      onClose={() => {
        setIsRequireAuthModalOpen(false)
        setAuthWaitingUrl(null);
      }}
      onBeforeAuth={() => {
        jumpToPage(`${baseUrl}/fe/reauth`);
      }}
      onProceedWithoutAuth={() => {
        if (authWaitingUrl) {
          jumpToPage(authWaitingUrl);
        }
      }}
    />
  </>
}
