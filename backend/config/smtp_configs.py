DEFAULT_HOST = "localhost"
DEFAULT_PORT = 25
DEFAULT_TIMEOUT = 30
AWS_SES_CONFIG = {
    "host": "email-smtp.region.amazonaws.com",
    "port": 465,
    "encryption": "SMTPS",
    "username": "your_aws_smtp_username",
    "password": "your_aws_smtp_password",
    "tls_verify": True,
}
SENDGRID_CONFIG = {
    "host": "smtp.sendgrid.net",
    "port": 465,
    "encryption": "SMTPS",
    "username": "apikey",
    "password": "your_sendgrid_api_key",
    "tls_verify": True,
}
MAILGUN_CONFIG = {
    "host": "smtp.mailgun.org",
    "port": 465,
    "encryption": "SMTPS",
    "username": "postmaster@example.mailgun.org",
    "password": "your_mailgun_password",
    "tls_verify": True,
}
GMAIL_CONFIG = {
    "host": "smtp.gmail.com",
    "port": 465,
    "encryption": "SMTPS",
    "username": "your_email@gmail.com",
    "password": "your_app_specific_password",
    "tls_verify": True,
}
OUTLOOK_CONFIG = {
    "host": "smtp.office365.com",
    "port": 587,
    "encryption": "STARTTLS",
    "username": "your_email@outlook.com",
    "password": "your_password",
    "tls_verify": True,
}
ICLOUD_CONFIG = {
    "host": "smtp.mail.me.com",
    "port": 587,
    "encryption": "STARTTLS",
    "username": "your_icloud_email@icloud.com",
    "password": "your_app_specific_password",
    "tls_verify": True,
}
YAHOO_CONFIG = {
    "host": "smtp.mail.yahoo.com",
    "port": 465,
    "encryption": "SMTPS",
    "username": "your_yahoo_email@yahoo.com",
    "password": "your_app_specific_password",
    "tls_verify": True,
}
ZOHO_CONFIG = {
    "host": "smtp.zoho.com",
    "port": 465,
    "encryption": "SMTPS",
    "username": "your_zoho_email@zoho.com",
    "password": "your_password_or_app_password",
    "tls_verify": True,
}
KAGOYA_CONFIG = {
    "host": "smtp.kagoya.net",
    "port": 587,
    "encryption": "STARTTLS",
    "username": "your_kagoya_email@example.com",
    "password": "your_password",
    "tls_verify": True,
}
SERVERDATA_CONFIG = {
    "host": "west.smtp.mx.exch080.serverdata.net",
    "port": 587,
    "encryption": "STARTTLS",
    "username": "your_email@yourdomain.com",
    "password": "your_password",
    "tls_verify": True,
}
