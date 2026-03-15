import {Component, OnInit} from '@angular/core';
import {NzModalRef} from 'ng-zorro-antd/modal';
import {IconService} from '../../../service/icon.service';
import {ServerService} from '../../../service/server/server.service';
import {IRespFetchProductSKU, SKUIdentify, VIPLevel} from '../../../service/server/api';
import QRCode from 'qrcode';
import {ErrorHandlerService} from '../../../service/error-handler.service';
import {UserService} from 'app/service/user.service';

enum PaymentState {
  None = 'none',
  Loading = 'loading',
  QrCode = 'qrcode',
}

@Component({
  selector: 'app-vip-benefit-dialog',
  templateUrl: './vip-benefit-dialog.component.html',
  styleUrl: './vip-benefit-dialog.component.scss',
})
export class VipBenefitDialogComponent implements OnInit {
  VIPLevel = VIPLevel;

  loadingSKUs = true;
  skuList: IRespFetchProductSKU[] = [];
  selectedSku: IRespFetchProductSKU | null = null;
  paymentState = PaymentState.None;
  qrCodeUrl = '';

  selectedVipLevel = VIPLevel.Normal;
  PaymentState = PaymentState;

  constructor(
    public dialogRef: NzModalRef,
    public iconService: IconService,
    private userService: UserService,
    private serverService: ServerService,
    private errorHandler: ErrorHandlerService,
  ) {}

  async ngOnInit() {
    await this.fetchProductSKUs();
  }

  async fetchProductSKUs() {
    try {
      this.loadingSKUs = true;
      const skus = await this.serverService.payment.fetchProductSKU(undefined as any);
      this.skuList = skus;
      if (this.skuList.length > 0) {
        const current = this.userService.getVipLevel();
        this.selectVipLevel(current > VIPLevel.None ? current : VIPLevel.Normal);
      }
    } catch (e) {
      this.errorHandler.handleError(e as Error);
    } finally {
      this.loadingSKUs = false;
    }
  }

  close() {
    this.dialogRef.close();
  }

  selectVipLevel(level: VIPLevel) {
    this.selectedVipLevel = level;
    switch(level) {
      case VIPLevel.None:
        break;
      case VIPLevel.Normal:
      case VIPLevel.Advanced:
        this.selectedSku = this.currentSkuList[this.currentSkuList.length - 1];
        break;
    }
  }

  isUpgradeVip(level: VIPLevel) {
    const current = this.userService.getVipLevel();
    if (current === VIPLevel.None)
      return false;
    if (current < level)
      return true;
    return false;
  }

  isDisabled() {
    return this.isDowngradeVip(this.selectedVipLevel);
  }

  isDowngradeVip(level: VIPLevel) {
    const current = this.userService.getVipLevel();
    if (current === VIPLevel.None)
      return false;
    if (current > level)
      return true;
    return false;
  }

  async pay() {
    if (!this.selectedSku) {
      return;
    }

    try {
      this.paymentState = PaymentState.Loading;
      const res = await this.serverService.payment.wechatNativePrepay({
        skuIdentify: this.selectedSku.identify
      });
      if (res.sandbox) {
        return;
      }

      if (res.codeUrl) {
        this.qrCodeUrl = await QRCode.toDataURL(res.codeUrl);
        this.paymentState = PaymentState.QrCode;
      }
    } catch (e) {
      this.paymentState = PaymentState.None;
      this.errorHandler.handleError(e as Error);
    }
  }

  backToPayment() {
    this.paymentState = PaymentState.None;
  }

  get currentSkuList() {
    return this.skuList.filter(v => v.level === this.selectedVipLevel)
  }

}
