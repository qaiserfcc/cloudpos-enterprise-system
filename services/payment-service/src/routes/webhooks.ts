import { Router } from 'express';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';
import { PaymentGateway } from '../models/types';

const router = Router();

// Stripe Webhook
router.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    // Store webhook event for processing
    await databaseService.query(`
      INSERT INTO webhook_events (gateway, event_type, event_id, data, signature)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (gateway, event_id) DO NOTHING
    `, [
      PaymentGateway.STRIPE,
      payload.type || 'unknown',
      payload.id || crypto.randomUUID(),
      JSON.stringify(payload),
      signature
    ]);

    // Process webhook asynchronously
    processWebhookAsync(PaymentGateway.STRIPE, payload);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// PayPal Webhook
router.post('/paypal', async (req, res) => {
  try {
    const payload = req.body;

    // Store webhook event for processing
    await databaseService.query(`
      INSERT INTO webhook_events (gateway, event_type, event_id, data)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (gateway, event_id) DO NOTHING
    `, [
      PaymentGateway.PAYPAL,
      payload.event_type || 'unknown',
      payload.id || crypto.randomUUID(),
      JSON.stringify(payload)
    ]);

    // Process webhook asynchronously
    processWebhookAsync(PaymentGateway.PAYPAL, payload);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Square Webhook
router.post('/square', async (req, res) => {
  try {
    const signature = req.headers['x-square-signature'] as string;
    const payload = req.body;

    // Store webhook event for processing
    await databaseService.query(`
      INSERT INTO webhook_events (gateway, event_type, event_id, data, signature)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (gateway, event_id) DO NOTHING
    `, [
      PaymentGateway.SQUARE,
      payload.type || 'unknown',
      payload.event_id || crypto.randomUUID(),
      JSON.stringify(payload),
      signature
    ]);

    // Process webhook asynchronously
    processWebhookAsync(PaymentGateway.SQUARE, payload);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Square webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Generic webhook processor
async function processWebhookAsync(gateway: PaymentGateway, payload: any): Promise<void> {
  try {
    // This would be processed by a background worker in production
    // For now, we'll just log the webhook
    
    logger.info('Processing webhook', {
      gateway,
      eventType: payload.type || payload.event_type,
      eventId: payload.id || payload.event_id
    });

    // Update webhook as processed
    await databaseService.query(`
      UPDATE webhook_events 
      SET processed = true, processed_at = CURRENT_TIMESTAMP
      WHERE gateway = $1 AND event_id = $2
    `, [gateway, payload.id || payload.event_id]);

    // Here you would:
    // 1. Verify webhook signature
    // 2. Update payment status in database
    // 3. Send notifications
    // 4. Update analytics
    // 5. Trigger other business logic

  } catch (error) {
    logger.error('Webhook processing error:', error);
    
    // Update retry count
    await databaseService.query(`
      UPDATE webhook_events 
      SET retry_count = retry_count + 1, last_retry_at = CURRENT_TIMESTAMP
      WHERE gateway = $1 AND event_id = $2
    `, [gateway, payload.id || payload.event_id]);
  }
}

// Get webhook events (for debugging)
router.get('/events', async (req, res) => {
  try {
    const { gateway, processed, limit = 50 } = req.query;
    
    let whereClause = '1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (gateway) {
      whereClause += ` AND gateway = $${++paramCount}`;
      params.push(gateway);
    }

    if (processed !== undefined) {
      whereClause += ` AND processed = $${++paramCount}`;
      params.push(processed === 'true');
    }

    const result = await databaseService.query(`
      SELECT * FROM webhook_events 
      WHERE ${whereClause}
      ORDER BY received_at DESC 
      LIMIT $${++paramCount}
    `, [...params, limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get webhook events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook events'
    });
  }
});

// Retry failed webhooks
router.post('/retry/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await databaseService.query(
      'SELECT * FROM webhook_events WHERE id = $1',
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Webhook event not found'
      });
    }

    const event = result.rows[0];
    
    // Retry processing
    await processWebhookAsync(event.gateway, event.data);

    res.json({
      success: true,
      message: 'Webhook retry initiated'
    });
  } catch (error) {
    logger.error('Webhook retry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry webhook'
    });
  }
});

export { router as webhookRoutes };