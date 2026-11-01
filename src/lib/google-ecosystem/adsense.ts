// AdSense governance: paid subscribers never see ads.
export const ADSENSE_PUBLISHER_ID = "pub-3443455318197857";

export function shouldHideAds(args: { adsenseEnabled: boolean; hasActivePlan: boolean }): boolean {
  if (!args.adsenseEnabled) return true; // site doesn't run ads at all
  return args.hasActivePlan;
}
