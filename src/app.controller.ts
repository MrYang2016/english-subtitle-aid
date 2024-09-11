import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

const getYoutubeSubtitles = require('@joegesualdo/get-youtube-subtitles-node');

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('subtitles')
  async getSubtitles(@Query('videoId') videoId: string): Promise<any> {
    const subtitles = await getYoutubeSubtitles(videoId, { type: 'nonauto' });
    return subtitles;
  }
}