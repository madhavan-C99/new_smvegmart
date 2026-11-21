from django.db import models, connection
from django.apps import apps
from decimal import Decimal
from django.forms.models import model_to_dict
from datetime import date, datetime   # ✅ add this import

class SafeDeleteModel(models.Model):
    class Meta:
        abstract = True

    def delete(self):
        return None

    def save_delete(self, user_id=None):
        LogModel = apps.get_model('adm', 'DeletedDataLog')
        
        obj_data = model_to_dict(self)

        # 👇 existing loop (DO NOT CHANGE structure)
        for field in self._meta.fields:
            value = getattr(self, field.name)
            
            if isinstance(value, models.fields.files.FieldFile):
                obj_data[field.name] = value.url if value else None

            # ✅ JUST ADD THIS BLOCK (nothing else change)
            elif isinstance(value, (date, datetime)):
                obj_data[field.name] = value.isoformat()
            
            elif isinstance(value, Decimal):  
                obj_data[field.name] = float(value)

        # Sanitize user_id: deleted_by is a ForeignKey to User (expects integer ID or None)
        valid_user_id = None
        if user_id is not None:
            if isinstance(user_id, int):
                valid_user_id = user_id
            elif isinstance(user_id, str) and user_id.isdigit():
                valid_user_id = int(user_id)
            elif hasattr(user_id, 'id') and isinstance(user_id.id, int):
                valid_user_id = user_id.id

        try:
            # Sync sequence if needed for adm_deleted_data_log
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT setval(
                        pg_get_serial_sequence('adm_deleted_data_log', 'id'),
                        COALESCE((SELECT MAX(id) FROM adm_deleted_data_log), 1)
                    );
                """)
        except Exception:
            pass

        LogModel.objects.create(
            table_name=self._meta.db_table,
            row_id=self.id,
            data=obj_data,
            deleted_by_id=valid_user_id
        )

        return super(SafeDeleteModel, self).delete()


