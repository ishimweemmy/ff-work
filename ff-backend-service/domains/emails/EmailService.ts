import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { AWS_SDK_CREDENTIALS } from '../../utils/config'

class EmailService {
  constructor () {
    if (this.constructor === EmailService) throw new Error('Abstract class cannot be instantiated')
  }

  async sendEmail (params: { recipient: string, subject: string, html: string }): Promise<void> {
    if (this.constructor === EmailService) throw new Error('Abstract method cannot be invoked')
  }
}

export class SESEmailService extends EmailService {
  client: SESClient

  constructor () {
    super()
    this.client = new SESClient({ region: 'us-west-2', credentials: AWS_SDK_CREDENTIALS })
  }

  async sendEmail (params: { recipient: string, subject: string, html: string }) {
    const config = generateSESConfig({
      recipient: params.recipient,
      source: 'noreply@flockfysh.ai',
      subject: params.subject,
      html: params.html
    })
    const command = new SendEmailCommand(config)
    try { await this.client.send(command) } catch (e) { console.error(e) }
  }
}

export function generateSESConfig (params: { recipient: string, source: string, subject: string, html: string }) {
  return {
    Destination: {
      ToAddresses: [params.recipient]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: params.html,
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: params.subject
      }
    },
    Source: params.source
  }
}
