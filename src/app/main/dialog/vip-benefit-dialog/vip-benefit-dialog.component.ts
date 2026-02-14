import {Component, OnInit} from '@angular/core';
import {NzModalRef} from 'ng-zorro-antd/modal';
import {IconService} from '../../../service/icon.service';
import {ServerService} from '../../../service/server/server.service';
import {IRespFetchProductSKU, SKUIdentify} from '../../../service/server/api';
import QRCode from 'qrcode';
import {ErrorHandlerService} from '../../../service/error-handler.service';

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
  loadingSKUs = true;
  skuList: IRespFetchProductSKU[] = [];
  selectedSku: IRespFetchProductSKU | null = null;
  paymentState = PaymentState.None;
  qrCodeUrl = '';

  constructor(
    public dialogRef: NzModalRef,
    public iconService: IconService,
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
        this.selectedSku = this.skuList[0];
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

  async pay() {
    if (!this.selectedSku) {
      return;
    }

    try {
      this.paymentState = PaymentState.Loading;
      const res = await this.serverService.payment.wechatNativePrepay({
        skuIdentify: this.selectedSku.identify
      });
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

  PaymentState = PaymentState;
}
