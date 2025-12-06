"""
Email service for sending verification codes
"""
import aiosmtplib
import random
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

# Load from project root .env file
project_root = os.path.join(os.path.dirname(__file__), '..', '..')
env_path = os.path.join(project_root, '.env')
print(f"Loading .env from: {env_path}")  # Debug print

# Load from current directory first (lower priority)
load_dotenv()  

# Then load from project root (higher priority - will override)
load_dotenv(env_path, override=True)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

# Debug: Print SMTP configuration status
print(f"SMTP_HOST: {SMTP_HOST}")
print(f"SMTP_PORT: {SMTP_PORT}")
print(f"SMTP_USER: {SMTP_USER}")
print(f"SMTP_PASSWORD: {'***' if SMTP_PASSWORD else '(empty)'}")

if SMTP_USER and SMTP_PASSWORD:
    print(f"✅ SMTP configured: {SMTP_USER} via {SMTP_HOST}:{SMTP_PORT}")
else:
    print("⚠️  SMTP not configured - verification codes will be printed to console")


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))


async def send_verification_email(
    to_email: str,
    code: str,
    purpose: str = "registration"
) -> bool:
    """
    Send verification code email
    
    Args:
        to_email: Recipient email address
        code: Verification code
        purpose: Purpose of the email (registration/password_reset)
    
    Returns:
        True if sent successfully, False otherwise
    """
    # Map purpose to user-friendly text
    purpose_text = {
        "registration": "Account Registration",
        "password_reset": "Password Reset",
        "注册": "Account Registration",
        "重置密码": "Password Reset"
    }.get(purpose, "Verification")
    
    # Always print verification code to console (for development/testing)
    print("\n" + "="*60)
    print(f"📧 Verification Code - {purpose_text}")
    print(f"   Email: {to_email}")
    print(f"   Code: {code}")
    print("="*60 + "\n")
    
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP not configured - code printed above only")
        return True
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = f"SmartBill - Your {purpose_text} Code"
        message["From"] = SMTP_FROM
        message["To"] = to_email

        # Plain text version
        text = f"""
SmartBill - {purpose_text}

Your verification code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The SmartBill Team
        """

        # Professional HTML version with modern design
        html = f"""
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                          💰 SmartBill
                        </h1>
                        <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">
                          Smart Expense Splitting Made Easy
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 48px 40px;">
                        <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                          {purpose_text}
                        </h2>
                        <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                          We received a request for {purpose_text.lower()} for your SmartBill account. Use the verification code below to proceed:
                        </p>
                        
                        <!-- Verification Code Box -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 32px; background: linear-gradient(135deg, #f0f4ff 0%, #e9f3ff 100%); border-radius: 8px; border: 2px dashed #667eea;">
                              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                                Your Verification Code
                              </p>
                              <p style="margin: 0; color: #667eea; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                {code}
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                          ⏱️ <strong>This code will expire in 10 minutes.</strong>
                        </p>
                        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                          🔒 For security reasons, please do not share this code with anyone.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          If you didn't request this code, you can safely ignore this email.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 SmartBill. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """

        part1 = MIMEText(text, "plain", "utf-8")
        part2 = MIMEText(html, "html", "utf-8")

        message.attach(part1)
        message.attach(part2)

        print(f"📤 Sending email to {to_email}...")
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        print(f"✅ Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def send_bill_email(
    to_email: str,
    bill_data: dict,
    subject: str = None
) -> bool:
    """
    Send bill email to user
    
    Args:
        to_email: Recipient email address
        bill_data: Bill information (store_name, total, items, etc.)
        subject: Email subject (optional)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️  SMTP not configured. Would send bill to {to_email}")
        return False
    
    try:
        store_name = bill_data.get('store_name', 'Receipt')
        total = bill_data.get('total', 0)
        
        # Default subject if not provided
        if not subject:
            subject = f"SmartBill - Your {store_name} Receipt"
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_FROM
        message["To"] = to_email

        # Generate items rows
        items_html = ""
        for item in bill_data.get("items", []):
            item_name = item.get('name', 'Item')
            item_price = item.get('price', 0)
            items_html += f"""
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                {item_name}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">
                ${item_price:.2f}
              </td>
            </tr>
            """

        # Professional HTML email
        html = f"""
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                          🧾 Receipt Summary
                        </h1>
                        <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px; font-weight: 500;">
                          {store_name}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px;">
                          Here's a summary of your recent expense:
                        </p>
                        
                        <!-- Items Table -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                          <thead>
                            <tr style="background-color: #f9fafb;">
                              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
                                Item
                              </th>
                              <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
              {items_html}
                          </tbody>
                          <tfoot>
                            <tr style="background-color: #f0fdf4;">
                              <td style="padding: 16px; font-weight: 700; color: #059669; font-size: 18px;">
                                Total
                              </td>
                              <td style="padding: 16px; font-weight: 700; color: #059669; font-size: 18px; text-align: right;">
                                ${total:.2f}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          This expense has been recorded in your SmartBill account. You can view and manage all your expenses in the dashboard.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                          Thank you for using SmartBill! 🎉
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 SmartBill. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """

        part = MIMEText(html, "html", "utf-8")
        message.attach(part)

        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as e:
        print(f"❌ Failed to send bill email: {e}")
        import traceback
        traceback.print_exc()
        return False


async def send_split_bill_email(
    to_email: str,
    to_name: str,
    payer_name: str,
    expense_data: dict,
    split_data: dict
) -> bool:
    """
    Send expense split bill to a participant
    
    Args:
        to_email: Participant's email address
        to_name: Participant's name
        payer_name: Name of person who paid initially
        expense_data: Expense information (store_name, total, items, date)
        split_data: Split information (amount_owed, items_detail)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️  SMTP not configured. Would send split bill to {to_email}")
        return False
    
    try:
        store_name = expense_data.get('store_name', 'Receipt')
        total_amount = expense_data.get('total', 0)
        expense_date = expense_data.get('date', 'Recent')
        amount_owed = split_data.get('amount_owed', 0)
        items_detail = split_data.get('items_detail', [])
        
        subject = f"SmartBill - You owe ${amount_owed:.2f} for {store_name}"
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_FROM
        message["To"] = to_email

        # Generate items rows if items_detail provided
        items_html = ""
        if items_detail and len(items_detail) > 0:
            for item in items_detail:
                items_html += f"""
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                    • {item}
                  </td>
                </tr>
                """
        else:
            items_html = """
            <tr>
              <td style="padding: 8px; color: #6b7280; font-style: italic;">
                Split amount based on total bill
              </td>
            </tr>
            """

        # Professional HTML email for expense split
        html = f"""
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                          💸 Bill Split Request
                        </h1>
                        <p style="margin: 8px 0 0 0; color: #fef3c7; font-size: 14px; font-weight: 500;">
                          From {payer_name}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 16px;">
                          Hi {to_name},
                        </p>
                        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                          <strong>{payer_name}</strong> paid for a recent expense at <strong>{store_name}</strong> and is requesting your share of the bill.
                        </p>
                        
                        <!-- Amount Owed Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                          <tr>
                            <td align="center" style="padding: 32px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border: 2px solid #f59e0b;">
                              <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                Your Share
                              </p>
                              <p style="margin: 0; color: #f59e0b; font-size: 48px; font-weight: 700;">
                                ${amount_owed:.2f}
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Expense Details -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 18px; font-weight: 600;">
                            📋 Expense Details
                          </h3>
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Store:</td>
                              <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">{store_name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Total Bill:</td>
                              <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${total_amount:.2f}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                              <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">{expense_date}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Paid by:</td>
                              <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">{payer_name}</td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- Items Detail -->
                        <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 18px; font-weight: 600;">
                          🛒 Your Items
                        </h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                          <tbody>
                            {items_html}
                          </tbody>
                        </table>
                        
                        <!-- Payment Instructions -->
                        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px;">
                          <p style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600; font-size: 14px;">
                            💳 Payment Instructions
                          </p>
                          <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                            Please settle this amount with {payer_name} directly. Once paid, they can mark it as settled in SmartBill.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                          This is an automated bill split request from SmartBill.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 SmartBill. Making expense splitting simple.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """

        part = MIMEText(html, "html", "utf-8")
        message.attach(part)

        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as e:
        print(f"❌ Failed to send split bill email: {e}")
        import traceback
        traceback.print_exc()
        return False

