from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal
import json

from .models import (
    MPesaAccount, MshwariAccount, KCBMPesaAccount,
    Agent, Transaction, Notification, PaybillBiller, BuyGoodsTill
)
from .serializers import (
    UserSerializer, UserCreateSerializer, MPesaAccountSerializer,
    MshwariAccountSerializer, KCBMPesaAccountSerializer, AgentSerializer,
    TransactionSerializer, NotificationSerializer, PaybillBillerSerializer,
    BuyGoodsTillSerializer
)

User = get_user_model()
channel_layer = get_channel_layer()


def send_realtime_notification(user_id, notification_type, data):
    """Send real-time notification via WebSocket"""
    try:
        async_to_sync(channel_layer.group_send)(
            f'notifications_{user_id}',
            {
                'type': notification_type,
                'data': data
            }
        )
    except Exception as e:
        print(f"WebSocket error: {e}")


def create_notification(user, message, transaction=None):
    notif = Notification.objects.create(user=user, message=message, transaction=transaction)
    send_realtime_notification(user.id, 'send_notification', {
        'id': notif.id,
        'message': message,
        'created_at': notif.created_at.isoformat(),
        'transaction_id': transaction.transaction_id if transaction else None
    })
    return notif


def calculate_mpesa_charge(amount, transaction_type):
    """Calculate M-PESA transaction charges"""
    amount = Decimal(str(amount))
    if transaction_type == 'send_money':
        if amount <= 100: return Decimal('0')
        elif amount <= 500: return Decimal('7')
        elif amount <= 1000: return Decimal('13')
        elif amount <= 1500: return Decimal('23')
        elif amount <= 2500: return Decimal('33')
        elif amount <= 3500: return Decimal('53')
        elif amount <= 5000: return Decimal('57')
        elif amount <= 7500: return Decimal('78')
        elif amount <= 10000: return Decimal('90')
        elif amount <= 15000: return Decimal('100')
        elif amount <= 20000: return Decimal('105')
        elif amount <= 35000: return Decimal('108')
        elif amount <= 50000: return Decimal('108')
        else: return Decimal('108')
    elif transaction_type in ['withdraw_agent', 'withdraw_atm']:
        if amount <= 100: return Decimal('10')
        elif amount <= 500: return Decimal('29')
        elif amount <= 1000: return Decimal('29')
        elif amount <= 1500: return Decimal('29')
        elif amount <= 2500: return Decimal('29')
        elif amount <= 3500: return Decimal('52')
        elif amount <= 5000: return Decimal('69')
        elif amount <= 7500: return Decimal('87')
        elif amount <= 10000: return Decimal('97')
        elif amount <= 15000: return Decimal('107')
        elif amount <= 20000: return Decimal('111')
        elif amount <= 35000: return Decimal('147')
        else: return Decimal('147')
    return Decimal('0')


# ========================= AUTH VIEWS =========================

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        password = request.data.get('password')

        if not phone_number or not password:
            return Response({'error': 'Phone number and password required'}, status=400)

        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=401)

        # USERNAME_FIELD is phone_number — authenticate(username=) won't work.
        # Check password directly against the stored hash.
        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=401)

        if not user.is_active:
            return Response({'error': 'Account is disabled'}, status=401)

        refresh = RefreshToken.for_user(user)
        
        # Get account data
        try:
            mpesa_acc = MPesaAccountSerializer(user.mpesa_account).data
        except:
            mpesa_acc = None

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'mpesa_account': mpesa_acc,
            'role': user.role,
        })


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Only admin/ICT or customer care can register users
        # For demo, allow open registration with role='customer'
        data = request.data.copy()
        if 'role' not in data:
            data['role'] = 'customer'
        
        serializer = UserCreateSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'message': 'Account created successfully'
            }, status=201)
        return Response(serializer.errors, status=400)


# ========================= DASHBOARD =========================

