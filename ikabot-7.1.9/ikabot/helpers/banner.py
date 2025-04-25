from ikabot.config import header, footer, IKABOT_VERSION, config
import os

def banner(account_manager=None):
    """Print the banner in the console with account information if available"""
    os.system("clear")
    print(header)
    
    # Add current account info to the banner if available
    account_info = ""
    if account_manager and account_manager.get_active_session():
        current_account = account_manager.get_current_account()
        if current_account:
            account_info = f" | Account: {current_account}"
    
    print(footer % (IKABOT_VERSION, config.infoUser + account_info))
