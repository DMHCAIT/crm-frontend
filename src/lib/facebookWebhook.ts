import { Request, Response } from 'express';

interface FacebookWebhookEntry {
  id: string;
  time: number;
  changes: Array<{
    field: string;
    value: {
      ad_id: string;
      form_id: string;
      leadgen_id: string;
      created_time: number;
      page_id: string;
      adgroup_id: string;
      campaign_id: string;
    };
  }>;
}

interface FacebookWebhookPayload {
  object: string;
  entry: FacebookWebhookEntry[];
}

export class FacebookWebhookHandler {
  private static readonly VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_TOKEN || 'your_webhook_verify_token_here';
  
  /**
   * Verify Facebook webhook challenge
   */
  static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FacebookWebhookHandler.VERIFY_TOKEN) {
      // Facebook webhook verified
      res.status(200).send(challenge);
    } else {
      console.error('❌ Failed to verify Facebook webhook');
      res.sendStatus(403);
    }
  }

  /**
   * Handle incoming Facebook lead webhook
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload: FacebookWebhookPayload = req.body;
      
      // Facebook webhook payload received

      if (payload.object !== 'page') {
        // Webhook not for page object, ignoring
        res.sendStatus(404);
        return;
      }

      // Process each entry in the webhook
      for (const entry of payload.entry) {
        await FacebookWebhookHandler.processWebhookEntry(entry);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error processing Facebook webhook:', error);
      res.sendStatus(500);
    }
  }

  /**
   * Process individual webhook entry
   */
  private static async processWebhookEntry(entry: FacebookWebhookEntry): Promise<void> {
    console.log(`📋 Processing entry for page: ${entry.id}`);

    for (const change of entry.changes) {
      if (change.field === 'leadgen') {
        await FacebookWebhookHandler.processLeadgenChange(change.value);
      }
    }
  }

  /**
   * Process lead generation change event
   */
  private static async processLeadgenChange(leadData: any): Promise<void> {
    try {
      console.log('🎯 Processing new Facebook lead:', leadData);

      const { leadgen_id, form_id, ad_id, campaign_id, page_id, created_time } = leadData;

      // Fetch the actual lead data from Facebook API
      const fullLeadData = await FacebookWebhookHandler.fetchLeadData(leadgen_id);
      
      if (!fullLeadData) {
        console.error('❌ Failed to fetch lead data from Facebook API');
        return;
      }

      // Map Facebook lead to CRM format
      const crmLead = FacebookWebhookHandler.mapFacebookLeadToCRM(fullLeadData, {
        ad_id,
        campaign_id,
        form_id,
        page_id,
        created_time
      });

      // Save to CRM database
      await FacebookWebhookHandler.saveToCRM(crmLead);

      console.log('✅ Successfully processed Facebook lead:', leadgen_id);
    } catch (error) {
      console.error('❌ Error processing leadgen change:', error);
    }
  }

  /**
   * Fetch full lead data from Facebook API
   */
  private static async fetchLeadData(leadgenId: string): Promise<any> {
    try {
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('Facebook access token not configured');
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${leadgenId}?fields=id,created_time,field_data&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching lead data from Facebook:', error);
      return null;
    }
  }

  /**
   * Map Facebook lead data to CRM format
   */
  private static mapFacebookLeadToCRM(leadData: any, metadata: any): any {
    const fieldMapping: { [key: string]: string } = {
      'full_name': 'name',
      'email': 'email',
      'phone_number': 'phone',
      'company_name': 'company',
      'job_title': 'designation',
      'city': 'country',
      'custom_question_1': 'branch',
      'custom_question_2': 'qualification',
      'custom_question_3': 'course'
    };

    const mappedLead: any = {
      source: 'Facebook Lead Ads (Webhook)',
      status: 'New',
      priority: 'High', // Real-time leads get high priority
      fbLeadId: leadData.id,
      fbAdId: metadata.ad_id,
      fbCampaignId: metadata.campaign_id,
      fbFormId: metadata.form_id,
      fbPageId: metadata.page_id,
      createdAt: new Date(leadData.created_time).toISOString(),
      receivedAt: new Date().toISOString()
    };

    // Map Facebook form fields to CRM fields
    if (leadData.field_data) {
      leadData.field_data.forEach((field: any) => {
        const crmField = fieldMapping[field.name];
        if (crmField && field.values && field.values.length > 0) {
          mappedLead[crmField] = field.values[0];
        }
      });
    }

    return mappedLead;
  }

  /**
   * Save lead to CRM database
   */
  private static async saveToCRM(leadData: any): Promise<void> {
    try {
      // This would typically use your CRM's database service
      // For now, we'll use a generic API endpoint
      const response = await fetch(`${process.env.API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SYSTEM_API_KEY}` // System-level access
        },
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        throw new Error(`CRM API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Lead saved to CRM:', result.id);
    } catch (error) {
      console.error('❌ Error saving lead to CRM:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint for webhook
   */
  static healthCheck(req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      service: 'facebook-webhook-handler',
      timestamp: new Date().toISOString(),
      webhookToken: !!process.env.FACEBOOK_WEBHOOK_TOKEN,
      accessToken: !!process.env.FACEBOOK_ACCESS_TOKEN
    });
  }
}

export default FacebookWebhookHandler;