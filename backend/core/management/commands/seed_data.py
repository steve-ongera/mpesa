"""
Management command to create demo users and seed data.
Run: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User, MPesaAccount, MshwariAccount, KCBMPesaAccount, Agent, PaybillBiller, BuyGoodsTill
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed demo data for M-PESA application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating demo users...')

        # Demo users
        users_data = [
            {
                'phone_number': '0712345678',
                'first_name': 'John',
                'last_name': 'Kamau',
                'role': 'customer',
                'username': 'john_kamau',
                'email': 'john@example.com',
                'password': 'demo1234',
                'pin': '1234',
                'balance': Decimal('15420.50'),
                'mshwari_balance': Decimal('5000.00'),
            },
            {
                'phone_number': '0722345678',
                'first_name': 'Grace',
                'last_name': 'Wanjiku',
                'role': 'agent',
                'username': 'grace_agent',
                'email': 'grace@example.com',
                'password': 'demo1234',
                'pin': '1234',
                'balance': Decimal('45000.00'),
            },
            {
                'phone_number': '0732345678',
                'first_name': 'Peter',
                'last_name': 'Odhiambo',
                'role': 'admin',
                'username': 'peter_admin',
                'email': 'peter@example.com',
                'password': 'demo1234',
                'pin': '1234',
                'balance': Decimal('0.00'),
            },
            {
                'phone_number': '0742345678',
                'first_name': 'Mary',
                'last_name': 'Njeri',
                'role': 'customer_care',
                'username': 'mary_care',
                'email': 'mary@example.com',
                'password': 'demo1234',
                'pin': '1234',
                'balance': Decimal('0.00'),
            },
            {
                'phone_number': '0752345678',
                'first_name': 'James',
                'last_name': 'Mwangi',
                'role': 'customer',
                'username': 'james_customer',
                'email': 'james@example.com',
                'password': 'demo1234',
                'pin': '1234',
                'balance': Decimal('8750.00'),
            },
        ]

        for ud in users_data:
            balance = ud.pop('balance', Decimal('0.00'))
            mshwari_balance = ud.pop('mshwari_balance', None)
            pin = ud.pop('pin')
            password = ud.pop('password')

            user, created = User.objects.get_or_create(
                phone_number=ud['phone_number'],
                defaults={**ud, 'is_verified': True}
            )
            if created:
                user.set_password(password)
                user.pin = make_password(pin)
                user.save()
                self.stdout.write(f'  Created user: {user.phone_number} ({user.role})')
            else:
                self.stdout.write(f'  Exists: {user.phone_number}')

            # M-PESA account
            acc, _ = MPesaAccount.objects.get_or_create(user=user)
            if acc.balance == Decimal('0.00') and balance > 0:
                acc.balance = balance
                acc.save()

            # M-Shwari
            if user.role == 'customer':
                msh, _ = MshwariAccount.objects.get_or_create(user=user, defaults={'loan_limit': Decimal('10000')})
                if mshwari_balance and msh.balance == 0:
                    msh.balance = mshwari_balance
                    msh.save()
                KCBMPesaAccount.objects.get_or_create(user=user, defaults={'loan_limit': Decimal('50000')})

            # Agent profile
            if user.role == 'agent':
                Agent.objects.get_or_create(
                    user=user,
                    defaults={
                        'agent_number': '12345678',
                        'business_name': 'Grace M-PESA Services',
                        'location': 'Tom Mboya Street, Nairobi',
                        'float_balance': Decimal('120000.00'),
                    }
                )

        # Billers
        billers = [
            ('Kenya Power', '888880', 'Utilities'),
            ('Nairobi Water', '888890', 'Utilities'),
            ('DSTV', '222222', 'Entertainment'),
            ('Zuku', '200200', 'Internet'),
            ('KRA iTax', '572572', 'Government'),
            ('NHIF', '200300', 'Health'),
            ('NSSF', '333200', 'Pension'),
            ('Safaricom', '400200', 'Telecom'),
            ('Nairobi City Council', '500100', 'Government'),
            ('Kenya Airways', '300200', 'Transport'),
        ]
        for name, number, cat in billers:
            PaybillBiller.objects.get_or_create(paybill_number=number, defaults={'name': name, 'category': cat})

        self.stdout.write(self.style.SUCCESS('✅ Demo data seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Demo Login Credentials:')
        self.stdout.write('  Customer:  0712345678 / demo1234')
        self.stdout.write('  Agent:     0722345678 / demo1234')
        self.stdout.write('  Admin:     0732345678 / demo1234')
        self.stdout.write('  Care:      0742345678 / demo1234')
        self.stdout.write('  M-PESA PIN for all: 1234')