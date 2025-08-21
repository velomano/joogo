import puppeteer from 'puppeteer';

export class LabelGenerator {
  async generateLabel(shipment: any, format: string = 'pdf'): Promise<Buffer> {
    try {
      // Generate HTML content for the label
      const htmlContent = this.generateLabelHtml(shipment);
      
      if (format === 'pdf') {
        return await this.htmlToPdf(htmlContent);
      } else {
        // For other formats, return HTML as buffer
        return Buffer.from(htmlContent, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to generate label: ${error}`);
    }
  }

  private generateLabelHtml(shipment: any): string {
    const order = shipment.orders;
    const items = shipment.shipment_items || [];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Shipping Label</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
          }
          .label {
            border: 2px solid #000;
            padding: 15px;
            max-width: 400px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .section {
            margin-bottom: 15px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .items {
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .tracking {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-top: 15px;
            padding: 10px;
            background: #f0f0f0;
            border: 1px solid #000;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <h2>SHIPPING LABEL</h2>
            <div>Carrier: ${shipment.carrier}</div>
          </div>
          
          <div class="section">
            <div class="section-title">TO:</div>
            <div>${order.buyer}</div>
          </div>
          
          <div class="section">
            <div class="section-title">ORDER DETAILS:</div>
            <div class="row">
              <span>Order #:</span>
              <span>${order.channel_order_no}</span>
            </div>
            <div class="row">
              <span>Shipment #:</span>
              <span>${shipment.id}</span>
            </div>
            <div class="row">
              <span>Date:</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div class="section items">
            <div class="section-title">ITEMS:</div>
            ${items.map((item: any) => `
              <div class="item">
                <span>${item.sku}</span>
                <span>Qty: ${item.qty}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="tracking">
            Tracking: ${shipment.tracking_no}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A6',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
      });
      
      await browser.close();
      return pdfBuffer;
    } catch (error) {
      throw new Error(`Failed to convert HTML to PDF: ${error}`);
    }
  }
}