class DashboardView(APIView):
    def get(self, request):
        user = request.user
        try:
            mpesa_acc = user.mpesa_account
        except:
            mpesa_acc = None

        mshwari_acc = None
        kcb_acc = None
        if user.role == 'customer':
            try:
                mshwari_acc = user.mshwari_account
            except:
                pass
            try:
                kcb_acc = user.kcb_account
            except:
                pass

        transactions = Transaction.objects.filter(
            sender=user
        ).union(
            Transaction.objects.filter(receiver=user)
        ).order_by('-created_at')[:10]

        return Response({
            'user': UserSerializer(user).data,
            'mpesa_account': MPesaAccountSerializer(mpesa_acc).data if mpesa_acc else None,
            'mshwari_account': MshwariAccountSerializer(mshwari_acc).data if mshwari_acc else None,
            'kcb_account': KCBMPesaAccountSerializer(kcb_acc).data if kcb_acc else None,
            'recent_transactions': TransactionSerializer(transactions, many=True).data,
            'unread_notifications': Notification.objects.filter(user=user, is_read=False).count(),
        })


# ========================= TRANSACTIONS =========================

class SendMoneyView(APIView):
    def post(self, request):
        sender = request.user
        receiver_phone = request.data.get('receiver_phone')
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        # Verify PIN
        if not check_password(pin, sender.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        if amount < 1:
            return Response({'error': 'Minimum amount is KES 1'}, status=400)

        try:
            receiver = User.objects.get(phone_number=receiver_phone)
        except User.DoesNotExist:
            return Response({'error': f'No M-PESA account for {receiver_phone}'}, status=404)

        charge = calculate_mpesa_charge(amount, 'send_money')
        total_deduction = amount + charge

        try:
            sender_account = sender.mpesa_account
            receiver_account = receiver.mpesa_account
        except Exception as e:
            return Response({'error': 'Account not found'}, status=404)

        if sender_account.balance < total_deduction:
            return Response({'error': f'Insufficient balance. You need KES {total_deduction} (incl. charge KES {charge})'}, status=400)

        # Process transaction
        sender_account.balance -= total_deduction
        sender_account.save()
        receiver_account.balance += amount
        receiver_account.save()

        txn = Transaction.objects.create(
            sender=sender,
            receiver=receiver,
            transaction_type='send_money',
            amount=amount,
            charge=charge,
            status='completed',
            completed_at=timezone.now(),
            description=f'Sent to {receiver.get_full_name()} {receiver_phone}'
        )

        # Real-time notifications
        sender_msg = f'KES {amount:,.2f} sent to {receiver.get_full_name()} {receiver_phone}. New M-PESA balance: KES {sender_account.balance:,.2f}. {txn.transaction_id}'
        receiver_msg = f'KES {amount:,.2f} received from {sender.get_full_name()} {sender.phone_number}. New M-PESA balance: KES {receiver_account.balance:,.2f}. {txn.transaction_id}'

        create_notification(sender, sender_msg, txn)
        create_notification(receiver, receiver_msg, txn)

        # Send balance updates via WebSocket
        send_realtime_notification(sender.id, 'balance_update', {
            'mpesa_balance': str(sender_account.balance)
        })
        send_realtime_notification(receiver.id, 'balance_update', {
            'mpesa_balance': str(receiver_account.balance)
        })

        return Response({
            'success': True,
            'transaction': TransactionSerializer(txn).data,
            'message': sender_msg,
            'new_balance': str(sender_account.balance)
        })


class WithdrawView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        withdraw_type = request.data.get('type', 'agent')  # 'agent' or 'atm'
        agent_number = request.data.get('agent_number', '')
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        charge = calculate_mpesa_charge(amount, f'withdraw_{withdraw_type}')
        total = amount + charge

        try:
            account = user.mpesa_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if account.balance < total:
            return Response({'error': f'Insufficient balance. Need KES {total}'}, status=400)

        # For agent withdrawal, verify agent exists
        agent = None
        if withdraw_type == 'agent' and agent_number:
            try:
                agent = Agent.objects.get(agent_number=agent_number)
                if agent.float_balance < amount:
                    return Response({'error': 'Agent has insufficient float'}, status=400)
                agent.float_balance -= amount
                commission = amount * Decimal('0.001')  # 0.1% commission
                agent.commission_earned += commission
                agent.save()
            except Agent.DoesNotExist:
                return Response({'error': 'Agent not found'}, status=404)

        account.balance -= total
        account.save()

        txn_type = 'withdraw_agent' if withdraw_type == 'agent' else 'withdraw_atm'
        txn = Transaction.objects.create(
            sender=user,
            transaction_type=txn_type,
            amount=amount,
            charge=charge,
            status='completed',
            completed_at=timezone.now(),
            external_ref=agent_number or 'ATM',
            description=f'Withdrawal via {agent.business_name if agent else "ATM"}'
        )

        msg = f'KES {amount:,.2f} withdrawn. Charge KES {charge}. New balance: KES {account.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)
        send_realtime_notification(user.id, 'balance_update', {'mpesa_balance': str(account.balance)})

        return Response({
            'success': True,
            'transaction': TransactionSerializer(txn).data,
            'message': msg,
            'new_balance': str(account.balance)
        })


class BuyAirtimeView(APIView):
    def post(self, request):
        user = request.user
        phone_number = request.data.get('phone_number', user.phone_number)
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        if amount < 5 or amount > 10000:
            return Response({'error': 'Amount must be between KES 5 and KES 10,000'}, status=400)

        try:
            account = user.mpesa_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if account.balance < amount:
            return Response({'error': 'Insufficient balance'}, status=400)

        account.balance -= amount
        account.save()

        txn = Transaction.objects.create(
            sender=user,
            transaction_type='buy_airtime',
            amount=amount,
            charge=Decimal('0'),
            status='completed',
            completed_at=timezone.now(),
            description=f'Airtime for {phone_number}',
            external_ref=phone_number
        )

        msg = f'KES {amount:,.2f} airtime sent to {phone_number}. New balance: KES {account.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)
        send_realtime_notification(user.id, 'balance_update', {'mpesa_balance': str(account.balance)})

        return Response({
            'success': True,
            'transaction': TransactionSerializer(txn).data,
            'message': msg,
            'new_balance': str(account.balance)
        })


class PaybillView(APIView):
    def post(self, request):
        user = request.user
        paybill_number = request.data.get('paybill_number')
        account_number = request.data.get('account_number')
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            account = user.mpesa_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if account.balance < amount:
            return Response({'error': 'Insufficient balance'}, status=400)

        account.balance -= amount
        account.save()

        # Find biller name
        biller_name = paybill_number
        try:
            biller = PaybillBiller.objects.get(paybill_number=paybill_number)
            biller_name = biller.name
        except:
            pass

        txn = Transaction.objects.create(
            sender=user,
            transaction_type='paybill',
            amount=amount,
            charge=Decimal('0'),
            status='completed',
            completed_at=timezone.now(),
            description=f'Paybill to {biller_name}',
            external_ref=paybill_number,
            reference=account_number
        )

        msg = f'KES {amount:,.2f} paid to {biller_name}. Account: {account_number}. Balance: KES {account.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)
        send_realtime_notification(user.id, 'balance_update', {'mpesa_balance': str(account.balance)})

        return Response({
            'success': True,
            'transaction': TransactionSerializer(txn).data,
            'message': msg,
        })


class BuyGoodsView(APIView):
    def post(self, request):
        user = request.user
        till_number = request.data.get('till_number')
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            account = user.mpesa_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if account.balance < amount:
            return Response({'error': 'Insufficient balance'}, status=400)

        account.balance -= amount
        account.save()

        business_name = till_number
        try:
            till = BuyGoodsTill.objects.get(till_number=till_number)
            business_name = till.business_name
            # If till owner, credit them
            if till.owner:
                try:
                    till.owner.mpesa_account.balance += amount
                    till.owner.mpesa_account.save()
                except:
                    pass
        except:
            pass

        txn = Transaction.objects.create(
            sender=user,
            transaction_type='buy_goods',
            amount=amount,
            charge=Decimal('0'),
            status='completed',
            completed_at=timezone.now(),
            description=f'Buy goods from {business_name}',
            external_ref=till_number
        )

        msg = f'KES {amount:,.2f} paid to {business_name}. Balance: KES {account.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)
        send_realtime_notification(user.id, 'balance_update', {'mpesa_balance': str(account.balance)})

        return Response({'success': True, 'transaction': TransactionSerializer(txn).data, 'message': msg})


# ========================= M-SHWARI =========================

class MshwariDepositView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            mpesa_acc = user.mpesa_account
            mshwari_acc = user.mshwari_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if mpesa_acc.balance < amount:
            return Response({'error': 'Insufficient M-PESA balance'}, status=400)

        mpesa_acc.balance -= amount
        mshwari_acc.balance += amount
        mpesa_acc.save()
        mshwari_acc.save()

        txn = Transaction.objects.create(
            sender=user, transaction_type='mshwari_deposit',
            amount=amount, status='completed', completed_at=timezone.now(),
            description='M-Shwari deposit from M-PESA'
        )

        msg = f'KES {amount:,.2f} moved to M-Shwari. M-Shwari balance: KES {mshwari_acc.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)
        send_realtime_notification(user.id, 'balance_update', {
            'mpesa_balance': str(mpesa_acc.balance),
            'mshwari_balance': str(mshwari_acc.balance)
        })

        return Response({'success': True, 'transaction': TransactionSerializer(txn).data, 'message': msg})


class MshwariWithdrawView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            mpesa_acc = user.mpesa_account
            mshwari_acc = user.mshwari_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        available = mshwari_acc.balance - mshwari_acc.locked_savings
        if available < amount:
            return Response({'error': f'Insufficient M-Shwari balance. Available: KES {available:,.2f}'}, status=400)

        mshwari_acc.balance -= amount
        mpesa_acc.balance += amount
        mshwari_acc.save()
        mpesa_acc.save()

        txn = Transaction.objects.create(
            sender=user, transaction_type='mshwari_withdraw',
            amount=amount, status='completed', completed_at=timezone.now(),
            description='M-Shwari withdrawal to M-PESA'
        )

        msg = f'KES {amount:,.2f} moved from M-Shwari to M-PESA. M-PESA balance: KES {mpesa_acc.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)
        send_realtime_notification(user.id, 'balance_update', {
            'mpesa_balance': str(mpesa_acc.balance),
            'mshwari_balance': str(mshwari_acc.balance)
        })

        return Response({'success': True, 'message': msg})


class MshwariLockSavingsView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        lock_until = request.data.get('lock_until')

        try:
            mshwari_acc = user.mshwari_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if mshwari_acc.balance < amount:
            return Response({'error': 'Insufficient M-Shwari balance'}, status=400)

        mshwari_acc.locked_savings += amount
        mshwari_acc.lock_until = lock_until
        mshwari_acc.is_locked = True
        mshwari_acc.save()

        return Response({'success': True, 'message': f'KES {amount:,.2f} locked until {lock_until}'})


class MshwariLoanView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            mshwari_acc = user.mshwari_account
            mpesa_acc = user.mpesa_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if mshwari_acc.active_loan > 0:
            return Response({'error': 'You have an existing M-Shwari loan'}, status=400)

        if amount > mshwari_acc.loan_limit:
            return Response({'error': f'Exceeds loan limit of KES {mshwari_acc.loan_limit:,.2f}'}, status=400)

        mshwari_acc.active_loan = amount
        mshwari_acc.save()
        mpesa_acc.balance += amount
        mpesa_acc.save()

        txn = Transaction.objects.create(
            sender=user, transaction_type='mshwari_loan',
            amount=amount, status='completed', completed_at=timezone.now(),
            description='M-Shwari loan disbursed to M-PESA'
        )

        msg = f'M-Shwari loan of KES {amount:,.2f} disbursed to your M-PESA. Repayment within 30 days. {txn.transaction_id}'
        create_notification(user, msg, txn)

        return Response({'success': True, 'message': msg, 'new_mpesa_balance': str(mpesa_acc.balance)})


# ========================= KCB M-PESA =========================

class KCBDepositView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            mpesa_acc = user.mpesa_account
            kcb_acc = user.kcb_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if mpesa_acc.balance < amount:
            return Response({'error': 'Insufficient M-PESA balance'}, status=400)

        mpesa_acc.balance -= amount
        kcb_acc.balance += amount
        mpesa_acc.save()
        kcb_acc.save()

        txn = Transaction.objects.create(
            sender=user, transaction_type='kcb_deposit',
            amount=amount, status='completed', completed_at=timezone.now()
        )
        msg = f'KES {amount:,.2f} deposited to KCB M-PESA. Balance: KES {kcb_acc.balance:,.2f}. {txn.transaction_id}'
        create_notification(user, msg, txn)

        return Response({'success': True, 'message': msg})


class KCBWithdrawView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            mpesa_acc = user.mpesa_account
            kcb_acc = user.kcb_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if kcb_acc.balance < amount:
            return Response({'error': 'Insufficient KCB M-PESA balance'}, status=400)

        kcb_acc.balance -= amount
        mpesa_acc.balance += amount
        kcb_acc.save()
        mpesa_acc.save()

        txn = Transaction.objects.create(
            sender=user, transaction_type='kcb_withdraw',
            amount=amount, status='completed', completed_at=timezone.now()
        )
        msg = f'KES {amount:,.2f} withdrawn from KCB M-PESA to M-PESA. {txn.transaction_id}'
        create_notification(user, msg, txn)

        return Response({'success': True, 'message': msg})


class KCBLoanView(APIView):
    def post(self, request):
        user = request.user
        amount = Decimal(str(request.data.get('amount', 0)))
        pin = request.data.get('pin')

        if not check_password(pin, user.pin):
            return Response({'error': 'Invalid PIN'}, status=400)

        try:
            kcb_acc = user.kcb_account
            mpesa_acc = user.mpesa_account
        except:
            return Response({'error': 'Account not found'}, status=404)

        if kcb_acc.active_loan > 0:
            return Response({'error': 'You have an existing KCB M-PESA loan'}, status=400)

        if amount > kcb_acc.loan_limit:
            return Response({'error': f'Exceeds loan limit of KES {kcb_acc.loan_limit:,.2f}'}, status=400)

        kcb_acc.active_loan = amount
        kcb_acc.save()
        mpesa_acc.balance += amount
        mpesa_acc.save()

        txn = Transaction.objects.create(
            sender=user, transaction_type='kcb_loan',
            amount=amount, status='completed', completed_at=timezone.now()
        )
        msg = f'KCB M-PESA loan of KES {amount:,.2f} disbursed. {txn.transaction_id}'
        create_notification(user, msg, txn)

        return Response({'success': True, 'message': msg})


# ========================= ACCOUNT / PROFILE =========================

class BalanceView(APIView):
    def get(self, request):
        user = request.user
        data = {}
        try:
            data['mpesa_balance'] = str(user.mpesa_account.balance)
        except:
            data['mpesa_balance'] = '0.00'
        try:
            data['mshwari_balance'] = str(user.mshwari_account.balance)
            data['mshwari_locked'] = str(user.mshwari_account.locked_savings)
            data['mshwari_loan'] = str(user.mshwari_account.active_loan)
        except:
            pass
        try:
            data['kcb_balance'] = str(user.kcb_account.balance)
        except:
            pass
        return Response(data)


class TransactionHistoryView(APIView):
    def get(self, request):
        user = request.user
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        txn_type = request.query_params.get('type', None)

        sent = Transaction.objects.filter(sender=user)
        received = Transaction.objects.filter(receiver=user)
        
        if txn_type:
            sent = sent.filter(transaction_type=txn_type)
            received = received.filter(transaction_type=txn_type)

        transactions = sent.union(received).order_by('-created_at')
        
        start = (page - 1) * limit
        end = start + limit
        total = transactions.count()

        return Response({
            'transactions': TransactionSerializer(transactions[start:end], many=True).data,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        })


class MiniStatementView(APIView):
    def get(self, request):
        user = request.user
        account_type = request.query_params.get('account', 'mpesa')
        
        if account_type == 'mpesa':
            sent = Transaction.objects.filter(sender=user).order_by('-created_at')[:5]
            received = Transaction.objects.filter(receiver=user).order_by('-created_at')[:5]
            txns = list(sent) + list(received)
            txns.sort(key=lambda x: x.created_at, reverse=True)
            txns = txns[:5]
        elif account_type == 'mshwari':
            txns = Transaction.objects.filter(
                sender=user,
                transaction_type__in=['mshwari_deposit', 'mshwari_withdraw', 'mshwari_loan']
            ).order_by('-created_at')[:5]
        else:
            txns = []

        return Response({'transactions': TransactionSerializer(txns, many=True).data})


class ChangePINView(APIView):
    def post(self, request):
        user = request.user
        old_pin = request.data.get('old_pin')
        new_pin = request.data.get('new_pin')

        if not check_password(old_pin, user.pin):
            return Response({'error': 'Current PIN is incorrect'}, status=400)

        if len(new_pin) != 4:
            return Response({'error': 'PIN must be 4 digits'}, status=400)

        user.pin = make_password(new_pin)
        user.save()
        return Response({'success': True, 'message': 'PIN changed successfully'})


class ChangeLanguageView(APIView):
    def post(self, request):
        user = request.user
        language = request.data.get('language')
        if language not in ['english', 'swahili']:
            return Response({'error': 'Invalid language'}, status=400)
        user.language = language
        user.save()
        return Response({'success': True, 'language': language})


class NotificationListView(APIView):
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:20]
        return Response(NotificationSerializer(notifications, many=True).data)

    def post(self, request):
        # Mark all as read
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'success': True})


