import logging
from django.utils import timezone
from huey import crontab
from huey.contrib.djhuey import db_periodic_task, task
from ..services.customer_management_service import update_all_customers_activity_status_service

logger = logging.getLogger('django')


@db_periodic_task(crontab(hour='0', minute='0'))
def daily_customer_activity_check_task():
    try:
        result = update_all_customers_activity_status_service()
        logger.info(f"daily_customer_activity_check_task completed: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in daily_customer_activity_check_task: {str(e)}", exc_info=True)
        return None
