import { Component, OnInit } from '@angular/core';
import { AppDataService } from '../../services/app-data.service';
import { LanguageService } from '../../services/language.service';
import { Invoice } from '../../models';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.page.html',
  styleUrls: ['./billing.page.scss'],
})
export class BillingPage implements OnInit {
  invoices: Invoice[] = [];

  constructor(
    public langService: LanguageService,
    public dataService: AppDataService,
  ) {}

  ngOnInit(): void {
    this.dataService.invoices$.subscribe(invs => (this.invoices = invs));
  }

  get totalDue(): number {
    return this.invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
  }

  statusClass(status: string): string {
    return `badge-${status}`;
  }

  statusLabel(status: string): string {
    return this.langService.t(status);
  }

  payInvoice(inv: Invoice): void {
    alert(`Payment flow for ${inv.id} – integrate with your payment provider.`);
  }
}
