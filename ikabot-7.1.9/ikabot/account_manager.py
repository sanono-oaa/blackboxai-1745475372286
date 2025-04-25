from ikabot.web.session import Session
from ikabot.helpers.gui import banner, read
import json
import os

class AccountManager:
    def __init__(self):
        self.sessions = {}
        self.active_session = None
        self.accounts_file = os.path.expanduser('~/.ikabot_accounts')
        self.load_accounts()

    def load_accounts(self):
        """Load saved account credentials securely"""
        self.accounts = {}
        try:
            if os.path.exists(self.accounts_file):
                # Check file permissions
                if oct(os.stat(self.accounts_file).st_mode & 0o777) != oct(0o600):
                    print("\nWarning: Insecure permissions on accounts file, fixing...")
                    os.chmod(self.accounts_file, 0o600)
                
                with open(self.accounts_file, 'r') as f:
                    self.accounts = json.load(f)
        except json.JSONDecodeError:
            print("\nWarning: Accounts file is corrupted, creating new file")
            self.accounts = {}
            self.save_accounts()
        except Exception as e:
            print(f"\nError loading accounts: {str(e)}")
            self.accounts = {}

    def save_accounts(self):
        """Save account credentials securely"""
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.accounts_file), exist_ok=True)
        
        # Save with restricted permissions
        with open(self.accounts_file, 'w') as f:
            json.dump(self.accounts, f)
        os.chmod(self.accounts_file, 0o600)  # Read/write for owner only

    def validate_credentials(self, email, password):
        """Validate account credentials by attempting to login"""
        try:
            test_session = Session()
            test_session.mail = email
            test_session.password = password
            test_session.__login()
            test_session.logout()
            return True
        except Exception as e:
            print(f"\nFailed to validate credentials: {str(e)}")
            return False

    def add_account(self, email, password, alias=None):
        """Add a new account after validating credentials"""
        try:
            # Check if email already exists
            for existing_alias, account in self.accounts.items():
                if account['email'] == email:
                    print(f"\nAccount with email {email} already exists as '{existing_alias}'")
                    return False

            # Validate the credentials first
            print("\nValidating credentials...")
            if not self.validate_credentials(email, password):
                print("Failed to add account: Invalid credentials")
                return False

            if alias is None:
                alias = email

            # Check if alias is unique
            if alias in self.accounts:
                print(f"\nAlias '{alias}' is already in use")
                return False

            self.accounts[alias] = {
                'email': email,
                'password': password
            }
            self.save_accounts()
            print(f"\nAccount '{alias}' added successfully")
            return True
        except Exception as e:
            print(f"\nError adding account: {str(e)}")
            return False

    def refresh_sessions(self):
        """Refresh all active sessions to prevent expiration"""
        for alias, session in list(self.sessions.items()):
            try:
                session.get()  # Test the session
            except Exception:
                print(f"\nSession expired for account '{alias}', attempting to reconnect...")
                try:
                    # Recreate the session
                    del self.sessions[alias]
                    self.switch_account(alias)
                except Exception as e:
                    print(f"Failed to reconnect account '{alias}': {str(e)}")

    def remove_account(self, alias):
        """Remove an account and clean up its data"""
        if alias in self.accounts:
            # Logout and cleanup session if exists
            if alias in self.sessions:
                try:
                    if self.sessions[alias] == self.active_session:
                        self.active_session = None
                    self.sessions[alias].logout()
                except:
                    pass
                del self.sessions[alias]

            # Remove account credentials
            del self.accounts[alias]
            self.save_accounts()

            # Clean up account's session data file
            try:
                email = self.accounts[alias]['email']
                session_file = os.path.expanduser('~/.ikabot')
                if os.path.exists(session_file):
                    # Create temporary session to access cipher
                    temp_session = Session()
                    temp_session.mail = email
                    temp_session.password = self.accounts[alias]['password']
                    cipher = temp_session.cipher
                    
                    # Clear account's data from session file
                    data = cipher.getSessionData(temp_session)
                    if 'account_id' in data and data['account_id'] == email:
                        cipher.setSessionData(temp_session, {})
            except:
                pass  # Ignore cleanup errors

            print(f"\nAccount {alias} and its data have been removed")
        else:
            print(f"\nAccount {alias} not found")

    def list_accounts(self):
        """List all registered accounts"""
        if not self.accounts:
            print("No accounts registered.")
            return

        print("\nRegistered accounts:")
        for i, (alias, details) in enumerate(self.accounts.items(), 1):
            print(f"({i}) {alias} - {details['email']}")

    def switch_account(self, alias):
        """Switch to a different account"""
        try:
            if alias not in self.accounts:
                print(f"Account {alias} not found")
                return False

            # If we already have a session for this account
            if alias in self.sessions:
                # Check if the session is still valid
                try:
                    self.sessions[alias].get()  # Test the session
                except Exception:
                    # Session expired or invalid, remove it
                    del self.sessions[alias]

            # Create new session if needed
            if alias not in self.sessions:
                session = Session()
                session.mail = self.accounts[alias]['email']
                session.password = self.accounts[alias]['password']
                try:
                    session.__login()
                except Exception as e:
                    print(f"Failed to login to account {alias}: {str(e)}")
                    return False
                self.sessions[alias] = session

            # Switch to the new session
            self.active_session = self.sessions[alias]
            print(f"\nSuccessfully switched to account: {alias} ({self.accounts[alias]['email']})")
            return True

        except Exception as e:
            print(f"Error switching to account {alias}: {str(e)}")
            return False

    def get_current_account(self):
        """Get the alias of the currently active account"""
        for alias, session in self.sessions.items():
            if session == self.active_session:
                return alias
        return None

    def display_current_account(self):
        """Display information about the currently active account"""
        alias = self.get_current_account()
        if alias and self.active_session:
            print(f"\nCurrent account: {alias}")
            print(f"Email: {self.accounts[alias]['email']}")
            if hasattr(self.active_session, 'username'):
                print(f"Player name: {self.active_session.username}")
            if hasattr(self.active_session, 'servidor'):
                print(f"Server: {self.active_session.servidor}")
            if hasattr(self.active_session, 'mundo'):
                print(f"World: {self.active_session.mundo}")
        else:
            print("\nNo active account")

    def get_active_session(self):
        """Get the currently active session"""
        return self.active_session

    def manage_accounts(self):
        """Interactive account management"""
        while True:
            banner()
            print("Account Management")
            print("(1) Add account")
            print("(2) Remove account")
            print("(3) List accounts")
            print("(4) Switch account")
            print("(5) Show current account")
            print("(0) Back")

            choice = read(min=0, max=5, digit=True)

            if choice == 0:
                break
            elif choice == 1:
                email = read(msg="Enter email: ")
                password = read(msg="Enter password: ")
                alias = read(msg="Enter alias (or press enter to use email): ")
                if not alias:
                    alias = email
                self.add_account(email, password, alias)
                print(f"Account {alias} added successfully")
            elif choice == 2:
                self.list_accounts()
                if self.accounts:
                    alias = read(msg="Enter alias to remove: ")
                    self.remove_account(alias)
                    print(f"Account {alias} removed successfully")
            elif choice == 3:
                self.list_accounts()
            elif choice == 4:
                self.list_accounts()
                if self.accounts:
                    alias = read(msg="Enter alias to switch to: ")
                    self.switch_account(alias)
            elif choice == 5:
                self.display_current_account()
                input("\nPress Enter to continue...")
