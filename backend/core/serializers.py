from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    MPesaAccount, MshwariAccount, KCBMPesaAccount,
    Agent, Transaction, Notification, PaybillBiller, BuyGoodsTill
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'phone_number', 'id_number', 'role',
                  'is_verified', 'language', 'profile_photo', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.phone_number


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    pin = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'phone_number', 'id_number', 'date_of_birth',
                  'role', 'password', 'pin']

    def create(self, validated_data):
        pin = validated_data.pop('pin', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        if pin:
            from django.contrib.auth.hashers import make_password
            user.pin = make_password(pin)
        user.save()
        # Create associated accounts
        MPesaAccount.objects.create(user=user)
        if user.role == 'customer':
            MshwariAccount.objects.create(user=user)
            KCBMPesaAccount.objects.create(user=user)
        return user


class MPesaAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = MPesaAccount
        fields = ['account_number', 'balance', 'is_active', 'created_at']


class MshwariAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = MshwariAccount
        fields = ['balance', 'locked_savings', 'lock_until', 'is_locked',
                  'loan_limit', 'active_loan', 'is_active']


class KCBMPesaAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = KCBMPesaAccount
        fields = ['balance', 'loan_limit', 'active_loan', 'is_active']


class AgentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Agent
        fields = ['id', 'agent_number', 'business_name', 'location',
                  'float_balance', 'commission_earned', 'is_active', 'user_details']


class TransactionSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    sender_phone = serializers.SerializerMethodField()
    receiver_phone = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_id', 'transaction_type', 'amount', 'charge',
                  'status', 'description', 'reference', 'external_ref',
                  'sender_name', 'receiver_name', 'sender_phone', 'receiver_phone',
                  'created_at', 'completed_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else 'Unknown'

    def get_receiver_name(self, obj):
        return obj.receiver.get_full_name() if obj.receiver else ''

    def get_sender_phone(self, obj):
        return obj.sender.phone_number if obj.sender else ''

    def get_receiver_phone(self, obj):
        return obj.receiver.phone_number if obj.receiver else ''


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at', 'transaction']


class PaybillBillerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaybillBiller
        fields = '__all__'


class BuyGoodsTillSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyGoodsTill
        fields = '__all__'


class DashboardSerializer(serializers.Serializer):
    """Combined dashboard data"""
    user = UserSerializer()
    mpesa_account = MPesaAccountSerializer()
    mshwari_account = MshwariAccountSerializer(allow_null=True)
    kcb_account = KCBMPesaAccountSerializer(allow_null=True)
    recent_transactions = TransactionSerializer(many=True)
    unread_notifications = serializers.IntegerField()