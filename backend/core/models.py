from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid
import random
import string


def generate_account_number():
    return ''.join(random.choices(string.digits, k=12))

def generate_transaction_id():
    return 'MP' + uuid.uuid4().hex[:10].upper()


class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('agent', 'Agent'),
        ('customer_care', 'Customer Care'),
        ('admin', 'Admin / ICT'),
    ]
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('swahili', 'Kiswahili'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number = models.CharField(max_length=15, unique=True)
    id_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    pin = models.CharField(max_length=128, blank=True)  # hashed PIN
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='english')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username', 'email']

    def __str__(self):
        return f"{self.get_full_name()} ({self.phone_number})"


class MPesaAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mpesa_account')
    account_number = models.CharField(max_length=12, unique=True, default=generate_account_number)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"M-PESA {self.user.phone_number} - KES {self.balance}"


class MshwariAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mshwari_account')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    locked_savings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    lock_until = models.DateField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    loan_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    active_loan = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"M-Shwari {self.user.phone_number}"


class KCBMPesaAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kcb_account')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    loan_limit = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00)
    active_loan = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"KCB M-PESA {self.user.phone_number}"


class Agent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    agent_number = models.CharField(max_length=10, unique=True)
    business_name = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    float_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    commission_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Agent {self.agent_number} - {self.business_name}"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('send_money', 'Send Money'),
        ('receive_money', 'Receive Money'),
        ('withdraw_agent', 'Withdraw via Agent'),
        ('withdraw_atm', 'Withdraw via ATM'),
        ('buy_airtime', 'Buy Airtime'),
        ('paybill', 'Lipa na M-PESA - Paybill'),
        ('buy_goods', 'Lipa na M-PESA - Buy Goods'),
        ('pochi', 'Pochi la Biashara'),
        ('mshwari_deposit', 'M-Shwari Deposit'),
        ('mshwari_withdraw', 'M-Shwari Withdraw'),
        ('mshwari_loan', 'M-Shwari Loan'),
        ('kcb_deposit', 'KCB M-PESA Deposit'),
        ('kcb_withdraw', 'KCB M-PESA Withdraw'),
        ('kcb_loan', 'KCB M-PESA Loan'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]

    transaction_id = models.CharField(max_length=20, unique=True, default=generate_transaction_id)
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_transactions')
    receiver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_transactions')
    transaction_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    charge = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)
    reference = models.CharField(max_length=100, blank=True)  # paybill account/reference
    external_ref = models.CharField(max_length=100, blank=True)  # paybill number, agent number
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_id} - {self.transaction_type} KES {self.amount}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.phone_number}"


class PaybillBiller(models.Model):
    name = models.CharField(max_length=200)
    paybill_number = models.CharField(max_length=10)
    category = models.CharField(max_length=50)
    logo = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.paybill_number})"


class BuyGoodsTill(models.Model):
    business_name = models.CharField(max_length=200)
    till_number = models.CharField(max_length=10, unique=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.business_name} ({self.till_number})"