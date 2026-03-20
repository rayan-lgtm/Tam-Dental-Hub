import { Component, OnInit } from '@angular/core';
import { AppDataService } from '../../services/app-data.service';
import { LanguageService } from '../../services/language.service';
import { Prescription, Questionnaire } from '../../models';

@Component({
  selector: 'app-health',
  templateUrl: './health.page.html',
  styleUrls: ['./health.page.scss'],
})
export class HealthPage implements OnInit {
  prescriptions: Prescription[] = [];
  questionnaires: Questionnaire[] = [];

  constructor(
    public langService: LanguageService,
    public dataService: AppDataService,
  ) {}

  ngOnInit(): void {
    this.prescriptions = this.dataService.prescriptions;
    this.questionnaires = this.dataService.questionnaires;
  }

  qStatusClass(status: string): string {
    return status === 'pending' ? 'badge-upcoming' : 'badge-completed';
  }
}
