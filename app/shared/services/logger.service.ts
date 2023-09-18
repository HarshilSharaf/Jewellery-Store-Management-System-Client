import { Injectable } from '@angular/core';
import { info, error } from 'tauri-plugin-log-api';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor() {}

  public LogInfo(infoString: string) {
    info(`[INFO FROM CLIENT] ${infoString}`);
  }

  public LogError(errorString: any ,errorFrom = '') {

    const errorObject = JSON.stringify(errorString)

    if(errorFrom != '') {
      error(`[ERROR FROM CLIENT] ${errorFrom} threw an error: ${errorObject}`);
    }
    else {
      error(`[ERROR FROM CLIENT] ${errorObject}`);
    }
  }
}
