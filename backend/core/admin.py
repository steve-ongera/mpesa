from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (User, MPesaAccount, MshwariAccount, KCBMPesaAccount,
                     Agent, Transaction, Notification, PaybillBiller, BuyGoodsTill)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['phone_number', 'get_full_name', 'role', 'is_verified', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active']
    search_fields = ['phone_number', 'first_name', 'last_name']
    fieldsets = UserAdmin.fieldsets + (
        ('M-PESA Info', {'fields': ('phone_number', 'id_number', 'role', 'is_verified', 'pin', 'language')}),
    )

admin.site.register(MPesaAccount)
admin.site.register(MshwariAccount)
admin.site.register(KCBMPesaAccount)
admin.site.register(Agent)
admin.site.register(Transaction)
admin.site.register(Notification)
admin.site.register(PaybillBiller)
admin.site.register(BuyGoodsTill)