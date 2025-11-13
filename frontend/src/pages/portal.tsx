import SiteLinkCard from "@/components/portal/site-link-card"

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

  return <>
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">ポータル</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center w-full">
        {siteLinks.map((siteLink, index) => (
          <SiteLinkCard key={index} {...siteLink} />
        ))}
      </div>
    </div>
  </>
}
