import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { PiArrowSquareOutDuotone } from "react-icons/pi";

type SiteLinkCardProps = {
  siteName: string;
  siteUrl: string;
  siteIconUrl?: string | null;
  siteDescription: string;
  siteTags: {
    label: string;
    color: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    variant: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "dot";
  }[];
  linkUrl: string;
  requireAuth: boolean;
  onJumpClicked?: (linkUrl: string) => void;
}

export default function SiteLinkCard(props: SiteLinkCardProps) {
  const { siteName, siteUrl, siteIconUrl, siteDescription, siteTags, linkUrl, onJumpClicked } = props;

  return <>
    <Card className="max-w-[500px] w-full">
      <CardHeader className="flex gap-3">
        {siteIconUrl &&
          <Image
            alt="サイトアイコン"
            height={40}
            radius="sm"
            src={siteIconUrl || ""}
            width={40}
          />
        }
        <div className="flex flex-col">
          <p className="text-md">{siteName}</p>
          <p className="text-small text-default-500">{siteUrl}</p>
        </div>
        <div className="ml-auto flex items-center">
          <Button variant="bordered" size="md" isIconOnly onPress={() => onJumpClicked(linkUrl)}>
            <PiArrowSquareOutDuotone className="text-lg" />
          </Button>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <p>{siteDescription}</p>
      </CardBody>
      <Divider />
      <CardFooter>
        <div className="flex gap-2">
          {siteTags.map((tag, index) => (
            <Chip key={index} color={tag.color} variant={tag.variant}>
              {tag.label}
            </Chip>
          ))}
        </div>
      </CardFooter>
    </Card>
  </>
}
