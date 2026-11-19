import { redirect } from "next/navigation";

/** Clean Instagram Story sticker route: smakr.no/popups → /?tab=popups */
export default function PopupsRedirectPage() {
  redirect("/?tab=popups");
}
