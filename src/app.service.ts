import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  running() {
    return { message: 'API is running successfully!' };
  }
}