# ========================= ADMIN VIEWS =========================

class AdminUserListView(APIView):
    def get(self, request):
        if request.user.role not in ['admin', 'customer_care']:
            return Response({'error': 'Unauthorized'}, status=403)
        users = User.objects.all().order_by('-created_at')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        if request.user.role not in ['admin', 'customer_care']:
            return Response({'error': 'Unauthorized'}, status=403)
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)


class AdminTransactionListView(APIView):
    def get(self, request):
        if request.user.role not in ['admin', 'customer_care']:
            return Response({'error': 'Unauthorized'}, status=403)
        transactions = Transaction.objects.all().order_by('-created_at')[:100]
        return Response(TransactionSerializer(transactions, many=True).data)


class AdminStatsView(APIView):
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        from django.db.models import Sum, Count
        stats = {
            'total_users': User.objects.count(),
            'total_customers': User.objects.filter(role='customer').count(),
            'total_agents': Agent.objects.count(),
            'total_transactions': Transaction.objects.count(),
            'total_volume': Transaction.objects.filter(status='completed').aggregate(
                total=Sum('amount'))['total'] or 0,
            'today_transactions': Transaction.objects.filter(
                created_at__date=timezone.now().date()).count(),
        }
        return Response(stats)


# ========================= AGENT VIEWS =========================

class AgentDashboardView(APIView):
    def get(self, request):
        if request.user.role != 'agent':
            return Response({'error': 'Unauthorized'}, status=403)
        try:
            agent = request.user.agent_profile
        except:
            return Response({'error': 'Agent profile not found'}, status=404)

        transactions = Transaction.objects.filter(
            transaction_type__in=['withdraw_agent'],
            external_ref=agent.agent_number
        ).order_by('-created_at')[:20]

        return Response({
            'agent': AgentSerializer(agent).data,
            'recent_transactions': TransactionSerializer(transactions, many=True).data,
            'mpesa_balance': str(request.user.mpesa_account.balance) if hasattr(request.user, 'mpesa_account') else '0.00'
        })


class PaybillListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        billers = PaybillBiller.objects.filter(is_active=True)
        return Response(PaybillBillerSerializer(billers, many=True).data)