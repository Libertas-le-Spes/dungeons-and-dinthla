import type { Dialogs } from "../../views/dialogs/dialog-view";
import { CarryingNoticeDialog } from "./carrying-notice-dialog";

export interface NoticeShown {
  shown(): boolean;
  keepShown(): Promise<void>;
}

export class CarryingNotice {
  constructor(
    private readonly record: NoticeShown,
    private readonly dialogs: Dialogs,
  ) {}

  async campaignMade(hadCampaigns: boolean): Promise<void> {
    if (!hadCampaigns) return;
    if (this.record.shown()) return;
    await this.record.keepShown();
    this.dialogs.open(new CarryingNoticeDialog());
  }
}
