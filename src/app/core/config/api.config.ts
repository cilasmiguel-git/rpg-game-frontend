import { environment } from '../../../environments/environment';

export class ApiConfig {
  static getBaseUrl(): string {
    return environment.apiUrl;
  }
}
