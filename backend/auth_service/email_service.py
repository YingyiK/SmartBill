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
project_root = os.path.join(os.path.dirname(__file__), '..', '..', '..')
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)  # Load from project root
load_dotenv()  # Also try current directory (for backward compatibility)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))


async def send_verification_email(
    to_email: str,
    code: str,
    purpose: str = "注册"
) -> bool:
    """
    Send verification code email
    
    Args:
        to_email: Recipient email address
        code: Verification code
        purpose: Purpose of the email (注册/重置密码)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("\n" + "="*60)
        print(f"📧 验证码（开发模式 - SMTP 未配置）")
        print(f"   邮箱: {to_email}")
        print(f"   验证码: {code}")
        print(f"   用途: {purpose}")
        print("="*60 + "\n")
        # 即使未配置 SMTP，也返回 True，因为验证码已经在控制台显示了
        return True
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = f"SmartBill {purpose}验证码"
        message["From"] = SMTP_FROM
        message["To"] = to_email

        # Plain text version
        text = f"""
您的 SmartBill {purpose}验证码是：{code}

验证码有效期为 10 分钟。

如果您没有请求此验证码，请忽略此邮件。
        """

        # HTML version
        html = f"""
        <html>
          <body>
            <h2>SmartBill {purpose}验证码</h2>
            <p>您的验证码是：<strong style="font-size: 24px; color: #4F46E5;">{code}</strong></p>
            <p>验证码有效期为 10 分钟。</p>
            <p style="color: #666;">如果您没有请求此验证码，请忽略此邮件。</p>
          </body>
        </html>
        """

        part1 = MIMEText(text, "plain", "utf-8")
        part2 = MIMEText(html, "html", "utf-8")

        message.attach(part1)
        message.attach(part2)

        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            use_tls=True,
        )
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False


async def send_bill_email(
    to_email: str,
    bill_data: dict,
    subject: str = "您的账单"
) -> bool:
    """
    Send bill email to user
    
    Args:
        to_email: Recipient email address
        bill_data: Bill information (store_name, total, items, etc.)
        subject: Email subject
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️  SMTP not configured. Would send bill to {to_email}")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_FROM
        message["To"] = to_email

        items_html = ""
        for item in bill_data.get("items", []):
            items_html += f"<tr><td>{item.get('name', '')}</td><td>${item.get('price', 0):.2f}</td></tr>"

        html = f"""
        <html>
          <body>
            <h2>{bill_data.get('store_name', '账单')}</h2>
            <table border="1" cellpadding="10">
              <tr><th>商品</th><th>价格</th></tr>
              {items_html}
            </table>
            <p><strong>总计：${bill_data.get('total', 0):.2f}</strong></p>
            <p>感谢使用 SmartBill！</p>
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
            use_tls=True,
        )
        return True
    except Exception as e:
        print(f"❌ Failed to send bill email: {e}")
        return False

