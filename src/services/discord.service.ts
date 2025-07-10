import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookClient, EmbedBuilder } from 'discord.js';
import { ConfigVariablesType } from 'src/config';

@Injectable()
export class DiscordService {
  private logger = new Logger(DiscordService.name);
  private webhookClient: WebhookClient;

  constructor(private configService: ConfigService<ConfigVariablesType, true>) {
    const webhookUrl = this.configService.get('discord.errorWebhookUrl', {
      infer: true,
    });
    this.webhookClient = new WebhookClient({ url: webhookUrl });
  }

  async sendError(
    error: Error | string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error Alert')
        .setTimestamp();

      const errorMessage = error instanceof Error ? error.message : error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      embed.addFields({
        name: 'Error Message',
        value: `\`\`\`\n${errorMessage}\n\`\`\``,
      });

      if (errorStack) {
        embed.addFields({
          name: 'Stack Trace',
          value: `\`\`\`\n${errorStack.slice(0, 1000)}${errorStack.length > 1000 ? '...' : ''}\n\`\`\``,
        });
      }

      if (metadata) {
        embed.addFields({
          name: 'Additional Information',
          value: `\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``,
        });
      }

      await this.webhookClient.send({
        embeds: [embed],
      });
    } catch (webhookError) {
      this.logger.error('Failed to send error to Discord', webhookError);
    }
  }
}
