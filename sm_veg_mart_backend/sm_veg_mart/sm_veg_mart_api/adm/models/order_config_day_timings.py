from django.db import models
from .delete_base_model import SafeDeleteModel
from .order_configuration import OrderConfiguration
from .delivery_days import DeliveryDays
from .delivery_timings import DeliveryTimings
class OrderConfigDayTimings(SafeDeleteModel):
    # 🌟 related_name நீக்கப்பட்டு நேரடி Foreign Key:
    order_config = models.ForeignKey(OrderConfiguration, on_delete=models.CASCADE)
    day = models.ForeignKey(DeliveryDays, on_delete=models.CASCADE)
    timing = models.ForeignKey(DeliveryTimings, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True)
    def __str__(self):
        return f"{self.order_config.delivery_option} | {self.day.day_name} | {self.timing.start_time}-{self.timing.end_time}"
    class Meta:
        db_table = 'adm_order_config_day_timings'
        unique_together = ('order_config', 'day', 'timing')